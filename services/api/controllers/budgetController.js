const prisma = require("../prisma/client");

// Transactions are stored at local (Malaysia) midnight, so month boundaries
// are computed in UTC+8 to keep the 1st and last day in the right month.
const TZ_OFFSET = "+08:00";

function monthRange(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month || "");
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  const pad = (n) => String(n).padStart(2, "0");
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;

  return {
    start: new Date(`${year}-${pad(monthIndex + 1)}-01T00:00:00${TZ_OFFSET}`),
    end: new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00${TZ_OFFSET}`),
  };
}

const categorySelect = { select: { id: true, name: true, icon: true, color: true } };

async function validateExpenseCategory(categoryId, userId) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId: null }, { userId }] },
  });
  if (!category) return "Category not found";
  if (category.type !== "EXPENSE") return "Budgets can only be set on expense categories";
  return null;
}

function parseAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Budgets are standing monthly limits: each one applies to every month, and
// the month query only decides which month's spending they're compared with.
async function listBudgets(req, res) {
  const range = monthRange(req.query.month);
  if (!range) {
    return res.status(400).json({ message: "month must be in YYYY-MM format" });
  }

  const userId = req.user.id;
  const inMonth = { userId, date: { gte: range.start, lt: range.end } };

  const [budgets, spendingGroups, incomeTotal, categories] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, period: "MONTHLY" },
      include: { category: categorySelect },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { ...inMonth, type: "EXPENSE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { ...inMonth, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.category.findMany({
      where: { type: "EXPENSE", OR: [{ userId: null }, { userId }] },
      ...categorySelect,
    }),
  ]);

  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const spentByCategory = new Map(
    spendingGroups.map((g) => [g.categoryId, Number(g._sum.amount || 0)])
  );
  const totalSpent = [...spentByCategory.values()].reduce((sum, v) => sum + v, 0);

  res.json({
    month: req.query.month,
    budgets: budgets.map((b) => ({
      id: b.id,
      amount: Number(b.amount),
      category: b.category,
      // An overall budget (no category) is measured against all spending.
      spent: b.categoryId ? spentByCategory.get(b.categoryId) || 0 : totalSpent,
    })),
    spending: spendingGroups
      .map((g) => ({
        category: g.categoryId ? categoriesById.get(g.categoryId) || null : null,
        spent: Number(g._sum.amount || 0),
        count: g._count,
      }))
      .sort((a, b) => b.spent - a.spent),
    totals: {
      spent: totalSpent,
      income: Number(incomeTotal._sum.amount || 0),
    },
  });
}

async function createBudget(req, res) {
  const { categoryId = null, amount } = req.body;
  const userId = req.user.id;

  const value = parseAmount(amount);
  if (value === null) {
    return res.status(400).json({ message: "amount must be a positive number" });
  }

  let name = "Overall";
  if (categoryId) {
    const problem = await validateExpenseCategory(categoryId, userId);
    if (problem) return res.status(400).json({ message: problem });
    name = (await prisma.category.findUnique({ where: { id: categoryId } })).name;
  }

  const duplicate = await prisma.budget.findFirst({
    where: { userId, categoryId, period: "MONTHLY" },
  });
  if (duplicate) {
    return res.status(409).json({
      message: categoryId ? "This category already has a budget" : "An overall budget already exists",
    });
  }

  const now = new Date();
  const budget = await prisma.budget.create({
    data: {
      userId,
      categoryId,
      name,
      amount: value,
      period: "MONTHLY",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    },
    include: { category: categorySelect },
  });

  res.status(201).json({
    budget: { id: budget.id, amount: Number(budget.amount), category: budget.category },
  });
}

// Applies a set of budgets at once (e.g. from a 50/30/20 template): each entry
// updates the existing budget for that category, or creates it. All or nothing.
async function applyBudgets(req, res) {
  const entries = req.body.budgets;
  const userId = req.user.id;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: "budgets must be a non-empty array" });
  }

  const seen = new Set();
  const cleaned = [];
  for (const entry of entries) {
    const categoryId = entry.categoryId || null;
    const value = parseAmount(entry.amount);
    if (value === null) {
      return res.status(400).json({ message: "Every budget amount must be a positive number" });
    }
    const key = categoryId ?? "overall";
    if (seen.has(key)) {
      return res.status(400).json({ message: "Each category can only appear once" });
    }
    seen.add(key);
    if (categoryId) {
      const problem = await validateExpenseCategory(categoryId, userId);
      if (problem) return res.status(400).json({ message: problem });
    }
    cleaned.push({ categoryId, amount: value });
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: cleaned.map((e) => e.categoryId).filter(Boolean) } },
  });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const now = new Date();

  const budgets = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const { categoryId, amount } of cleaned) {
      const existing = await tx.budget.findFirst({ where: { userId, categoryId, period: "MONTHLY" } });
      const budget = existing
        ? await tx.budget.update({ where: { id: existing.id }, data: { amount }, include: { category: categorySelect } })
        : await tx.budget.create({
            data: {
              userId,
              categoryId,
              name: categoryId ? nameById.get(categoryId) : "Overall",
              amount,
              period: "MONTHLY",
              startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            },
            include: { category: categorySelect },
          });
      results.push({ id: budget.id, amount: Number(budget.amount), category: budget.category });
    }
    return results;
  });

  res.json({ budgets });
}

async function updateBudget(req, res) {
  const value = parseAmount(req.body.amount);
  if (value === null) {
    return res.status(400).json({ message: "amount must be a positive number" });
  }

  const existing = await prisma.budget.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) {
    return res.status(404).json({ message: "Budget not found" });
  }

  const budget = await prisma.budget.update({
    where: { id: existing.id },
    data: { amount: value },
    include: { category: categorySelect },
  });

  res.json({
    budget: { id: budget.id, amount: Number(budget.amount), category: budget.category },
  });
}

async function deleteBudget(req, res) {
  const existing = await prisma.budget.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) {
    return res.status(404).json({ message: "Budget not found" });
  }

  await prisma.budget.delete({ where: { id: existing.id } });
  res.json({ message: "Budget deleted" });
}

module.exports = { listBudgets, createBudget, applyBudgets, updateBudget, deleteBudget };
