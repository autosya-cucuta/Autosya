import { supabase } from "../lib/supabase";
import Papa from "papaparse";

export interface LegacyAd {
  id?: string | number;
  title?: string;
  images?: string;
  price?: string | number;
  year?: string | number;
  mileage?: string | number;
  fuel?: string;
  transmission?: string;
  category?: string;
  color?: string;
  engine?: string;
  plate_last_digit?: string;
  plate_city?: string;
  phone?: string;
  whatsapp?: string;
  plate?: string;
  description?: string;
}

export async function migrateFromCSV(csvFile: File, userId: string) {
  if (!supabase) {
    throw new Error("La base de datos no está configurada correctamente.");
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const adsToInsert = results.data.map((ad: any) => {
            // Handle case-insensitive headers
            const getVal = (keys: string[]) => {
              for (const key of keys) {
                if (ad[key] !== undefined) return ad[key];
                if (ad[key.toLowerCase()] !== undefined) return ad[key.toLowerCase()];
                if (ad[key.charAt(0).toUpperCase() + key.slice(1)] !== undefined) return ad[key.charAt(0).toUpperCase() + key.slice(1)];
              }
              return "";
            };

            const category = getVal(["category"]);
            const title = getVal(["title"]);
            const [make, ...modelParts] = category.includes(">") ? category.split(">") : [getVal(["make"]) || "Otro", getVal(["model"]) || title];
            const model = modelParts.join(" ") || title || "Modelo no especificado";

            const rawImages = getVal(["images", "image_url"]);
            const imagesArray = String(rawImages).split(/[|]|(?<=\.jpg|\.png|\.jpeg)\.?(?=http)/i)
              .map((img: string) => img.trim())
              .filter((img: string) => img.startsWith("http"));
            
            const mainImage = imagesArray[0] || "";

            // Robust Price Parsing
            const rawPrice = String(getVal(["price"]) || "0").replace(/[^0-9]/g, '');
            let price = parseInt(rawPrice) || 0;
            if (price > 0 && price < 1000) price = price * 1000000;

            // Robust Mileage Parsing
            const rawMileage = String(getVal(["mileage"]) || "0").replace(/[^0-9]/g, '');
            const mileage = parseInt(rawMileage) || 0;

            const rawTrans = String(getVal(["transmission"]) || "").toLowerCase();
            let transmission = "Automatic";
            if (rawTrans.includes("mec") || rawTrans.includes("man")) transmission = "Manual";
            if (rawTrans.includes("dual")) transmission = "Dual";

            return {
              make: (make || "Otro").trim(),
              model: (model || "Modelo").trim(),
              year: parseInt(getVal(["year"])) || 2024,
              price: price,
              mileage: mileage,
              fuel_type: String(getVal(["fuel", "fuel_type"])).toLowerCase().includes("die") ? "Diesel" : "Gasoline",
              transmission: transmission,
              image_url: mainImage,
              all_images: imagesArray,
              description: getVal(["description"]) || title || "",
              user_id: userId,
              color: getVal(["color"]),
              engine: getVal(["engine"]),
              plate_last_digit: getVal(["plate_last_digit"]),
              plate_city: getVal(["plate_city"]),
              legacy_id: parseInt(getVal(["id"])) || null,
              vehicle_type: getVal(["tipo", "vehicle_type"]),
              nationality: getVal(["nac", "nationality"]),
              owner_info: getVal(["dueno", "owner_info"]),
              location_city: getVal(["ciudad", "location_city", "Ciudad"])
            };
          }).filter((ad: any) => ad.legacy_id !== null);

          // Insert in chunks of 50 to avoid payload limits
          const chunkSize = 50;
          for (let i = 0; i < adsToInsert.length; i += chunkSize) {
            const chunk = adsToInsert.slice(i, i + chunkSize);
            const { error } = await supabase.from("cars").upsert(chunk, { onConflict: 'legacy_id' });
            if (error) throw error;
          }

          resolve(adsToInsert.length);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

export async function revertMigration() {
  const { error } = await supabase
    .from("cars")
    .delete()
    .not("legacy_id", "is", null);
  
  if (error) throw error;
}
