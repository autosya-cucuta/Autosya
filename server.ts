import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("cars.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    price INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    transmission TEXT,
    fuel_type TEXT,
    image_url TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM cars").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO cars (make, model, year, price, mileage, transmission, fuel_type, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const seedCars = [
    ["BMW", "M4 Competition", 2022, 75000, 12000, "Automatic", "Gasoline", "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800", "Pristine condition, full service history."],
    ["Audi", "RS6 Avant", 2021, 115000, 18000, "Automatic", "Gasoline", "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&q=80&w=800", "The ultimate family wagon. High spec."],
    ["Porsche", "911 Carrera S", 2020, 125000, 8000, "PDK", "Gasoline", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800", "Classic silver, sports exhaust, premium sound."],
    ["Tesla", "Model 3 Performance", 2023, 52000, 5000, "Automatic", "Electric", "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800", "Like new, full self-driving capability included."],
    ["Toyota", "Land Cruiser", 2019, 68000, 45000, "Automatic", "Diesel", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800", "Rugged and ready for any adventure."],
    ["Mercedes-Benz", "G63 AMG", 2021, 185000, 15000, "Automatic", "Gasoline", "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=800", "Iconic design, unmatched performance."]
  ];
  seedCars.forEach(car => insert.run(...car));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/cars", (req, res) => {
    const cars = db.prepare("SELECT * FROM cars ORDER BY created_at DESC").all();
    res.json(cars);
  });

  app.get("/api/cars/:id", (req, res) => {
    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({ error: "Car not found" });
    }
  });

  app.post("/api/cars", (req, res) => {
    const { make, model, year, price, mileage, transmission, fuel_type, image_url, description } = req.body;
    const result = db.prepare(
      "INSERT INTO cars (make, model, year, price, mileage, transmission, fuel_type, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(make, model, year, price, mileage, transmission, fuel_type, image_url, description);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
