# 🌱 AgroData SCZ — Agente agroclimático para decidir cuándo sembrar

**Demo en vivo:** https://agrodata-frontend-mfw4.vercel.app

## El problema

Un productor de Santa Cruz que siembra en el momento equivocado pierde la
inversión de toda la campaña: semilla podrida por suelo saturado, germinación
despareja por sequía, o pérdida de la ventana por un surazo. Hoy esa decisión
se toma por intuición o consultando fuentes dispersas (pronóstico general,
grupos de WhatsApp, experiencia propia).

## La solución: un agente sobre datos

AgroData SCZ es un **agente sobre datos agroclimáticos**: el productor marca su
lote en el mapa, ingresa lo que sabe de su suelo, y el agente:

1. **Percibe** — obtiene el pronóstico real de 7 días para las coordenadas
   exactas del lote (Open-Meteo: lluvia, temperatura y humedad de suelo,
   viento, evapotranspiración) y busca noticias del agro cruceño
   (Exa → Firecrawl → LLM).
2. **Decide** — un motor de reglas agronómicas por cultivo (soja, maíz, sorgo,
   trigo) evalúa cada factor y determina el semáforo:
   🟢 sembrar · 🟡 precaución · 🔴 esperar. Si el productor no midió la humedad,
   el agente usa el modelo satelital de suelo como proxy y lo declara.
3. **Explica y actúa** — un LLM redacta la justificación citando los números
   concretos y entrega una acción para las próximas 48–72 h. Todo se guarda en
   PostgreSQL con el historial del lote.

La decisión del semáforo es **determinista y auditable** (reglas con umbrales
publicados abajo); la IA se usa para explicar la decisión y resumir el contexto
de noticias, nunca para inventar el veredicto.

## Setup en 4 pasos

```bash
# 1. Clonar e instalar
git clone <repo-url> && cd agrodata-frontend && npm install

# 2. Crear .env.local con las claves
#    DATABASE_URL=postgres://...       (PostgreSQL, tabla lotes_agricolas)
#    EXA_API_KEY=...                   (búsqueda de noticias)
#    FIRECRAWL_API_KEY=...             (scraping de noticias)
#    OPENROUTER_API_KEY=...            (LLM para explicación y resumen)

# 3. Levantar
npm run dev

# 4. Abrir http://localhost:3000 y pulsar "Probar Demo"
```

## Arquitectura

```
Formulario (mapa Leaflet + datos de suelo)
        │
        ▼
POST /api/analizar  ←── el agente
        │
        ├─ 1. Open-Meteo (pronóstico 7 días en las coords del lote)
        ├─ 2. lib/decision.ts (motor de reglas por cultivo → semáforo)
        ├─ 3. OpenRouter LLM (redacta justificación con los datos)
        └─ 4. Respuesta: recomendación + factores + alertas + clima
        
POST /api/lotes      → guarda el lote en PostgreSQL
GET  /api/noticias   → Exa → Firecrawl → LLM (resumen del agro SCZ)
```

## Umbrales agronómicos del motor de decisión

Basados en guías FAO de cultivo, manuales EMBRAPA y recomendaciones para el
trópico bajo de Santa Cruz. Definidos en `lib/decision.ts`.

| Factor | Soja | Maíz | Sorgo | Trigo |
|---|---|---|---|---|
| pH óptimo | 5.5–7.0 | 5.8–7.5 | 5.5–8.2 | 5.5–7.5 |
| pH tolerable (fuera → 🔴) | 4.8–8.0 | 5.0–8.2 | 5.0–8.8 | 5.0–8.2 |
| Humedad óptima siembra | 20–60% | 25–60% | 20–60% | 20–60% |
| Alerta suelo seco | <15% | <15% | <12% | <15% |
| Temp. suelo ideal germinación | ≥18 °C | ≥12 °C | ≥16 °C | ≥10 °C |
| Temp. suelo mínima (bajo → 🔴) | 15 °C | 10 °C | 14 °C | 7 °C |

Comunes a todos los cultivos: humedad >60% = suelo saturado (🔴), lluvia 48 h
>40 mm (🔴) o >15 mm (🟡), ráfagas >60 km/h (🟡), <5 mm de lluvia en 7 días con
suelo seco (🟡).

**Regla de decisión:** cualquier factor en nivel BLOQUEO → 🔴 NO_RECOMENDADO;
si no, cualquier PRECAUCIÓN → 🟡; si todo OK → 🟢 ÓPTIMO.

## Caso de uso

- **Quién:** productores de soja, maíz, sorgo y trigo en Santa Cruz, Bolivia
  (Pailón, Okinawa, Cuatro Cañadas, San Julián…).
- **Qué resuelve:** la decisión de mayor riesgo económico de la campaña
  (¿siembro ahora o espero?) con datos del lote exacto, no del departamento.
- **Por qué Bolivia:** el este cruceño concentra la producción nacional de
  granos y no existe una herramienta local que combine pronóstico
  georreferenciado, criterios agronómicos por cultivo y contexto de noticias
  del sector en una sola recomendación accionable.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · Leaflet ·
PostgreSQL (`pg`) · Open-Meteo · Exa · Firecrawl · OpenRouter ·
Deploy en Vercel.
