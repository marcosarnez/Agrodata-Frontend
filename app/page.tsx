import Link from "next/link";
import Image from "next/image";
import { Leaf, Sparkle, glow } from "@/components/Decoraciones";

const features = [
  {
    icon: "🗺️",
    titulo: "Ubicación GPS del lote",
    descripcion:
      "Selecciona la ubicación exacta de tu lote en un mapa interactivo de Santa Cruz.",
    delay: "delay-100",
  },
  {
    icon: "🧪",
    titulo: "Análisis de suelo",
    descripcion:
      "Ingresa humedad, pH y materia orgánica para evaluar las condiciones reales de tu terreno.",
    delay: "delay-300",
  },
  {
    icon: "🚦",
    titulo: "Semáforo de siembra",
    descripcion:
      "Recibe una recomendación clara: verde para sembrar, amarillo con precaución o rojo para esperar.",
    delay: "delay-500",
  },
];

const stats = [
  { valor: "4", etiqueta: "Cultivos evaluados" },
  { valor: "48h", etiqueta: "Pronóstico climático" },
  { valor: "100%", etiqueta: "Decisiones con datos" },
];

const luciernagas = [
  { top: "18%", left: "12%", size: "w-2 h-2", delay: "delay-100" },
  { top: "30%", left: "22%", size: "w-1.5 h-1.5", delay: "delay-700" },
  { top: "12%", left: "78%", size: "w-2 h-2", delay: "delay-300" },
  { top: "38%", left: "88%", size: "w-1.5 h-1.5", delay: "delay-1000" },
  { top: "55%", left: "15%", size: "w-2.5 h-2.5", delay: "delay-500" },
  { top: "62%", left: "82%", size: "w-2 h-2", delay: "delay-200" },
  { top: "75%", left: "28%", size: "w-1.5 h-1.5", delay: "delay-300" },
  { top: "70%", left: "70%", size: "w-2 h-2", delay: "delay-700" },
  { top: "24%", left: "40%", size: "w-1.5 h-1.5", delay: "delay-500" },
  { top: "45%", left: "60%", size: "w-1.5 h-1.5", delay: "delay-100" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-emerald-800 text-white flex flex-col overflow-hidden">
      {/* BLOBS DE FONDO */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-blob absolute -top-24 -left-24 w-96 h-96 bg-green-500/25 rounded-full blur-3xl" />
        <div className="animate-blob delay-1000 absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-lime-400/15 rounded-full blur-3xl" />
        <div className="animate-blob delay-500 absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
      </div>

      {/* DECORACIONES FLOTANTES (SVG) */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden="true"
      >
        {/* Hojas luminosas */}
        <Leaf
          className={`animate-float absolute top-[12%] left-[7%] w-16 h-16 text-lime-400/70 ${glow}`}
        />
        <Leaf
          className={`animate-float-slow delay-500 absolute top-[20%] right-[8%] w-20 h-20 text-emerald-300/70 -scale-x-100 rotate-12 ${glow}`}
        />
        <Leaf
          className={`animate-float delay-1000 absolute top-[58%] left-[5%] w-12 h-12 text-green-300/60 -rotate-12 ${glow}`}
        />
        <Leaf
          className={`animate-float-slow delay-300 absolute top-[64%] right-[6%] w-14 h-14 text-lime-300/60 -scale-x-100 ${glow}`}
        />
        <Leaf
          className={`animate-float delay-700 absolute bottom-[22%] left-[16%] w-10 h-10 text-emerald-400/50 rotate-45 ${glow}`}
        />
        <Leaf
          className={`animate-float-slow delay-200 absolute top-[8%] left-[42%] w-9 h-9 text-green-300/50 rotate-[160deg] ${glow}`}
        />

        {/* Destellos */}
        <Sparkle
          className={`animate-twinkle delay-200 absolute top-[26%] left-[30%] w-5 h-5 text-lime-200 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-700 absolute top-[16%] right-[26%] w-4 h-4 text-emerald-200 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-1000 absolute top-[52%] right-[18%] w-6 h-6 text-lime-200 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-300 absolute bottom-[30%] left-[24%] w-4 h-4 text-green-200 ${glow}`}
        />
        <Sparkle
          className={`animate-twinkle delay-500 absolute top-[40%] left-[10%] w-3 h-3 text-emerald-100 ${glow}`}
        />

        {/* Luciérnagas parpadeantes */}
        {luciernagas.map((p, i) => (
          <span
            key={i}
            className={`animate-twinkle ${p.delay} ${p.size} absolute rounded-full bg-lime-300 shadow-[0_0_12px_4px_rgba(163,230,53,0.55)]`}
            style={{ top: p.top, left: p.left }}
          />
        ))}

        {/* Partículas que suben desde el suelo */}
        <span
          className="animate-rise absolute bottom-[8%] left-[35%] w-1.5 h-1.5 rounded-full bg-emerald-200/80 shadow-[0_0_10px_3px_rgba(52,211,153,0.5)]"
        />
        <span
          className="animate-rise delay-1000 absolute bottom-[5%] left-[55%] w-2 h-2 rounded-full bg-lime-200/80 shadow-[0_0_10px_3px_rgba(163,230,53,0.5)]"
        />
        <span
          className="animate-rise delay-500 absolute bottom-[10%] left-[75%] w-1.5 h-1.5 rounded-full bg-green-200/80 shadow-[0_0_10px_3px_rgba(74,222,128,0.5)]"
        />
        <span
          className="animate-rise delay-300 absolute bottom-[6%] left-[20%] w-1.5 h-1.5 rounded-full bg-lime-100/80 shadow-[0_0_10px_3px_rgba(163,230,53,0.5)]"
        />
      </div>

      {/* HERO */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        {/* LOGO */}
        <div className="animate-fade-in animate-float-slow relative mb-6">
          <div
            className="absolute inset-0 rounded-full bg-green-400/30 blur-2xl scale-110"
            aria-hidden="true"
          />
          {/* Anillo orbital girando */}
          <div
            className="animate-spin-slow absolute -inset-4 rounded-full border-2 border-dashed border-green-400/40"
            aria-hidden="true"
          >
            <span className="absolute -top-1 left-1/2 w-2.5 h-2.5 rounded-full bg-lime-300 shadow-[0_0_10px_3px_rgba(163,230,53,0.8)]" />
            <span className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_2px_rgba(52,211,153,0.8)]" />
          </div>
          <Image
            src="/agrodata-logo.png"
            alt="Logo de AgroData SCZ: una planta mitad hoja natural, mitad circuito de datos"
            width={160}
            height={160}
            priority
            className="relative rounded-full ring-2 ring-green-400/40 shadow-2xl shadow-green-950/60"
          />
        </div>

        <span className="animate-fade-in animate-bounce-soft inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-green-200 mb-6 backdrop-blur">
          🌱 AgroTech · Santa Cruz, Bolivia
        </span>

        <h1 className="animate-fade-in delay-100 text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          AgroData <span className="text-gradient-animated">SCZ</span>
        </h1>

        <p className="animate-fade-in delay-200 mt-6 max-w-2xl text-base md:text-lg text-green-100/90 leading-relaxed">
          La plataforma inteligente que te dice{" "}
          <span className="font-bold text-white">cuándo sembrar y cuándo esperar</span>.
          Evaluamos las condiciones de suelo y clima de tu lote para proteger tu
          inversión desde el primer día.
        </p>

        {/* BOTÓN PLAY DEMO */}
        <Link
          href="/demo"
          className="animate-fade-in delay-300 animate-pulse-glow group mt-10 inline-flex items-center gap-3 bg-green-500 hover:bg-green-400 text-green-950 font-black text-lg px-10 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-950 text-green-400 group-hover:bg-green-900 group-hover:scale-110 transition">
            ▶
          </span>
          Probar Demo
        </Link>

        <p className="animate-fade-in delay-500 mt-4 text-xs text-green-200/70">
          Sin registro · Datos de simulación · Gratis
        </p>

        {/* ESTADÍSTICAS */}
        <div className="animate-fade-in delay-700 mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {stats.map((s) => (
            <div key={s.etiqueta} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-green-300">
                {s.valor}
              </div>
              <div className="text-xs uppercase tracking-wider text-green-100/70 mt-1">
                {s.etiqueta}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEPARADOR ONDULADO */}
      <div className="relative z-10 -mb-1" aria-hidden="true">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 md:h-14 text-white/5"
          preserveAspectRatio="none"
        >
          <path
            d="M0 30 C240 60 480 0 720 30 C960 60 1200 0 1440 30 L1440 60 L0 60 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* CARACTERÍSTICAS */}
      <section className="relative z-10 px-4 pb-16 bg-white/5">
        <div className="max-w-5xl mx-auto pt-12">
          <h2 className="text-center text-sm font-bold uppercase tracking-[0.3em] text-green-300 mb-8">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.titulo}
                className={`animate-fade-in ${f.delay} group bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur hover:bg-white/10 hover:border-green-400/40 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300 inline-block">
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-1">{f.titulo}</h3>
                <p className="text-sm text-green-100/80 leading-relaxed">
                  {f.descripcion}
                </p>
              </div>
            ))}
          </div>

          {/* CTA SECUNDARIO */}
          <div className="text-center mt-12">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-green-300 hover:text-green-200 font-bold text-sm border-b-2 border-green-400/40 hover:border-green-300 pb-0.5 transition"
            >
              Comenzar mi primera evaluación →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-green-200/60 bg-white/5">
        AgroData SCZ — Optimización de siembra con datos de suelo y clima 🌱
      </footer>
    </main>
  );
}
