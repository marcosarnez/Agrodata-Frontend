/**
 * POST /api/analizar — El agente de AgroData SCZ.
 *
 * Pipeline: percibe (formulario + clima Open-Meteo) → decide (motor de
 * reglas agronómicas en lib/decision.ts) → explica (LLM vía OpenRouter
 * redacta la justificación citando los datos) → entrega resultado
 * accionable con el contrato de docs/CONTRATO_API.md.
 *
 * La decisión del semáforo es SIEMPRE determinista (reglas). El LLM solo
 * redacta la explicación; si falla, hay textos de respaldo.
 */

import { extraerClimaPorGps } from "@/lib/clima";
import {
  evaluarCondiciones,
  textosPorDefecto,
  UMBRALES,
  type ResultadoReglas,
} from "@/lib/decision";

export const maxDuration = 60;

const OPENROUTER_MODEL = "qwen/qwen3-coder";

interface AnalizarPayload {
  nombre: string;
  superficie: number;
  cultivo: string;
  humedadSuelo?: number;
  phSuelo?: number;
  materiaOrganica?: string;
  latitud: number;
  longitud: number;
}

interface TextosRecomendacion {
  titulo: string;
  mensaje: string;
  accion_sugerida: string;
}

async function redactarConLLM(
  payload: AnalizarPayload,
  cultivoNombre: string,
  reglas: ResultadoReglas,
  apiKey: string
): Promise<TextosRecomendacion | null> {
  const hechos = {
    cultivo: cultivoNombre,
    zona: "Santa Cruz, Bolivia",
    decision_del_semaforo: reglas.estado,
    factores_evaluados: reglas.factores,
    indicadores_clima: reglas.indicadoresClima,
    datos_del_productor: {
      humedad_suelo_pct: payload.humedadSuelo ?? "no medida",
      ph_suelo: payload.phSuelo ?? "no medido",
      materia_organica: payload.materiaOrganica ?? "no indicada",
      superficie_ha: payload.superficie,
    },
  };

  const prompt =
    "Eres el agente agronómico de AgroData SCZ (Santa Cruz, Bolivia). " +
    "Un motor de reglas ya decidió el estado de siembra; tu trabajo es " +
    "explicárselo al productor citando los números concretos. " +
    "NO cambies la decisión.\n\n" +
    `HECHOS (JSON):\n${JSON.stringify(hechos, null, 2)}\n\n` +
    "Responde SOLO con un JSON válido, sin markdown, con esta forma exacta:\n" +
    '{"titulo": "máx 60 caracteres, con un emoji al final", ' +
    '"mensaje": "2-3 frases citando los valores medidos y del pronóstico que sustentan la decisión", ' +
    '"accion_sugerida": "1-2 frases: qué hacer en las próximas 48-72 horas, concreto y accionable"}';

  try {
    const respuesta = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://agrodata-frontend-mfw4.vercel.app",
          "X-OpenRouter-Title": "AgroData SCZ",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
          temperature: 0.3,
        }),
      }
    );
    if (!respuesta.ok) return null;

    const data = await respuesta.json();
    const texto: string = data.choices?.[0]?.message?.content?.trim() || "";
    // Tolerar respuestas envueltas en ```json ... ```
    const jsonCrudo = texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(jsonCrudo) as Partial<TextosRecomendacion>;
    if (!parsed.titulo || !parsed.mensaje || !parsed.accion_sugerida) {
      return null;
    }
    return parsed as TextosRecomendacion;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let payload: AnalizarPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  if (
    !payload.cultivo ||
    typeof payload.latitud !== "number" ||
    typeof payload.longitud !== "number"
  ) {
    return Response.json(
      { error: "Faltan campos obligatorios (cultivo, latitud, longitud)" },
      { status: 400 }
    );
  }

  try {
    // 1) PERCIBIR: pronóstico real para las coordenadas del lote
    const clima = await extraerClimaPorGps(payload.latitud, payload.longitud);

    // 2) DECIDIR: motor de reglas agronómicas por cultivo
    const reglas = evaluarCondiciones(
      {
        cultivo: payload.cultivo,
        humedadSuelo: payload.humedadSuelo,
        phSuelo: payload.phSuelo,
        materiaOrganica: payload.materiaOrganica,
      },
      clima
    );

    const cultivoNombre =
      UMBRALES[payload.cultivo.toLowerCase()]?.nombre ?? payload.cultivo;

    // 3) EXPLICAR: el LLM redacta la justificación con los datos
    const apiKey = process.env.OPENROUTER_API_KEY;
    let textos: TextosRecomendacion | null = null;
    if (apiKey) {
      textos = await redactarConLLM(payload, cultivoNombre, reglas, apiKey);
    }
    if (!textos) {
      textos = textosPorDefecto(cultivoNombre, reglas);
    }

    // 4) ENTREGAR: contrato de docs/CONTRATO_API.md + datos de soporte
    return Response.json({
      lote_id: `LOTE-${Date.now().toString().slice(-6)}`,
      nombre: payload.nombre || "Lote Registrado",
      cultivo: cultivoNombre.toUpperCase(),
      recomendacion: {
        estado: reglas.estado,
        color: reglas.color,
        titulo: textos.titulo,
        mensaje: textos.mensaje,
        accion_sugerida: textos.accion_sugerida,
      },
      alertas: reglas.alertas,
      // Datos de soporte para la UI (transparencia de la decisión)
      factores: reglas.factores,
      indicadores_clima: reglas.indicadoresClima,
      clima,
    });
  } catch (error) {
    console.error("Error en /api/analizar:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo analizar el lote",
      },
      { status: 500 }
    );
  }
}
