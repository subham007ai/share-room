"use client";
import { cn } from "@/lib/utils";
import React from "react";

interface BackgroundLinesProps {
  children: React.ReactNode;
  className?: string;
  svgOptions?: {
    duration?: number;
  };
}

export const BackgroundLines = ({
  children,
  className,
  svgOptions,
}: BackgroundLinesProps) => {
  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <div className="absolute inset-0 z-0">
        <SVG svgOptions={svgOptions} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const SVG = ({ svgOptions }: { svgOptions?: { duration?: number } }) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 696 316"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full"
    >
      <path
        d="M1 316V1H695V316"
        stroke="url(#paint0_linear_0_1)"
        strokeOpacity="0.4"
      />
      <defs>
        <linearGradient
          id="paint0_linear_0_1"
          x1="348"
          y1="1"
          x2="348"
          y2="316"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Animated lines */}
      <g opacity="0.6">
        <path
          d="M100 50 L200 150 L300 100 L400 200 L500 120 L600 180"
          stroke="url(#gradient1)"
          strokeWidth="1"
          fill="none"
          className="animate-pulse"
        />
        <path
          d="M50 100 L150 200 L250 150 L350 250 L450 170 L550 230"
          stroke="url(#gradient2)"
          strokeWidth="1"
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <path
          d="M150 80 L250 180 L350 130 L450 230 L550 150 L650 210"
          stroke="url(#gradient3)"
          strokeWidth="1"
          fill="none"
          className="animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </g>
      
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
};