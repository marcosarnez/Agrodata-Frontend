"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoteForm, { LoteFormData } from "@/components/LoteForm";
import SemaforoResultado, { ResultadoAnalisis } from "@/components/SemaforoResultado";
import { Leaf, Sparkle, glow } from "@/components/Decoraciones";
import type { ClimaDatos } from "@/lib/clima";
import { STORAGE_KEY, type DatosResultados } from "@/lib/resultados";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pasoCarga, setPasoCarga] = useState("");
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [guardado, setGuardado] = useState<EstadoGuardado | null>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (glowRef.current) {
      glowRef.current.style.left = `${e.clientX}px`;
      glowRef.current.style.top = `${e.clientY}px`;
    }
  };

  const handleFormSubmit = async (data: LoteFormData) => {
    setLoading(true);
    setResultado(null);
    setGuardado(null);

    let idLote: number | undefined;

    // 1) Guardar lote en PostgreSQL
    setPasoCarga("Guardando lote en la base de datos...");
    try {
      const resLote = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const jsonLote = await resLote.json();
      if (!resLote.ok) throw new Error(jsonLote.error || "Error al guardar");
      idLote = jsonLote.id_lote;
      setGuardado({ tipo: "exito", idLote: jsonLote.id_lote });
    } catch (err) {
      setGuardado({
        tipo: "error",
        mensaje: err instanceof Error ? err.message : "Error desconocido",
      });
    }

    // 2) Agente: clima real + motor de reglas agronómicas + explicación LLM
    setPasoCarga("El agente está analizando clima y suelo del lote...");
    let clima: ClimaDatos | null = null;
    let errorClima: string | undefined;
    let recomendacion: ResultadoAnalisis | null = null;
    try {
      const resAnalisis = await fetch("/api/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const jsonAnalisis = await resAnalisis.json();
      if (!resAnalisis.ok) {
        throw new Error(jsonAnalisis.error || "Error al analizar el lote");
      }
      clima = jsonAnalisis.clima as ClimaDatos;
      recomendacion = {
        lote_id: jsonAnalisis.lote_id,
        nombre: jsonAnalisis.nombre,
        cultivo: jsonAnalisis.cultivo,
        recomendacion: jsonAnalisis.recomendacion,
        alertas: jsonAnalisis.alertas ?? [],
      };
    } catch (err) {
      errorClima =
        err instanceof Error ? err.message : "No se pudo analizar el lote";
    }

    // 3) Resumen de 10 noticias (solo el párrafo)
    setPasoCarga(
      "Buscando noticias del sector y generando resumen (puede tardar ~1 min)..."
    );
    let resumenNoticias: string | null = null;
    let fuentesNoticias: Array<{ titulo: string; url: string }> | undefined;
    let errorNoticias: string | undefined;
    try {
      const resNoticias = await fetch("/api/noticias");
      const jsonNoticias = await resNoticias.json();
      if (!resNoticias.ok) {
        throw new Error(jsonNoticias.error || "Error de noticias");
      }
      resumenNoticias = jsonNoticias.resumen as string;
      fuentesNoticias = jsonNoticias.fuentes;
    } catch (err) {
      errorNoticias =
        err instanceof Error
          ? err.message
          : "No se pudo generar el resumen de noticias";
    }

    // 4) Mostrar la recomendación real del agente
    setResultado(recomendacion);

    // 5) Guardar todo y abrir la pestaña de resultados
    const payload: DatosResultados = {
      loteNombre: data.nombre || "Lote Registrado",
      cultivo: data.cultivo.toUpperCase(),
      latitud: data.latitud,
      longitud: data.longitud,
      clima,
      errorClima,
      resumenNoticias,
      fuentesNoticias,
      errorNoticias,
      recomendacion,
      idLote,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setLoading(false);
    setPasoCarga("");
    router.push("/demo/resultados");
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-emerald-950 overflow-hidden"
    >
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-0 w-96 h-96 rounded-full bg-green-400/15 blur-3xl -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-blob absolute -top-24 -right-24 w-96 h-96 bg-lime-400/15 rounded-full blur-3xl" />
        <div className="animate-blob delay-700 absolute top-1/2 -left-32 w-[26rem] h-[26rem] bg-green-500/20 rounded-full blur-3xl" />
        <div className="animate-blob delay-300 absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl" />
      </div>

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
          <div className="flex items-center gap-2">
            <Link
              href="/demo/resultados"
              className="text-xs font-semibold text-green-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-1.5 transition"
            >
              Ver resultados
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-green-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-1.5 transition"
            >
              ← Inicio
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative z-10 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center space-y-3">
          <span className="animate-fade-in animate-bounce-soft inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-200">
            Modo demostración
          </span>
          <h1 className="animate-fade-in delay-100 text-3xl md:text-4xl font-extrabold tracking-tight">
            Evalúa tu lote en{" "}
            <span className="text-gradient-animated">segundos</span> 🚜
          </h1>
          <p className="animate-fade-in delay-200 text-green-100/85 max-w-lg mx-auto text-sm md:text-base">
            Completa los datos, elige la ubicación en el mapa y recibe clima,
            noticias del sector y recomendación de siembra.
          </p>
        </div>
      </header>

      <main className="relative z-10 pb-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="animate-fade-in delay-300 max-w-2xl mx-auto rounded-3xl p-[3px] bg-gradient-to-br from-green-400/60 via-emerald-500/20 to-lime-400/50 shadow-2xl shadow-green-950/60">
            <LoteForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>

          {loading && (
            <div className="animate-fade-in flex flex-col items-center justify-center gap-3 bg-white/10 border border-white/15 backdrop-blur rounded-2xl p-6 text-green-100 text-sm text-center">
              <span className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold">{pasoCarga || "Procesando..."}</span>
              <span className="text-xs text-green-200/70">
                El resumen de noticias puede tardar hasta un minuto
              </span>
            </div>
          )}

          {guardado?.tipo === "exito" && !loading && (
            <div className="animate-fade-in max-w-2xl mx-auto flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-400/40 backdrop-blur rounded-2xl px-4 py-3 text-emerald-200 text-sm font-semibold">
              ✅ Lote guardado en la base de datos con ID #{guardado.idLote}
            </div>
          )}

          {guardado?.tipo === "error" && !loading && (
            <div className="animate-fade-in max-w-2xl mx-auto flex items-center justify-center gap-2 bg-rose-500/15 border border-rose-400/40 backdrop-blur rounded-2xl px-4 py-3 text-rose-200 text-sm font-semibold">
              ⚠️ No se pudo guardar el lote: {guardado.mensaje}
            </div>
          )}

          {resultado && !loading && (
            <div className="space-y-4">
              <SemaforoResultado resultado={resultado} />
              <div className="text-center">
                <Link
                  href="/demo/resultados"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-green-950 font-bold px-6 py-3 rounded-xl transition"
                >
                  Ver clima y noticias →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-green-200/60">
        AgroData SCZ — Plataforma de optimización de siembra 🌾
      </footer>
    </div>
  );
}
