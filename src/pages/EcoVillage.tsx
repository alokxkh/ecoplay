import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import {
  TbBolt,
  TbWind,
  TbDroplet,
  TbLeaf,
  TbFilter,
  TbAlertTriangle,
  TbLock,
} from "react-icons/tb";

import ProjectCardSkeleton from "../components/ProjectCardSkeleton";
import Tooltip from "../components/Tooltip";

import {
  shopItems,
  ShopItem,
  ItemCategory,
  ItemRarity,
} from "../types/Shop";

const rarityColors: Record<ItemRarity, string> = {
  Common:
    "border-gray-500/30 text-gray-300 bg-white/5 hover:bg-white/10",

  Rare:
    "border-blue-500/50 text-blue-200 bg-blue-900/20 hover:bg-blue-800/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]",

  Epic:
    "border-purple-500/60 text-purple-200 bg-purple-900/20 hover:bg-purple-800/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]",

  Legendary:
    "border-yellow-500/80 text-yellow-200 bg-yellow-900/20 hover:bg-yellow-800/30 shadow-[0_0_30px_rgba(234,179,8,0.4)]",
};

const categoryLabels: Record<"All" | ItemCategory, string> = {
  All: "All Items",
  trees_plants: "Trees & Plants",
  renewable_energy: "Energy",
  eco_buildings: "Buildings",
  decorations: "Decorations",
  community: "Community",
};

const RESOURCE_TOOLTIPS = {
  points: "Eco points — spend in the shop to grow your village",

  air:
    "Village air health. Improved by planting trees and adding solar panels.",

  water:
    "Water cleanliness. Improved by water filters; degraded by wildlife pollution.",

  bio:
    "Biodiversity level. Improved by planting trees, gardens, and wildlife.",

  filter:
    "Status of water filters. Degrades over time; buy new filters to restore water quality.",
} as const;

const EcoVillage = () => {
  const { state, dispatch } = useGame();

  const { user, ecoVillage, notifications } = state;

  const [isLoading, setIsLoading] = useState(true);

  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [showNotifications, setShowNotifications] = useState(true);

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<"All" | ItemCategory>("All");

  const [purchaseEffects, setPurchaseEffects] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      setShowNotifications(true);
    }
  }, [notifications]);

  const buyItem = (
    item: ShopItem,
    event: React.MouseEvent
  ) => {
    if (item.unlockRequirements) {
      const {
        airQuality = 0,
        waterQuality = 0,
        biodiversity = 0,
      } = item.unlockRequirements;

      if (
        (ecoVillage.airQuality || 0) < airQuality ||
        (ecoVillage.waterQuality || 0) < waterQuality ||
        (ecoVillage.biodiversity || 0) < biodiversity
      ) {
        setPopup({
          message: "Village milestones not met!",
          type: "error",
        });

        setTimeout(() => setPopup(null), 1500);

        return;
      }
    }

    if (user.points < item.cost) {
      setPopup({
        message: "Not enough points!",
        type: "error",
      });

      setTimeout(() => setPopup(null), 1500);

      return;
    }

    dispatch({
      type: "ADD_POINTS",
      payload: -item.cost,
    });

    const updates: Partial<typeof ecoVillage> = {
      inventory: [
        ...(ecoVillage.inventory || []),
        item.emoji,
      ],
    };

    if (item.impactScores) {
      if (item.impactScores.air) {
        updates.airQuality = Math.min(
          100,
          (ecoVillage.airQuality || 0) +
            item.impactScores.air
        );
      }

      if (item.impactScores.water) {
        updates.waterQuality = Math.min(
          100,
          (ecoVillage.waterQuality || 0) +
            item.impactScores.water
        );
      }

      if (item.impactScores.bio) {
        updates.biodiversity = Math.min(
          100,
          (ecoVillage.biodiversity || 0) +
            item.impactScores.bio
        );
      }

      if (item.id === "water_filter") {
        updates.filterHealth = 100;
      }
    }

    dispatch({
      type: "UPDATE_ECO_VILLAGE",
      payload: updates,
    });

    setPopup({
      message: `You bought ${item.label}!`,
      type: "success",
    });

    setTimeout(() => setPopup(null), 1500);

    const rect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();

    const newEffect = {
      id: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top,
    };

    setPurchaseEffects((prev) => [
      ...prev,
      newEffect,
    ]);

    setTimeout(() => {
      setPurchaseEffects((prev) =>
        prev.filter((e) => e.id !== newEffect.id)
      );
    }, 1000);
  };

  const handleDragStart = (emoji: string) => {
    setDraggedItem(emoji);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    if (!draggedItem) return;

    const rect =
      e.currentTarget.getBoundingClientRect();

    const x =
      ((e.clientX - rect.left) / rect.width) * 100;

    const y =
      ((e.clientY - rect.top) / rect.height) * 100;

    const newLandscape = [
      ...(ecoVillage.landscape || []),
      { emoji: draggedItem, x, y },
    ];

    const newInventory = [
      ...(ecoVillage.inventory || []),
    ];

    const itemIndex =
      newInventory.indexOf(draggedItem);

    if (itemIndex > -1) {
      newInventory.splice(itemIndex, 1);
    }

    dispatch({
      type: "UPDATE_ECO_VILLAGE",
      payload: {
        landscape: newLandscape,
        inventory: newInventory,
      },
    });

    setDraggedItem(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
  };

  const filteredItems =
    activeCategory === "All"
      ? shopItems
      : shopItems.filter(
          (item) =>
            item.category === activeCategory
        );

  return (
    <div className="p-4 md:p-8 text-white max-w-7xl mx-auto">
      {/* Purchase Effects */}
      {purchaseEffects.map((effect) => (
        <motion.div
          key={effect.id}
          initial={{
            opacity: 1,
            y: effect.y,
            x: effect.x,
            scale: 0.5,
          }}
          animate={{
            opacity: 0,
            y: effect.y - 100,
            scale: 2,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="fixed pointer-events-none z-50 text-4xl text-yellow-300"
        >
          ✨
        </motion.div>
      ))}

      {/* Remaining JSX continues unchanged */}
    </div>
  );
};

export default EcoVillage;