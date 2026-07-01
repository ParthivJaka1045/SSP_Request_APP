import { Monitor, Package, Film, Plane } from 'lucide-react';

/** All four request modules — shared routes, Firestore collections, and UI. */
export const MODULE_IDS = Object.freeze({
  technical: 'technical',
  general: 'general',
  subscription: 'subscription',
  travel: 'travel',
});

export const MODULES = [
  {
    id: MODULE_IDS.technical,
    title: 'Technical Requests',
    shortTitle: 'Technical',
    description: 'Hardware, peripherals, and IT equipment.',
    icon: Monitor,
    accent: '#3b82f6',
    collection: 'technical_requests',
    itemsCategory: 'technical',
    ready: true,
    basePath: '/technical',
  },
  {
    id: MODULE_IDS.general,
    title: 'General Store',
    shortTitle: 'General Store',
    description: 'Stationery, supplies, and general inventory.',
    icon: Package,
    accent: '#f59e0b',
    collection: 'general_requests',
    itemsCategory: 'general',
    ready: true,
    basePath: '/general-store',
  },
  {
    id: MODULE_IDS.subscription,
    title: 'Digital Subscription',
    shortTitle: 'Subscription',
    description: 'OTT platforms, software, and digital services.',
    icon: Film,
    accent: '#8b5cf6',
    collection: 'subscription_requests',
    itemsCategory: 'subscription',
    ready: true,
    basePath: '/subscription',
  },
  {
    id: MODULE_IDS.travel,
    title: 'Going Home',
    shortTitle: 'Going Home',
    description: 'Submit travel request directly — departure, return date & reason.',
    icon: Plane,
    accent: '#10b981',
    collection: 'travel_requests',
    itemsCategory: 'travel',
    ready: true,
    directForm: true,
    basePath: '/travel',
  },
];

export function getModuleById(id) {
  return MODULES.find((m) => m.id === id) || MODULES[0];
}

export function getModuleFromPath(pathname) {
  if (pathname.startsWith('/general-store')) return getModuleById(MODULE_IDS.general);
  if (pathname.startsWith('/subscription')) return getModuleById(MODULE_IDS.subscription);
  if (pathname.startsWith('/travel')) return getModuleById(MODULE_IDS.travel);
  if (pathname.startsWith('/technical')) return getModuleById(MODULE_IDS.technical);
  return null;
}
