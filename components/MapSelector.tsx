"use client";

import { useState, useEffect, useRef } from "react";
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

type EstadoValidacion =
  | { tipo: "idle" }
  | { tipo: "verificando" }
  | { tipo: "rechazado"; motivo: string };

/**
 * Chequeo 1 — color del mapa: descarga el tile de OpenStreetMap del punto
 * y revisa si los píxeles alrededor del clic son del azul de agua de OSM
 * (rgb 170, 211, 223). Detecta lagos y ríos pequeños que el modelo
 * satelital no ve por su resolución de ~10 km.
 */
async function esAguaPorColor(lat: number, lng: number): Promise<boolean> {
  try {
    const zoom = 16;
    const n = 2 ** zoom;
    const xf = ((lng + 180) / 360) * n;
    const latRad = (lat * Math.PI) / 180;
    const yf =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      n;
    const xt = Math.floor(xf);
    const yt = Math.floor(yf);
    const px = Math.min(255, Math.max(0, Math.floor((xf - xt) * 256)));
    const py = Math.min(255, Math.max(0, Math.floor((yf - yt) * 256)));

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://tile.openstreetmap.org/${zoom}/${xt}/${yt}.png`;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    // Muestra de 3x3 píxeles alrededor del clic; mayoría azul = agua
    const x0 = Math.min(253, Math.max(0, px - 1));
    const y0 = Math.min(253, Math.max(0, py - 1));
    const datos = ctx.getImageData(x0, y0, 3, 3).data;
    let azules = 0;
    for (let i = 0; i < 9; i++) {
      const r = datos[i * 4];
      const g = datos[i * 4 + 1];
      const b = datos[i * 4 + 2];
      // Azul de agua del estilo estándar de OSM: rgb(170, 211, 223)
      if (Math.abs(r - 170) < 14 && Math.abs(g - 211) < 14 && Math.abs(b - 223) < 14) {
        azules++;
      }
    }
    return azules >= 5;
  } catch {
    return false;
  }
}

/**
 * Chequeo 2 — humedad de suelo satelital de Open-Meteo: sobre cuerpos de
 * agua grandes el modelo reporta ~0 m³/m³ (no hay suelo). Es la misma
 * señal que valida el backend en /api/analizar.
 */
async function esAguaPorSatelite(lat: number, lng: number): Promise<boolean> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=soil_moisture_9_to_27cm&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    const valores: number[] = data.hourly?.soil_moisture_9_to_27cm ?? [];
    if (!valores.length) return false;
    const promedio =
      valores.reduce((a: number, b: number) => a + (b ?? 0), 0) / valores.length;
    // < 0.01 m³/m³ = sin suelo (agua o roca desnuda)
    return promedio < 0.01;
  } catch {
    return false;
  }
}

/**
 * Combina ambos chequeos en paralelo: cualquiera que detecte agua
 * rechaza el punto. Si ambos fallan (red caída), devuelve false para no
 * bloquear al usuario: el backend es la red de seguridad final.
 */
async function esAgua(lat: number, lng: number): Promise<boolean> {
  const [porColor, porSatelite] = await Promise.all([
    esAguaPorColor(lat, lng),
    esAguaPorSatelite(lat, lng),
  ]);
  return porColor || porSatelite;
}

// Componente interno para escuchar el click en el mapa
function LocationMarker({
  onLocationSelect,
  onValidacion,
}: MapProps & { onValidacion: (estado: EstadoValidacion) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(
    new L.LatLng(-17.7833, -63.1821)
  );
  // Para ignorar respuestas viejas si el usuario hace varios clics rápidos
  const ultimaPeticion = useRef(0);

  useMapEvents({
    click(e) {
      const idPeticion = ++ultimaPeticion.current;
      onValidacion({ tipo: "verificando" });

      esAgua(e.latlng.lat, e.latlng.lng).then((agua) => {
        if (idPeticion !== ultimaPeticion.current) return; // clic más nuevo pendiente

        if (agua) {
          onValidacion({
            tipo: "rechazado",
            motivo:
              "Ese punto cae en agua (lago, río o mar) o terreno sin suelo cultivable. Elige tierra firme para tu lote.",
          });
          return; // el marcador NO se mueve
        }

        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        onValidacion({ tipo: "idle" });
      });
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
}

export default function MapSelector({ onLocationSelect }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [validacion, setValidacion] = useState<EstadoValidacion>({
    tipo: "idle",
  });

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
          <LocationMarker
            onLocationSelect={onLocationSelect}
            onValidacion={setValidacion}
          />
        </MapContainer>
      </div>

      {validacion.tipo === "verificando" && (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Verificando que el punto sea tierra firme...
        </p>
      )}

      {validacion.tipo === "rechazado" && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          🚫 {validacion.motivo}
        </p>
      )}
    </div>
  );
}
