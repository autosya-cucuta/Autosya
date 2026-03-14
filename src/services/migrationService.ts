import { supabase } from "../lib/supabase";

export const legacyAds = [
  {
    id: 30060,
    title: "HYUNDAI TERRACAN GL 2006 4X4 MECANICA blindada",
    images: "https://www.autosya.com.co/wp-content/uploads/2023/04/terraca.jpg|https://www.autosya.com.co/wp-content/uploads/2023/04/terrass.jpg",
    price: 6,
    year: 2006,
    mileage: 135000,
    fuel: "gasolina",
    transmission: "mecánica",
    category: "Hiundai>Terracan gl",
    color: "azul",
    engine: "3.5",
    plate_last_digit: "6",
    plate_city: "bogota",
    phone: "",
    whatsapp: "",
    plate: ""
  },
  {
    id: 30159,
    title: "Suzuki alto 2020 poco uso",
    images: "https://www.autosya.com.co/wp-content/uploads/2023/05/IMG_20230502_142826-scaled.jpg",
    price: 3,
    year: 2020,
    mileage: 14000,
    fuel: "gasolina",
    transmission: "mecánica",
    category: "Suzuki>Swift",
    color: "gris",
    engine: "800",
    plate_last_digit: "1",
    plate_city: "Cucuta",
    phone: "",
    whatsapp: "LUISALBERTOBAUTISTA3184440008",
    plate: ""
  },
  {
    id: 31283,
    title: "Ford Ranger 2022 diesel 4x4",
    images: "https://www.autosya.com.co/wp-content/uploads/2023/08/IMG_20230817_091717-scaled.jpg",
    price: 1,
    year: 2022,
    mileage: 17000,
    fuel: "diesel",
    transmission: "dual",
    category: "Ford>ranger",
    color: "azul",
    engine: "3.2",
    plate_last_digit: "1",
    plate_city: "Bogotá",
    phone: "",
    whatsapp: "",
    plate: ""
  },
  {
    id: 36086,
    title: "Captiva 2015 automática",
    images: "https://www.autosya.com.co/wp-content/uploads/2024/01/Screenshot_20240119_092959-4c6ce7be.jpg",
    price: 4,
    year: 2015,
    mileage: 49000,
    fuel: "gasolina",
    transmission: "dual",
    category: "Chevrolet>Captiva Sport",
    color: "rojo",
    engine: "1.5",
    plate_last_digit: "5",
    plate_city: "Bogotá",
    phone: "",
    whatsapp: "",
    plate: ""
  },
  {
    id: 36709,
    title: "Chevrolet onix 2023 automática",
    images: "https://www.autosya.com.co/wp-content/uploads/2024/03/Screenshot_20240318_095257-8a1037eb.jpg",
    price: 6,
    year: 2023,
    mileage: 9000,
    fuel: "gasolina",
    transmission: "dual",
    category: "Chevrolet>Onix",
    color: "gris",
    engine: "1.",
    plate_last_digit: "-1",
    plate_city: "Cucuta",
    phone: "",
    whatsapp: "Jihan+57 300 8754275",
    plate: ""
  },
  {
    id: 36815,
    title: "Fortuner sw4 2018",
    images: "https://www.autosya.com.co/wp-content/uploads/2024/04/Screenshot_20240408_211603-c9373879.jpg",
    price: 15,
    year: 2018,
    mileage: 40000,
    fuel: "gasolina",
    transmission: "dual",
    category: "Toyota>Fortuner",
    color: "blanco",
    engine: "2.7",
    plate_last_digit: "6",
    plate_city: "Villa del Rosario",
    phone: "",
    whatsapp: "Peña+57 315 780",
    plate: ""
  }
];

export async function migrateAds(userId: string) {
  if (!supabase) {
    throw new Error("La base de datos no está configurada correctamente.");
  }

  const adsToInsert = legacyAds.map(ad => {
    const [make, model] = ad.category.split(">");
    const imageUrl = ad.images.split("|")[0];
    const normalizedPrice = ad.price < 1000 ? ad.price * 1000000 : ad.price;

    return {
      make: make || "Otro",
      model: model || ad.title,
      year: ad.year,
      price: normalizedPrice,
      mileage: ad.mileage,
      fuel_type: ad.fuel === "gasolina" ? "Gasoline" : ad.fuel === "diesel" ? "Diesel" : "Hybrid",
      transmission: ad.transmission === "mecánica" ? "Manual" : "Automatic",
      image_url: imageUrl,
      description: ad.title,
      user_id: userId,
      color: (ad as any).color,
      engine: (ad as any).engine,
      plate_last_digit: (ad as any).plate_last_digit,
      plate_city: (ad as any).plate_city,
      phone: (ad as any).phone,
      whatsapp: (ad as any).whatsapp,
      plate: (ad as any).plate,
      legacy_id: ad.id
    };
  });

  const { data, error } = await supabase.from("cars").insert(adsToInsert).select();

  if (error) {
    console.error("Error en migración masiva:", error);
    throw error;
  }
  
  return data;
}

export async function revertMigration() {
  const { error } = await supabase
    .from("cars")
    .delete()
    .not("legacy_id", "is", null);
  
  if (error) throw error;
}
