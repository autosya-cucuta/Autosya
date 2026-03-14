import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
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
  const PORT = parseInt(process.env.PORT || "3000", 10);

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
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) return next();
    
    try {
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  // Try to start server, with fallback ports
  const tryListen = (port: number, maxAttempts = 5, attempt = 1): void => {
    const server = app.listen(port, "0.0.0.0")
      .on("listening", () => {
        console.log(`Server running on http://localhost:${port}`);
      })
      .on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && attempt < maxAttempts) {
          console.log(`Port ${port} in use, trying ${port + 1}...`);
          server.close();
          tryListen(port + 1, maxAttempts, attempt + 1);
        } else {
          console.error("Failed to start server:", err.message);
          process.exit(1);
        }
      });
  };

  tryListen(PORT);
}

startServer();
