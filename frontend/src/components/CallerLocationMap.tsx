import React from 'react';
import { MapPin, Navigation, Compass, Radio, ZoomIn, ZoomOut } from 'lucide-react';

export interface CallerLocation {
  city: string;
  state?: string;
  country: string;
  area?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  provider?: string;
  isMock?: boolean;
}

export const DEFAULT_MOCK_LOCATION: CallerLocation = {
  city: 'New Delhi',
  state: 'Delhi',
  country: 'India',
  area: 'Connaught Place',
  latitude: 28.6139,
  longitude: 77.2090,
  accuracyMeters: 350,
  provider: 'Cellular Tower Triangulation',
  isMock: true,
};

export interface CallerLocationMapProps {
  callerName?: string | null;
  location?: CallerLocation;
  className?: string;
}

export const CallerLocationMap: React.FC<CallerLocationMapProps> = ({
  callerName,
  location = DEFAULT_MOCK_LOCATION,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#0a101d] border border-[#1a2333] rounded-3xl shadow-xl overflow-hidden transition-all duration-300 ${className}`}
      data-testid="caller-location-map"
    >
      {/* Mini Card Header */}
      <div className="px-4 py-2.5 bg-[#0d1627] border-b border-[#1a2333] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            <MapPin size={13} />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">
            Live Caller Location
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
            ACTIVE FIX
          </span>
        </div>
      </div>

      {/* Google Maps Style Vector Geographic Map */}
      <div className="relative w-full h-44 sm:h-52 bg-[#18202d] overflow-hidden select-none">
        <svg
          viewBox="0 0 400 200"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft map drop shadows */}
            <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
            </filter>
            {/* Subtle grid pattern */}
            <pattern id="cityGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="#18202d" />
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1d2737" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Base Urban Terrain Grid */}
          <rect width="400" height="200" fill="url(#cityGrid)" />

          {/* City Block Polygon Fills */}
          <polygon points="10,10 70,15 65,55 15,50" fill="#1e2838" />
          <polygon points="85,15 150,20 140,55 80,50" fill="#1c2534" />
          <polygon points="260,20 330,15 320,55 255,50" fill="#1e2838" />
          <polygon points="345,10 395,10 395,60 335,55" fill="#1b2432" />

          <polygon points="10,140 70,145 60,190 10,190" fill="#1c2534" />
          <polygon points="80,150 140,150 135,190 75,190" fill="#1e2838" />
          <polygon points="260,150 330,145 335,190 265,190" fill="#1c2534" />
          <polygon points="345,140 395,140 395,190 345,190" fill="#1e2838" />

          {/* Green Spaces / Parks (Google Maps Sage/Dark Green) */}
          <path
            d="M 20 80 Q 45 65 70 85 T 60 125 T 15 115 Z"
            fill="#122e22"
            stroke="#184332"
            strokeWidth="1"
          />
          <path
            d="M 330 80 Q 370 70 385 105 T 350 135 T 320 110 Z"
            fill="#122e22"
            stroke="#184332"
            strokeWidth="1"
          />
          {/* Central Park (Inside Connaught Place Inner Circle) */}
          <circle cx="200" cy="100" r="18" fill="#143628" stroke="#1d4e3a" strokeWidth="1.5" />

          {/* Yamuna River / Waterway Curve in the northeast */}
          <path
            d="M 320 -10 Q 350 30 380 40 T 410 70"
            fill="none"
            stroke="#142c44"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 320 -10 Q 350 30 380 40 T 410 70"
            fill="none"
            stroke="#1c3e62"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <text x="368" y="28" fill="#3b82f6" fontSize="7" fontStyle="italic" opacity="0.6">
            Yamuna River
          </text>

          {/* Secondary City Streets Grid (Slate gray) */}
          <g stroke="#28374d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M 0 35 L 400 35" />
            <path d="M 0 165 L 400 165" />
            <path d="M 45 0 L 45 200" />
            <path d="M 110 0 L 110 200" />
            <path d="M 290 0 L 290 200" />
            <path d="M 360 0 L 360 200" />
          </g>

          {/* Connaught Place Concentric Circular Roads */}
          <circle cx="200" cy="100" r="56" fill="none" stroke="#334661" strokeWidth="5" />
          <circle cx="200" cy="100" r="56" fill="none" stroke="#25354a" strokeWidth="3.5" />
          <circle cx="200" cy="100" r="38" fill="none" stroke="#28384f" strokeWidth="2.5" />
          <circle cx="200" cy="100" r="24" fill="none" stroke="#3a4f6d" strokeWidth="3" />

          {/* Major Radial Arterial Highways (Warm Google Maps Orange/Gold) */}
          <g stroke="#7c4a03" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M 200 124 L 200 205" />
            <path d="M 200 76 L 200 -5" />
            <path d="M 224 100 L 405 100" />
            <path d="M 176 100 L -5 100" />
            <path d="M 183 117 L 110 190" />
            <path d="M 217 117 L 290 190" />
            <path d="M 217 83 L 295 10" />
            <path d="M 183 83 L 105 10" />
          </g>

          {/* Primary Road Highway Inner Lines (Bright Yellow/Orange) */}
          <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 200 124 L 200 205" />
            <path d="M 200 76 L 200 -5" />
            <path d="M 224 100 L 405 100" />
            <path d="M 176 100 L -5 100" />
            <path d="M 183 117 L 110 190" />
            <path d="M 217 117 L 290 190" />
            <path d="M 217 83 L 295 10" />
            <path d="M 183 83 L 105 10" />
          </g>

          {/* Authentic Geographic Labels */}
          <text x="200" y="70" fill="#e2e8f0" fontSize="8" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
            CONNAUGHT PLACE
          </text>
          <text x="200" y="103" fill="#86efac" fontSize="6.5" fontWeight="600" textAnchor="middle" opacity="0.85">
            Central Park
          </text>
          <text x="206" y="155" fill="#cbd5e1" fontSize="6.5" fontWeight="500">
            Janpath
          </text>
          <text x="270" y="96" fill="#cbd5e1" fontSize="6.5" fontWeight="500">
            Barakhamba Rd
          </text>
          <text x="135" y="150" fill="#94a3b8" fontSize="6" fontWeight="500" transform="rotate(-45 135 150)">
            Sansad Marg
          </text>
          <text x="250" y="155" fill="#94a3b8" fontSize="6" fontWeight="500" transform="rotate(45 250 155)">
            KG Marg
          </text>

          {/* Metro Station Nodes (Blue 'M' Badges) */}
          <g transform="translate(193, 110)">
            <rect width="14" height="9" rx="2" fill="#2563eb" />
            <text x="7" y="7" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">
              M
            </text>
          </g>
          <text x="210" y="117" fill="#93c5fd" fontSize="5.5" fontWeight="500">
            Rajiv Chowk
          </text>

          {/* CALLER LOCATION PIN & RADAR BEACON */}
          {/* Signal Accuracy Circle */}
          <circle
            cx="200"
            cy="98"
            r="32"
            fill="#ef4444"
            fillOpacity="0.08"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Animated Pulsing Signal Beacon */}
          <circle cx="200" cy="98" r="18" fill="#ef4444" fillOpacity="0.25">
            <animate attributeName="r" values="10;28;10" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.35;0.05;0.35" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Pin Ground Shadow */}
          <ellipse cx="200" cy="98" rx="7" ry="3" fill="#000000" fillOpacity="0.5" />

          {/* Pin Ground Target Dot */}
          <circle cx="200" cy="98" r="2.5" fill="#b91c1c" />

          {/* Classic Red Google Maps Pin */}
          <g filter="url(#pinShadow)">
            <path
              d="M 200 68 
                 C 192 68 186 74 186 82 
                 C 186 92.5 200 98 200 98 
                 C 200 98 214 92.5 214 82 
                 C 214 74 208 68 200 68 Z"
              fill="#ea4335"
              stroke="#b91c1c"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* White Center Dot of Pin */}
            <circle cx="200" cy="80.5" r="4" fill="#ffffff" />
            {/* Inner accent dot */}
            <circle cx="200" cy="80.5" r="1.8" fill="#ea4335" />
          </g>
        </svg>

        {/* Floating Callout Badge Above Pin */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#070b14]/90 border border-rose-500/50 shadow-xl backdrop-blur-md flex items-center space-x-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-[11px] font-bold text-white tracking-wide">
            {callerName ? `${callerName}'s Location` : 'Caller Location'}
          </span>
        </div>

        {/* Mini Map Controls (Google Maps Style Overlay) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          <div className="w-6 h-6 rounded-md bg-[#0a101d]/90 border border-[#1a2333] shadow-md flex items-center justify-center text-gray-300">
            <Compass size={13} className="text-rose-400 transform -rotate-45" />
          </div>
          <div className="flex flex-col rounded-md bg-[#0a101d]/90 border border-[#1a2333] shadow-md overflow-hidden">
            <button
              type="button"
              className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-white border-b border-[#1a2333]"
              title="Zoom in (UI Demo)"
            >
              <ZoomIn size={11} />
            </button>
            <button
              type="button"
              className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-white"
              title="Zoom out (UI Demo)"
            >
              <ZoomOut size={11} />
            </button>
          </div>
        </div>

        {/* Subtle Watermark & Mock Indicator */}
        <div className="absolute bottom-1 left-2 flex items-center space-x-1 text-[9px] font-mono text-gray-400/80 pointer-events-none bg-[#0a101d]/70 px-1.5 py-0.5 rounded backdrop-blur-sm">
          <span>Map mockup</span>
          <span>•</span>
          <span className="text-gray-400">VERA Geolocation</span>
        </div>
      </div>

      {/* Location Text & Context Details Underneath */}
      <div className="p-3.5 sm:p-4 bg-[#0a101d] border-t border-[#1a2333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Navigation size={11} className="text-blue-400" />
            <span>Caller Location</span>
          </div>
          <div className="text-base font-bold text-white tracking-wide">
            {location.city}, {location.country}
          </div>
          <div className="text-xs text-gray-400 font-mono flex flex-wrap items-center gap-2">
            {location.area && (
              <span className="text-gray-300 font-medium">{location.area}</span>
            )}
            <span className="text-gray-600">•</span>
            <span>
              {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Signal Context Pill */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1a2333]/50 shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-blue-950/80 border border-blue-500/40 text-blue-300 shadow-sm">
            <Radio size={10} className="mr-1 text-blue-400 animate-pulse" />
            {location.provider || 'Cellular Tower Triangulation'}
          </span>
          <span className="text-[10px] text-gray-500 font-mono mt-1">
            Radius: ±{location.accuracyMeters || 350}m {location.isMock ? '(Demo Data)' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CallerLocationMap;
