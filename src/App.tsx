import React, { useState, useEffect, FormEvent } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { Search, Car as CarIcon, Shield, Zap, Menu, X, Filter, ChevronRight, Phone, Mail, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import type { Car } from "./lib/utils";

import { getCarAdvice, estimateCarValue } from "./services/geminiService";

// --- Components ---

function AIAssistant({ inventory }: { inventory: Car[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AutoMarket Pro assistant. How can I help you find your dream car today?" }
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
      setMessages(prev => [...prev, { role: "ai", text: response || "I'm sorry, I couldn't process that. How else can I help?" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "I'm having a bit of trouble connecting. Please try again later!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 md:w-96 h-[500px] bg-white rounded-[32px] shadow-2xl border border-zinc-100 flex flex-col overflow-hidden"
          >
            <div className="p-6 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">AI Assistant</div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</div>
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
                  Thinking...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 flex gap-2">
              <input
                type="text"
                placeholder="Ask anything..."
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
          </motion.div>
        )}
      </AnimatePresence>

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
  const [formData, setFormData] = useState({
    make: "", model: "", year: "", price: "", mileage: "", 
    transmission: "Automatic", fuel_type: "Gasoline", image_url: "", description: ""
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimate, setEstimate] = useState("");
  const navigate = useNavigate();

  const handleEstimate = async () => {
    if (!formData.make || !formData.model) return alert("Please enter make and model first");
    setIsEstimating(true);
    try {
      const res = await estimateCarValue(`${formData.year} ${formData.make} ${formData.model} with ${formData.mileage}km`);
      setEstimate(res || "");
    } catch (error) {
      alert("Valuation service is currently unavailable.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        year: parseInt(formData.year),
        price: parseInt(formData.price),
        mileage: parseInt(formData.mileage)
      })
    });
    if (res.ok) {
      alert("Car listed successfully!");
      navigate("/inventory");
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">SELL YOUR CAR</h1>
          <p className="text-zinc-500 font-medium">List your vehicle and reach thousands of potential buyers instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-sm border border-zinc-100 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Make</label>
                  <input required className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Model</label>
                  <input required className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Year</label>
                  <input required type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Price ($)</label>
                  <input required type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Mileage (km)</label>
                  <input required type="number" className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Image URL</label>
                <input required className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-2">Description</label>
                <textarea required rows={4} className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all">
                List Vehicle
              </button>
            </form>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 text-white p-8 rounded-[40px] shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-emerald-400 w-6 h-6" />
                <h3 className="font-bold">AI Valuation</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-6">Get an instant estimate of your car's value based on current market data.</p>
              <button 
                onClick={handleEstimate}
                disabled={isEstimating}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {isEstimating ? "Calculating..." : "Get Estimate"}
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
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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
            AutoMarket<span className="text-emerald-500">Pro</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Inventory", "Sell", "Services", "About"].map((item) => (
            <Link
              key={item}
              to={item === "Inventory" ? "/inventory" : `/${item.toLowerCase()}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-emerald-500",
                isScrolled ? "text-zinc-600" : "text-white/80"
              )}
            >
              {item}
            </Link>
          ))}
          <Link
            to="/inventory"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Browse Cars
          </Link>
        </div>

        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="text-black" /> : <Menu className={isScrolled ? "text-black" : "text-white"} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t p-6 md:hidden flex flex-col gap-4 shadow-xl"
          >
            {["Inventory", "Sell", "Services", "About"].map((item) => (
              <Link
                key={item}
                to={item === "Inventory" ? "/inventory" : `/${item.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-zinc-900"
              >
                {item}
              </Link>
            ))}
            <Link
              to="/inventory"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-emerald-500 text-white text-center py-3 rounded-xl font-bold"
            >
              Browse Cars
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function CarCard({ car }: { car: Car; key?: React.Key }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      className="group bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
    >
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
              <p className="text-zinc-500 text-sm font-medium">{car.transmission} • {car.fuel_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-50">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Mileage</span>
              <span className="text-sm font-bold text-zinc-700">{car.mileage.toLocaleString()} km</span>
            </div>
            <div className="w-px h-8 bg-zinc-100" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Condition</span>
              <span className="text-sm font-bold text-emerald-600">Excellent</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cars")
      .then(res => res.json())
      .then(data => {
        setCars(data.slice(0, 3));
        setLoading(false);
      });
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
              Premium Used Car Marketplace
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
              DRIVE YOUR <br />
              <span className="text-emerald-500">DREAM</span> TODAY.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
              Experience the future of car buying. Transparent pricing, 
              certified vehicles, and AI-powered recommendations.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link
                to="/inventory"
                className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
              >
                Browse Inventory <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/sell"
                className="w-full md:w-auto bg-zinc-800/50 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all"
              >
                Sell Your Car
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 hidden md:grid grid-cols-3 gap-8">
          {[
            { label: "Cars Available", value: "500+" },
            { label: "Happy Customers", value: "12k+" },
            { label: "Certified Dealers", value: "45" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center"
            >
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                FEATURED <span className="text-emerald-500">LISTINGS</span>
              </h2>
              <p className="text-zinc-500 font-medium max-w-lg">
                Hand-picked premium vehicles that meet our strict 150-point inspection criteria.
              </p>
            </div>
            <Link to="/inventory" className="text-zinc-900 font-bold flex items-center gap-2 group">
              View All Inventory <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></div>
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
              WHY CHOOSE <br />
              <span className="text-emerald-500">AUTOMARKET PRO?</span>
            </h2>
            <div className="space-y-8">
              {[
                { icon: Shield, title: "Certified Vehicles", desc: "Every car undergoes a rigorous 150-point inspection by our experts." },
                { icon: Zap, title: "Instant Valuation", desc: "Get a fair market price for your car in minutes using our AI engine." },
                { icon: Sparkles, title: "Premium Experience", desc: "From test drive to paperwork, we handle everything for you." }
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
                <div className="font-bold text-zinc-900">AI Assistant</div>
              </div>
              <p className="text-sm text-zinc-500 italic">
                "I can help you find the perfect car based on your lifestyle and budget."
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
    fetch("/api/cars")
      .then(res => res.json())
      .then(data => {
        setCars(data);
        setFilteredCars(data);
        setLoading(false);
      });
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
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-4">INVENTORY</h1>
          <p className="text-zinc-500 font-medium">Browse our extensive collection of premium pre-owned vehicles.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Filters */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-100">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-zinc-900">Filters</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Search</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Model, make..."
                      className="w-full bg-zinc-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3">Make</label>
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
                        {make}
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
                <h3 className="text-xl font-bold text-zinc-900 mb-2">No cars found</h3>
                <p className="text-zinc-500">Try adjusting your filters to find what you're looking for.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CarDetail() {
  const { id } = useNavigate() as any; // Mocking for now, will use useParams
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  // In a real app, use useParams()
  const carId = window.location.pathname.split("/").pop();

  useEffect(() => {
    fetch(`/api/cars/${carId}`)
      .then(res => res.json())
      .then(data => {
        setCar(data);
        setLoading(false);
      });
  }, [carId]);

  if (loading) return <div className="pt-40 text-center">Loading...</div>;
  if (!car) return <div className="pt-40 text-center">Car not found</div>;

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-zinc-100 px-4 py-1 rounded-full text-xs font-bold text-zinc-600">{car.year}</span>
                <span className="bg-emerald-100 px-4 py-1 rounded-full text-xs font-bold text-emerald-600">Certified Pre-Owned</span>
              </div>
              <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-2 uppercase">
                {car.make} <span className="text-emerald-500">{car.model}</span>
              </h1>
              <p className="text-3xl font-bold text-zinc-900">${car.price.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              {[
                { label: "Mileage", value: `${car.mileage.toLocaleString()} km` },
                { label: "Transmission", value: car.transmission },
                { label: "Fuel Type", value: car.fuel_type },
                { label: "Engine", value: "3.0L Turbo" }
              ].map((spec, i) => (
                <div key={i} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">{spec.label}</div>
                  <div className="text-lg font-bold text-zinc-900">{spec.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Description</h3>
              <p className="text-zinc-500 leading-relaxed">
                {car.description} This vehicle has been meticulously maintained and comes with a full service history. 
                Features include premium leather interior, advanced safety systems, and a high-performance audio system.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" /> Contact Seller
              </button>
              <button className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" /> Inquire Now
              </button>
            </div>
          </motion.div>
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
              AutoMarket<span className="text-emerald-500">Pro</span>
            </span>
          </div>
          <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
            The most trusted marketplace for premium used vehicles. 
            We combine technology and expertise to provide the best car buying experience.
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
          <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
          <ul className="space-y-4 text-zinc-500">
            <li><Link to="/inventory" className="hover:text-white transition-colors">Inventory</Link></li>
            <li><Link to="/sell" className="hover:text-white transition-colors">Sell Your Car</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-lg">Newsletter</h4>
          <p className="text-zinc-500 text-sm mb-4">Get the latest deals and car news.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email" 
              className="bg-white/5 border-none rounded-xl px-4 py-3 text-sm flex-1 focus:ring-2 focus:ring-emerald-500"
            />
            <button className="bg-emerald-500 p-3 rounded-xl hover:bg-emerald-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm">
        © 2024 AutoMarket Pro. All rights reserved.
      </div>
    </footer>
  );
}

export default function App() {
  const [inventory, setInventory] = useState<Car[]>([]);

  useEffect(() => {
    fetch("/api/cars").then(res => res.json()).then(setInventory);
  }, []);

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
          </Routes>
        </main>
        <Footer />
        <AIAssistant inventory={inventory} />
      </div>
    </Router>
  );
}
