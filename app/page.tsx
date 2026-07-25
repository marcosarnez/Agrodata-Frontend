"use client";

import { useState } from "react";
import LoteForm, { LoteFormData } from "@/components/LoteForm";
import SemaforoResultado, { ResultadoAnalisis } from "@/components/SemaforoResultado";
import mockData from "@/data/mockResponse.json";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);

  const handleFormSubmit = (data: LoteFormData) => {
    setLoading(true);
    setResultado(null);

    // Simulación de respuesta del backend
    setTimeout(() => {
      setLoading(false);
      
      const simData: ResultadoAnalisis = {
        ...(mockData as ResultadoAnalisis),
        nombre: data.nombre || "Lote Registrado",
        cultivo: data.cultivo.toUpperCase(),
      };

      // Ejemplo de regla de simulación
      if (data.humedadSuelo > 60) {
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
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            AgroData <span className="text-green-600">SCZ</span> 🌱
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto text-sm md:text-base">
            Plataforma inteligente para la optimización de la siembra mediante evaluación de suelo y clima
          </p>
        </header>

        <LoteForm onSubmit={handleFormSubmit} isLoading={loading} />
        <SemaforoResultado resultado={resultado} />
      </div>
    </main>
  );
}