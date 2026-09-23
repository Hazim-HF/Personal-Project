const prisma = require("../prisma/client");

const VEHICLE_TYPES = ["CAR", "MOTORCYCLE", "TRUCK", "VAN", "OTHER"];

function toOptionalInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : NaN;
}

async function listVehicles(req, res) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: req.user.id, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  res.json({ vehicles });
}

async function createVehicle(req, res) {
  const { name, type, make, model, year, plateNumber, mileage } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: "name and type are required" });
  }

  if (!VEHICLE_TYPES.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${VEHICLE_TYPES.join(", ")}` });
  }

  const yearNum = toOptionalInt(year);
  const mileageNum = toOptionalInt(mileage);
  if (Number.isNaN(yearNum) || Number.isNaN(mileageNum)) {
    return res.status(400).json({ message: "year and mileage must be whole numbers" });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: req.user.id,
      name,
      type,
      make: make || null,
      model: model || null,
      year: yearNum,
      plateNumber: plateNumber ? String(plateNumber).toUpperCase() : null,
      mileage: mileageNum ?? 0,
    },
  });

  res.status(201).json({ vehicle });
}

module.exports = { listVehicles, createVehicle, VEHICLE_TYPES };
