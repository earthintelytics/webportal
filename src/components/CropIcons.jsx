import React from 'react';

/**
 * CropIcons.jsx
 * -----------------------------------------------------------------------------
 * Bespoke, high-precision SVG icons tailored specifically for agricultural crops.
 * Replaces mismatched generic placeholders with accurate botanical/agronomy iconography.
 * Compatible with Lucide icon props (size, color, strokeWidth, className).
 * -----------------------------------------------------------------------------
 */

/** 🌴 Oil Palm (Pinnate fronds with distinct leaflets, fruit bunch & trunk) */
export const OilPalmIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Textured Trunk */}
    <path d="M12 22V10" />
    <path d="M10 22h4" />
    <path d="M10.5 18l3-2" />
    <path d="M13.5 15l-3-2" />
    {/* Central Upright Frond */}
    <path d="M12 10V2" />
    <path d="M12 4c-1-1-2-.5-2 1 1 .5 1.5 0 2-1z" />
    <path d="M12 4c1-1 2-.5 2 1-1 .5-1.5 0-2-1z" />
    {/* Left Arching Pinnate Fronds */}
    <path d="M12 10C8.5 8 4 9 2 12c3 0 6.5-.5 10-2" />
    <path d="M12 10C9 6 5 4.5 3 6.5c2 2 4.5 3 9 3.5" />
    {/* Right Arching Pinnate Fronds */}
    <path d="M12 10c3.5-2 8-1 10 2-3 0-6.5-.5-10-2" />
    <path d="M12 10c3-4 7-5.5 9-3.5-2 2-4.5 3-9 3.5" />
    {/* Oil Palm Fruit Bunch at Crown Node */}
    <circle cx="12" cy="10" r="1.5" />
  </svg>
);

/** 🌳 Rubber Tree (Tapped trunk with spiral tapping channel, spout, latex cup, drip, & trifoliate canopy) */
export const RubberIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Trunk Base & Columns */}
    <path d="M7 22V9" />
    <path d="M14 22V9" />
    
    {/* Spiral Tapping Cut (Groove channeled down tree bark) */}
    <path d="M7 11.5c2.5 1 4.5 1.8 7 2.2" />
    <path d="M7 14c2.5 1 4.5 1.8 7 2.2" />
    
    {/* Metal Tapping Spout / Gutter */}
    <path d="M14 16.2l2.2 1" />
    
    {/* Falling Latex Droplet */}
    <path d="M16.5 18a0.6 0.6 0 1 0 0 .01" strokeWidth={strokeWidth + 0.5} />
    
    {/* Latex Collection Cup hanging securely on tree */}
    <path d="M14.5 19.2h4a1.8 1.8 0 0 1 1.8 1.8v.2a1 1 0 0 1-1 1h-5.6a1 1 0 0 1-1-1v-.2a1.8 1.8 0 0 1 1.8-1.8z" />
    
    {/* Trifoliate Hevea Foliage Canopy (Three leaflets radiating from apex) */}
    {/* Central leaflet */}
    <path d="M10.5 9V4c-.8.5-1.5 1.5-1.5 3 0 .8.5 1.5 1.5 2z" />
    <path d="M10.5 9V4c.8.5 1.5 1.5 1.5 3 0 .8-.5 1.5-1.5 2z" />
    {/* Left leaflet */}
    <path d="M10.5 9c-2-1.5-4.5-2-5.5-.5.5 1.8 2.5 2.5 5.5.5z" />
    {/* Right leaflet */}
    <path d="M10.5 9c2-1.5 4.5-2 5.5-.5-.5 1.8-2.5 2.5-5.5.5z" />
  </svg>
);

/** 🎋 Sugarcane (Segmented cane stalks with distinct growth rings & arching blade leaves) */
export const SugarcaneIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Primary Jointed Stalk */}
    <line x1="8" y1="3" x2="8" y2="22" />
    {/* Primary Stalk Nodes / Rings */}
    <line x1="6.5" y1="8" x2="9.5" y2="8" />
    <line x1="6.5" y1="13" x2="9.5" y2="13" />
    <line x1="6.5" y1="18" x2="9.5" y2="18" />
    
    {/* Secondary Jointed Stalk */}
    <line x1="15" y1="5" x2="15" y2="22" />
    {/* Secondary Stalk Nodes / Rings */}
    <line x1="13.5" y1="10" x2="16.5" y2="10" />
    <line x1="13.5" y1="15" x2="16.5" y2="15" />
    <line x1="13.5" y1="19" x2="16.5" y2="19" />
    
    {/* Arching Cane Blade Leaves */}
    <path d="M8 8C5 6 3 7 2 10c2.5-.5 4.5-1 6-2" />
    <path d="M15 10c3-2 5-1 7 2-2.5-.5-4.5-1-7-2" />
    <path d="M8 13c-3-2-5-1-6 2 2.5 0 4.5-.8 6-2" />
    <path d="M15 5c2-2.5 4.5-2.5 7-1.5-1.5 2-3.5 2-7 1.5" />
    <path d="M8 3c-1.5-2-3-2-5-1 1.5 1.5 2.5 1.8 5 1" />
  </svg>
);

