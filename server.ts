import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { google } from "googleapis";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google Service Account Setup
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

// Multer Setup for temporary file storage
const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- File Upload to Google Drive (Using Owner's Service Account) ---
  app.post("/api/upload-to-drive", upload.array("files"), async (req, res) => {
    const { folderName } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Faltan archivos" });
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      return res.status(500).json({ error: "Credenciales de Google Drive no configuradas en el servidor" });
    }

    try {
      // 1. Create a folder for the ad
      const folderMetadata = {
        name: folderName || "Nuevo Anuncio",
        mimeType: "application/vnd.google-apps.folder",
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : [],
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      const folderId = folder.data.id;
      const uploadedUrls: string[] = [];

      // 2. Upload each file to the new folder
      for (const file of files) {
        const fileMetadata = {
          name: file.originalname,
          parents: [folderId!],
        };
        const media = {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.path),
        };

        const uploadedFile = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id",
        });

        // Make file public
        await drive.permissions.create({
          fileId: uploadedFile.data.id!,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });

        // Use a direct thumbnail link which is more reliable for <img> tags
        const fileId = uploadedFile.data.id;
        const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
        uploadedUrls.push(directUrl);
        
        // Clean up temp file
        fs.unlinkSync(file.path);
      }

      res.json({ urls: uploadedUrls });
    } catch (error: any) {
      console.error("Error uploading to Drive:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/cars", async (req, res) => {
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/cars/:id", async (req, res) => {
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", req.params.id)
      .single();
    
    if (error) return res.status(404).json({ error: "Vehículo no encontrado" });
    res.json(data);
  });

  app.post("/api/cars", async (req, res) => {
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
