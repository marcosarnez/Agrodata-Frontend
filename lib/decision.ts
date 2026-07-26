/**
 * Motor de decisión agronómica de AgroData SCZ.
 *
 * Evalúa condiciones de suelo (formulario) + clima (Open-Meteo) contra
 * umbrales por cultivo y produce un estado de semáforo determinista:
 *   - BLOQUEO   → NO_RECOMENDADO (ROJO)
 *   - PRECAUCION → PRECAUCION (AMARILLO)
 *   - todo OK   → OPTIMO (VERDE)
 *
 * Umbrales basados en literatura agronómica (guías FAO de cultivo,
 * manuales EMBRAPA de soja/maíz/sorgo y recomendaciones para el
 * trópico bajo de Santa Cruz, Bolivia).
 */

import type { ClimaDatos } from "@/lib/clima";

export type NivelFactor = "OK" | "PRECAUCION" | "BLOQUEO";

export interface FactorEvaluado {
  nombre: string;
  valor: string;
  nivel: NivelFactor;
  detalle: string;
}

export interface EntradaEvaluacion {
  cultivo: string; // "soja" | "maiz" | "sorgo" | "trigo"
  humedadSuelo?: number; // % medido en campo (opcional)
  phSuelo?: number; // opcional
  materiaOrganica?: string; // "Baja" | "Media" | "Alta"
}

export interface ResultadoReglas {
  estado: "OPTIMO" | "PRECAUCION" | "NO_RECOMENDADO";
  color: "VERDE" | "AMARILLO" | "ROJO";
  factores: FactorEvaluado[];
  alertas: Array<{ tipo: string; mensaje: string }>;
  /** Resumen numérico del clima usado en la decisión */
  indicadoresClima: {
    lluvia48h_mm: number;
    lluvia7d_mm: number;
    probLluviaMax48h_pct: number;
    tempSueloMedia48h_C: number;
    rafagaMax48h_kmh: number;
    humedadSueloModelo_pct: number | null;
  };
}

interface UmbralesCultivo {
  nombre: string;
  /** Rango óptimo de pH */
  phOptimo: [number, number];
  /** Fuera de este rango es bloqueo (requiere enmienda antes de sembrar) */
  phTolerable: [number, number];
  /** Rango óptimo de humedad de suelo (%) para siembra */
  humedadOptima: [number, number];
  /** Por debajo → precaución por suelo seco */
  humedadSecaWarn: number;
  /** Temp. de suelo mínima ideal para germinación (°C) */
  tempSueloIdeal: number;
  /** Por debajo de esta temp. de suelo la germinación falla → bloqueo */
  tempSueloMinima: number;
}

export const UMBRALES: Record<string, UmbralesCultivo> = {
  soja: {
    nombre: "Soja",
    phOptimo: [5.5, 7.0],
    phTolerable: [4.8, 8.0],
    humedadOptima: [20, 60],
    humedadSecaWarn: 15,
    tempSueloIdeal: 18,
    tempSueloMinima: 15,
  },
  maiz: {
    nombre: "Maíz",
    phOptimo: [5.8, 7.5],
    phTolerable: [5.0, 8.2],
    humedadOptima: [25, 60],
    humedadSecaWarn: 15,
    tempSueloIdeal: 12,
    tempSueloMinima: 10,
  },
  sorgo: {
    nombre: "Sorgo",
    phOptimo: [5.5, 8.2],
    phTolerable: [5.0, 8.8],
    humedadOptima: [20, 60],
    humedadSecaWarn: 12, // más tolerante a sequía
    tempSueloIdeal: 16,
    tempSueloMinima: 14,
  },
  trigo: {
    nombre: "Trigo",
    phOptimo: [5.5, 7.5],
    phTolerable: [5.0, 8.2],
    humedadOptima: [20, 60],
    humedadSecaWarn: 15,
    tempSueloIdeal: 10, // cultivo de invierno en SCZ
    tempSueloMinima: 7,
  },
};

