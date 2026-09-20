require("dotenv").config();

const prisma = require("./client");

// Shared default categories (userId = null) every user sees out of the box.
const defaultCategories = [
  { name: "Salary", type: "INCOME", icon: "\u{1F4B0}" },
  { name: "Other Income", type: "INCOME", icon: "➕" },
  { name: "Food & Dining", type: "EXPENSE", icon: "\u{1F374}" },
  { name: "Groceries", type: "EXPENSE", icon: "\u{1F6D2}" },
  { name: "Transport", type: "EXPENSE", icon: "\u{1F697}" },
  { name: "Housing & Rent", type: "EXPENSE", icon: "\u{1F3E0}" },
  { name: "Utilities", type: "EXPENSE", icon: "\u{1F4A1}" },
  { name: "Subscriptions", type: "EXPENSE", icon: "\u{1F4F1}" },
  { name: "Healthcare", type: "EXPENSE", icon: "\u{1FA7A}" },
  { name: "Shopping", type: "EXPENSE", icon: "\u{1F6CD}️" },
  { name: "Entertainment", type: "EXPENSE", icon: "\u{1F3AC}" },
  { name: "Savings & Investments", type: "EXPENSE", icon: "\u{1F4C8}" },
  { name: "Other", type: "EXPENSE", icon: "\u{1F4CB}" },
];

async function main() {
  let created = 0;

  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name: category.name, type: category.type },
      select: { id: true },
    });

    if (!existing) {
      await prisma.category.create({ data: { ...category, isDefault: true } });
      created += 1;
    }
  }

  console.log(`Seeded ${created} new default categories (${defaultCategories.length} total defined).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
