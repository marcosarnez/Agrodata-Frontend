"use client";

import type { ClimaDatos } from "@/lib/clima";

interface PanelClimaProps {
  clima: ClimaDatos;
}

function formatearFecha(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-BO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function PanelClima({ clima }: PanelClimaProps) {
  const { daily, hourly, latitud, longitud } = clima;

  const humedadAhora = hourly.relative_humidity_2m?.[0];
  const vientoAhora = hourly.wind_speed_10m?.[0];
  const tempSuelo = hourly.soil_temperature_6cm?.[0];
  const humedadSuelo = hourly.soil_moisture_9_to_27cm?.[0];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Pronóstico del clima
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordenadas del lote: {latitud.toFixed(4)}, {longitud.toFixed(4)}
            {clima.timezone ? ` · ${clima.timezone}` : ""}
          </p>
        </div>
      </div>

      {/* KPIs del momento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Humedad aire",
            valor: humedadAhora != null ? `${Math.round(humedadAhora)}%` : "—",
            icon: "💧",
          },
          {
            label: "Viento",
            valor: vientoAhora != null ? `${vientoAhora.toFixed(1)} km/h` : "—",
            icon: "💨",
          },
          {
            label: "Temp. suelo",
            valor: tempSuelo != null ? `${tempSuelo.toFixed(1)}°C` : "—",
            icon: "🌡️",
          },
          {
            label: "Humedad suelo",
            valor:
              humedadSuelo != null
                ? `${(humedadSuelo * 100).toFixed(0)}%`
                : "—",
            icon: "🌱",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4"
          >
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-lg font-black text-slate-900">{k.valor}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Pronóstico 7 días */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-3 min-w-max pb-1">
          {daily.time.map((dia, i) => {
            const tmax = daily.temperature_2m_max[i];
            const tmin = daily.temperature_2m_min[i];
            const lluvia = daily.precipitation_sum[i];
            const probLluvia = daily.precipitation_probability_max[i];
            const uv = daily.uv_index_max[i];

            return (
              <div
                key={dia}
                className="w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:border-emerald-300 transition"
              >
                <div className="text-xs font-bold text-emerald-700 uppercase mb-2">
                  {formatearFecha(dia)}
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-black text-slate-900">
                    {Math.round(tmax)}°
                  </span>
                  <span className="text-sm text-slate-400">
                    / {Math.round(tmin)}°
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Lluvia</span>
                    <span className="font-semibold">{lluvia.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prob.</span>
                    <span className="font-semibold">{probLluvia}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UV</span>
                    <span className="font-semibold">{uv.toFixed(1)}</span>
                  </div>
                </div>
                {/* Barra de probabilidad de lluvia */}
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-400"
                    style={{ width: `${Math.min(100, probLluvia)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
