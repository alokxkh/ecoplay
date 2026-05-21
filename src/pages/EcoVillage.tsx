import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import { TbBolt, TbWind, TbDroplet, TbLeaf, TbFilter, TbAlertTriangle } from 'react-icons/tb';
import ProjectCardSkeleton from "../components/ProjectCardSkeleton";
import Tooltip from "../components/Tooltip";

interface ShopItem {
  id: string;
  emoji: string;
  label: string;
  cost: number;
  category: 'plants' | 'energy' | 'water' | 'wildlife';
  tooltip: string;
}

const RESOURCE_TOOLTIPS = {
  points: 'Eco points — spend in the shop to grow your village',
  air: 'Air quality — plant trees and add solar panels to improve',
  water: 'Water quality — install water filters to purify',
  bio: 'Biodiversity — trees, gardens, and wildlife raise this score',
  filter: 'Filter health — drops over time; buy a water filter to restore',
} as const;

const SHOP_ITEMS: ShopItem[] = [
  { id: 'tree', emoji: "🌳", label: "Plant a Tree", cost: 50, category: 'plants', tooltip: 'Adds a tree — +5 air, +3 biodiversity' },
  { id: 'apple', emoji: "🍎", label: "Apple Tree", cost: 75, category: 'plants', tooltip: 'Fruit tree — +5 air, +3 biodiversity' },
  { id: 'flower', emoji: "🌼", label: "Flower Garden", cost: 40, category: 'wildlife', tooltip: 'Wildflower patch — +4 biodiversity' },
  { id: 'bird', emoji: "🐦", label: "Add Birds", cost: 60, category: 'wildlife', tooltip: 'Attract birds — +4 biodiversity' },
  { id: 'cottage', emoji: "🏡", label: "Cottage", cost: 150, category: 'plants', tooltip: 'Cozy cottage — decorative placement' },
  { id: 'solar', emoji: "⚡", label: "Solar Panel", cost: 100, category: 'energy', tooltip: 'Clean energy — +8 air, −5 pollution' },
  { id: 'filter', emoji: "💧", label: "Water Filter", cost: 75, category: 'water', tooltip: 'Water filter — +10 water, restores filter health' },
];

const EMOJI_TO_ITEM = Object.fromEntries(SHOP_ITEMS.map((item) => [item.emoji, item]));

interface PlacedItem {
  emoji: string;
  x: number;
  y: number;
}

