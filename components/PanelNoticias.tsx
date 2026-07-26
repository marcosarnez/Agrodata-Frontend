"use client";

interface Fuente {
  titulo: string;
  url: string;
}

interface PanelNoticiasProps {
  resumen: string;
  fuentes?: Fuente[];
}

export default function PanelNoticias({ resumen, fuentes }: PanelNoticiasProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Resumen del sector agrícola
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Generado a partir de 10 noticias recientes de Santa Cruz, Bolivia
        </p>
      </div>

      <div className="relative rounded-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-amber-100 p-5 md:p-6 shadow-sm">
        <div className="absolute -top-3 left-5 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
          Resumen IA
        </div>
        <p className="text-slate-800 text-sm md:text-[15px] leading-relaxed mt-2">
          {resumen}
        </p>
      </div>

      {fuentes && fuentes.length > 0 && (
        <details className="group rounded-xl border border-slate-200 bg-white overflow-hidden">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 flex items-center justify-between">
            <span>Fuentes ({fuentes.length})</span>
            <span className="text-slate-400 group-open:rotate-180 transition">
              ▼
            </span>
          </summary>
          <ul className="border-t border-slate-100 divide-y divide-slate-50 px-4 py-2">
            {fuentes.map((f, i) => (
              <li key={f.url} className="py-2">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-700 hover:text-emerald-900 hover:underline font-medium"
                >
                  {i + 1}. {f.titulo}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
