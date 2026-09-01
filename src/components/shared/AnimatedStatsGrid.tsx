"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { StatsCard, type StatsCardColor } from "@/components/shared/StatsCard";

export type StatCardData = {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: StatsCardColor;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AnimatedStatsGrid({
  cards,
  className,
}: {
  cards: StatCardData[];
  className?: string;
}) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      {cards.map((card) => (
        <motion.div key={card.title} variants={itemVariants}>
          <StatsCard {...card} />
        </motion.div>
      ))}
    </motion.div>
  );
}
