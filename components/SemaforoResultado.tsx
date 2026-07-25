"use client";

import React from "react";

export interface ResultadoAnalisis {
  lote_id: string;
  nombre: string;
  cultivo: string;
  recomendacion: {
    estado: "OPTIMO" | "PRECAUCION" | "NO_RECOMENDADO";
    color: "VERDE" | "AMARILLO" | "ROJO";
    titulo: string;
    mensaje: string;
    accion_sugerida: string;
  };
  alertas: Array<{
    tipo: string;
    mensaje: string;
  }>;
}

interface SemaforoProps {
  resultado: ResultadoAnalisis | null;
}

export default function SemaforoResultado({ resultado }: SemaforoProps) {
  if (!resultado) return null;

  const { recomendacion, alertas, nombre, cultivo } = resultado;

  // Configuración de colores dinámica según el semáforo
  const colorStyles = {
    VERDE: {
      bg: "bg-emerald-50",
      border: "border-emerald-500",
      text: "text-emerald-900",
      badge: "bg-emerald-500 text-white",
      icon: "✅",
    },
    AMARILLO: {
      bg: "bg-amber-50",
      border: "border-amber-500",
      text: "text-amber-900",
      badge: "bg-amber-500 text-white",
      icon: "⚠️",
    },
    ROJO: {
      bg: "bg-rose-50",
      border: "border-rose-500",
      text: "text-rose-900",
      badge: "bg-rose-500 text-white",
      icon: "🚫",
    },
  };

  const style = colorStyles[recomendacion.color] || colorStyles.VERDE;

  return (
    <div
      className={`p-6 rounded-2xl border-2 ${style.border} ${style.bg} shadow-md space-y-4 transition-all animate-fade-in`}
    >
      <div className="flex items-center justify-between border-b pb-3 border-slate-200/60">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resultado del Análisis — {nombre}
          </span>
          <h3 className="text-xl font-extrabold text-slate-900">
            Cultivo: {cultivo}
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${style.badge}`}
        >
          {style.icon} {recomendacion.estado}
        </span>
      </div>

      <div>
        <h4 className={`text-lg font-bold ${style.text}`}>
          {recomendacion.titulo}
        </h4>
        <p className="text-slate-700 text-sm mt-1 leading-relaxed">
          {recomendacion.mensaje}
        </p>
      </div>

      <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-800">
        <span className="font-bold text-slate-900">💡 Sugerencia del sistema:</span>{" "}
        {recomendacion.accion_sugerida}
      </div>

      {alertas && alertas.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60">
          <span className="text-xs font-semibold text-slate-600 block mb-1">
            Notas complementarias:
          </span>
          {alertas.map((item, index) => (
            <p key={index} className="text-xs text-slate-600 italic">
              • {item.mensaje}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}