const EcoVillage = () => {
  const { state, dispatch } = useGame();
  const { user, ecoVillage, notifications } = state;
  
  const [isLoading, setIsLoading] = useState(true);
  const [landscape, setLandscape] = useState<PlacedItem[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [popup, setPopup] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      setShowNotifications(true);
    }
  }, [notifications]);

  const buyItem = (item: ShopItem) => {
    if (user.points < item.cost) {
      setPopup("Not enough points!");
      setTimeout(() => setPopup(null), 1500);
      return;
    }

    dispatch({ type: 'ADD_POINTS', payload: -item.cost });
    setInventory([...inventory, item.emoji]);
    
    const updates: Partial<typeof ecoVillage> = {};
    if (item.id === 'tree' || item.id === 'apple') {
      updates.trees = (ecoVillage.trees || 0) + 1;
      updates.airQuality = Math.min(100, (ecoVillage.airQuality || 0) + 5);
      updates.biodiversity = Math.min(100, (ecoVillage.biodiversity || 0) + 3);
    } else if (item.id === 'solar') {
      updates.solarPanels = (ecoVillage.solarPanels || 0) + 1;
      updates.airQuality = Math.min(100, (ecoVillage.airQuality || 0) + 8);
      updates.pollutionLevel = Math.max(0, (ecoVillage.pollutionLevel || 0) - 5);
    } else if (item.id === 'filter') {
      updates.waterFilters = (ecoVillage.waterFilters || 0) + 1;
      updates.waterQuality = Math.min(100, (ecoVillage.waterQuality || 0) + 10);
      updates.filterHealth = 100;
    } else if (item.id === 'flower' || item.id === 'bird') {
      updates.biodiversity = Math.min(100, (ecoVillage.biodiversity || 0) + 4);
      updates.wildlife = [...(ecoVillage.wildlife || []), 'animal'];
    }

    dispatch({ type: 'UPDATE_ECO_VILLAGE', payload: updates });
    setPopup(`You bought ${item.emoji} ${item.label}!`);
    setTimeout(() => setPopup(null), 1500);
  };

  const handleDragStart = (emoji: string) => {
    setDraggedItem(emoji);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setLandscape([...landscape, { emoji: draggedItem, x, y }]);
    setInventory(inventory.filter((item) => item !== draggedItem));
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="p-6 text-white max-w-5xl mx-auto">
      <AnimatePresence>
        {showNotifications && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 shadow-2xl max-w-lg w-full border border-white/30"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TbAlertTriangle className="h-5 w-5" />
                Village Update
              </h3>
              <Tooltip content="Dismiss village updates" disableTouchToggle>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
                  }}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </Tooltip>
            </div>
            <div className="space-y-1 text-sm">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-center">🌳 Your Eco Village</h1>

      {/* Resource Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
          ))
        ) : (
          <>
            <Tooltip content={RESOURCE_TOOLTIPS.points}>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 text-center w-full h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mb-2">
                  <TbBolt className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-xl font-bold text-white">{user.points}</div>
                <div className="text-xs text-blue-200">Points</div>
              </div>
            </Tooltip>
            <Tooltip content={RESOURCE_TOOLTIPS.air}>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 text-center w-full h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-2">
                  <TbWind className="h-5 w-5 text-sky-300" />
                </div>
                <div className="text-xl font-bold text-white">{ecoVillage.airQuality}%</div>
                <div className="text-xs text-blue-200">Air</div>
              </div>
            </Tooltip>
            <Tooltip content={RESOURCE_TOOLTIPS.water}>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 text-center w-full h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-2">
                  <TbDroplet className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="text-xl font-bold text-white">{ecoVillage.waterQuality}%</div>
                <div className="text-xs text-blue-200">Water</div>
              </div>
            </Tooltip>
            <Tooltip content={RESOURCE_TOOLTIPS.bio}>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 text-center w-full h-full flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-2">
                  <TbLeaf className="h-5 w-5 text-green-300" />
                </div>
                <div className="text-xl font-bold text-white">{ecoVillage.biodiversity}%</div>
                <div className="text-xs text-blue-200">Bio</div>
              </div>
            </Tooltip>
            <Tooltip content={ecoVillage.filterHealth < 30 ? `${RESOURCE_TOOLTIPS.filter} — needs attention!` : RESOURCE_TOOLTIPS.filter}>
              <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-3 border ${ecoVillage.filterHealth < 30 ? 'border-red-500/50' : 'border-white/20'} text-center w-full h-full flex flex-col items-center justify-center`}>
                <div className={`w-10 h-10 rounded-lg ${ecoVillage.filterHealth < 30 ? 'bg-red-500/15 border border-red-500/30' : 'bg-cyan-500/15 border border-cyan-500/30'} flex items-center justify-center mb-2`}>
                  <TbFilter className={`h-5 w-5 ${ecoVillage.filterHealth < 30 ? 'text-red-300' : 'text-cyan-300'}`} />
                </div>
                <div className="text-xl font-bold text-white">{ecoVillage.filterHealth}%</div>
                <div className="text-xs text-blue-200">Filter</div>
              </div>
            </Tooltip>
          </>
        )}
      </div>

      {/* LANDSCAPE */}
      <div 
        className="mb-8 relative shadow-2xl rounded-2xl overflow-hidden min-h-[450px] border border-green-500/30"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isLoading ? (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        ) : (
          <>
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: "url('/villageback.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center 60%",
                transform: "scale(1.3)",
                filter: "brightness(0.9)",
              }}
            />
            <div className="absolute top-4 left-10 text-6xl z-5 pointer-events-none">☁️</div>
            <div className="absolute top-8 right-12 text-5xl z-5 pointer-events-none">☁️</div>
            <div className="absolute top-16 left-1/3 text-4xl z-5 pointer-events-none opacity-70">☁️</div>

            <div className="relative z-20 w-full h-full">
              {landscape.map((item, index) => {
                const placed = EMOJI_TO_ITEM[item.emoji];
                const tooltipText = placed
                  ? `${placed.label} — placed in your village`
                  : `${item.emoji} — placed item`;
                return (
                  <Tooltip key={index} content={tooltipText}>
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: index * 0.05 }}
                      className="text-6xl absolute cursor-pointer drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]"
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                      }}
                    >
                      {item.emoji}
                    </motion.div>
                  </Tooltip>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-20 z-30 pointer-events-none flex items-end justify-around text-4xl pb-2">
              <span>🌿</span>
              <span>🌾</span>
              <span>🌱</span>
              <span>🌿</span>
              <span>🌾</span>
              <span>🌱</span>
              <span>🌿</span>
            </div>
            <div
              className="absolute inset-0 z-40 pointer-events-none"
              style={{ boxShadow: "inset 0 0 200px rgba(0,0,0,0.35)" }}
            />
          </>
        )}
      </div>

      {/* INVENTORY */}
      <h2 className="text-2xl font-semibold mb-3">📦 Inventory (Drag to Village)</h2>
      <div className="flex gap-3 flex-wrap mb-6 min-h-[80px] bg-white/5 rounded-xl p-4 border border-white/10">
        {isLoading ? (
          <div className="h-12 bg-white/10 rounded w-1/3 animate-pulse" />
        ) : inventory.length === 0 ? (
          <p className="text-gray-300">Buy items from the shop to place them in your village!</p>
        ) : (
          inventory.map((emoji, i) => {
            const item = EMOJI_TO_ITEM[emoji];
            const tooltipText = item
              ? `${item.label} — drag onto the village to place`
              : `${emoji} — drag to place`;
            return (
              <Tooltip key={i} content={tooltipText}>
                <div
                  draggable
                  onDragStart={() => handleDragStart(emoji)}
                  className="text-5xl p-3 bg-green-700/40 rounded-xl hover:bg-green-700/60 hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
                >
                  {emoji}
                </div>
              </Tooltip>
            );
          })
        )}
      </div>

      {/* SHOP */}
      <h2 className="text-2xl font-semibold mb-3">🛒 Shop</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 min-h-[300px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="contents"
            >
              {Array.from({ length: 7 }).map((_, idx) => (
                <ProjectCardSkeleton key={idx} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="shop-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="contents"
            >
              {SHOP_ITEMS.map((item) => {
                const canAfford = user.points >= item.cost;
                return (
                  <Tooltip key={item.id} content={item.tooltip} disableTouchToggle>
                    <motion.button
                      onClick={() => buyItem(item)}
                      disabled={!canAfford}
                      whileHover={{ scale: canAfford ? 1.05 : 1 }}
                      whileTap={{ scale: canAfford ? 0.95 : 1 }}
                      className={`bg-white/10 backdrop-blur-lg p-4 rounded-xl border transition w-full ${
                        canAfford
                          ? 'border-green-400/50 hover:bg-green-700/30 cursor-pointer'
                          : 'border-white/10 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-5xl mb-2">{item.emoji}</div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className={`text-xs mt-1 ${canAfford ? 'text-yellow-300' : 'text-red-300'}`}>
                        {item.cost} points
                      </div>
                    </motion.button>
                  </Tooltip>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* POPUP */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-black/80 px-6 py-3 rounded-lg text-white text-lg font-semibold shadow-2xl border border-white/20"
          >
            {popup}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EcoVillage;