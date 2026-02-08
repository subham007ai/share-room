"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionProps, Variants } from "framer-motion";
import { ElementType } from "react";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
    | "fadeIn"
    | "blurIn"
    | "blurInUp"
    | "blurInDown"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
    | "scaleUp"
    | "scaleDown";

interface TextAnimateProps extends MotionProps {
    /**
     * The text content to animate
     */
    children: string;
    /**
     * The class name to apply to the container
     */
    className?: string;
    /**
     * The animation type: text, word, character, or line
     * @default "character"
     */
    type?: AnimationType;
    /**
     * The animation variant
     * @default "blurIn"
     */
    animation?: AnimationVariant;
    /**
     * The element type to render
     * @default "p"
     */
    as?: ElementType;
    /**
     * Whether to animate by character, word, or line.
     * "item" is deprecated and will be removed in future versions.
     * @default "character"
     */
    by?: "text" | "word" | "character" | "line";
    /**
     * Whether to start animation when element is in view
     * @default true
     */
    startOnView?: boolean;
    /**
     * Delay before staring animation
     * @default 0
     */
    delay?: number;
    /**
     * Duration of the animation
     * @default 0.3
     */
    duration?: number;
    /**
     * Helper prop for staggering animation
     * @default 0.05
     */
    stagger?: number;
    /**
     * Whether to animate only once
     * @default false
     */
    once?: boolean;
    /**
     * Custom variants for the container
     */
    containerVariants?: Variants;
    /**
     * Custom variants for the item (character, word, line)
     */
    itemVariants?: Variants;
}

const defaultContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

const defaultItemVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
    exit: { opacity: 0 },
};

const defaultAnimationVariants: Record<AnimationVariant, Variants> = {
    fadeIn: {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
    },
    blurIn: {
        hidden: { opacity: 0, filter: "blur(10px)" },
        show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.3 } },
        exit: { opacity: 0, filter: "blur(10px)", transition: { duration: 0.3 } },
    },
    blurInUp: {
        hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
        show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, filter: "blur(10px)", y: 20, transition: { duration: 0.3 } },
    },
    blurInDown: {
        hidden: { opacity: 0, filter: "blur(10px)", y: -20 },
        show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, filter: "blur(10px)", y: -20, transition: { duration: 0.3 } },
    },
    slideUp: {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
    },
    slideDown: {
        hidden: { opacity: 0, y: -20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
    },
    slideLeft: {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
    },
    slideRight: {
        hidden: { opacity: 0, x: 20 },
        show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
    },
    scaleUp: {
        hidden: { opacity: 0, scale: 0.5 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 0.5, transition: { duration: 0.3 } },
    },
    scaleDown: {
        hidden: { opacity: 0, scale: 1.5 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 1.5, transition: { duration: 0.3 } },
    },
};

export function TextAnimate({
    children,
    className,
    type,
    animation = "blurIn",
    as: Component = "p",
    by = "character",
    startOnView = true,
    delay = 0,
    duration = 0.3,
    stagger = 0.05,
    once = false,
    containerVariants,
    itemVariants,
    ...props
}: TextAnimateProps) {
    // Use `by` if `type` is not provided, otherwise use `type` (backwards compatibility)
    const segmentType = type || by;

    const getSegments = (text: string): string[] => {
        switch (segmentType) {
            case "word":
                return text.split(/(\s+)/);
            case "character":
                return text.split("");
            case "line":
                return text.split("\n");
            case "text":
            default:
                return [text];
        }
    };

    const segments = getSegments(children);

    // Merge default variants with custom variants
    const finalContainerVariants = {
        ...defaultContainerVariants,
        ...containerVariants,
        show: {
            ...defaultContainerVariants.show,
            transition: {
                ...defaultContainerVariants.show.transition,
                staggerChildren: stagger,
                delayChildren: delay,
            },
            ...containerVariants?.show,
        },
        exit: {
            ...defaultContainerVariants.exit,
            ...containerVariants?.exit,
        },
    };

    const finalItemVariants = {
        ...defaultItemVariants,
        ...defaultAnimationVariants[animation],
        ...itemVariants,
    };

    // If animating by line, we need to wrap lines in a block
    if (segmentType === "line") {
        return (
            <AnimatePresence mode="popLayout">
                <Component
                    className={cn("whitespace-pre-wrap", className)}
                    {...props}
                >
                    <motion.span
                        initial="hidden"
                        whileInView={startOnView ? "show" : undefined}
                        animate={!startOnView ? "show" : undefined}
                        viewport={{ once }}
                        variants={finalContainerVariants}
                    >
                        {segments.map((segment, i) => (
                            <motion.span
                                key={`${segment}-${i}`}
                                className="block" // Force block display for lines
                                variants={finalItemVariants}
                            >
                                {segment}
                            </motion.span>
                        ))}
                    </motion.span>
                </Component>
            </AnimatePresence>
        );
    }


    return (
        <AnimatePresence mode="popLayout">
            <Component
                className={cn("whitespace-pre-wrap", className)}
                {...props}
            >
                <motion.span
                    initial="hidden"
                    whileInView={startOnView ? "show" : undefined}
                    animate={!startOnView ? "show" : undefined}
                    viewport={{ once }}
                    variants={finalContainerVariants}
                >
                    {segments.map((segment, i) => (
                        <motion.span
                            key={`${segment}-${i}`}
                            className="inline-block"
                            variants={finalItemVariants}
                        >
                            {segment === " " ? "\u00A0" : segment}
                        </motion.span>
                    ))}
                </motion.span>
            </Component>
        </AnimatePresence>
    );
}
