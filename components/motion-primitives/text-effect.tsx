"use client";

import type React from "react";
import { motion } from "framer-motion";

interface TextEffectProps {
  children: React.ReactNode;
  preset?: "fade-in-blur";
  speedSegment?: number;
  delay?: number;
  per?: "line" | "word" | "character";
  as?: React.ElementType;
  className?: string;
}

export function TextEffect({
  children,
  preset = "fade-in-blur",
  speedSegment = 0.3,
  delay = 0,
  per = "word",
  as: Component = "div",
  className,
}: TextEffectProps) {
  const variants = {
    hidden: {
      opacity: 0,
      filter: "blur(8px)",
      y: 10,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      as={Component}
    >
      {children}
    </motion.div>
  );
}