/** 🥜 Cashew (Plump cashew apple with kidney-shaped nut attached at the base) */
export const CashewIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Stem & Calyx */}
    <path d="M12 2v2.5" />
    <path d="M9.5 4.5h5" />
    {/* Fleshy Cashew Apple (Bell/Pear Receptacle) */}
    <path d="M8.5 5.5C6.5 7 5.5 9.5 6.5 12.5c1 3 3.5 4 5.5 4s4.5-1 5.5-4c1-3 0-5.5-2-7-1.5-1.2-5-1.2-7 0z" />
    {/* Contour ridge on apple */}
    <path d="M12 6c-1 2.5-1 5.5 0 8" strokeDasharray="1 1.5" opacity="0.6" />
    {/* True Cashew Nut (Kidney-shaped drupe attached at bottom) */}
    <path d="M10.5 16.5c-2 .5-3 1.8-2.2 3.5 1 2 4 2.5 5.5 1.2 1.2-1 1-2.8-.5-3.5-1-.4-2-.2-2.8-1.2z" />
  </svg>
);

/** 🍫 Cocoa (Pointed ribbed cacao pod with longitudinal furrows & stem) */
export const CocoaIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Peduncle (Stem) */}
    <path d="M12 2v2.5" />
    {/* Main Cacao Pod Silhouette (Tapered ends) */}
    <path d="M12 4.5C6.5 4.5 4 8.5 4 13.5c0 4.5 5 7.5 8 8.5 3-1 8-4 8-8.5 0-5-2.5-9-8-9z" />
    {/* Center Ridge */}
    <path d="M12 4.5v17.5" />
    {/* Left Ribbed Furrows */}
    <path d="M8.5 6C6.5 8.5 6 11.5 6 14c0 2.5 1 4.5 2.5 6.5" />
    {/* Right Ribbed Furrows */}
    <path d="M15.5 6c2 2.5 2.5 5.5 2.5 8 0 2.5-1 4.5-2.5 6.5" />
  </svg>
);

/** 🌿 Cassava (Palmate 5-lobed leaf & underground root tubers) */
export const CassavaIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Central Vertical Leaflet */}
    <path d="M12 11V3c-.8.8-1.2 2-1 3.5.2 1.5.6 2.8 1 4.5z" />
    <path d="M12 11V3c.8.8 1.2 2 1 3.5-.2 1.5-.6 2.8-1 4.5z" />
    {/* Upper Diagonal Left Leaflet */}
    <path d="M12 11L5 5.5c-.2 1.2.2 2.4 1.4 3.2 1.2.8 2.8 1.4 5.6 2.3z" />
    {/* Upper Diagonal Right Leaflet */}
    <path d="M12 11l7-5.5c.2 1.2-.2 2.4-1.4 3.2-1.2.8-2.8 1.4-5.6 2.3z" />
    {/* Lateral Left Leaflet */}
    <path d="M12 11H3.5c-.2 1 .5 1.8 2 2 1.5.2 3.5-.2 6.5-2z" />
    {/* Lateral Right Leaflet */}
    <path d="M12 11h8.5c.2 1-.5 1.8-2 2-1.5.2-3.5-.2-6.5-2z" />
    {/* Ground Soil Line */}
    <line x1="6" y1="13.5" x2="18" y2="13.5" strokeDasharray="1 1.5" opacity="0.5" />
    {/* Stem connecting to root crown */}
    <line x1="12" y1="11" x2="12" y2="15" />
    {/* Elongated Cassava Root Tubers */}
    <path d="M12 15c-1.8 1-3.2 2.8-4 6.5 2-.5 4.5-2.5 4.5-6.5" />
    <path d="M12 15c1.8 1 3.2 2.8 4 6.5-2-.5-4.5-2.5-4.5-6.5" />
  </svg>
);

/** 🌽 Maize (Corn ear with grain rows and open husk bracts) */
export const MaizeIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Corn Ear Silhouette */}
    <path d="M12 3.5C9.5 3.5 8 6.5 8 11.5c0 4.5 1.5 7.5 4 8.5 2.5-1 4-4 4-8.5 0-5-1.5-8-4-8.5z" />
    {/* Center kernel division */}
    <line x1="12" y1="5.5" x2="12" y2="18" />
    {/* Horizontal kernel lines */}
    <line x1="9.5" y1="8" x2="14.5" y2="8" />
    <line x1="9" y1="11.5" x2="15" y2="11.5" />
    <line x1="9.5" y1="15" x2="14.5" y2="15" />
    {/* Left Open Husk Leaf */}
    <path d="M8 15c-3 1.2-5-.5-5-3.5 1-2.2 3.2-3.2 5-2" />
    {/* Right Open Husk Leaf */}
    <path d="M16 15c3 1.2 5-.5 5-3.5-1-2.2-3.2-3.2-5-2" />
    {/* Corn Silk Top */}
    <path d="M10.5 3.5C10 2 10.5 1 12 1c1.5 0 2 1 1.5 2.5" />
    {/* Stalk Base */}
    <line x1="12" y1="20" x2="12" y2="23" />
  </svg>
);

