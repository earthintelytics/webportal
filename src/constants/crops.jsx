import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  Activity, 
  Trees, 
  Droplets, 
  FlaskConical, 
  RotateCcw,
  Box,
  Truck,
  Sprout,
  Zap,
  Target,
  BarChart4,
  Camera,
  Leaf,
  Globe
} from 'lucide-react';

export const CROP_EMOJIS = {
  ffb: '',
  oil_palm: '',
  sugarcane: '',
  rice: '',
  cocoa: '',
  cassava: '',
  maize: '',
  rubber: '',
  cashew: '',
  smallholder: '',
  default: '',
};

export const getCropEmoji = (cropType = '') => {
  return '';
};

export const crops = [
  {
    id: 'management-ffb',
    name: 'Oil Palm',
    branding: 'FFB Management',
    primaryColor: '#16A34A',
    logo: 'https://cdn-icons-png.flaticon.com/512/3241/3241513.png',
    menu: [
      { id: 'dashboard', label: 'Executive Hub', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-cashew',
    name: 'Cashew',
    branding: 'Cashew Hub',
    primaryColor: '#D35400', 
    logo: 'https://cdn-icons-png.flaticon.com/512/1041/1041383.png',
    menu: [
      { id: 'dashboard', label: 'Estate Overview', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'harvesting', label: 'Harvest Logs', icon: <Box size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-rubber',
    name: 'Rubber',
    branding: 'Rubber Console',
    primaryColor: '#0E7490', 
    logo: 'https://cdn-icons-png.flaticon.com/512/3082/3082051.png',
    menu: [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'lab', label: 'Latex Lab', icon: <FlaskConical size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-sugarcane',
    name: 'SugarCane',
    branding: 'Cane Console',
    primaryColor: '#16A34A', 
    logo: 'https://cdn-icons-png.flaticon.com/512/2413/2413158.png',
    menu: [
      { id: 'dashboard', label: 'Operations', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'logistics', label: 'Haulage Hub', icon: <Truck size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-rice',
    name: 'Rice',
    branding: 'Rice Portal',
    primaryColor: '#0D9488',
    logo: 'https://cdn-icons-png.flaticon.com/512/3174/3174880.png',
    menu: [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-cocoa',
    name: 'Cocoa',
    branding: 'Cocoa Core',
    primaryColor: '#92400E',
    logo: 'https://cdn-icons-png.flaticon.com/512/2913/2913136.png',
    menu: [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-cassava',
    name: 'Cassava',
    branding: 'Cassava Hub',
    primaryColor: '#B45309',
    logo: 'https://cdn-icons-png.flaticon.com/512/2153/2153786.png',
    menu: [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  },
  {
    id: 'management-maize',
    name: 'Maize',
    branding: 'Maize Console',
    primaryColor: '#CA8A04',
    logo: 'https://cdn-icons-png.flaticon.com/512/2276/2276931.png',
    menu: [
      { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18} /> },
      { id: 'sustainability', label: 'Sustainability', icon: <Leaf size={18} /> },
      { id: 'workers', label: 'Workers', icon: <Users size={18} /> },
      { id: 'plots-analytics', label: 'Plots Analytics', icon: <BarChart4 size={18} /> },
    ]
  }
];
