import express from "express";
import { MongoClient } from "mongodb";

const app = express();

const VESRION = process.env.APP_VERSION || "1.0.0";
const FAULT = process.env.FAULT === "on";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "";

const mongoClient = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000,
});

const logs = mongoClient.db().collection("logs");

async function log(message, level) {
  const line = { time: new Date(), version: VESRION, level, message };
  console.log(JSON.stringify(line));
  await logs.insertOne(line);
}

// גרסה שבורה
async function loadPrices() {
  if (FAULT) {
    await fetch("http://pricing-service:5000/prices");
  }
  return { lelev: 30, errog: 50 };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/version", (req, res) => {
  res.json({ service: "orders-api", version: VESRION });
});

app.get("/logs", async (req, res) => {
  const newestFirst = { time: -1 };

  const lines = await logs
    .find({}, { projection: { _id: 0 } })
    .sort(newestFirst)
    .limit(20)
    .toArray();
  res.json(lines);
});

app.get("/api/orders", async (req, res) => {
  let prices;

  try {
    prices = await loadPrices();
  } catch (error) {
    await log(
      "error",
      `GET /api/orders 500 - cannot reach pricing service ${error.cause} ${error.code} ${error.message}`
    );

    return res.status(500).json({ error: "Internal server error" });
  }

  await log("info", "GET /api/orders 200");
  res.json({ orders: [{ id: 1, item: "lulav", price: prices.lulav }] });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`orders-api ${VESRION} listening on ${PORT}`);
});