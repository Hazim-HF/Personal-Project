const prisma = require("../prisma/client");

const ACCOUNT_TYPES = ["CHECKING", "SAVINGS", "CASH", "CREDIT_CARD", "INVESTMENT", "LOAN", "OTHER"];

async function listAccounts(req, res) {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user.id, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  res.json({ accounts });
}

async function createAccount(req, res) {
  const { name, type, institution, currency, balance } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: "name and type are required" });
  }

  if (!ACCOUNT_TYPES.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${ACCOUNT_TYPES.join(", ")}` });
  }

  const account = await prisma.account.create({
    data: {
      userId: req.user.id,
      name,
      type,
      institution: institution || null,
      currency: currency || "MYR",
      balance: balance ? Number(balance) : 0,
    },
  });

  res.status(201).json({ account });
}

module.exports = { listAccounts, createAccount, ACCOUNT_TYPES };
