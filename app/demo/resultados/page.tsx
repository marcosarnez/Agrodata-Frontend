"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PanelClima from "@/components/PanelClima";
import PanelNoticias from "@/components/PanelNoticias";
import SemaforoResultado from "@/components/SemaforoResultado";
import { STORAGE_KEY, type DatosResultados } from "@/lib/resultados";

type TabId = "clima" | "noticias" | "recomendacion";

export default function ResultadosPage() {
  const [datos, setDatos] = useState<DatosResultados | null>(null);
  const [tab, setTab] = useState<TabId>("clima");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDatos(JSON.parse(raw) as DatosResultados);
      }
    } catch {
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Cargando resultados...
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-700 font-semibold">
          No hay resultados para mostrar todavía.
        </p>
        <p className="text-sm text-slate-500 max-w-md">
          Primero completa el formulario de evaluación y pulsa{" "}
          <strong>Evaluar Recomendación de Siembra</strong>.
        </p>
        <Link
          href="/demo"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition"
        >
          Ir al formulario
        </Link>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; badge?: string }[] = [
    { id: "clima", label: "Clima", badge: datos.clima ? "7 días" : "—" },
    {
      id: "noticias",
      label: "Noticias",
      badge: datos.resumenNoticias ? "Resumen" : "—",
    },
    { id: "recomendacion", label: "Recomendación" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <nav className="sticky top-0 z-20 bg-green-950/95 backdrop-blur border-b border-green-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/agrodata-logo.png"
              alt="Logo AgroData SCZ"
              width={34}
              height={34}
              className="rounded-full ring-1 ring-green-400/50"
            />
            <span className="font-extrabold text-white tracking-tight">
              AgroData <span className="text-green-400">SCZ</span>
            </span>
          </Link>
          <Link
            href="/demo"
            className="text-xs font-semibold text-green-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-1.5 transition"
          >
            ← Nueva evaluación
          </Link>
        </div>
      </nav>

      <header className="bg-gradient-to-r from-green-900 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-2">
          <span className="inline-flex text-[10px] font-bold uppercase tracking-widest bg-white/10 border border-white/20 rounded-full px-3 py-1 text-green-200">
            Resultados de la evaluación
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {datos.loteNombre}
          </h1>
          <p className="text-green-100/90 text-sm">
            Cultivo: <strong className="text-white">{datos.cultivo}</strong>
            {" · "}
            Lat {datos.latitud.toFixed(4)}, Lng {datos.longitud.toFixed(4)}
            {datos.idLote != null && (
              <>
                {" · "}
                ID lote #{datos.idLote}
              </>
            )}
          </p>
        </div>
      </header>

      {/* PESTAÑAS */}
      <div className="sticky top-[57px] z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-3 text-sm font-bold whitespace-nowrap transition border-b-2 ${
                tab === t.id
                  ? "border-green-600 text-green-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
              {t.badge && (
                <span
                  className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    tab === t.id
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-5 md:p-8 animate-fade-in">
          {tab === "clima" && (
            <>
              {datos.clima ? (
                <PanelClima clima={datos.clima} />
              ) : (
                <EstadoVacio
                  titulo="No se pudo cargar el clima"
                  mensaje={
                    datos.errorClima ||
                    "Intenta evaluar de nuevo desde el formulario."
                  }
                />
              )}
            </>
          )}

          {tab === "noticias" && (
            <>
              {datos.resumenNoticias ? (
                <PanelNoticias
                  resumen={datos.resumenNoticias}
                  fuentes={datos.fuentesNoticias}
                />
              ) : (
                <EstadoVacio
                  titulo="No se pudo generar el resumen"
                  mensaje={
                    datos.errorNoticias ||
                    "El servicio de noticias no respondió. Puedes reintentar la evaluación."
                  }
                />
              )}
            </>
          )}

          {tab === "recomendacion" && (
            <>
              {datos.recomendacion ? (
                <SemaforoResultado resultado={datos.recomendacion} />
              ) : (
                <EstadoVacio
                  titulo="Sin recomendación"
                  mensaje="No hay datos de recomendación para mostrar."
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EstadoVacio({
  titulo,
  mensaje,
}: {
  titulo: string;
  mensaje: string;
}) {
  return (
    <div className="text-center py-12 px-4 space-y-2">
      <p className="font-bold text-slate-800">{titulo}</p>
      <p className="text-sm text-slate-500 max-w-md mx-auto">{mensaje}</p>
    </div>
  );
}
