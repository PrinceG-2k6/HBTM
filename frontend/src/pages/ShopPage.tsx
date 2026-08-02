import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Search, Star, ArrowRight,
  CheckCircle2, X, Plus, Minus, Zap, ArrowLeft, Check, Cpu
} from "lucide-react";
import { SHOP_PRODUCTS, type Product } from "../data/shopProducts";
import { rankProductsByVectorSimilarity } from "../utils/vectorSimilarity";
import { useAuth } from "../contexts/auth.context";

interface CartItem {
  product: Product;
  quantity: number;
}

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter & Search states
  const searchQuery = searchParams.get("search") || searchParams.get("q") || searchParams.get("node") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"match" | "price-low" | "price-high" | "rating">("match");

  // Modal & Cart states
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("hbtm_cart");
    return stored ? JSON.parse(stored) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Sync search input with URL search param
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Persist cart items to localStorage
  useEffect(() => {
    localStorage.setItem("hbtm_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Add to cart helper
  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Cart quantity controls
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Total cart calculations
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = Math.round(subtotal * 0.15); // 15% AI Member Discount
  const grandTotal = Math.max(0, subtotal - discount);

  // Handle Search Input Change & URL Sync
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  // Vector Cosine Similarity Embedding Calculation & Filtering
  const vectorRankedProducts = useMemo(() => {
    // 1. Rank all products using Cosine Similarity against active search / node content
    const ranked = rankProductsByVectorSimilarity(SHOP_PRODUCTS, searchInput);

    // 2. Filter by category
    const filtered = ranked.filter(product => {
      return selectedCategory === "All" || product.category === selectedCategory;
    });

    // 3. Sort by requested sort criterion
    return filtered.sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.similarityPercent - a.similarityPercent; // Default: Cosine Similarity %
    });
  }, [searchInput, selectedCategory, sortBy]);

  const categories = [
    "All",
    "Apparel & Pieces",
    "Digital Tools",
    "Books & Media",
    "Experiences",
    "Hardware & Wearables",
    "Workspace Artifacts",
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#141416] text-zinc-100 pb-24 overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[350px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Top Header Navigation Row ─────────────────────────────── */}
      <header className="relative z-20 w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-2xl px-6 sm:px-10 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider">
                  PRODUCTS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Curated apparel, digital tools, hardware, and growth artifacts for your trajectory.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-5 py-2.5 rounded-full bg-amber-400 text-amber-950 hover:bg-amber-300 text-xs sm:text-sm font-semibold transition-all shadow-xl shadow-amber-400/20 flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <ShoppingBag size={16} />
            <span>Bag</span>
            {totalItemsCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-amber-950 text-amber-300 text-2xs flex items-center justify-center font-bold">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-8 space-y-10">

        {/* ── Controls Bar: Search & Category Filter ────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-white text-black shadow-lg"
                    : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Options */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products or nodes..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-amber-400/60 transition-all placeholder-zinc-500"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs outline-none cursor-pointer focus:border-zinc-700 font-medium"
            >
              <option value="match">AI Trajectory Match</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ── Product Grid ───────────────────────────────────────── */}
        {vectorRankedProducts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/40 rounded-3xl border border-zinc-800/60 space-y-4">
            <ShoppingBag size={48} className="mx-auto text-zinc-600" />
            <h3 className="text-xl text-white font-semibold">No products found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No products match "{searchInput}". Try clearing your search or picking another category.
            </p>
            <button
              onClick={() => { handleSearchChange(""); setSelectedCategory("All"); }}
              className="px-6 py-2.5 rounded-full bg-amber-400 text-amber-950 text-xs font-semibold hover:bg-amber-300 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vectorRankedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setActiveModalProduct(product)}
                className="group relative rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-amber-400/40 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-2xs font-bold shadow-md">
                          {product.badge}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-950/85 backdrop-blur-md text-emerald-400 border border-emerald-800/60 text-2xs font-mono font-bold shadow-lg">
                        {product.similarityPercent}% Match
                      </span>
                    </div>

                    {/* Node Affinity Tag */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-purple-950/90 text-purple-300 border border-purple-700/60 text-2xs font-medium backdrop-blur-md flex items-center gap-1">
                        <Zap size={11} className="text-purple-400" />
                        <span>{product.nodeAffinity} Node</span>
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {product.title}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Metrics Indicators */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-2xs">
                      <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 block uppercase">Confidence</span>
                        <span className="text-amber-400 font-bold">+{product.confidenceBoost}% Boost</span>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 block uppercase">Growth</span>
                        <span className="text-emerald-400 font-bold truncate block">{product.growthSupport}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Price & Action */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-zinc-800/40 mt-2">
                  <div>
                    <span className="text-xl font-bold text-white font-mono">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-zinc-500 line-through ml-2">${product.originalPrice}</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-amber-400 hover:text-amber-950 hover:border-amber-400 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Product Detail Modal ─────────────────────────────────── */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Product Image */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-square">
                <img
                  src={activeModalProduct.image}
                  alt={activeModalProduct.title}
                  className="w-full h-full object-cover"
                />
                {activeModalProduct.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold shadow-md">
                    {activeModalProduct.badge}
                  </span>
                )}
              </div>

              {/* Product Inspection Details */}
              <div className="space-y-5">
                <div>
                  <span className="text-2xs uppercase tracking-widest text-purple-300 font-semibold px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                    {activeModalProduct.nodeAffinity} Node Artifact
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">
                    {activeModalProduct.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Star size={14} className="fill-amber-400" /> {activeModalProduct.rating}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{activeModalProduct.reviewsCount} Aspirant Reviews</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {activeModalProduct.description}
                </p>

                {/* Highlights */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Key Trajectory Specifications
                  </span>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {activeModalProduct.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                    <span className="text-2xs text-zinc-400 uppercase block">Confidence Boost</span>
                    <span className="text-lg font-bold text-amber-400">+{activeModalProduct.confidenceBoost}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                    <span className="text-2xs text-zinc-400 uppercase block">Growth Impact</span>
                    <span className="text-xs font-bold text-emerald-400 truncate block mt-1">
                      {activeModalProduct.growthSupport}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                  <div>
                    <span className="text-2xl font-bold text-white font-mono">${activeModalProduct.price}</span>
                    {activeModalProduct.originalPrice && (
                      <span className="text-xs text-zinc-500 line-through ml-2">${activeModalProduct.originalPrice}</span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(activeModalProduct);
                      setActiveModalProduct(null);
                    }}
                    className="px-8 py-3.5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs sm:text-sm hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20 cursor-pointer flex items-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-over Cart Drawer ───────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={20} className="text-amber-400" />
                    <h2 className="text-lg font-bold text-white">Your Growth Bag</h2>
                    <span className="text-xs text-zinc-400 font-mono">({totalItemsCount} items)</span>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Items List */}
                {cartItems.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <ShoppingBag size={40} className="mx-auto text-zinc-600" />
                    <p className="text-sm text-zinc-400">Your bag is currently empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-6 max-h-[55vh] overflow-y-auto pr-1">
                    {cartItems.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800"
                      >
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-16 h-16 rounded-xl object-cover border border-zinc-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{product.title}</h4>
                          <span className="text-2xs text-purple-300 block mt-0.5">{product.nodeAffinity} Node</span>
                          <span className="text-xs font-bold text-white font-mono block mt-1">${product.price}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-mono font-bold text-white w-4 text-center">{quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Footer */}
              {cartItems.length > 0 && (
                <div className="pt-6 border-t border-zinc-800 space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span className="font-mono text-zinc-200">${subtotal}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>AI Member Discount (15%)</span>
                      <span className="font-mono">-${discount}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                      <span>Grand Total</span>
                      <span className="font-mono text-amber-400">${grandTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutSuccess(true);
                      setTimeout(() => {
                        setCheckoutSuccess(false);
                        setCartItems([]);
                        setIsCartOpen(false);
                      }, 2500);
                    }}
                    className="w-full py-4 rounded-full bg-amber-400 text-amber-950 font-bold text-sm hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {checkoutSuccess ? (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Order Confirmed! Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Order (${grandTotal})</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
