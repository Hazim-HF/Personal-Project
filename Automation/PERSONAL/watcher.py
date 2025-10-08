#!/usr/bin/env python3
"""
Excel Change Watcher → Email Notifier
------------------------------------
Watches an Excel file for new/modified rows and emails the address in the EMAIL column
whenever a row is added or updated.

Works with personal email accounts via SMTP (e.g., Outlook/Hotmail, Gmail).
Use an app password if your provider requires it.

Setup:
1) `python -m venv .venv && .venv/Scripts/activate` (Windows) or `source .venv/bin/activate` (macOS/Linux)
2) `pip install -r requirements.txt`
3) Copy `.env.example` to `.env` and fill in values.
4) Run: `python watcher.py`

Notes:
- State is tracked in `excel_state.json` in the same folder.
- A row is identified by ID_COLUMN (e.g., a unique key). If you don't have one, set ID_COLUMN to an existing stable column (e.g., "email").
- A change is detected when any value in the row differs from the last seen fingerprint.
"""

import hashlib
import json
import os
import sys
import time
from datetime import datetime
from email.message import EmailMessage

import pandas as pd
import smtplib
from dotenv import load_dotenv

STATE_FILE = "excel_state.json"


def load_env():
    load_dotenv()
    cfg = {
        "EXCEL_FILE": os.getenv("EXCEL_FILE", "").strip(),
        "SHEET_NAME": os.getenv("SHEET_NAME", "").strip() or None,
        "EMAIL_COLUMN": os.getenv("EMAIL_COLUMN", "email").strip(),
        "ID_COLUMN": os.getenv("ID_COLUMN", "email").strip(),
        "SMTP_SERVER": os.getenv("SMTP_SERVER", "smtp.office365.com").strip(),
        "SMTP_PORT": int(os.getenv("SMTP_PORT", "587").strip()),
        "EMAIL_ADDRESS": os.getenv("EMAIL_ADDRESS", "").strip(),
        "EMAIL_PASSWORD": os.getenv("EMAIL_PASSWORD", "").strip(),
        "SENDER_NAME": os.getenv("SENDER_NAME", "").strip() or None,
        "POLL_SECONDS": int(os.getenv("POLL_SECONDS", "10").strip()),
        "SUBJECT_TEMPLATE": os.getenv("SUBJECT_TEMPLATE", "Update from our Excel sheet for {id}").strip(),
        "BODY_TEMPLATE": os.getenv(
            "BODY_TEMPLATE",
            "Hi,\n\nYour record was created/updated on {timestamp}.\n\nHere are your details:\n{row_pretty}\n\nBest,\n{sender_name}"
        ).strip(),
        "IGNORE_COLUMNS": [c.strip() for c in os.getenv("IGNORE_COLUMNS", "").split(",") if c.strip()],
    }
    missing = [k for k in ["EXCEL_FILE", "EMAIL_ADDRESS", "EMAIL_PASSWORD"] if not cfg.get(k)]
    if missing:
        print(f"[!] Missing required .env values: {', '.join(missing)}")
        sys.exit(1)
    return cfg


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            print("[!] Could not read state file; starting fresh.")
    return {"rows": {}, "last_seen_mtime": 0}


def save_state(state):
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
    os.replace(tmp, STATE_FILE)


def file_mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0


def row_fingerprint(series, ignore_cols):
    # Create a stable fingerprint of all values except ignored columns
    pieces = []
    for col, val in series.items():
        if col in ignore_cols:
            continue
        pieces.append(f"{col}={str(val).strip()}")
    joined = "|".join(pieces)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()


def read_excel_rows(excel_path, sheet_name=None):
    if sheet_name:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, dtype=str)
    else:
        df = pd.read_excel(excel_path, dtype=str)
    # Normalize column names (strip spaces)
    df.columns = [str(c).strip() for c in df.columns]
    return df


def ensure_columns(df, id_col, email_col):
    cols = df.columns.tolist()
    if id_col not in cols:
        raise ValueError(f"ID_COLUMN '{id_col}' not found in Excel. Columns present: {cols}")
    if email_col not in cols:
        raise ValueError(f"EMAIL_COLUMN '{email_col}' not found in Excel. Columns present: {cols}")