// Umbrales climáticos comunes a todos los cultivos
const LLUVIA_48H_WARN_MM = 15; // lluvia moderada → precaución
const LLUVIA_48H_BLOQUEO_MM = 40; // lluvia fuerte → no sembrar
const HUMEDAD_SATURACION_PCT = 60; // suelo saturado → no sembrar
const SEQUIA_7D_MM = 5; // casi sin lluvia en la semana
const RAFAGA_WARN_KMH = 60; // viento fuerte complica labores
// Open-Meteo entrega humedad de suelo en m³/m³; ~0.45 se considera saturación
const SATURACION_VOLUMETRICA = 0.45;

function promedio(valores: number[]): number {
  if (!valores.length) return NaN;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function redondear(n: number, decimales = 1): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

/**
 * Aplica las reglas agronómicas y devuelve la decisión del semáforo
 * junto a todos los factores evaluados (transparencia de la decisión).
 */
export function evaluarCondiciones(
  entrada: EntradaEvaluacion,
  clima: ClimaDatos
): ResultadoReglas {
  const umbral = UMBRALES[entrada.cultivo.toLowerCase()] ?? UMBRALES.soja;
  const factores: FactorEvaluado[] = [];
  const alertas: Array<{ tipo: string; mensaje: string }> = [];

  // ---- Indicadores derivados del pronóstico ----
  const lluvia48h = redondear(
    (clima.daily.precipitation_sum[0] ?? 0) +
      (clima.daily.precipitation_sum[1] ?? 0)
  );
  const lluvia7d = redondear(
    clima.daily.precipitation_sum.reduce((a, b) => a + (b ?? 0), 0)
  );
  const probLluvia48h = Math.max(
    clima.daily.precipitation_probability_max[0] ?? 0,
    clima.daily.precipitation_probability_max[1] ?? 0
  );
  const tempSuelo48h = redondear(
    promedio(clima.hourly.soil_temperature_6cm.slice(0, 48))
  );
  const rafagaMax48h = redondear(
    Math.max(...clima.hourly.wind_gusts_10m.slice(0, 48))
  );

  // Humedad del modelo satelital (proxy si no hay medición de campo)
  const humedadVolumetrica = promedio(
    clima.hourly.soil_moisture_9_to_27cm.slice(0, 24)
  );
  const humedadModelo = Number.isNaN(humedadVolumetrica)
    ? null
    : redondear(
        Math.min(100, (humedadVolumetrica / SATURACION_VOLUMETRICA) * 100)
      );

  // ---- Factor: humedad del suelo ----
  const humedadEfectiva = entrada.humedadSuelo ?? humedadModelo ?? undefined;
  const fuenteHumedad =
    entrada.humedadSuelo !== undefined
      ? "medición de campo"
      : "modelo satelital Open-Meteo (9-27 cm)";

  if (humedadEfectiva !== undefined) {
    let nivel: NivelFactor = "OK";
    let detalle = `Dentro del rango óptimo (${umbral.humedadOptima[0]}–${umbral.humedadOptima[1]}%) para ${umbral.nombre.toLowerCase()}.`;

    if (humedadEfectiva > HUMEDAD_SATURACION_PCT) {
      nivel = "BLOQUEO";
      detalle = `Suelo saturado (>${HUMEDAD_SATURACION_PCT}%): alto riesgo de pudrición de semilla y compactación por maquinaria.`;
    } else if (humedadEfectiva < umbral.humedadSecaWarn) {
      nivel = "PRECAUCION";
      detalle = `Suelo muy seco (<${umbral.humedadSecaWarn}%): la germinación puede ser despareja sin lluvia próxima.`;
    } else if (humedadEfectiva < umbral.humedadOptima[0]) {
      nivel = "PRECAUCION";
      detalle = `Humedad por debajo del óptimo (${umbral.humedadOptima[0]}%).`;
    }

    factores.push({
      nombre: "Humedad del suelo",
      valor: `${redondear(humedadEfectiva)}% (${fuenteHumedad})`,
      nivel,
      detalle,
    });
  }

  if (entrada.humedadSuelo === undefined && humedadModelo !== null) {
    alertas.push({
      tipo: "INFO",
      mensaje: `Sin medición de humedad en campo: el agente usó el modelo satelital de Open-Meteo (${humedadModelo}%) como referencia.`,
    });
  }

  // ---- Factor: pH ----
  if (entrada.phSuelo !== undefined) {
    let nivel: NivelFactor = "OK";
    let detalle = `Dentro del rango óptimo (${umbral.phOptimo[0]}–${umbral.phOptimo[1]}) para ${umbral.nombre.toLowerCase()}.`;

    if (
      entrada.phSuelo < umbral.phTolerable[0] ||
      entrada.phSuelo > umbral.phTolerable[1]
    ) {
      nivel = "BLOQUEO";
      detalle = `pH fuera del rango tolerable (${umbral.phTolerable[0]}–${umbral.phTolerable[1]}): se requiere enmienda (encalado o yeso) antes de sembrar.`;
    } else if (
      entrada.phSuelo < umbral.phOptimo[0] ||
      entrada.phSuelo > umbral.phOptimo[1]
    ) {
      nivel = "PRECAUCION";
      detalle = `pH fuera del óptimo (${umbral.phOptimo[0]}–${umbral.phOptimo[1]}): puede limitar la disponibilidad de nutrientes.`;
    }

    factores.push({
      nombre: "pH del suelo",
      valor: String(entrada.phSuelo),
      nivel,
      detalle,
    });
  } else {
    alertas.push({
      tipo: "INFO",
      mensaje:
        "No se ingresó pH del suelo. Se recomienda un análisis de laboratorio para una evaluación completa.",
    });
  }

  // ---- Factor: lluvia próximas 48 h ----
  {
    let nivel: NivelFactor = "OK";
    let detalle = "No se prevén lluvias que impidan la siembra en 48 h.";
    if (lluvia48h > LLUVIA_48H_BLOQUEO_MM) {
      nivel = "BLOQUEO";
      detalle = `Se pronostican ${lluvia48h} mm en 48 h (>${LLUVIA_48H_BLOQUEO_MM} mm): riesgo de anegamiento y lavado de semilla.`;
    } else if (lluvia48h > LLUVIA_48H_WARN_MM) {
      nivel = "PRECAUCION";
      detalle = `Se pronostican ${lluvia48h} mm en 48 h: planificar la labor evitando las ventanas de lluvia.`;
    }
    factores.push({
      nombre: "Lluvia próximas 48 h",
      valor: `${lluvia48h} mm (prob. máx ${probLluvia48h}%)`,
      nivel,
      detalle,
    });
  }

  // ---- Factor: sequía semanal ----
  if (
    lluvia7d < SEQUIA_7D_MM &&
    humedadEfectiva !== undefined &&
    humedadEfectiva < umbral.humedadOptima[0]
  ) {
    factores.push({
      nombre: "Sequía próxima semana",
      valor: `${lluvia7d} mm en 7 días`,
      nivel: "PRECAUCION",
      detalle:
        "Suelo seco y sin lluvia significativa en el pronóstico semanal: riesgo de germinación despareja.",
    });
  }

  // ---- Factor: temperatura del suelo ----
  if (!Number.isNaN(tempSuelo48h)) {
    let nivel: NivelFactor = "OK";
    let detalle = `Adecuada para la germinación de ${umbral.nombre.toLowerCase()} (ideal ≥${umbral.tempSueloIdeal}°C).`;
    if (tempSuelo48h < umbral.tempSueloMinima) {
      nivel = "BLOQUEO";
      detalle = `Temperatura de suelo por debajo del mínimo (${umbral.tempSueloMinima}°C): la semilla no germinará bien. Posible surazo.`;
    } else if (tempSuelo48h < umbral.tempSueloIdeal) {
      nivel = "PRECAUCION";
      detalle = `Por debajo del ideal (${umbral.tempSueloIdeal}°C): germinación más lenta de lo normal.`;
    }
    factores.push({
      nombre: "Temperatura del suelo (6 cm)",
      valor: `${tempSuelo48h}°C promedio 48 h`,
      nivel,
      detalle,
    });
  }

  // ---- Factor: viento ----
  if (!Number.isNaN(rafagaMax48h) && rafagaMax48h > RAFAGA_WARN_KMH) {
    factores.push({
      nombre: "Ráfagas de viento",
      valor: `${rafagaMax48h} km/h máx en 48 h`,
      nivel: "PRECAUCION",
      detalle:
        "Ráfagas fuertes: complican la siembra de precisión y cualquier pulverización asociada.",
    });
  }

  // ---- Nota: materia orgánica ----
  if (entrada.materiaOrganica === "Baja") {
    alertas.push({
      tipo: "INFO",
      mensaje:
        "Materia orgánica baja (<1.5%): considerar abono verde o enmienda orgánica tras la campaña.",
    });
  }

  // ---- Decisión final ----
  const hayBloqueo = factores.some((f) => f.nivel === "BLOQUEO");
  const hayPrecaucion = factores.some((f) => f.nivel === "PRECAUCION");

  const estado = hayBloqueo
    ? "NO_RECOMENDADO"
    : hayPrecaucion
      ? "PRECAUCION"
      : "OPTIMO";
  const color = hayBloqueo ? "ROJO" : hayPrecaucion ? "AMARILLO" : "VERDE";

  // Factores problemáticos como alertas visibles en la UI
  for (const f of factores) {
    if (f.nivel !== "OK") {
      alertas.push({
        tipo: f.nivel === "BLOQUEO" ? "WARNING" : "PRECAUCION",
        mensaje: `${f.nombre} (${f.valor}): ${f.detalle}`,
      });
    }
  }

  return {
    estado,
    color,
    factores,
    alertas,
    indicadoresClima: {
      lluvia48h_mm: lluvia48h,
      lluvia7d_mm: lluvia7d,
      probLluviaMax48h_pct: probLluvia48h,
      tempSueloMedia48h_C: Number.isNaN(tempSuelo48h) ? 0 : tempSuelo48h,
      rafagaMax48h_kmh: Number.isNaN(rafagaMax48h) ? 0 : rafagaMax48h,
      humedadSueloModelo_pct: humedadModelo,
    },
  };
}

/**
 * Textos de respaldo (sin LLM) construidos a partir de los factores.
 * Garantizan que la demo nunca se quede sin recomendación.
 */
export function textosPorDefecto(
  cultivoNombre: string,
  reglas: ResultadoReglas
): { titulo: string; mensaje: string; accion_sugerida: string } {
  const problemas = reglas.factores.filter((f) => f.nivel !== "OK");
  const resumenProblemas = problemas
    .map((f) => `${f.nombre.toLowerCase()} (${f.valor})`)
    .join(", ");

  if (reglas.estado === "OPTIMO") {
    return {
      titulo: `Condiciones óptimas para sembrar ${cultivoNombre} 🌿`,
      mensaje: `Todos los factores evaluados (humedad, pH, lluvia, temperatura de suelo y viento) están dentro de los rangos recomendados para ${cultivoNombre.toLowerCase()} en la zona.`,
      accion_sugerida: `Puedes proceder con la siembra de ${cultivoNombre.toLowerCase()} en las próximas 48 horas.`,
    };
  }

  if (reglas.estado === "PRECAUCION") {
    return {
      titulo: `Sembrar ${cultivoNombre} con precaución ⚠️`,
      mensaje: `Hay factores fuera del rango óptimo: ${resumenProblemas}. La siembra es posible pero con riesgo de menor uniformidad.`,
      accion_sugerida:
        "Revisar los factores en amarillo y, si es posible, ajustar la fecha de siembra dentro de la semana.",
    };
  }

  return {
    titulo: `No se recomienda sembrar ${cultivoNombre} ahora 🚫`,
    mensaje: `Se detectaron condiciones limitantes: ${resumenProblemas}. Sembrar en estas condiciones compromete la germinación y la inversión.`,
    accion_sugerida:
      "Esperar a que las condiciones bloqueantes se normalicen y volver a evaluar el lote (3 a 5 días).",
  };
}
