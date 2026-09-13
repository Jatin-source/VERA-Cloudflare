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
  city: 'Greater Noida',
  state: 'Uttar Pradesh',
  country: 'India',
  area: 'Bennett University (TechZone 2)',
  latitude: 28.4506,
  longitude: 77.5842,
  accuracyMeters: 250,
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

      {/* Google Maps Style Vector Geographic Map: Bennett University, Greater Noida */}
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
            <pattern id="campusGrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <rect width="25" height="25" fill="#18202d" />
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1d2737" strokeWidth="0.7" />
            </pattern>
          </defs>

          {/* Base Terrain Grid */}
          <rect width="400" height="200" fill="url(#campusGrid)" />

          {/* Institutional Sector / TechZone Blocks */}
          <polygon points="15,15 90,15 85,75 15,70" fill="#1e2838" />
          <polygon points="15,90 85,95 80,185 15,185" fill="#1c2534" />
          <polygon points="315,15 385,15 385,75 320,80" fill="#1c2534" />
          <polygon points="320,105 385,100 385,185 315,185" fill="#1e2838" />

          {/* Bennett University Campus Zone (Central Plot) */}
          <rect x="110" y="30" width="180" height="140" rx="12" fill="#1b2535" stroke="#253549" strokeWidth="1.5" />

          {/* Campus Greens & Athletic Sports Complex Fields */}
          {/* Main Sports Oval / Cricket Ground */}
          <ellipse cx="245" cy="72" rx="22" ry="16" fill="#143628" stroke="#1d4e3a" strokeWidth="1.5" />
          <ellipse cx="245" cy="72" rx="6" ry="4" fill="none" stroke="#225b44" strokeWidth="1" />
          <text x="245" y="74" fill="#86efac" fontSize="5.5" fontWeight="600" textAnchor="middle" opacity="0.85">
            Sports Oval
          </text>

          {/* Campus Quad Lawns & Courtyard */}
          <rect x="135" y="65" width="38" height="28" rx="4" fill="#122e22" stroke="#184332" strokeWidth="1" />
          <text x="154" y="81" fill="#86efac" fontSize="5.5" fontWeight="600" textAnchor="middle" opacity="0.85">
            Campus Quad
          </text>

          {/* Academic & Administrative Blocks */}
          <rect x="132" y="110" width="32" height="18" rx="2" fill="#243447" stroke="#32465e" strokeWidth="1" />
          <text x="148" y="122" fill="#cbd5e1" fontSize="5.5" fontWeight="bold" textAnchor="middle">
            Block A/B
          </text>

          <rect x="175" y="112" width="30" height="18" rx="2" fill="#243447" stroke="#32465e" strokeWidth="1" />
          <text x="190" y="123" fill="#cbd5e1" fontSize="5.5" fontWeight="bold" textAnchor="middle">
            Block C
          </text>

          <rect x="220" y="110" width="45" height="18" rx="2" fill="#243447" stroke="#32465e" strokeWidth="1" />
          <text x="242" y="122" fill="#cbd5e1" fontSize="5.5" fontWeight="bold" textAnchor="middle">
            Hostels & Mess
          </text>

          {/* Surrounding Secondary Grid Streets (TechZone 2 Roads) */}
          <g stroke="#28374d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* TechZone Internal Roadways */}
            <path d="M 0 50 L 110 50" />
            <path d="M 0 150 L 110 150" />
            <path d="M 290 50 L 400 50" />
            <path d="M 290 150 L 400 150" />
            {/* Campus Loop Road */}
            <rect x="122" y="42" width="156" height="116" rx="8" />
          </g>

          {/* MAJOR ARTERIAL HIGHWAY 1: Yamuna Expressway (Diagonal corridor in east) */}
          <g stroke="#7c4a03" strokeWidth="7" strokeLinecap="round" fill="none">
            <path d="M 330 -10 L 410 190" />
          </g>
          <g stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" fill="none">
            <path d="M 330 -10 L 410 190" />
          </g>
          {/* Expressway Dashed Center Line */}
          <path d="M 330 -10 L 410 190" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.7" />
          <text x="340" y="110" fill="#fde68a" fontSize="7" fontWeight="bold" transform="rotate(68 340 110)">
            YAMUNA EXPRESSWAY
          </text>

          {/* MAJOR ARTERIAL HIGHWAY 2: TechZone 2 Main Blvd / Pari Chowk Connector */}
          <g stroke="#7c4a03" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M -5 100 L 405 100" />
          </g>
          <g stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M -5 100 L 405 100" />
          </g>
          <text x="50" y="94" fill="#cbd5e1" fontSize="6.5" fontWeight="600">
            TechZone 2 Blvd
          </text>
          <text x="310" y="94" fill="#cbd5e1" fontSize="6" fontWeight="500">
            To Pari Chowk →
          </text>

          {/* Authentic Geographic Labels */}
          <text x="200" y="58" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="0.6">
            BENNETT UNIVERSITY
          </text>
          <text x="200" y="148" fill="#94a3b8" fontSize="6.5" fontWeight="600" textAnchor="middle">
            Greater Noida Campus • TechZone 2
          </text>
          <text x="50" y="30" fill="#64748b" fontSize="6.5" fontWeight="500">
            Knowledge Park III
          </text>
          <text x="50" y="170" fill="#64748b" fontSize="6.5" fontWeight="500">
            Institutional Area
          </text>

          {/* University Icon / Emblem Node */}
          <g transform="translate(193, 76)">
            <circle cx="7" cy="7" r="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
            <text x="7" y="10" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
              U
            </text>
          </g>

          {/* CALLER LOCATION PIN & RADAR BEACON (Anchored at Bennett University Campus) */}
          {/* Signal Accuracy Circle */}
          <circle
            cx="200"
            cy="92"
            r="30"
            fill="#ef4444"
            fillOpacity="0.08"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Animated Pulsing Signal Beacon */}
          <circle cx="200" cy="92" r="16" fill="#ef4444" fillOpacity="0.25">
            <animate attributeName="r" values="10;26;10" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.35;0.05;0.35" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Pin Ground Shadow */}
          <ellipse cx="200" cy="92" rx="7" ry="3" fill="#000000" fillOpacity="0.5" />

          {/* Pin Ground Target Dot */}
          <circle cx="200" cy="92" r="2.5" fill="#b91c1c" />

          {/* Classic Red Google Maps Pin */}
          <g filter="url(#pinShadow)">
            <path
              d="M 200 62 
                 C 192 62 186 68 186 76 
                 C 186 86.5 200 92 200 92 
                 C 200 92 214 86.5 214 76 
                 C 214 68 208 62 200 62 Z"
              fill="#ea4335"
              stroke="#b91c1c"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* White Center Dot of Pin */}
            <circle cx="200" cy="74.5" r="4" fill="#ffffff" />
            {/* Inner accent dot */}
            <circle cx="200" cy="74.5" r="1.8" fill="#ea4335" />
          </g>
        </svg>

        {/* Floating Callout Badge Above Pin */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#070b14]/90 border border-rose-500/50 shadow-xl backdrop-blur-md flex items-center space-x-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-[11px] font-bold text-white tracking-wide">
            {callerName ? `${callerName}'s Location` : 'Caller Location'} • Bennett Univ
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
            Radius: ±{location.accuracyMeters || 250}m {location.isMock ? '(Demo Data)' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CallerLocationMap;
