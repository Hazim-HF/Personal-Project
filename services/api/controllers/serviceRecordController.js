const prisma = require("../prisma/client");

const SERVICE_CATEGORIES = ["OIL_CHANGE", "TIRES", "BRAKES", "BATTERY", "INSPECTION", "REPAIR", "OTHER"];

const includeVehicle = {
  vehicle: { select: { id: true, name: true, plateNumber: true } },
};

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function listServiceRecords(req, res) {
  const where = { userId: req.user.id };
  if (req.query.vehicleId) where.vehicleId = req.query.vehicleId;

  const serviceRecords = await prisma.serviceRecord.findMany({
    where,
    include: includeVehicle,
    orderBy: { date: "desc" },
    take: 200,
  });

  res.json({ serviceRecords });
}

async function createServiceRecord(req, res) {
  const { vehicleId, category, title, date, mileage, cost, workshop, notes, nextDueDate, nextDueMileage } =
    req.body;

  if (!vehicleId || !category || !title || mileage === undefined || mileage === "") {
    return res.status(400).json({ message: "vehicleId, category, title and mileage are required" });
  }

  if (!SERVICE_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `category must be one of: ${SERVICE_CATEGORIES.join(", ")}` });
  }

  const mileageNum = Number(mileage);
  if (!Number.isInteger(mileageNum) || mileageNum < 0) {
    return res.status(400).json({ message: "mileage must be a whole number" });
  }

  const costNum = cost === undefined || cost === "" ? 0 : Number(cost);
  if (!Number.isFinite(costNum) || costNum < 0) {
    return res.status(400).json({ message: "cost must be zero or a positive number" });
  }

  const serviceDate = date ? parseDate(date) : new Date();
  if (!serviceDate) {
    return res.status(400).json({ message: "date is invalid" });
  }

  const nextDate = nextDueDate ? parseDate(nextDueDate) : null;
  if (nextDueDate && !nextDate) {
    return res.status(400).json({ message: "nextDueDate is invalid" });
  }

  const nextMileage = nextDueMileage === undefined || nextDueMileage === "" ? null : Number(nextDueMileage);
  if (nextMileage !== null && (!Number.isInteger(nextMileage) || nextMileage < 0)) {
    return res.status(400).json({ message: "nextDueMileage must be a whole number" });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId: req.user.id },
  });
  if (!vehicle) {
    return res.status(404).json({ message: "Vehicle not found" });
  }

  const serviceRecord = await prisma.$transaction(async (tx) => {
    const record = await tx.serviceRecord.create({
      data: {
        userId: req.user.id,
        vehicleId,
        category,
        title,
        date: serviceDate,
        mileage: mileageNum,
        cost: costNum,
        workshop: workshop || null,
        notes: notes || null,
        nextDueDate: nextDate,
        nextDueMileage: nextMileage,
      },
      include: includeVehicle,
    });

    // Keep the vehicle's odometer at the highest reading we've seen.
    if (mileageNum > vehicle.mileage) {
      await tx.vehicle.update({ where: { id: vehicleId }, data: { mileage: mileageNum } });
    }

    return record;
  });

  res.status(201).json({ serviceRecord });
}

module.exports = { listServiceRecords, createServiceRecord, SERVICE_CATEGORIES };