def connect_smtp(server, port, email_addr, password):
    smtp = smtplib.SMTP(server, port, timeout=30)
    smtp.ehlo()
    smtp.starttls()
    smtp.login(email_addr, password)
    return smtp


def send_email(smtp, sender_email, sender_name, to_email, subject, body):
    msg = EmailMessage()
    msg["From"] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    smtp.send_message(msg)


def pretty_row(series):
    width = max(len(str(k)) for k in series.index)
    lines = []
    for k, v in series.items():
        lines.append(f"{str(k).ljust(width)} : {'' if pd.isna(v) else str(v)}")
    return "\n".join(lines)


def main():
    cfg = load_env()
    state = load_state()

    # Keep a persistent SMTP connection; reconnect if it drops
    smtp = None
    last_connect_ts = 0

    print("[*] Excel Change Watcher started.")
    print(f"    File       : {cfg['EXCEL_FILE']}")
    print(f"    Sheet      : {cfg['SHEET_NAME'] or '(first sheet)'}")
    print(f"    ID column  : {cfg['ID_COLUMN']}")
    print(f"    Email col  : {cfg['EMAIL_COLUMN']}")
    print(f"    Interval   : {cfg['POLL_SECONDS']}s")
    print(f"    SMTP       : {cfg['SMTP_SERVER']}:{cfg['SMTP_PORT']} as {cfg['EMAIL_ADDRESS']}")
    print("-------------------------------------------------------------")

    while True:
        try:
            # If the file timestamp hasn't changed, still poll but skip heavy work
            current_mtime = file_mtime(cfg["EXCEL_FILE"])
            # We'll re-read on every loop to catch small changes even if mtime glitches
            df = read_excel_rows(cfg["EXCEL_FILE"], cfg["SHEET_NAME"])
            ensure_columns(df, cfg["ID_COLUMN"], cfg["EMAIL_COLUMN"])

            # Clean up data types and NaNs
            df = df.fillna("")
            id_col = cfg["ID_COLUMN"]
            email_col = cfg["EMAIL_COLUMN"]

            # Build a map of id -> row
            rows_to_process = []
            for _, row in df.iterrows():
                rid = str(row[id_col]).strip()
                if not rid:
                    continue  # skip rows without an id
                email = str(row[email_col]).strip()
                if not email:
                    continue  # skip rows without an email
                fp = row_fingerprint(row, cfg["IGNORE_COLUMNS"])
                prev = state["rows"].get(rid)
                if prev is None or prev.get("fp") != fp:
                    rows_to_process.append((rid, email, row, fp))

            if rows_to_process:
                # Connect / reconnect SMTP every 15 minutes or if not connected
                now = time.time()
                if (smtp is None) or (now - last_connect_ts > 900):
                    if smtp is not None:
                        try:
                            smtp.quit()
                        except Exception:
                            pass
                    smtp = connect_smtp(cfg["SMTP_SERVER"], cfg["SMTP_PORT"], cfg["EMAIL_ADDRESS"], cfg["EMAIL_PASSWORD"])
                    last_connect_ts = now

                for rid, email, row, fp in rows_to_process:
                    try:
                        subject = cfg["SUBJECT_TEMPLATE"].format(id=rid)
                        body = cfg["BODY_TEMPLATE"].format(
                            id=rid,
                            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            row_pretty=pretty_row(row),
                            sender_name=cfg["SENDER_NAME"] or cfg["EMAIL_ADDRESS"],
                        )
                        send_email(smtp, cfg["EMAIL_ADDRESS"], cfg["SENDER_NAME"], email, subject, body)
                        print(f"[+] Emailed {email} for row id={rid}")
                        state["rows"][rid] = {"fp": fp, "last_sent": datetime.now().isoformat()}
                        save_state(state)
                    except Exception as e:
                        print(f"[!] Failed emailing {email} for row id={rid}: {e}")

            # Update last seen mtime
            state["last_seen_mtime"] = current_mtime
            save_state(state)

        except KeyboardInterrupt:
            print("\n[!] Stopped by user.")
            break
        except Exception as e:
            print(f"[!] Loop error: {e}")

        time.sleep(cfg["POLL_SECONDS"])


if __name__ == "__main__":
    main()
