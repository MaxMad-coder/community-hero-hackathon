/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { Issue, IssueStatus, IssueSeverity } from "../types.js";

interface MapContainerProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  interactive?: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  reportCoordinates?: { lat: number; lng: number } | null;
}

export default function MapContainer({
  issues,
  selectedIssue,
  onSelectIssue,
  interactive = false,
  onCoordinatesChange,
  reportCoordinates
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const reportMarkerRef = useRef<any | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);

  // Detect Leaflet availability synchronously from the index.html resources load
  useEffect(() => {
    let timerId: any = null;
    const handleCheckLeaflet = () => {
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        timerId = setTimeout(handleCheckLeaflet, 50);
      }
    };
    handleCheckLeaflet();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      try {
        // Clear leaflet ID check to prevent double-initialization errors
        if ((mapContainerRef.current as any)._leaflet_id) {
          delete (mapContainerRef.current as any)._leaflet_id;
        }

        // Center at San Francisco downtown: 37.7749, -122.4194
        const centerLat = selectedIssue ? selectedIssue.latitude : 37.7749;
        const centerLng = selectedIssue ? selectedIssue.longitude : -122.4194;
        
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([centerLat, centerLng], 14);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;

        // Coordinate select for reporting form
        if (interactive && onCoordinatesChange) {
          map.on("click", (e: any) => {
            const { lat, lng } = e.latlng;
            // Precision round
            const rLat = Math.round(lat * 10000) / 10000;
            const rLng = Math.round(lng * 10000) / 10000;
            onCoordinatesChange(rLat, rLng);
          });
        }
      } catch (err) {
        console.warn("[Leaflet Map Init] Suppressed map initialization error:", err);
      }
    }

    return () => {
      // Unmount logic to clean up Map
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, interactive]);

  // Handle selected issue focus or panning
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !selectedIssue) return;
    try {
      mapInstanceRef.current.setView([selectedIssue.latitude, selectedIssue.longitude], 15, {
        animate: true,
        duration: 1.0
      });
    } catch (err) {
      console.warn("[Leaflet View Focus] Suppressed focus panning error:", err);
    }
  }, [selectedIssue, leafletLoaded]);

  // Plot/Re-plot issues markers
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    try {
      const L = (window as any).L;
      const map = mapInstanceRef.current;

      // Remove old markers
      markersRef.current.forEach(m => {
        try {
          map.removeLayer(m);
        } catch (e) {}
      });
      markersRef.current = [];

      // Colors according to statuses
      const getStatusColor = (status: IssueStatus) => {
        switch (status) {
          case IssueStatus.Reported: return "#ef4444"; // Red
          case IssueStatus.Verified: return "#f97316"; // Orange
          case IssueStatus.Assigned: return "#eab308"; // Yellow
          case IssueStatus.InProgress: return "#3b82f6"; // Blue
          case IssueStatus.Resolved: return "#22c55e"; // Green
          default: return "#6b7280";
        }
      };

      issues.forEach(issue => {
        const color = getStatusColor(issue.status);
        
        const marker = L.circleMarker([issue.latitude, issue.longitude], {
          radius: selectedIssue?.id === issue.id ? 12 : 8,
          fillColor: color,
          color: selectedIssue?.id === issue.id ? "#ffffff" : color,
          weight: selectedIssue?.id === issue.id ? 3 : 1,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        const popupContent = `
          <div class="p-1 font-sans">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">${issue.category}</span>
            </div>
            <h4 class="text-sm font-semibold text-gray-900 leading-tight mb-1">${issue.title}</h4>
            <p class="text-xs text-gray-500 mb-2 truncate max-w-[200px]">${issue.summary}</p>
            <div class="flex items-center justify-between gap-4">
              <span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">${issue.status}</span>
              <button id="btn-popup-${issue.id}" class="text-[11px] text-blue-600 font-semibold hover:underline">Click to view</button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { minWidth: 220 });
        
        // Setup dynamic button event when popup displays
        marker.on("popupopen", () => {
          const btn = document.getElementById(`btn-popup-${issue.id}`);
          if (btn) {
            btn.addEventListener("click", () => {
              onSelectIssue(issue);
              map.closePopup();
            });
          }
        });

        markersRef.current.push(marker);
      });
    } catch (err) {
      console.warn("[Leaflet Marker Plot] Suppressed marker plotting error:", err);
    }
  }, [issues, leafletLoaded, selectedIssue]);

  // Adjust/Plot user's report coordinates
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    try {
      const L = (window as any).L;
      const map = mapInstanceRef.current;

      if (reportMarkerRef.current) {
        try {
          map.removeLayer(reportMarkerRef.current);
        } catch (e) {}
        reportMarkerRef.current = null;
      }

      if (reportCoordinates) {
        const marker = L.marker([reportCoordinates.lat, reportCoordinates.lng], {
          draggable: true,
          icon: L.divIcon({
            className: "custom-div-icon",
            html: `<div class="w-8 h-8 bg-black rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-lg animate-bounce">📍</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(map);

        // Pan to selection
        map.setView([reportCoordinates.lat, reportCoordinates.lng], 16);

        marker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          if (onCoordinatesChange) {
            const rLat = Math.round(lat * 10000) / 10000;
            const rLng = Math.round(lng * 10000) / 10000;
            onCoordinatesChange(rLat, rLng);
          }
        });

        reportMarkerRef.current = marker;
      }
    } catch (err) {
      console.warn("[Leaflet Report Marker Plot] Suppressed coordinate selection error:", err);
    }
  }, [reportCoordinates, leafletLoaded]);

  return (
    <div className="relative w-full h-full bg-slate-50 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {!leafletLoaded && (
        <div className="flex flex-col items-center gap-3 text-slate-500 font-sans z-10 font-medium" id="map-loading-indicator">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium tracking-wide">Syncing Municipal Satellite Maps...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" style={{ visibility: leafletLoaded ? "visible" : "hidden" }} id="map-leaflet-canvas" />
      {interactive && leafletLoaded && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-bold text-slate-700 z-[1000] pointer-events-none">
          Click map to pin / Drag marker to adjust
        </div>
      )}
    </div>
  );
}
