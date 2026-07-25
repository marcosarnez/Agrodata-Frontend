"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const MapSelector = dynamic(() => import("./MapSelector"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
      Cargando mapa...
    </div>
  ),
});

export interface LoteFormData {
  nombre: string;
  superficie: number;
  cultivo: string;
  humedadSuelo: number;
  phSuelo: number;
  materiaOrganica?: string;
  latitud: number;
  longitud: number;
}

interface LoteFormProps {
  onSubmit: (data: LoteFormData) => void;
  isLoading?: boolean;
}

export default function LoteForm({ onSubmit, isLoading = false }: LoteFormProps) {
  const [formData, setFormData] = useState<LoteFormData>({
    nombre: "",
    superficie: 10,
    cultivo: "soja",
    humedadSuelo: 25,
    phSuelo: 6.5,
    materiaOrganica: "Media",
    latitud: -17.7833,
    longitud: -63.1821,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitud: lat,
      longitud: lng,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6 text-slate-800"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900 border-b pb-2">
          🌱 Registrar Nuevo Lote
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ingresa los datos iniciales para evaluar las condiciones de siembra.
        </p>
      </div>

      {/* SECCIÓN 1: DATOS GENERALES Y UBICACIÓN */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider">
          1. Información del Lote y GPS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre o Código del Lote
            </label>
            <input
              type="text"
              name="nombre"
              required
              placeholder="Ej. Lote Norte 4"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Superficie (Hectáreas)
            </label>
            <input
              type="number"
              name="superficie"
              min="0.1"
              step="0.1"
              required
              value={formData.superficie}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Cultivo a Evaluar
          </label>
          <select
            name="cultivo"
            value={formData.cultivo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none bg-white transition"
          >
            <option value="soja">Soja</option>
            <option value="maiz">Maíz</option>
            <option value="sorgo">Sorgo</option>
            <option value="trigo">Trigo</option>
          </select>
        </div>

        {/* MAPA INTERACTIVO */}
        <MapSelector onLocationSelect={handleLocationSelect} />

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div><span className="font-semibold">Lat:</span> {formData.latitud.toFixed(4)}</div>
          <div><span className="font-semibold">Lng:</span> {formData.longitud.toFixed(4)}</div>
        </div>
      </div>

      {/* SECCIÓN 2: CONDICIONES DEL SUELO */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider">
          2. Carga Manual de Suelo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Humedad del Suelo (%)
            </label>
            <input
              type="number"
              name="humedadSuelo"
              min="0"
              max="100"
              step="0.5"
              required
              value={formData.humedadSuelo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              pH del Suelo (0 - 14)
            </label>
            <input
              type="number"
              name="phSuelo"
              min="0"
              max="14"
              step="0.1"
              required
              value={formData.phSuelo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Materia Orgánica (Opcional)
          </label>
          <select
            name="materiaOrganica"
            value={formData.materiaOrganica}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none bg-white transition"
          >
            <option value="Baja">Baja (&lt; 1.5%)</option>
            <option value="Media">Media (1.5% - 3%)</option>
            <option value="Alta">Alta (&gt; 3%)</option>
          </select>
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        {isLoading ? (
          <span>Analizando condiciones...</span>
        ) : (
          <span>Evaluar Recomendación de Siembra 🚀</span>
        )}
      </button>
    </form>
  );
}