import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Modern easing curves:
 * - easeOutQuart: Crisp and smooth deceleration
 * - subtleSpring: Dynamic natural feel
 */
const transitionConfig = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1], // Custom smooth cubic-bezier curve
};

/**
 * Universal PageTransition wrapper.
 * Provides graceful page mount animations and seamless cross-fading
 * between loading skeletons and hydrated page content.
 *
 * @param {React.ReactNode} children - The hydrated page content
 * @param {boolean} [isLoading=false] - Whether the page is currently in data-loading state
 * @param {React.ReactNode} [skeleton] - The skeleton loader component to cross-fade from
 * @param {string} [className=''] - Optional wrapper CSS classes
 * @param {string|number} [pageKey] - Unique key for route/view transitions (defaults to content)
 */
export function PageTransition({
  children,
  isLoading = false,
  skeleton,
  className = '',
  pageKey,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const motionVariants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8,
      scale: shouldReduceMotion ? 1 : 0.995,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: transitionConfig,
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -6,
      transition: {
        duration: 0.18,
        ease: [0.7, 0, 0.84, 0],
      },
    },
  };

  const skeletonVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoading && skeleton ? (
        <motion.div
          key="page-skeleton-state"
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`w-full ${className}`}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key={pageKey || 'page-content-state'}
          variants={motionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`w-full ${className}`}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * StaggerContainer: Wraps grids or lists (e.g. KPI cards, Property grids)
 * to smoothly cascade items in one after another.
 */
export function StaggerContainer({ children, className = '', staggerDelay = 0.05 }) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: 0.02,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem: Child of StaggerContainer
 */
export function StaggerItem({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
