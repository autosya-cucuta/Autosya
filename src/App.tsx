import React, { useState, useEffect, FormEvent } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, Car as CarIcon, Shield, Zap, Menu, X, Filter, ChevronRight, Phone, Mail, MapPin, Sparkles, AlertCircle, User, LogOut, ChevronLeft, MessageCircle, Eye, EyeOff, Settings, Heart, History, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import type { Car } from "./lib/utils";

import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { getCarAdvice, estimateCarValue } from "./services/geminiService";
import { migrateFromCSV, revertMigration } from "./services/migrationService";
import { BRANDS_DATA } from "./constants";

// --- SEO Component ---
function SEO({ title, description, image, url }: { title?: string; description?: string; image?: string; url?: string }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Autosya Cúcuta`;
    }
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.setAttribute('content', description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && image) ogImage.setAttribute('content', image);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && url) ogUrl.setAttribute('content', url);
  }, [title, description, image, url]);

  return null;
}

// --- Components ---

function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    { title: "Para comprar", subtitle: "Ventas", phone: "573000000000" },
    { title: "Para financiar", subtitle: "Financiacion", phone: "573000000000" },
    { title: "Para vender", subtitle: "Asesor", phone: "573000000000" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[70] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[320px] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#2db742] p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-8 h-8 fill-current" />
                <h3 className="text-lg font-bold">Iniciar una conversacion</h3>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                ¡Hola! Haga clic en uno de nuestros miembros a continuación para chatear
              </p>
            </div>

            {/* Body */}
            <div className="p-4 bg-zinc-50/50">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4 px-2">
                El equipo suele responder en unos minutos.
              </p>
              <div className="space-y-3">
                {contactOptions.map((option, i) => (
                  <a
                    key={i}
                    href={`https://wa.me/${option.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white rounded-xl border-l-4 border-[#2db742] shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#2db742]/10 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-[#2db742] fill-current" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">{option.title}</div>
                        <div className="text-xs text-zinc-400">{option.subtitle}</div>
                      </div>
                    </div>
                    <MessageCircle className="w-5 h-5 text-[#2db742] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group",
          isOpen ? "bg-[#2db742] text-white" : "bg-[#25D366] text-white"
        )}
        title="Contactar por WhatsApp"
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <MessageCircle className="w-8 h-8 fill-current" />
        )}
      </button>
    </div>
  );
}

function BrandsDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ name: string; count: number; models: { name: string; count: number }[] }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBrands() {
      const { data, error } = await supabase
        .from("cars")
        .select("make, model");
      
      if (data) {
        const brandsMap: Record<string, { count: number; models: Record<string, number> }> = {};
        
        data.forEach(car => {
          if (!brandsMap[car.make]) {
            brandsMap[car.make] = { count: 0, models: {} };
          }
          brandsMap[car.make].count++;
          if (car.model) {
            brandsMap[car.make].models[car.model] = (brandsMap[car.make].models[car.model] || 0) + 1;
          }
        });

        const formattedBrands = Object.entries(brandsMap).map(([name, info]) => ({
          name,
          count: info.count,
          models: Object.entries(info.models).map(([mName, mCount]) => ({
            name: mName,
            count: mCount
          })).sort((a, b) => b.count - a.count)
        })).sort((a, b) => a.name.localeCompare(b.name));

        setBrands(formattedBrands);
      }
    }

    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  const brand = brands.find(b => b.name === selectedBrand);

  const handleBrandClick = (brandName: string) => {
    navigate(`/inventory?make=${brandName}`);
    onClose();
  };

  const handleModelClick = (modelName: string) => {
    navigate(`/inventory?search=${modelName}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              {selectedBrand ? (
                <button 
                  onClick={() => setSelectedBrand(null)}
                  className="flex items-center gap-2 text-zinc-900 font-bold hover:text-red-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Ir atrás</span>
                </button>
              ) : (
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Marcas</h2>
              )}
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!selectedBrand ? (
                <div className="divide-y divide-zinc-50">
                  {brands.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => b.models.length > 0 ? setSelectedBrand(b.name) : handleBrandClick(b.name)}
                      className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-medium text-zinc-600 group-hover:text-zinc-900">{b.name}</span>
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-red-600">{b.count}</span>
                      </div>
                      {b.models.length > 0 && <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-red-600 uppercase tracking-tight">{selectedBrand}</h3>
                    <button 
                      onClick={() => handleBrandClick(selectedBrand)}
                      className="text-xs font-bold text-zinc-400 hover:text-black underline underline-offset-4"
                    >
                      Ver todos {selectedBrand}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {brand?.models?.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => handleModelClick(model.name)}
                        className="flex items-center gap-3 px-4 py-2 bg-white border border-zinc-200 rounded-xl hover:border-red-600 hover:shadow-md transition-all group"
                      >
                        <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{model.name}</span>
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-red-600">{model.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AIAssistant({ inventory }: { inventory: Car[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "¡Hola! Soy tu asistente de Autosya. ¿Cómo puedo ayudarte a encontrar el carro de tus sueños hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getCarAdvice(userMsg, inventory);
      setMessages(prev => [...prev, { role: "ai", text: response || "Lo siento, no pude procesar eso. ¿En qué más puedo ayudarte?" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Tengo problemas para conectarme. ¡Por favor, inténtalo de nuevo más tarde!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 md:w-96 h-[500px] bg-white rounded-[32px] shadow-2xl border border-zinc-100 flex flex-col overflow-hidden">
          <div className="p-6 bg-zinc-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Asistente IA</div>
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">En línea</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                m.role === "user" 
                  ? "bg-zinc-100 text-zinc-900 ml-auto rounded-tr-none" 
                  : "bg-red-50 text-red-900 rounded-tl-none"
              )}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div className="bg-red-50 text-red-900 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm animate-pulse">
                Pensando...
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-100 flex gap-2">
            <input
              type="text"
              placeholder="Pregunta lo que quieras..."
              className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="bg-red-600 text-white p-2 rounded-xl hover:bg-red-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-zinc-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
      >
        <Sparkles className="w-8 h-8 group-hover:text-red-400 transition-colors" />
      </button>
    </div>
  );
}

function SellCar() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    make: "", model: "", year: "", price: "", mileage: "", 
    transmission: "Automatic", fuel_type: "Gasoline", image_url: "", description: "",
    color: "", phone: "", engine: "", plate_last_digit: "", plate_city: "",
    soat_until: "", techno_until: "", whatsapp: "", plate: ""
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimate, setEstimate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });
  }, []);

  const handleEstimate = async () => {
    if (!formData.make || !formData.model) return alert("Por favor ingresa marca y modelo primero");
    setIsEstimating(true);
    try {
      const res = await estimateCarValue(`${formData.year} ${formData.make} ${formData.model} con ${formData.mileage}km`);
      setEstimate(res || "");
    } catch (error) {
      alert("El servicio de valoración no está disponible actualmente.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Debes iniciar sesión para publicar un vehículo.");

    const { data, error } = await supabase
      .from("cars")
      .insert([{
        ...formData,
        year: parseInt(formData.year),
        price: parseInt(formData.price),
        mileage: parseInt(formData.mileage),
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      alert("Error al publicar el carro: " + error.message);
    } else {
      alert("¡Carro publicado con éxito!");
      navigate("/inventory");
    }
  };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-xl border border-zinc-100 text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-zinc-400" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-4">Acceso Restringido</h2>
          <p className="text-zinc-500 mb-10">Debes iniciar sesión para poder publicar tu vehículo en nuestra plataforma.</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all"
          >
            Iniciar Sesión Ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">VENDE TU CARRO</h1>
          <p className="text-zinc-500 font-medium">Publica tu vehículo y llega a miles de compradores potenciales al instante.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-sm border border-zinc-100 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Marca</label>
                  <input required className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Modelo</label>
                  <input required className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Año</label>
                  <input required type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Precio ($)</label>
                  <input required type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Kilometraje (km)</label>
                  <input required type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Transmisión</label>
                  <select 
                    required 
                    className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" 
                    value={formData.transmission} 
                    onChange={e => setFormData({...formData, transmission: e.target.value})}
                  >
                    <option value="Automatic">Automática</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Combustible</label>
                  <select 
                    required 
                    className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" 
                    value={formData.fuel_type} 
                    onChange={e => setFormData({...formData, fuel_type: e.target.value})}
                  >
                    <option value="Gasoline">Gasolina</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Eléctrico</option>
                    <option value="Hybrid">Híbrido</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">URL de la Imagen</label>
                <input required className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Descripción</label>
                <textarea required rows={4} className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-widest">Información Adicional</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Color</label>
                    <input className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Motor / Cilindrada</label>
                    <input className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" placeholder="Ej: 2.0L" value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Placa</label>
                    <input className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" placeholder="ABC-123" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Último Dígito</label>
                    <input type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.plate_last_digit} onChange={e => setFormData({...formData, plate_last_digit: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Ciudad Placa</label>
                    <input className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.plate_city} onChange={e => setFormData({...formData, plate_city: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">SOAT hasta</label>
                    <input type="date" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.soat_until} onChange={e => setFormData({...formData, soat_until: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Tecno hasta</label>
                    <input type="date" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.techno_until} onChange={e => setFormData({...formData, techno_until: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Teléfono</label>
                    <input type="tel" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">WhatsApp</label>
                    <input type="tel" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all">
                Publicar Vehículo
              </button>
            </form>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 text-white p-8 rounded-[40px] shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-red-400 w-6 h-6" />
                <h3 className="font-bold">Valoración IA</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-6">Obtén una estimación instantánea del valor de tu carro basada en datos actuales del mercado.</p>
              <button 
                onClick={handleEstimate}
                disabled={isEstimating}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isEstimating ? "Calculando..." : "Obtener Estimación"}
              </button>
              {estimate && (
                <div className="mt-6 p-4 bg-white/5 rounded-2xl text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {estimate}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Registro exitoso! Por favor verifica tu correo electrónico.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onClose();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[40px] p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-zinc-400" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/20">
                <User className="text-white w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-zinc-900 mb-2">
                {isSignUp ? "Crea tu cuenta" : "Bienvenido"}
              </h2>
              <p className="text-zinc-500">
                {isSignUp ? "Únete a la comunidad de Autosya" : "Inicia sesión para continuar"}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Correo Electrónico</label>
                <input 
                  required 
                  type="email" 
                  className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-red-600" 
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Contraseña</label>
                <div className="relative">
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 pr-12 focus:ring-2 focus:ring-red-600" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold transition-all hover:bg-black disabled:opacity-50"
              >
                {loading ? "Procesando..." : (isSignUp ? "Registrarse" : "Iniciar Sesión")}
              </button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400 font-bold">O continúa con</span></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-zinc-100 hover:border-zinc-200 py-4 rounded-2xl font-bold text-zinc-700 transition-all hover:shadow-md active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google
            </button>

            <p className="mt-8 text-center text-sm text-zinc-500">
              {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-red-600 font-bold hover:underline"
              >
                {isSignUp ? "Inicia Sesión" : "Regístrate gratis"}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Navbar({ inventory }: { inventory: Car[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBrandsDrawerOpen, setIsBrandsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Car[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = inventory.filter(car => 
        car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.year.toString().includes(searchQuery)
      ).slice(0, 5); // Limit to 5 results for the dropdown
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, inventory]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setIsUserMenuOpen(false);
    });

    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener('open-login', handleOpenLogin);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('open-login', handleOpenLogin);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchFocused(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-2",
        "bg-white shadow-md border-b border-zinc-100"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Autosya" 
              className="h-12 md:h-16 w-auto"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://ui-avatars.com/api/?name=Autosya&background=ef4444&color=fff";
              }}
            />
          </Link>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-center relative"
          >
            <div className="relative w-full flex">
              <input 
                type="text" 
                placeholder="Busca tu auto..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full border-2 border-red-600 rounded-l-md px-4 py-2 focus:outline-none focus:ring-0 text-zinc-900"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              )}
              <button 
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-r-md hover:bg-red-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSearchFocused(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-zinc-100 overflow-hidden z-20"
                  >
                    <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                      <span className="text-sm font-bold text-zinc-600">{searchResults.length} Resultados</span>
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-white rounded border border-zinc-200"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="p-1 hover:bg-white rounded border border-zinc-200"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-zinc-50">
                      {searchResults.length > 0 ? (
                        searchResults.map((car) => (
                          <Link
                            key={car.id}
                            to={`/car/${car.id}`}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors group"
                          >
                            <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100">
                              <img 
                                src={car.image_url} 
                                alt={car.model} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-zinc-900 truncate group-hover:text-red-600 transition-colors">
                                {car.make} {car.model} {car.year} {car.transmission === 'Automatic' ? 'automático' : 'mecánico'}
                              </h4>
                              <div className="text-red-600 font-black text-lg">$ {car.price.toLocaleString()}</div>
                              <div className="flex gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                <span>Kilometraje: {car.mileage.toLocaleString()}</span>
                                <span>Combustible: {car.fuel_type === 'Gasoline' ? 'Gasolina' : 'Diesel'}</span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-8 text-center text-zinc-400 italic">No se encontraron resultados</div>
                      )}
                    </div>

                    <Link 
                      to="/inventory" 
                      onClick={() => {
                        setIsSearchFocused(false);
                        setSearchQuery("");
                      }}
                      className="block p-4 text-center text-red-600 font-bold hover:bg-red-50 transition-colors border-t border-zinc-100"
                    >
                      Ver todos los resultados
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4 md:gap-8">
            <button 
              onClick={() => setIsBrandsDrawerOpen(true)}
              className="hidden md:flex flex-col items-center gap-0.5 text-zinc-600 hover:text-red-600 transition-colors"
            >
              <Menu className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase">Marcas</span>
            </button>

            <Link 
              to="/sell" 
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-600/20 whitespace-nowrap"
            >
              Publica Gratis
            </Link>

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border-2 border-zinc-100 hover:border-red-600 transition-all bg-white"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=ef4444&color=fff`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isUserMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden z-20"
                      >
                        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                          <div className="font-bold text-zinc-900 truncate">{user.email}</div>
                          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">Usuario Premium</div>
                        </div>
                        <div className="p-2">
                          {[
                            { icon: Heart, label: "Mis Favoritos", path: "/favorites" },
                            { icon: History, label: "Mis Publicaciones", path: "/my-listings" },
                            { icon: Settings, label: "Configuración", path: "/settings" },
                          ].map((item, i) => (
                            <Link 
                              key={i}
                              to={item.path}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 hover:bg-zinc-50 hover:text-red-600 transition-all text-sm font-medium"
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="h-px bg-zinc-100 my-2 mx-2" />
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-bold"
                          >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-all"
                title="Iniciar Sesión"
              >
                <User className="w-6 h-6" />
              </button>
            )}

            <button 
              className="md:hidden text-zinc-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white p-6 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-10" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "https://ui-avatars.com/api/?name=Autosya&background=ef4444&color=fff";
                }}
              />
              <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-8 h-8 text-zinc-900" /></button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto">
              <form 
                onSubmit={handleSearchSubmit}
                className="relative flex flex-col gap-2"
              >
                <div className="relative flex">
                  <input 
                    type="text" 
                    placeholder="Busca tu auto..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-2 border-red-600 rounded-l-md px-4 py-2 text-zinc-900"
                  />
                  <button 
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-r-md"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search Results */}
                {searchQuery.trim().length > 0 && (
                  <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
                    <div className="p-3 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {searchResults.length} Resultados
                    </div>
                    <div className="divide-y divide-zinc-200">
                      {searchResults.map((car) => (
                        <Link
                          key={car.id}
                          to={`/car/${car.id}`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-white transition-colors"
                        >
                          <img src={car.image_url} className="w-16 h-10 object-cover rounded" alt={car.model} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-zinc-900 truncate">{car.make} {car.model}</div>
                            <div className="text-red-600 font-black text-sm">$ {car.price.toLocaleString()}</div>
                          </div>
                        </Link>
                      ))}
                      <Link 
                        to="/inventory"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setSearchQuery("");
                        }}
                        className="block p-3 text-center text-xs font-bold text-red-600"
                      >
                        Ver todos
                      </Link>
                    </div>
                  </div>
                )}
              </form>
              {["Inventario", "Vender", "Servicios", "Nosotros"].map((item) => (
                <Link
                  key={item}
                  to={item === "Inventario" ? "/inventory" : `/${item === "Vender" ? "sell" : item === "Servicios" ? "services" : "about"}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl font-bold text-zinc-900 border-b pb-2"
                >
                  {item}
                </Link>
              ))}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsBrandsDrawerOpen(true);
                }}
                className="text-xl font-bold text-zinc-900 border-b pb-2 text-left"
              >
                Marcas
              </button>
              {!user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="bg-zinc-900 text-white text-center py-3 rounded-xl font-bold"
                >
                  Iniciar Sesión
                </button>
              )}
              {user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="bg-red-50 text-red-600 text-center py-3 rounded-xl font-bold"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <BrandsDrawer isOpen={isBrandsDrawerOpen} onClose={() => setIsBrandsDrawerOpen(false)} />
    </>
  );
}

function Favorites({ inventory, favorites, onToggleFavorite }: { inventory: Car[], favorites: number[], onToggleFavorite: (id: number) => void }) {
  const favoriteCars = inventory.filter(car => favorites.includes(car.id));

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">MIS FAVORITOS</h1>
          <p className="text-zinc-500 font-medium">Tus vehículos guardados para ver más tarde.</p>
        </div>

        {favoriteCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteCars.map(car => (
              <CarCard 
                key={car.id} 
                car={car} 
                isFavorite={true} 
                onToggleFavorite={onToggleFavorite} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-zinc-200">
            <Heart className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No tienes favoritos aún</h3>
            <p className="text-zinc-500">Explora nuestro inventario y guarda los carros que más te gusten.</p>
            <Link to="/inventory" className="inline-block mt-8 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
              Ir al Inventario
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function MyListings({ inventory, favorites, onToggleFavorite }: { inventory: Car[]; favorites: number[]; onToggleFavorite: (id: number) => void }) {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const myListings = inventory.filter(car => car.user_id === user?.id);

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">MIS PUBLICACIONES</h1>
          <p className="text-zinc-500 font-medium">Gestiona los vehículos que has puesto a la venta.</p>
        </div>

        {myListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myListings.map(car => (
              <CarCard 
                key={car.id} 
                car={car} 
                isFavorite={favorites.includes(car.id)} 
                onToggleFavorite={onToggleFavorite} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-zinc-200">
            <CarIcon className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No tienes publicaciones</h3>
            <p className="text-zinc-500">¿Quieres vender tu carro? Publícalo gratis con nosotros.</p>
            <Link to="/sell" className="inline-block mt-8 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
              Publicar Ahora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsMigrating(true);
    setMigrationStatus("Procesando archivo CSV...");
    try {
      const count = await migrateFromCSV(file, user.id);
      setMigrationStatus(`¡Éxito! Se importaron/actualizaron ${count} anuncios.`);
      setTimeout(() => window.location.reload(), 3000);
    } catch (error: any) {
      console.error(error);
      setMigrationStatus(`Error: ${error.message || "Error al procesar el archivo"}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRevert = async () => {
    if (!user) return;
    if (!confirm("¿Estás seguro de que deseas revertir la migración? Esto eliminará todos los anuncios importados.")) return;
    setIsMigrating(true);
    setMigrationStatus("Revirtiendo migración...");
    try {
      await revertMigration();
      setMigrationStatus("¡Migración revertida con éxito!");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      setMigrationStatus("Error al revertir la migración.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">CONFIGURACIÓN</h1>
          <p className="text-zinc-500 font-medium">Gestiona tu cuenta y preferencias.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Perfil de Usuario</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Correo Electrónico</label>
                <div className="p-4 bg-zinc-50 rounded-2xl text-zinc-900 font-medium">{user?.email}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">ID de Usuario</label>
                <div className="p-4 bg-zinc-50 rounded-2xl text-zinc-400 font-mono text-xs">{user?.id}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Preferencias</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                <span className="font-medium text-zinc-900">Notificaciones por Correo</span>
                <div className="w-12 h-6 bg-red-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                <span className="font-medium text-zinc-900">Modo Oscuro</span>
                <div className="w-12 h-6 bg-zinc-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {user?.email?.toLowerCase() === "autosyacucuta@gmail.com" && (
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-100">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Migración de Datos (CSV)</h3>
              <p className="text-zinc-500 text-sm mb-6">Sube tu archivo Excel/CSV con los 425 anuncios para importarlos todos de una vez.</p>
              <div className="flex flex-col gap-4">
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isMigrating}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                      isMigrating ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800"
                    )}
                  >
                    <Sparkles className="w-5 h-5" />
                    {isMigrating ? "Procesando..." : "Subir Archivo CSV"}
                  </button>
                  <button 
                    onClick={handleRevert}
                    disabled={isMigrating}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold transition-all border-2",
                      isMigrating ? "border-zinc-100 text-zinc-400 cursor-not-allowed" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    Limpiar Importados
                  </button>
                </div>
              </div>
              {migrationStatus && (
                <p className="mt-4 text-center text-sm font-bold text-red-600">{migrationStatus}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function CarCard({ car, isFavorite, onToggleFavorite }: { car: Car; isFavorite?: boolean; onToggleFavorite?: (id: number) => void; key?: any }) {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 relative">
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(car.id);
        }}
        className={cn(
          "absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all",
          isFavorite ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-white/80 text-zinc-400 hover:text-red-600"
        )}
      >
        <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
      </button>
      <Link to={`/car/${car.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={car.image_url}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-900">
            {car.year}
          </div>
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            ${car.price.toLocaleString()}
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
                {car.make} {car.model}
              </h3>
              <p className="text-zinc-500 text-sm font-medium">
                {car.vehicle_type && `${car.vehicle_type} • `}
                {car.transmission === "Automatic" ? "Automática" : car.transmission === "Manual" ? "Manual" : car.transmission} • {car.fuel_type === "Gasoline" ? "Gasolina" : car.fuel_type === "Diesel" ? "Diesel" : car.fuel_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-50">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Kilometraje</span>
              <span className="text-sm font-bold text-zinc-700">{car.mileage.toLocaleString()} km</span>
            </div>
            <div className="w-px h-8 bg-zinc-100" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Ubicación</span>
              <span className="text-sm font-bold text-zinc-700">{car.location_city || "Cúcuta"}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Home({ favorites, onToggleFavorite }: { favorites: number[], onToggleFavorite: (id: number) => void }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCars() {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (data) setCars(data);
      setLoading(false);
    }
    fetchCars();
  }, []);

  return (
    <div className="min-h-screen">
      <SEO 
        title="Compra y Venta de Carros Usados en Cúcuta" 
        description="Encuentra los mejores carros usados en Cúcuta con Autosya. Vehículos certificados, financiamiento y los precios más bajos del mercado."
      />
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div>
            <span className="inline-block px-4 py-1.5 mb-6 bg-red-600/10 border border-red-600/20 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest">
              Concesionario Premium en Cúcuta
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
              CONDUCE TU <br />
              <span className="text-red-600">SUEÑO</span> HOY.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
              Vive el futuro de la compra de vehículos. Precios transparentes, 
              vehículos certificados y recomendaciones impulsadas por IA.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link
                to="/inventory"
                className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
              >
                Ver Inventario <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/sell"
                className="w-full md:w-auto bg-zinc-800/50 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all"
              >
                Vende tu Carro
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 hidden md:grid grid-cols-3 gap-8">
          {[
            { label: "Carros Disponibles", value: "500+" },
            { label: "Clientes Felices", value: "12k+" },
            { label: "Concesionarios Certificados", value: "45" }
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center"
            >
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                VEHÍCULOS <span className="text-red-600">DESTACADOS</span>
              </h2>
              <p className="text-zinc-500 font-medium max-w-lg">
                Vehículos premium seleccionados a mano que cumplen con nuestros estrictos criterios de inspección de 150 puntos.
              </p>
            </div>
            <Link to="/inventory" className="text-zinc-900 font-bold flex items-center gap-2 group">
              Ver Todo el Inventario <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></div>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-zinc-100 rounded-3xl animate-pulse" />
              ))
            ) : (
              cars.map(car => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  isFavorite={favorites.includes(car.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-zinc-50 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-8">
              ¿POR QUÉ ELEGIR <br />
              <span className="text-red-600">AUTOSYA?</span>
            </h2>
            <div className="space-y-8">
              {[
                { icon: Shield, title: "Vehículos Certificados", desc: "Cada carro se somete a una rigurosa inspección de 150 puntos por nuestros expertos." },
                { icon: Zap, title: "Valoración Instantánea", desc: "Obtén un precio justo de mercado para tu carro en minutos usando nuestro motor de IA." },
                { icon: Sparkles, title: "Experiencia Premium", desc: "Desde la prueba de manejo hasta el papeleo, nosotros nos encargamos de todo por ti." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.title}</h3>
                    <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[40px] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000"
                alt="Showroom"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-xl max-w-xs hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-red-600" />
                </div>
                <div className="font-bold text-zinc-900">Asistente IA</div>
              </div>
              <p className="text-sm text-zinc-500 italic">
                "Puedo ayudarte a encontrar el carro perfecto basado en tu estilo de vida y presupuesto."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Inventory({ favorites, onToggleFavorite }: { favorites: number[], onToggleFavorite: (id: number) => void }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [makeFilter, setMakeFilter] = useState(searchParams.get("make") || "All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [transmissionFilter, setTransmissionFilter] = useState("All");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [nationalityFilter, setNationalityFilter] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000000]);
  const [yearRange, setYearRange] = useState<[number, number]>([1980, 2026]);

  useEffect(() => {
    const querySearch = searchParams.get("search");
    if (querySearch !== null) setSearch(querySearch);
    
    const queryMake = searchParams.get("make");
    if (queryMake !== null) setMakeFilter(queryMake);
  }, [searchParams]);

  useEffect(() => {
    async function fetchCars() {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        setCars(data);
        setFilteredCars(data);
      }
      setLoading(false);
    }
    fetchCars();
  }, []);

  useEffect(() => {
    let result = cars;
    if (search) {
      result = result.filter(c => 
        `${c.make} ${c.model}`.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (makeFilter !== "All") {
      result = result.filter(c => c.make === makeFilter);
    }
    if (typeFilter !== "All") {
      result = result.filter(c => c.vehicle_type === typeFilter);
    }
    if (transmissionFilter !== "All") {
      result = result.filter(c => c.transmission === transmissionFilter);
    }
    if (fuelFilter !== "All") {
      result = result.filter(c => c.fuel_type === fuelFilter);
    }
    if (nationalityFilter !== "All") {
      result = result.filter(c => c.nationality === nationalityFilter);
    }
    result = result.filter(c => c.price >= priceRange[0] && c.price <= priceRange[1]);
    result = result.filter(c => c.year >= yearRange[0] && c.year <= yearRange[1]);
    
    setFilteredCars(result);
  }, [search, makeFilter, typeFilter, transmissionFilter, fuelFilter, nationalityFilter, priceRange, yearRange, cars]);

  const makes = ["All", ...new Set(cars.map(c => c.make))].sort();
  const types = ["All", ...new Set(cars.filter(c => c.vehicle_type).map(c => c.vehicle_type!))].sort();
  const transmissions = ["All", ...new Set(cars.map(c => c.transmission))].sort();
  const fuels = ["All", ...new Set(cars.map(c => c.fuel_type))].sort();
  const nationalities = ["All", ...new Set(cars.filter(c => c.nationality).map(c => c.nationality!))].sort();

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <SEO 
        title={`Inventario de Carros Usados ${makeFilter !== 'All' ? makeFilter : ''}`} 
        description={`Explora nuestro inventario de ${filteredCars.length} carros usados en Cúcuta. Filtra por marca, precio, año y más.`}
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">INVENTARIO</h1>
          <p className="text-zinc-500 font-medium">Explora nuestra extensa colección de vehículos premium usados.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Filters */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-100">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-zinc-900">Filtros</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Modelo, marca..."
                      className="w-full bg-zinc-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Marca</label>
                  <select 
                    value={makeFilter}
                    onChange={(e) => setMakeFilter(e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-bold"
                  >
                    {makes.map(make => (
                      <option key={make} value={make}>{make === "All" ? "Todas las Marcas" : make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Tipo de Vehículo</label>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-bold"
                  >
                    {types.map(t => (
                      <option key={t} value={t}>{t === "All" ? "Todos los Tipos" : t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Transmisión</label>
                  <div className="flex flex-wrap gap-2">
                    {transmissions.map(t => (
                      <button
                        key={t}
                        onClick={() => setTransmissionFilter(t)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold transition-all",
                          transmissionFilter === t 
                            ? "bg-black text-white shadow-lg shadow-black/20" 
                            : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                        )}
                      >
                        {t === "All" ? "Todas" : t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Rango de Precio (Millones)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full bg-zinc-50 border-none rounded-xl py-2 px-3 text-xs font-bold"
                      value={priceRange[0] / 1000000}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) * 1000000 || 0, priceRange[1]])}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full bg-zinc-50 border-none rounded-xl py-2 px-3 text-xs font-bold"
                      value={priceRange[1] / 1000000}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) * 1000000 || 500000000])}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Año</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Desde"
                      className="w-full bg-zinc-50 border-none rounded-xl py-2 px-3 text-xs font-bold"
                      value={yearRange[0]}
                      onChange={(e) => setYearRange([parseInt(e.target.value) || 1980, yearRange[1]])}
                    />
                    <input
                      type="number"
                      placeholder="Hasta"
                      className="w-full bg-zinc-50 border-none rounded-xl py-2 px-3 text-xs font-bold"
                      value={yearRange[1]}
                      onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value) || 2026])}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Combustible</label>
                  <div className="flex flex-wrap gap-2">
                    {fuels.map(f => (
                      <button
                        key={f}
                        onClick={() => setFuelFilter(f)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold transition-all",
                          fuelFilter === f 
                            ? "bg-black text-white shadow-lg shadow-black/20" 
                            : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                        )}
                      >
                        {f === "All" ? "Todos" : f === "Gasoline" ? "Gasolina" : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Nacionalidad</label>
                  <div className="flex flex-wrap gap-2">
                    {nationalities.map(n => (
                      <button
                        key={n}
                        onClick={() => setNationalityFilter(n)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold transition-all",
                          nationalityFilter === n 
                            ? "bg-black text-white shadow-lg shadow-black/20" 
                            : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                        )}
                      >
                        {n === "All" ? "Todas" : n}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSearch("");
                    setMakeFilter("All");
                    setTypeFilter("All");
                    setTransmissionFilter("All");
                    setFuelFilter("All");
                    setNationalityFilter("All");
                    setPriceRange([0, 500000000]);
                    setYearRange([1980, 2026]);
                  }}
                  className="w-full py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-96 bg-zinc-200 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredCars.map(car => (
                  <CarCard 
                    key={car.id} 
                    car={car} 
                    isFavorite={favorites.includes(car.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-zinc-200">
                <CarIcon className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">No se encontraron carros</h3>
                <p className="text-zinc-500">Intenta ajustar tus filtros para encontrar lo que buscas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CarDetail({ favorites, onToggleFavorite }: { favorites: number[], onToggleFavorite: (id: number) => void }) {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCar() {
      if (!id || !isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) {
        setCar(data);
        setActiveImage(data.image_url);
      }
      setLoading(false);
    }
    fetchCar();
  }, [id]);

  if (loading) return <div className="pt-40 text-center">Cargando...</div>;
  if (!car) return <div className="pt-40 text-center">Carro no encontrado</div>;

  const images = car.all_images && car.all_images.length > 0 ? car.all_images : [car.image_url];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-white">
      {car && (
        <SEO 
          title={`${car.make} ${car.model} ${car.year}`} 
          description={`Compra este ${car.make} ${car.model} ${car.year} en Cúcuta. ${car.mileage.toLocaleString()} km, transmisión ${car.transmission}, combustible ${car.fuel_type}. ¡Contáctanos ahora!`}
          image={car.image_url}
          url={`https://www.autosya.com.co/car/${car.id}`}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="aspect-[16/10] rounded-[40px] overflow-hidden shadow-2xl bg-zinc-100">
              <img
                src={activeImage || car.image_url}
                alt={car.model}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "aspect-square rounded-2xl bg-zinc-100 overflow-hidden cursor-pointer hover:opacity-80 transition-all border-2",
                      activeImage === img ? "border-red-600" : "border-transparent"
                    )}
                  >
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-zinc-100 px-4 py-1 rounded-full text-xs font-bold text-zinc-600">{car.year}</span>
                <span className="bg-red-100 px-4 py-1 rounded-full text-xs font-bold text-red-600">Usado Certificado</span>
              </div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <h1 className="text-5xl font-black text-zinc-900 tracking-tight uppercase">
                  {car.make} <span className="text-red-600">{car.model}</span>
                </h1>
                <button 
                  onClick={() => onToggleFavorite(car.id)}
                  className={cn(
                    "p-4 rounded-2xl transition-all shadow-xl",
                    favorites.includes(car.id) ? "bg-red-600 text-white shadow-red-600/20" : "bg-zinc-50 text-zinc-400 hover:text-red-600"
                  )}
                >
                  <Heart className={cn("w-6 h-6", favorites.includes(car.id) && "fill-current")} />
                </button>
              </div>
              <p className="text-3xl font-bold text-zinc-900">${car.price.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              {[
                { label: "Kilometraje", value: `${car.mileage.toLocaleString()} km` },
                { label: "Transmisión", value: car.transmission === "Automatic" ? "Automática" : car.transmission === "Manual" ? "Manual" : car.transmission },
                { label: "Combustible", value: car.fuel_type === "Gasoline" ? "Gasolina" : car.fuel_type === "Diesel" ? "Diesel" : car.fuel_type },
                { label: "Motor", value: car.engine || "No especificado" },
                { label: "Tipo", value: car.vehicle_type || "No especificado" },
                { label: "Nacionalidad", value: car.nationality || "No especificado" }
              ].map((spec, i) => (
                <div key={i} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">{spec.label}</div>
                  <div className="text-lg font-bold text-zinc-900">{spec.value}</div>
                </div>
              ))}
            </div>

            {(car.plate_city || car.color || car.soat_until || car.techno_until || car.location_city) && (
              <div className="mb-10 p-8 bg-zinc-50 rounded-[40px] border border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-widest">Ficha Técnica</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  {car.location_city && (
                    <>
                      <div className="text-zinc-400">Ubicación</div>
                      <div className="font-bold text-zinc-900 text-right">{car.location_city}</div>
                    </>
                  )}
                  {car.plate_city && (
                    <>
                      <div className="text-zinc-400">Ciudad de Placa</div>
                      <div className="font-bold text-zinc-900 text-right">{car.plate_city}</div>
                    </>
                  )}
                  {car.color && (
                    <>
                      <div className="text-zinc-400">Color</div>
                      <div className="font-bold text-zinc-900 text-right capitalize">{car.color}</div>
                    </>
                  )}
                  {car.soat_until && (
                    <>
                      <div className="text-zinc-400">SOAT Vigente hasta</div>
                      <div className="font-bold text-zinc-900 text-right">{car.soat_until}</div>
                    </>
                  )}
                  {car.techno_until && (
                    <>
                      <div className="text-zinc-400">Tecnomecánica hasta</div>
                      <div className="font-bold text-zinc-900 text-right">{car.techno_until}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mb-10">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Descripción</h3>
              <p className="text-zinc-500 leading-relaxed">
                {car.description} Este vehículo ha sido mantenido meticulosamente y cuenta con un historial de servicio completo. 
                Las características incluyen interior de cuero premium, sistemas de seguridad avanzados y un sistema de audio de alto rendimiento.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={`tel:${car.phone || "573000000000"}`}
                className="flex-1 bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-center"
              >
                <Phone className="w-5 h-5" /> Contactar Vendedor
              </a>
              <a 
                href={`https://wa.me/${car.whatsapp?.replace(/\D/g, '') || "573000000000"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-center"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const popularMakes = ["Toyota", "Chevrolet", "Renault", "Mazda", "Nissan", "Kia", "Suzuki", "Ford"];

  return (
    <footer className="bg-zinc-950 text-white py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <CarIcon className="text-black w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Autosya
            </span>
          </div>
          <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
            El mercado más confiable para vehículos usados premium en Cúcuta. 
            Combinamos tecnología y experiencia para brindar la mejor experiencia de compra de carros.
          </p>
          <div className="flex gap-4">
            {[Phone, Mail, MapPin].map((Icon, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-lg">Marcas Populares</h4>
          <ul className="grid grid-cols-2 gap-4 text-zinc-500">
            {popularMakes.map(make => (
              <li key={make}>
                <Link to={`/inventory?make=${make}`} className="hover:text-white transition-colors text-sm">
                  {make} Usados
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-lg">Enlaces Rápidos</h4>
          <ul className="space-y-4 text-zinc-500">
            <li><Link to="/inventory" className="hover:text-white transition-colors">Inventario Cúcuta</Link></li>
            <li><Link to="/sell" className="hover:text-white transition-colors">Vende tu Carro</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Servicios</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Nosotros</Link></li>
          </ul>
        </div>
      </div>
      
      {/* SEO Text Block */}
      <div className="max-w-7xl mx-auto mt-16 p-8 bg-white/5 rounded-3xl border border-white/10">
        <h5 className="text-zinc-300 font-bold mb-4 text-sm uppercase tracking-widest">Autosya Cúcuta - Tu Concesionario de Confianza</h5>
        <p className="text-zinc-500 text-xs leading-relaxed">
          En Autosya nos especializamos en la compra y venta de carros usados en Cúcuta, Norte de Santander. 
          Contamos con un amplio inventario de camionetas 4x4, automóviles familiares y vehículos de carga. 
          Si buscas Toyota usados en Cúcuta, Renault Stepway, Chevrolet Onix o camionetas Ford, somos tu mejor opción. 
          Ofrecemos financiamiento inmediato, peritaje certificado y los precios más bajos de la región. 
          Visítanos y descubre por qué somos el concesionario líder en Cúcuta.
        </p>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm">
        © 2026 Autosya. Todos los derechos reservados. | Carros Usados Cúcuta | Venta de Vehículos
      </div>
    </footer>
  );
}

function ConfigError() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#09090b', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        backgroundColor: 'white', 
        borderRadius: '32px', 
        padding: '40px', 
        textAlign: 'center', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 32px auto' 
        }}>
          <AlertCircle style={{ width: '40px', height: '40px', color: '#ef4444' }} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#18181b', marginBottom: '16px' }}>CONFIGURACIÓN PENDIENTE</h1>
        <p style={{ color: '#71717a', marginBottom: '32px', lineHeight: '1.6' }}>
          Tu aplicación se ha desplegado correctamente, pero faltan las <b>Variables de Entorno</b> en Vercel para conectar con Supabase.
        </p>
        <div style={{ backgroundColor: '#f4f4f5', padding: '24px', borderRadius: '24px', textAlign: 'left', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <code style={{ fontSize: '12px', fontWeight: 'bold', color: '#3f3f46' }}>VITE_SUPABASE_URL</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <code style={{ fontSize: '12px', fontWeight: 'bold', color: '#3f3f46' }}>VITE_SUPABASE_ANON_KEY</code>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#a1a1aa', fontStyle: 'italic' }}>
          Añádelas en Vercel (Settings &gt; Environment Variables) y vuelve a desplegar.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [inventory, setInventory] = useState<Car[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('autosya_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('autosya_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    console.log("App mounted, checking config...");
    console.log("Supabase Configured:", isSupabaseConfigured);
    
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Please check environment variables.");
      return;
    }

    async function fetchInventory() {
      try {
        const { data, error: sbError } = await supabase.from("cars").select("*");
        if (sbError) throw sbError;
        if (data) setInventory(data);
      } catch (err: any) {
        console.error("Failed to fetch inventory:", err);
        setError(err.message);
      }
    }
    fetchInventory();
  }, []);

  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  if (error) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error de Base de Datos</h1>
        <p className="text-zinc-500 mt-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 bg-black text-white px-6 py-2 rounded-xl"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="font-sans selection:bg-red-600/30">
        <Navbar inventory={inventory} />
        <main>
          <Routes>
            <Route path="/" element={<Home favorites={favorites} onToggleFavorite={toggleFavorite} />} />
            <Route path="/inventory" element={<Inventory favorites={favorites} onToggleFavorite={toggleFavorite} />} />
            <Route path="/car/:id" element={<CarDetail favorites={favorites} onToggleFavorite={toggleFavorite} />} />
            <Route path="/sell" element={<SellCar />} />
            <Route path="/favorites" element={<Favorites inventory={inventory} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
            <Route path="/my-listings" element={<MyListings inventory={inventory} favorites={favorites} onToggleFavorite={toggleFavorite} />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <Footer />
        <AIAssistant inventory={inventory} />
        <WhatsAppButton />
      </div>
    </Router>
  );
}
