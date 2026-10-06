import { useEffect, useState } from 'react';
import { serviceCall } from '../../../../../services/serviceClient';

/**
 * Classes for map layers that are not satellite indices (G53): rain, heat,
 * yield, restoration progress, survival, carbon, biomass. One source for both
 * the legend and the map colours, so they never disagree. The admin edits
 * them in Map classes; GET /crop-monitoring/legends returns them. Until that
 * endpoint answers, the same defaults as the backend are used.
 */
export const LAYER_DEFAULTS = {
  rain: { unit: 'mm per month', classes: [
    { range: [0, 50], label: 'Dry', colour: 'status-critical' },
    { range: [50, 150], label: 'Normal', colour: 'status-warning' },
    { range: [150, 2000], label: 'Wet', colour: 'status-good' }] },
  heat: { unit: '°C at the surface', classes: [
    { range: [-10, 28], label: 'Normal', colour: 'status-good' },
    { range: [28, 34], label: 'Warm', colour: 'status-warning' },
    { range: [34, 70], label: 'Very hot', colour: 'status-critical' }] },
  yield: { unit: 't/ha', classes: [
    { range: [0, 10], label: 'Below target', colour: 'status-critical' },
    { range: [10, 22], label: 'On target', colour: 'status-warning' },
    { range: [22, 200], label: 'Above target', colour: 'status-good' }] },
  restoration_progress: { unit: '% of target cover', classes: [
    { range: [0, 35], label: 'Slow', colour: 'status-critical' },
    { range: [35, 70], label: 'Growing', colour: 'status-warning' },
    { range: [70, 100], label: 'Established', colour: 'status-good' }] },
  survival: { unit: '% of seedlings alive', classes: [
    { range: [0, 60], label: 'Poor', colour: 'status-critical' },
    { range: [60, 80], label: 'Fair', colour: 'status-warning' },
    { range: [80, 100], label: 'Good', colour: 'status-good' }] },
  carbon: { unit: 't CO₂e/ha', classes: [
    { range: [0, 50], label: 'Low', colour: 'status-critical' },
    { range: [50, 120], label: 'Medium', colour: 'status-warning' },
    { range: [120, 2000], label: 'High', colour: 'status-good' }] },
  biomass: { unit: 'kg/m²', classes: [
    { range: [0, 2], label: 'Sparse', colour: 'status-critical' },
    { range: [2, 6], label: 'Moderate', colour: 'status-warning' },
    { range: [6, 200], label: 'Dense', colour: 'status-good' }] },
};

// Status tokens as colours (Leaflet paints SVG attributes, which cannot read CSS variables).
const TOKEN_HEX = { 'status-critical': '#DC2626', 'status-warning': '#D97706', 'status-good': '#3F8432', 'status-info': '#2563EB' };
export const hexOf = (c) => c.color || TOKEN_HEX[c.colour] || '#9CA3AF';

const cache = {};
const listeners = new Set();

function load(layer, crop) {
  const key = `${layer}:${crop || ''}`;
  if (cache[key]) return;
  cache[key] = { ...LAYER_DEFAULTS[layer], source: 'default' };
  serviceCall(`/crop-monitoring/legends?layer=${layer}${crop ? `&crop=${encodeURIComponent(crop)}` : ''}`)
    .then((d) => { if (d?.classes?.length) { cache[key] = d; listeners.forEach((fn) => fn()); } })
    .catch(() => {});
}

/** The classes for a layer (admin's when loaded, defaults until then). */
export function legendFor(layer, crop) {
  load(layer, crop);
  return cache[`${layer}:${crop || ''}`] || LAYER_DEFAULTS[layer];
}

/** Colour of a value on a layer's map, from the same classes as its legend. */
export function classColour(value, layer, crop) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const v = Number(value);
  const cls = (legendFor(layer, crop)?.classes || []).find((c) => v >= c.range[0] && v <= c.range[1]);
  return cls ? hexOf(cls) : null;
}

/** Re-render when admin classes arrive. */
export function useLayerLegends() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
}
