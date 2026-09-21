import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await readFile(
    join(process.cwd(), "assets/Montserrat-800.woff")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "black",
          color: "white",
          fontSize: 110,
          fontFamily: "Montserrat",
          fontWeight: 800,
        }}
      >
        H
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Montserrat",
          data: fontData,
          weight: 800,
          style: "normal",
        },
      ],
    }
  );
}
