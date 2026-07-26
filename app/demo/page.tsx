"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoteForm, { LoteFormData } from "@/components/LoteForm";
import SemaforoResultado, { ResultadoAnalisis } from "@/components/SemaforoResultado";
import { Leaf, Sparkle, glow } from "@/components/Decoraciones";
import mockData from "@/data/mockResponse.json";

const luciernagas = [
  { top: "15%", left: "8%", size: "w-2 h-2", delay: "delay-100" },
  { top: "28%", left: "90%", size: "w-1.5 h-1.5", delay: "delay-700" },
  { top: "45%", left: "6%", size: "w-2 h-2", delay: "delay-300" },
  { top: "60%", left: "92%", size: "w-2.5 h-2.5", delay: "delay-1000" },
  { top: "75%", left: "12%", size: "w-1.5 h-1.5", delay: "delay-500" },
  { top: "85%", left: "85%", size: "w-2 h-2", delay: "delay-200" },
  { top: "35%", left: "15%", size: "w-1.5 h-1.5", delay: "delay-1000" },
  { top: "55%", left: "88%", size: "w-1.5 h-1.5", delay: "delay-100" },
];

type EstadoGuardado =
  | { tipo: "exito"; idLote: number }
  | { tipo: "error"; mensaje: string };

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [guardado, setGuardado] = useState<EstadoGuardado | null>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (glowRef.current) {
      glowRef.current.style.left = `${e.clientX}px`;
      glowRef.current.style.top = `${e.clientY}px`;
    }
  };

  const handleFormSubmit = (data: LoteFormData) => {
    setLoading(true);
    setResultado(null);
    setGuardado(null);

    // Guardado REAL del lote en PostgreSQL (Render)
    fetch("/api/lotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error desconocido");
        setGuardado({ tipo: "exito", idLote: json.id_lote });
      })
      .catch((err: Error) => {
        setGuardado({ tipo: "error", mensaje: err.message });
      });

    // Simulación de respuesta del análisis (aún sin backend de recomendaciones)
    setTimeout(() => {
      setLoading(false);

      const simData: ResultadoAnalisis = {
        ...(mockData as ResultadoAnalisis),
        nombre: data.nombre || "Lote Registrado",
        cultivo: data.cultivo.toUpperCase(),
      };

      // Ejemplo de regla de simulación (solo si el usuario informó humedad)
      if (data.humedadSuelo !== undefined && data.humedadSuelo > 60) {
        simData.recomendacion = {
          estado: "NO_RECOMENDADO",
          color: "ROJO",
          titulo: "Suelo saturado de agua 🌧️",
          mensaje: "Exceso de humedad detectado. Sembrar en estas condiciones provocará pudrición de la semilla.",
          accion_sugerida: "Esperar entre 3 a 5 días a que drene el suelo antes de iniciar la siembra."
        };
      }

      setResultado(simData);
    }, 1000);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-emerald-950 overflow-hidden"
    >
      {/* RESPLANDOR QUE SIGUE AL MOUSE */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-0 w-96 h-96 rounded-full bg-green-400/15 blur-3xl -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />

      {/* BLOBS DE FONDO */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-blob absolute -top-24 -right-24 w-96 h-96 bg-lime-400/15 rounded-full blur-3xl" />
        <div className="animate-blob delay-700 absolute top-1/2 -left-32 w-[26rem] h-[26rem] bg-green-500/20 rounded-full blur-3xl" />
        <div className="animate-blob delay-300 absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl" />
      </div>

      {/* DECORACIONES FLOTANTES */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden="true"
      >
        <Leaf
          className={`animate-float absolute top-[18%] left-[6%] w-14 h-14 text-lime-400/60 ${glow}`}
        />
        <Leaf
          className={`animate-float-slow delay-500 absolute top-[30%] right-[5%] w-16 h-16 text-emerald-300/60 -scale-x-100 rotate-12 ${glow}`}
        />
        <Leaf
          className={`animate-float delay-1000 absolute top-[65%] left-[7%] w-10 h-10 text-green-300/50 -rotate-12 ${glow}`}
        />
        <Leaf
          className={`animate-float-slow delay-300 absolute top-[78%] right-[8%] w-12 h-12 text-lime-300/50 -scale-x-100 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-200 absolute top-[22%] left-[18%] w-4 h-4 text-lime-200 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-700 absolute top-[50%] right-[14%] w-5 h-5 text-emerald-200 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-1000 absolute bottom-[18%] left-[14%] w-4 h-4 text-green-200 ${glow}`}
        />
        {luciernagas.map((p, i) => (
          <span
            key={i}
            className={`animate-twinkle ${p.delay} ${p.size} absolute rounded-full bg-lime-300 shadow-[0_0_12px_4px_rgba(163,230,53,0.55)]`}
            style={{ top: p.top, left: p.left }}
          />
        ))}
      </div>

      {/* BARRA DE NAVEGACIÓN */}
      <nav className="sticky top-0 z-20 bg-green-950/80 backdrop-blur border-b border-white/10 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/agrodata-logo.png"
              alt="Logo de AgroData SCZ"
              width={34}
              height={34}
              className="rounded-full ring-1 ring-green-400/50 group-hover:rotate-12 group-hover:scale-110 transition-transform"
            />
            <span className="font-extrabold text-white tracking-tight">
              AgroData <span className="text-green-400">SCZ</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-green-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-1.5 transition"
          >
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      {/* CABECERA DE LA DEMO */}
      <header className="relative z-10 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center space-y-3">
          <span className="animate-fade-in animate-bounce-soft inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-200">
            Modo demostración
          </span>
          <h1 className="animate-fade-in delay-100 text-3xl md:text-4xl font-extrabold tracking-tight">
            Evalúa tu lote en <span className="text-gradient-animated">segundos</span> 🚜
          </h1>
          <p className="animate-fade-in delay-200 text-green-100/85 max-w-lg mx-auto text-sm md:text-base">
            Completa los datos de tu terreno y recibe una recomendación de
            siembra basada en suelo y clima.
          </p>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="relative z-10 pb-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="animate-fade-in delay-300 max-w-2xl mx-auto rounded-3xl p-[3px] bg-gradient-to-br from-green-400/60 via-emerald-500/20 to-lime-400/50 shadow-2xl shadow-green-950/60">
            <LoteForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>

          {loading && (
            <div className="animate-fade-in flex items-center justify-center gap-3 bg-white/10 border border-white/15 backdrop-blur rounded-2xl p-6 text-green-100 text-sm">
              <span className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              Analizando las condiciones de tu lote...
            </div>
          )}

          {guardado?.tipo === "exito" && (
            <div className="animate-fade-in max-w-2xl mx-auto flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-400/40 backdrop-blur rounded-2xl px-4 py-3 text-emerald-200 text-sm font-semibold">
              ✅ Lote guardado en la base de datos con ID #{guardado.idLote}
            </div>
          )}

          {guardado?.tipo === "error" && (
            <div className="animate-fade-in max-w-2xl mx-auto flex items-center justify-center gap-2 bg-rose-500/15 border border-rose-400/40 backdrop-blur rounded-2xl px-4 py-3 text-rose-200 text-sm font-semibold">
              ⚠️ No se pudo guardar el lote: {guardado.mensaje}
            </div>
          )}

          <SemaforoResultado resultado={resultado} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-green-200/60">
        AgroData SCZ — Plataforma de optimización de siembra 🌾
      </footer>
    </div>
  );
}
