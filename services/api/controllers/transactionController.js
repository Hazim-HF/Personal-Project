const prisma = require("../prisma/client");

const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"];

const includeRelations = {
  account: { select: { id: true, name: true, type: true, currency: true } },
  transferAccount: { select: { id: true, name: true, type: true } },
  category: { select: { id: true, name: true, type: true, icon: true, color: true } },
};

async function listTransactions(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    include: includeRelations,
    orderBy: { date: "desc" },
    take: 100,
  });

  res.json({ transactions });
}

async function createTransaction(req, res) {
  const { accountId, categoryId, transferAccountId, type, amount, description, merchant, date } =
    req.body;

  if (!accountId || !type || amount === undefined) {
    return res.status(400).json({ message: "accountId, type and amount are required" });
  }

  if (!TRANSACTION_TYPES.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${TRANSACTION_TYPES.join(", ")}` });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "amount must be a positive number" });
  }

  const transactionDate = date ? new Date(date) : new Date();
  if (Number.isNaN(transactionDate.getTime())) {
    return res.status(400).json({ message: "date is invalid" });
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: req.user.id },
  });
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (type === "TRANSFER") {
    if (!transferAccountId || transferAccountId === accountId) {
      return res
        .status(400)
        .json({ message: "transferAccountId is required and must differ from accountId" });
    }

    const destinationAccount = await prisma.account.findFirst({
      where: { id: transferAccountId, userId: req.user.id },
    });
    if (!destinationAccount) {
      return res.status(404).json({ message: "Transfer destination account not found" });
    }
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId: req.user.id }] },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId: req.user.id,
        accountId,
        transferAccountId: type === "TRANSFER" ? transferAccountId : null,
        categoryId: categoryId || null,
        type,
        amount: amountNum,
        currency: account.currency,
        description: description || null,
        merchant: merchant || null,
        date: transactionDate,
      },
      include: includeRelations,
    });

    if (type === "INCOME") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amountNum } },
      });
    } else if (type === "EXPENSE") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amountNum } },
      });
    } else if (type === "TRANSFER") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amountNum } },
      });
      await tx.account.update({
        where: { id: transferAccountId },
        data: { balance: { increment: amountNum } },
      });
    }

    return created;
  });

  res.status(201).json({ transaction });
}

module.exports = { listTransactions, createTransaction, TRANSACTION_TYPES };
