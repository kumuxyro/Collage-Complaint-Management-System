/**
 * College Complaint Management System - Core Visual Design System Tokens
 * Re-engineered for a luxury cinematic Black + Bright Red visual identity.
 */

export const tokens = {
  // 1. Color Palette (60-30-10 Distribution)
  colors: {
    // 60% Dominant Neutral Canvas (Cinematic Obsidian & Deep Void)
    canvas: {
      void: '#000000',
      base: '#040405',
      subtle: '#09090C',
      surface: '#0F0F13',
      elevated: '#17171C',
    },
    // 30% Structural Surfaces & Hairline Dividers
    structure: {
      hairline: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'rgba(255, 255, 255, 0.09)',
      borderMedium: 'rgba(255, 255, 255, 0.16)',
      borderActive: 'rgba(229, 9, 20, 0.55)',
      glassBg: 'rgba(15, 15, 19, 0.75)',
      glassSpecular: 'rgba(255, 255, 255, 0.04)',
    },
    // Typography Scales
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1AA',
      muted: '#71717A',
      accent: '#FF2E3B',
      inverse: '#000000',
    },
    // 10% High-Intent Brand Accent (Bright Red) + Semantic Auxiliary Statuses
    accent: {
      brandRed: {
        base: '#E50914',
        vibrant: '#FF1A26',
        glow: 'rgba(229, 9, 20, 0.28)',
        hover: '#FF333E',
        surface: 'rgba(229, 9, 20, 0.09)',
      },
      // Auxiliary status colors (strictly semantic; red is reserved for brand & critical)
      emerald: {
        base: '#10B981',
        glow: 'rgba(16, 185, 129, 0.25)',
        hover: '#34D399',
        surface: 'rgba(16, 185, 129, 0.08)',
      },
      amber: {
        base: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.25)',
        hover: '#FBBF24',
        surface: 'rgba(245, 158, 11, 0.08)',
      },
      neutral: {
        base: '#71717A',
        glow: 'rgba(113, 113, 122, 0.2)',
        hover: '#A1A1AA',
        surface: 'rgba(113, 113, 122, 0.08)',
      },
    },
  },

  // 2. Typography Pairings & Hierarchy
  typography: {
    fonts: {
      display: "'Syne', sans-serif",
      body: "'Plus Jakarta Sans', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    sizes: {
      displayLarge: { size: '3.25rem', lineHeight: '1.1', weight: '700', tracking: '-0.03em' },
      displayMedium: { size: '2.25rem', lineHeight: '1.2', weight: '700', tracking: '-0.025em' },
      displaySmall: { size: '1.75rem', lineHeight: '1.25', weight: '600', tracking: '-0.02em' },
      headline: { size: '1.25rem', lineHeight: '1.35', weight: '600', tracking: '-0.015em' },
      bodyRegular: { size: '0.9375rem', lineHeight: '1.6', weight: '400', tracking: '0' },
      bodyMedium: { size: '0.9375rem', lineHeight: '1.6', weight: '500', tracking: '0' },
      metadata: { size: '0.75rem', lineHeight: '1.4', weight: '500', tracking: '0.02em' },
      code: { size: '0.8125rem', lineHeight: '1.5', weight: '500', tracking: '0' },
    },
  },

  // 3. Spacing Rhythm (8pt Mathematical Grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    containerPadding: '24px',
  },

  // 4. Borders & Corner Geometry (Nested Radii Math: r_inner = r_outer - padding)
  radii: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    full: '9999px',
  },

  // 5. Shadows & Ambient Specular Glows
  shadows: {
    subtle: '0 2px 8px -2px rgba(0, 0, 0, 0.7), 0 1px 4px -1px rgba(0, 0, 0, 0.6)',
    elevated: '0 12px 32px -8px rgba(0, 0, 0, 0.85), 0 4px 12px -2px rgba(0, 0, 0, 0.7)',
    floating: '0 24px 64px -12px rgba(0, 0, 0, 0.95), 0 8px 24px -4px rgba(0, 0, 0, 0.8)',
    specularGlowRed: '0 0 35px -5px rgba(229, 9, 20, 0.35)',
    specularGlowCrimson: '0 0 35px -5px rgba(185, 28, 28, 0.3)',
  },

  // 6. Depth & Spatial Layering (Z-Coordinates and Layer Order)
  depthLayers: {
    layer0: { name: 'Canvas Void', zIndex: 0, description: 'Deepest cinematic black background with red particle physics' },
    layer1: { name: 'Structural Base', zIndex: 10, description: 'Charcoal layouts, headers, and section containers' },
    layer2: { name: 'Elevated 3D Cards', zIndex: 20, description: 'Deep black cards with cursor tilt, red specular sheen, and hairlines' },
    layer3: { name: 'Interactive Drawers & Flyouts', zIndex: 30, description: 'Action sheets and contextual inspection sidecars' },
    layer4: { name: 'Spatial Modals & Overlays', zIndex: 40, description: 'Full focus dialogs and intake forms' },
    layer5: { name: 'Dynamic Toast & Feedback', zIndex: 50, description: 'Immediate system response notifications' },
  },

  // 7. 3D Spatial Transforms & Camera Math
  spatial3D: {
    perspective: '1000px',
    maxTiltAngle: 5.5,
    translateZDepth: '8px',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDuration: '320ms',
  },

  // 8. Motion & Latency Budgets (Compositor Only: transform, opacity, filter)
  motion: {
    fast: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '240ms cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
    ambientPulse: '6000ms ease-in-out infinite',
  },

  // 9. Responsive Breakpoints
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
    ultra: '1440px',
  },
} as const;