/** 🌾 Rice (Gracefully drooping arching panicle with cascading grain spikelets) */
export const RiceIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Arching Panicle Rachis (Stem) */}
    <path d="M4 22c3-7 7.5-13.5 16-17.5" />
    {/* Cascading Rice Grain Spikelets */}
    <path d="M19.5 4.5c-.8 1.8-.8 3.5.8 4.5-.8-1.8-.8-3.5-.8-4.5z" />
    <path d="M16.5 6.5c-1.2 1.8-1.2 3.5.5 4.5-1.2-1.8-1.2-3.5-.5-4.5z" />
    <path d="M13.5 9.5c-1.5 1.8-1.5 3.5 0 4.5-1.5-1.8-1.5-3.5 0-4.5z" />
    <path d="M10.5 13.5c-1.5 1.8-1.5 3.2 0 4-1.5-1.8-1.5-3.2 0-4z" />
    <path d="M7.5 17.5c-1.5 1.5-1.5 2.8 0 3.5-1.5-1.5-1.5-2.8 0-3.5z" />
    {/* Secondary Spikelets */}
    <path d="M18 9c1.5 1 2.8.5 3-1-1.5-.5-2.2 0-3 1z" />
    <path d="M15 12c1.5 1 2.8.5 3-1-1.5-.5-2.2 0-3 1z" />
    {/* Slender Flag Leaf */}
    <path d="M5.5 20c-2.5-3-3.5-7-2.5-11 2.5 3 3.5 7 2.5 11z" />
  </svg>
);

/** ✈️ Drone (Quadcopter aerial field inspection) */
export const DroneIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Central Body & Camera Lens */}
    <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    {/* Diagonals to 4 rotors */}
    <line x1="9.5" y1="9.5" x2="5" y2="5" />
    <line x1="14.5" y1="9.5" x2="19" y2="5" />
    <line x1="9.5" y1="14.5" x2="5" y2="19" />
    <line x1="14.5" y1="14.5" x2="19" y2="19" />
    {/* 4 Rotors */}
    <ellipse cx="5" cy="5" rx="3.5" ry="1.5" transform="rotate(-30 5 5)" />
    <ellipse cx="19" cy="5" rx="3.5" ry="1.5" transform="rotate(30 19 5)" />
    <ellipse cx="5" cy="19" rx="3.5" ry="1.5" transform="rotate(30 5 19)" />
    <ellipse cx="19" cy="19" rx="3.5" ry="1.5" transform="rotate(-30 19 19)" />
  </svg>
);

/** 🧑‍🌾 Smallholder / Cooperative Network */
export const SmallholderIcon = ({ size = 24, strokeWidth = 1.75, className = '', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    {/* Central farmer node */}
    <circle cx="12" cy="7" r="3" />
    <path d="M6 18c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    {/* Connecting agricultural plot nodes */}
    <circle cx="4" cy="19" r="1.5" />
    <circle cx="20" cy="19" r="1.5" />
    <line x1="5.5" y1="19" x2="9" y2="18.5" />
    <line x1="18.5" y1="19" x2="15" y2="18.5" />
    {/* Sprout badge */}
    <path d="M12 3v-1" />
    <path d="M12 2c-.8 0-1.5-.5-1.5-1 1 0 1.5.5 1.5 1z" />
    <path d="M12 2c.8 0 1.5-.5 1.5-1-1 0-1.5.5-1.5 1z" />
  </svg>
);

export const CROP_ICON_MAP = {
  ffb: OilPalmIcon,
  oil_palm: OilPalmIcon,
  'oil palm': OilPalmIcon,
  rubber: RubberIcon,
  sugarcane: SugarcaneIcon,
  cashew: CashewIcon,
  cocoa: CocoaIcon,
  cassava: CassavaIcon,
  maize: MaizeIcon,
  rice: RiceIcon,
  aerial: DroneIcon,
  drone: DroneIcon,
  fusion: SmallholderIcon,
  smallholder: SmallholderIcon,
};

export const getCropIcon = (cropKey = '', defaultIcon = null) => {
  if (!cropKey) return defaultIcon || OilPalmIcon;
  const k = String(cropKey).toLowerCase().replace('-', '_').trim();
  return CROP_ICON_MAP[k] || CROP_ICON_MAP[cropKey.toLowerCase()] || defaultIcon || OilPalmIcon;
};

