import type { ClimaDatos } from "@/lib/clima";
import type { ResultadoAnalisis } from "@/components/SemaforoResultado";

export type DatosResultados = {
  loteNombre: string;
  cultivo: string;
  latitud: number;
  longitud: number;
  clima: ClimaDatos | null;
  errorClima?: string;
  resumenNoticias: string | null;
  fuentesNoticias?: Array<{ titulo: string; url: string }>;
  errorNoticias?: string;
  recomendacion: ResultadoAnalisis | null;
  idLote?: number;
};

export const STORAGE_KEY = "agrodata_resultados";
