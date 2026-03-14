import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if credentials are available
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/cars", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Database not configured" });
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/cars/:id", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Database not configured" });
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", req.params.id)
      .single();
    
    if (error) return res.status(404).json({ error: "Vehículo no encontrado" });
    res.json(data);
  });

  app.post("/api/cars", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Database not configured" });
    const { make, model, year, price, mileage, transmission, fuel_type, image_url, description } = req.body;
    const { data, error } = await supabase
      .from("cars")
      .insert([{ make, model, year, price, mileage, transmission, fuel_type, image_url, description }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  
  // SPA fallback - serve index.html for all non-API routes
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    try {
      const template = await vite.transformIndexHtml(req.originalUrl, 
        await import("fs").then(fs => fs.promises.readFile(path.join(__dirname, "index.html"), "utf-8"))
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      next(e);
    }
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${PORT} is in use, trying ${Number(PORT) + 1}...`);
      app.listen(Number(PORT) + 1, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${Number(PORT) + 1}`);
      });
    } else {
      throw err;
    }
  });
}

startServer();
