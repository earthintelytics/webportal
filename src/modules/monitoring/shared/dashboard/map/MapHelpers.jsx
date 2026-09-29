/* Small react-leaflet helpers used by the crop dashboard map panes. */
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export const ResizeMap = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 200);
    const timer3 = setTimeout(() => map.invalidateSize(), 350);
    const timer4 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [trigger, map]);
  return null;
};

export const MapPaneClipSetter = ({ leftPaneName, rightPaneName, splitPosition, isCompareMode }) => {
  const map = useMap();
  useEffect(() => {
    const updateClips = () => {
      const leftPane = map.getPane(leftPaneName);
      const rightPane = map.getPane(rightPaneName);
      
      if (!isCompareMode) {
        if (leftPane) leftPane.style.clipPath = 'none';
        if (rightPane) rightPane.style.clipPath = 'none';
        return;
      }
      
      if (leftPane) {
        leftPane.style.clipPath = `inset(0 ${100 - splitPosition}% 0 0)`;
      }
      if (rightPane) {
        rightPane.style.clipPath = `inset(0 0 0 ${splitPosition}%)`;
      }
    };

    updateClips();
    const t = setTimeout(updateClips, 50);
    return () => clearTimeout(t);
  }, [map, leftPaneName, rightPaneName, splitPosition, isCompareMode]);
  return null;
};

export const SwipeSliderOverlay = ({ isCompareMode, splitPosition, currentTimelineA, currentTimelineB, handleSplitDragStart }) => {
  if (!isCompareMode) return null;
  return (
    <>
      {/* Split Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white pointer-events-none"
        style={{ left: `${splitPosition}%`, zIndex: 30000 }}
      />
      
      {/* Drag Handle */}
      <div
        onMouseDown={handleSplitDragStart}
        onTouchStart={handleSplitDragStart}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-green-600 shadow-2xl flex items-center justify-center cursor-ew-resize select-none transition-transform hover:scale-110 active:scale-95"
        style={{ left: `${splitPosition}%`, zIndex: 30001 }}
      >
        <span className="text-green-600 font-extrabold text-lg select-none">↔</span>
      </div>

      {/* Floating Date Badges (At the lower side, square, smaller, and no colors) */}
      {/* Left Badge */}
      <div
        className="absolute bg-white/90 backdrop-blur-sm border border-gray-200 px-2 py-1 rounded-sm shadow-md flex flex-col pointer-events-none"
        style={{ left: '12px', bottom: '12px', zIndex: 20000 }}
      >
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Left</span>
        <span className="text-[11px] font-extrabold text-gray-800">{currentTimelineA?.label?.split(',')[0]}</span>
      </div>

      {/* Right Badge */}
      <div
        className="absolute bg-white/90 backdrop-blur-sm border border-gray-200 px-2 py-1 rounded-sm shadow-md flex flex-col pointer-events-none text-right"
        style={{ right: '55px', bottom: '12px', zIndex: 20000 }}
      >
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Right</span>
        <span className="text-[11px] font-extrabold text-gray-800">{currentTimelineB?.label?.split(',')[0]}</span>
      </div>
    </>
  );
};


// ── Default Farm Plots Coordinates ────────────────────────────────────────

// ── Auto-fit map to loaded plots ─────────────────────────────────────────
export function FitBoundsToPlots({ plotsData, farmBoundary, refitKey = null }) {
  const map = useMap();
  const fitted = useRef(false);
  const lastKey = useRef(refitKey);
  useEffect(() => {
    // Fit once, and again whenever refitKey changes (e.g. a different estate is picked)
    if (lastKey.current !== refitKey) { lastKey.current = refitKey; fitted.current = false; }
    if (fitted.current) return;
    // Priority 1: fit to real plot polygons
    if (plotsData && plotsData.length > 0) {
      const allCoords = plotsData.flatMap(p => p.coords || []);
      if (allCoords.length > 0) {
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const [lat, lng] of allCoords) {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        }
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [30, 30], maxZoom: 15 });
        fitted.current = true;
        return;
      }
    }
    // Priority 2: fit to farm boundary bbox (e.g. Olam)
    if (farmBoundary?.properties?.bbox) {
      const { min_lat, max_lat, min_lng, max_lng } = farmBoundary.properties.bbox;
      map.fitBounds([[min_lat, min_lng], [max_lat, max_lng]], { padding: [40, 40], maxZoom: 13 });
      fitted.current = true;
    }
  }, [plotsData, farmBoundary, map, refitKey]);
  return null;
}

// Flies to zarr bounds only when the map center is outside them (avoids zooming out when already viewing the data).
export function FitToZarrBounds({ zarrBounds }) {
  const map = useMap();
  useEffect(() => {
    if (!zarrBounds) return;
    const center = map.getCenter();
    const [[swLat, swLng], [neLat, neLng]] = zarrBounds;
    const centerInBounds =
      center.lat >= swLat && center.lat <= neLat &&
      center.lng >= swLng && center.lng <= neLng;
    if (!centerInBounds) {
      map.fitBounds(zarrBounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [zarrBounds, map]);
  return null;
}

// Restoration zone fallback coords removed — coords must come from backend boundary geometry.

