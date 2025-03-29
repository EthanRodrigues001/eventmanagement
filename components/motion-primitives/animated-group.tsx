"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedGroupProps {
  children: React.ReactNode;
  variants: any;
  className?: string;
}

export function AnimatedGroup({
  children,
  variants,
  className,
}: AnimatedGroupProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants.container || variants}
      className={className}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            as: motion.div,
            variants: variants.item || variants,
          });
        }
        return child;
      })}
    </motion.div>
  );
}
