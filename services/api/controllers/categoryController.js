const prisma = require("../prisma/client");

async function listCategories(req, res) {
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId: null }, { userId: req.user.id }],
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  res.json({ categories });
}

module.exports = { listCategories };
