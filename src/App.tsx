import React, { useState, useEffect, FormEvent } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { Search, Car as CarIcon, Shield, Zap, Menu, X, Filter, ChevronRight, Phone, Mail, MapPin, Sparkles, AlertCircle, User, LogOut, Table, Save, Trash2, Plus, Check, XCircle } from "lucide-react";
import { cn } from "./lib/utils";
import type { Car } from "./lib/utils";

import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { getCarAdvice, estimateCarValue } from "./services/geminiService";

// --- Components ---

// function AIAssistant({ inventory }: { inventory: Car[] }) {
// ... simplified for debug
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
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Asistente IA</div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">En línea</div>
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
                  : "bg-emerald-50 text-emerald-900 rounded-tl-none"
              )}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm animate-pulse">
                Pensando...
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-100 flex gap-2">
            <input
              type="text"
              placeholder="Pregunta lo que quieras..."
              className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition-colors"
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
        <Sparkles className="w-8 h-8 group-hover:text-emerald-400 transition-colors" />
      </button>
    </div>
  );
}

function SellCar() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    make: "", model: "", year: "", price: "", mileage: "", 
    transmission: "Automatic", fuel_type: "Gasoline", image_url: "", description: ""
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

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

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
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all"
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
              <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all">
                Publicar Vehículo
              </button>
            </form>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 text-white p-8 rounded-[40px] shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-emerald-400 w-6 h-6" />
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
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-zinc-400" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
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
              className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500" 
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Contraseña</label>
            <input 
              required 
              type="password" 
              className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
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
            className="text-emerald-600 font-bold hover:underline"
          >
            {isSignUp ? "Inicia Sesión" : "Regístrate gratis"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

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
  };

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CarIcon className="text-white w-6 h-6" />
            </div>
            <span className={cn(
              "text-xl font-bold tracking-tight",
              isScrolled ? "text-black" : "text-white"
            )}>
              Autosya
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {["Inventario", "Vender", "Servicios", "Nosotros"].map((item) => (
              <Link
                key={item}
                to={item === "Inventario" ? "/inventory" : `/${item === "Vender" ? "sell" : item === "Servicios" ? "services" : "about"}`}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-500",
                  isScrolled ? "text-zinc-600" : "text-white/80"
                )}
              >
                {item}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/spreadsheet"
                  className={cn(
                    "flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all",
                    isScrolled 
                      ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                      : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  )}
                >
                  <Table className="w-4 h-4" />
                  Mis Anuncios
                </Link>
                <div className="flex items-center gap-2 bg-zinc-100/50 p-1 pr-3 rounded-full border border-zinc-200">
                  <img 
                    src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=10b981&color=fff`} 
                    alt={user.user_metadata.full_name || user.email} 
                    className="w-8 h-8 rounded-full border border-white"
                  />
                  <span className="text-xs font-bold text-zinc-700">
                    {(user.user_metadata.full_name || user.email).split(' ')[0].split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className={cn(
                    "p-2 rounded-full transition-colors hover:bg-red-50 hover:text-red-500",
                    isScrolled ? "text-zinc-400" : "text-white/60"
                  )}
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={cn(
                  "text-sm font-bold px-6 py-2.5 rounded-full transition-all border",
                  isScrolled 
                    ? "text-zinc-900 border-zinc-200 hover:bg-zinc-50" 
                    : "text-white border-white/20 hover:bg-white/10"
                )}
              >
                Iniciar Sesión
              </button>
            )}
          </div>

          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="text-black" /> : <Menu className={isScrolled ? "text-black" : "text-white"} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t p-6 md:hidden flex flex-col gap-4 shadow-xl">
            {["Inventario", "Vender", "Servicios", "Nosotros"].map((item) => (
              <Link
                key={item}
                to={item === "Inventario" ? "/inventory" : `/${item === "Vender" ? "sell" : item === "Servicios" ? "services" : "about"}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-zinc-900"
              >
                {item}
              </Link>
            ))}
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
              <>
                <Link
                  to="/spreadsheet"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-bold"
                >
                  <Table className="w-4 h-4" />
                  Mis Anuncios
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="bg-red-50 text-red-600 text-center py-3 rounded-xl font-bold"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        )}
      </nav>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}

