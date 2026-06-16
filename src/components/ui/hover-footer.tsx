"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const TextHoverEffect = ({
  text,
  duration,
  className,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  // Extra-extra-large viewBox (3000×600) for a MASSIVE, bold AFRIBAYIT watermark
  // Font-size 460px — fills the full navy section edge-to-edge
  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 3000 600"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none uppercase cursor-pointer", className)}
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {hovered && (
            <>
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#80eeb4" />
              <stop offset="75%" stopColor="#003087" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>

        {/* Animated stroke-draw gradient — gold ↔ navy shift, always animating */}
        <linearGradient
          id="animatedStroke"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#D4AF37">
            <animate
              attributeName="stop-color"
              values="#D4AF37;#003087;#D4AF37"
              dur="6s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#003087">
            <animate
              attributeName="stop-color"
              values="#003087;#D4AF37;#003087"
              dur="6s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#D4AF37">
            <animate
              attributeName="stop-color"
              values="#D4AF37;#003087;#D4AF37"
              dur="6s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Filled gradient for the main watermark body */}
        <linearGradient
          id="filledWatermark"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#D4AF37">
            <animate
              attributeName="stop-color"
              values="#D4AF37;#003087;#D4AF37"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#003087">
            <animate
              attributeName="stop-color"
              values="#003087;#D4AF37;#003087"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>

      {/* Ghost text — very faint outline always visible (watermark effect) */}
      <text
        x="1500"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="1.2"
        className="fill-transparent stroke-white/20 font-[helvetica] font-bold"
        style={{ fontSize: "460px", letterSpacing: "-12px" }}
      >
        {text}
      </text>

      {/* Filled watermark — animated gradient fill, opacity breathing */}
      <motion.text
        x="1500"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-[helvetica] font-bold"
        fill="url(#filledWatermark)"
        style={{ fontSize: "460px", letterSpacing: "-12px" }}
        animate={{ opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.text>

      {/* Animated stroke-draw text — always animating, gold/navy shifting */}
      <motion.text
        x="1500"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="1.5"
        className="fill-transparent font-[helvetica] font-bold"
        stroke="url(#animatedStroke)"
        style={{ fontSize: "460px", letterSpacing: "-12px" }}
        initial={{ strokeDashoffset: 6000, strokeDasharray: 6000 }}
        animate={{
          strokeDashoffset: [6000, 0, 0, 6000],
          strokeDasharray: 6000,
        }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
          times: [0, 0.45, 0.55, 1],
        }}
      >
        {text}
      </motion.text>

      {/* Outline text — subtle gold pulsing */}
      <motion.text
        x="1500"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.8"
        className="fill-transparent stroke-[#D4AF37]/40 font-[helvetica] font-bold"
        style={{ fontSize: "460px", letterSpacing: "-12px" }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.text>

      {/* Gradient mask text — reveals on hover */}
      <text
        x="1500"
        y="300"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="1.5"
        mask="url(#textMask)"
        className="fill-transparent font-[helvetica] font-bold"
        style={{ fontSize: "460px", letterSpacing: "-12px" }}
      >
        {text}
      </text>
    </svg>
  );
};


export const FooterBackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 10%, #0a0a0c99 30%, #00308799 70%, #001440ee 100%)",
      }}
    />
  );
};
