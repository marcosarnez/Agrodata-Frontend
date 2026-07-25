"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para los íconos por defecto de Leaflet en Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

// Componente interno para escuchar el click en el mapa
function LocationMarker({ onLocationSelect }: MapProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    new L.LatLng(-17.7833, -63.1821)
  );

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
}

export default function MapSelector({ onLocationSelect }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 w-full bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-slate-500 text-sm">
        Cargando mapa interactivo...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700">
        Ubicación Geográfica del Lote (Haz clic en el mapa)
      </label>
      <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
        <MapContainer
          center={[-17.7833, -63.1821]}
          zoom={9}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>
    </div>
  );
}