function CarCard({ car }: { car: Car; key?: React.Key }) {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500">
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
          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            ${car.price.toLocaleString()}
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                {car.make} {car.model}
              </h3>
              <p className="text-zinc-500 text-sm font-medium">
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
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Estado</span>
              <span className="text-sm font-bold text-emerald-600">Excelente</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Home() {
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
            <span className="inline-block px-4 py-1.5 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
              Concesionario Premium en Cúcuta
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
              CONDUCE TU <br />
              <span className="text-emerald-500">SUEÑO</span> HOY.
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
                VEHÍCULOS <span className="text-emerald-500">DESTACADOS</span>
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
              cars.map(car => <CarCard key={car.id} car={car} />)
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
              <span className="text-emerald-500">AUTOSYA?</span>
            </h2>
            <div className="space-y-8">
              {[
                { icon: Shield, title: "Vehículos Certificados", desc: "Cada carro se somete a una rigurosa inspección de 150 puntos por nuestros expertos." },
                { icon: Zap, title: "Valoración Instantánea", desc: "Obtén un precio justo de mercado para tu carro en minutos usando nuestro motor de IA." },
                { icon: Sparkles, title: "Experiencia Premium", desc: "Desde la prueba de manejo hasta el papeleo, nosotros nos encargamos de todo por ti." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-emerald-500" />
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
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
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

function Inventory() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [makeFilter, setMakeFilter] = useState("All");

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
    setFilteredCars(result);
  }, [search, makeFilter, cars]);

  const makes = ["All", ...new Set(cars.map(c => c.make))];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
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
                <Filter className="w-5 h-5 text-emerald-500" />
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
                      className="w-full bg-zinc-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Marca</label>
                  <div className="flex flex-wrap gap-2">
                    {makes.map(make => (
                      <button
                        key={make}
                        onClick={() => setMakeFilter(make)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          makeFilter === make 
                            ? "bg-black text-white shadow-lg shadow-black/20" 
                            : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                        )}
                      >
                        {make === "All" ? "Todas" : make}
                      </button>
                    ))}
                  </div>
                </div>
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
                {filteredCars.map(car => <CarCard key={car.id} car={car} />)}
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

function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCar() {
      if (!id || !isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) setCar(data);
      setLoading(false);
    }
    fetchCar();
  }, [id]);

  if (loading) return <div className="pt-40 text-center">Cargando...</div>;
  if (!car) return <div className="pt-40 text-center">Carro no encontrado</div>;

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="aspect-[16/10] rounded-[40px] overflow-hidden shadow-2xl">
              <img
                src={car.image_url}
                alt={car.model}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-2xl bg-zinc-100 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={car.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-zinc-100 px-4 py-1 rounded-full text-xs font-bold text-zinc-600">{car.year}</span>
                <span className="bg-emerald-100 px-4 py-1 rounded-full text-xs font-bold text-emerald-600">Usado Certificado</span>
              </div>
              <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-2 uppercase">
                {car.make} <span className="text-emerald-500">{car.model}</span>
              </h1>
              <p className="text-3xl font-bold text-zinc-900">${car.price.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              {[
                { label: "Kilometraje", value: `${car.mileage.toLocaleString()} km` },
                { label: "Transmisión", value: car.transmission === "Automatic" ? "Automática" : "Manual" },
                { label: "Combustible", value: car.fuel_type === "Gasoline" ? "Gasolina" : car.fuel_type === "Diesel" ? "Diesel" : car.fuel_type },
                { label: "Motor", value: "3.0L Turbo" }
              ].map((spec, i) => (
                <div key={i} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">{spec.label}</div>
                  <div className="text-lg font-bold text-zinc-900">{spec.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Descripción</h3>
              <p className="text-zinc-500 leading-relaxed">
                {car.description} Este vehículo ha sido mantenido meticulosamente y cuenta con un historial de servicio completo. 
                Las características incluyen interior de cuero premium, sistemas de seguridad avanzados y un sistema de audio de alto rendimiento.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" /> Contactar Vendedor
              </button>
              <button className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" /> Consultar Ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpreadsheetEditor() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [editedCars, setEditedCars] = useState<Map<number, Partial<Car>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [newRows, setNewRows] = useState<Partial<Car>[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchCars() {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) setCars(data);
      setLoading(false);
    }
    fetchCars();
  }, [user]);

  const handleCellChange = (carId: number, field: keyof Car, value: string | number) => {
    setEditedCars(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(carId) || {};
      newMap.set(carId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const handleNewRowChange = (index: number, field: keyof Car, value: string | number) => {
    setNewRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addNewRow = () => {
    setNewRows(prev => [...prev, {
      make: "", model: "", year: new Date().getFullYear(), price: 0,
      mileage: 0, transmission: "Automatic", fuel_type: "Gasoline",
      image_url: "", description: ""
    }]);
  };

  const removeNewRow = (index: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRowSelection = (carId: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(carId)) newSet.delete(carId);
      else newSet.add(carId);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === cars.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(cars.map(c => c.id)));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Update existing cars
      for (const [carId, changes] of editedCars) {
        const { error } = await supabase
          .from("cars")
          .update(changes)
          .eq("id", carId)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      // Insert new cars
      if (newRows.length > 0) {
        const validNewRows = newRows.filter(r => r.make && r.model);
        if (validNewRows.length > 0) {
          const { error } = await supabase
            .from("cars")
            .insert(validNewRows.map(r => ({ ...r, user_id: user.id })));
          if (error) throw error;
        }
      }

      // Refresh data
      const { data } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) setCars(data);
      setEditedCars(new Map());
      setNewRows([]);
      alert("Cambios guardados exitosamente");
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedRows.size} anuncio(s)?`)) return;

    setSaving(true);
    try {
      for (const carId of selectedRows) {
        const { error } = await supabase
          .from("cars")
          .delete()
          .eq("id", carId)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      setCars(prev => prev.filter(c => !selectedRows.has(c.id)));
      setSelectedRows(new Set());
      setEditedCars(prev => {
        const newMap = new Map(prev);
        for (const id of selectedRows) newMap.delete(id);
        return newMap;
      });
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getCellValue = (car: Car, field: keyof Car) => {
    const edited = editedCars.get(car.id);
    if (edited && field in edited) return edited[field as keyof typeof edited];
    return car[field];
  };

  const hasChanges = editedCars.size > 0 || newRows.length > 0;

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-xl border border-zinc-100 text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Table className="w-10 h-10 text-zinc-400" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-4">Acceso Restringido</h2>
          <p className="text-zinc-500 mb-10">Debes iniciar sesión para editar tus anuncios.</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  const columns: { key: keyof Car; label: string; type: "text" | "number" | "select"; options?: string[] }[] = [
    { key: "make", label: "Marca", type: "text" },
    { key: "model", label: "Modelo", type: "text" },
    { key: "year", label: "Año", type: "number" },
    { key: "price", label: "Precio ($)", type: "number" },
    { key: "mileage", label: "Km", type: "number" },
    { key: "transmission", label: "Transmisión", type: "select", options: ["Automatic", "Manual"] },
    { key: "fuel_type", label: "Combustible", type: "select", options: ["Gasoline", "Diesel", "Electric", "Hybrid"] },
    { key: "image_url", label: "URL Imagen", type: "text" },
  ];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">EDITAR ANUNCIOS</h1>
            <p className="text-zinc-500 font-medium mt-2">Edita múltiples anuncios simultáneamente como en una hoja de cálculo.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedRows.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={saving}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar ({selectedRows.size})
              </button>
            )}
            <button
              onClick={addNewRow}
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || !hasChanges}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                hasChanges 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Todo"}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-medium">
              Tienes cambios sin guardar. {editedCars.size > 0 && `${editedCars.size} fila(s) modificada(s).`} {newRows.length > 0 && `${newRows.length} fila(s) nueva(s).`}
            </span>
          </div>
        )}

        <div className="bg-white rounded-[32px] shadow-sm border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="p-4 text-left">
                    <input 
                      type="checkbox"
                      checked={cars.length > 0 && selectedRows.size === cars.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </th>
                  {columns.map(col => (
                    <th key={col.key} className="p-4 text-left text-[10px] uppercase tracking-widest text-zinc-500 font-bold whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-20 text-center">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : cars.length === 0 && newRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-20 text-center">
                      <Table className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                      <p className="text-zinc-500 font-medium">No tienes anuncios publicados.</p>
                      <button 
                        onClick={addNewRow}
                        className="mt-4 text-emerald-600 font-bold hover:underline"
                      >
                        Crear tu primer anuncio
                      </button>
                    </td>
                  </tr>
                ) : (
                  <>
                    {cars.map(car => {
                      const isEdited = editedCars.has(car.id);
                      const isSelected = selectedRows.has(car.id);
                      return (
                        <tr 
                          key={car.id} 
                          className={cn(
                            "border-b border-zinc-50 transition-colors",
                            isSelected && "bg-emerald-50",
                            isEdited && !isSelected && "bg-amber-50/50"
                          )}
                        >
                          <td className="p-4">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(car.id)}
                              className="w-4 h-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                            />
                          </td>
                          {columns.map(col => (
                            <td key={col.key} className="p-2">
                              {col.type === "select" ? (
                                <select
                                  value={getCellValue(car, col.key) as string}
                                  onChange={(e) => handleCellChange(car.id, col.key, e.target.value)}
                                  className="w-full bg-transparent border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                  {col.options?.map(opt => (
                                    <option key={opt} value={opt}>
                                      {opt === "Automatic" ? "Automática" : opt === "Manual" ? "Manual" : 
                                       opt === "Gasoline" ? "Gasolina" : opt === "Diesel" ? "Diesel" : 
                                       opt === "Electric" ? "Eléctrico" : opt === "Hybrid" ? "Híbrido" : opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={col.type}
                                  value={getCellValue(car, col.key) as string | number}
                                  onChange={(e) => handleCellChange(car.id, col.key, col.type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
                                  className={cn(
                                    "w-full bg-transparent border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
                                    col.key === "image_url" && "min-w-[200px]"
                                  )}
                                />
                              )}
                            </td>
                          ))}
                          <td className="p-2">
                            {isEdited && (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold">
                                <AlertCircle className="w-3 h-3" /> Modificado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* New rows */}
                    {newRows.map((row, index) => (
                      <tr key={`new-${index}`} className="border-b border-zinc-50 bg-emerald-50/30">
                        <td className="p-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full text-xs font-bold">
                            <Plus className="w-3 h-3" />
                          </span>
                        </td>
                        {columns.map(col => (
                          <td key={col.key} className="p-2">
                            {col.type === "select" ? (
                              <select
                                value={(row[col.key] as string) || (col.options?.[0] || "")}
                                onChange={(e) => handleNewRowChange(index, col.key, e.target.value)}
                                className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              >
                                {col.options?.map(opt => (
                                  <option key={opt} value={opt}>
                                    {opt === "Automatic" ? "Automática" : opt === "Manual" ? "Manual" : 
                                     opt === "Gasoline" ? "Gasolina" : opt === "Diesel" ? "Diesel" : 
                                     opt === "Electric" ? "Eléctrico" : opt === "Hybrid" ? "Híbrido" : opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type}
                                value={(row[col.key] as string | number) || ""}
                                placeholder={col.label}
                                onChange={(e) => handleNewRowChange(index, col.key, col.type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
                                className={cn(
                                  "w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-400",
                                  col.key === "image_url" && "min-w-[200px]"
                                )}
                              />
                            )}
                          </td>
                        ))}
                        <td className="p-2">
                          <button
                            onClick={() => removeNewRow(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-zinc-500">
          <div>
            {cars.length} anuncio(s) • {selectedRows.size} seleccionado(s)
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 rounded"></span> Modificado</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 rounded"></span> Nuevo/Seleccionado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
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
              <div key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors cursor-pointer">
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-lg">Enlaces Rápidos</h4>
          <ul className="space-y-4 text-zinc-500">
            <li><Link to="/inventory" className="hover:text-white transition-colors">Inventario</Link></li>
            <li><Link to="/sell" className="hover:text-white transition-colors">Vende tu Carro</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Servicios</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Nosotros</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-lg">Boletín</h4>
          <p className="text-zinc-500 text-sm mb-4">Recibe las últimas ofertas y noticias del mundo automotriz.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              className="bg-white/5 border-none rounded-xl px-4 py-3 text-sm flex-1 focus:ring-2 focus:ring-emerald-500"
            />
            <button className="bg-emerald-500 p-3 rounded-xl hover:bg-emerald-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm">
        © 2026 Autosya. Todos los derechos reservados.
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
      <div className="font-sans selection:bg-emerald-500/30">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/car/:id" element={<CarDetail />} />
            <Route path="/sell" element={<SellCar />} />
            <Route path="/spreadsheet" element={<SpreadsheetEditor />} />
          </Routes>
        </main>
        <Footer />
        <AIAssistant inventory={inventory} />
      </div>
    </Router>
  );
}
