/**
 * DormSafe Design System Tokens
 * Single Source of Truth for Brand Colors, Semantic Palettes, Radii, Typography, and Sizing.
 */

export const colors = {
  // Brand Colors (Ateneo de Davao University)
  brand: {
    blue: '#003366',      // Ateneo Blue (Primary)
    blueLight: '#004080', // Lighter hover state
    blueDark: '#002244',  // Darker active state
    gold: '#C5A900',      // Ateneo Gold (Secondary Accent)
    goldLight: '#DFC31D',
    goldDark: '#9E8700',
  },

  // Semantic Status Colors
  semantic: {
    success: {
      DEFAULT: '#10B981', // Emerald 500
      light: '#ECFDF5',   // Emerald 50
      text: '#047857',    // Emerald 700
      border: '#A7F3D0',  // Emerald 200
    },
    warning: {
      DEFAULT: '#F59E0B', // Amber 500
      light: '#FFFBEB',   // Amber 50
      text: '#B45309',    // Amber 700
      border: '#FDE68A',  // Amber 200
    },
    danger: {
      DEFAULT: '#F43F5E', // Rose 500
      light: '#FFF1F2',   // Rose 50
      text: '#BE123C',    // Rose 700
      border: '#FECDD3',  // Rose 200
    },
    info: {
      DEFAULT: '#0284C7', // Sky 600
      light: '#F0F9FF',   // Sky 50
      text: '#0369A1',    // Sky 700
      border: '#BAE6FD',  // Sky 200
    },
  },

  // Neutral Slate Palette
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

export const typography = {
  sectionHeader: 'text-base font-semibold text-slate-900',
  sectionSubtext: 'text-xs text-slate-500 font-normal leading-relaxed mt-0.5',
  pageTitle: 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900',
  pageSubtitle: 'text-sm text-slate-500 font-normal mt-1',
  kpiNumber: 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900',
  kpiLabel: 'text-[11px] font-bold uppercase tracking-wider text-slate-400',
  fieldLabel: 'text-xs font-semibold text-slate-700 mb-1.5',
  fieldHelper: 'text-[11px] text-slate-400 font-normal mt-1',
  tableHeader: 'text-[11px] font-bold uppercase tracking-wider text-slate-400',
};

export const radii = {
  pill: 'rounded-full',     // radius="full" for Buttons, Chips, Badges
  card: 'rounded-2xl',      // 16px for standard Cards, Tiles, StatsCards
  surface: 'rounded-3xl',   // 24px for large Containers, Showcase sections, Modals
  control: 'rounded-xl',    // 12px for Inputs, Pickers, Dropdowns
  squircle: 'rounded-xl',   // 12px for 32x32 Icon badges
};

export const buttonStandards = {
  sizes: {
    sm: {
      height: 'h-8',
      fontSize: 'text-xs font-semibold',
      padding: 'px-3',
      iconSize: 14,
      usage: 'Table row actions, dense cards, inline filters',
    },
    md: {
      height: 'h-10',
      fontSize: 'text-sm font-semibold',
      padding: 'px-4',
      iconSize: 16,
      usage: 'Standard form submits, dialog footers, default actions (Default)',
    },
    lg: {
      height: 'h-12',
      fontSize: 'text-base font-semibold',
      padding: 'px-6',
      iconSize: 18,
      usage: 'Hero CTAs, primary checkout / booking flows',
    },
  },
  defaultRadius: 'full', // Pill profile standard
};

export default {
  colors,
  typography,
  radii,
  buttonStandards,
};
