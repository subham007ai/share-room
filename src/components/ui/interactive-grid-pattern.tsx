"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    squares?: [number, number]; // [horizontal, vertical]
    squaresClassName?: string;
}

export function InteractiveGridPattern({
    width = 40,
    height = 40,
    squares = [24, 24],
    className,
    squaresClassName,
    ...props
}: InteractiveGridPatternProps) {
    const [horizontal, vertical] = squares;
    const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

    return (
        <svg
            width="100%"
            height="100%"
            className={cn(
                "absolute inset-0 h-full w-full border-neutral-200/50 dark:border-neutral-800/50",
                className
            )}
            {...props}
        >
            <defs>
                <pattern
                    id="grid-pattern"
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    x={-1}
                    y={-1}
                >
                    <path
                        d={`M.5 ${height}V.5H${width}`}
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="0"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            <svg x={-1} y={-1} className="overflow-visible">
                {Array.from({ length: horizontal * vertical }).map((_, i) => {
                    const x = (i % horizontal) * width;
                    const y = Math.floor(i / horizontal) * height;
                    return (
                        <rect
                            key={i}
                            width={width - 1}
                            height={height - 1}
                            x={x + 0.5}
                            y={y + 0.5}
                            className={cn(
                                "fill-transparent transition-all duration-100 ease-in-out hover:duration-0",
                                squaresClassName
                            )}
                            onMouseEnter={() => setHoveredSquare(i)}
                            onMouseLeave={() => setHoveredSquare(null)}
                        />
                    );
                })}
            </svg>
        </svg>
    );
}
