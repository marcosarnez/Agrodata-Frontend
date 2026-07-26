# AgroData SCZ — Proyecto completo para compartir

## Cómo levantarlo (Windows / Mac / Linux)

1. Descomprimir este zip
2. Entrar a la carpeta
3. Copiar .env.example a .env.local y pegar las claves
4. Instalar dependencias:
   `ash
   npm install
   `
5. Arrancar:
   `ash
   npm run dev
   `
6. Abrir http://localhost:3000
7. Demo: http://localhost:3000/demo
8. Diapositivas: http://localhost:3000/diapositivas.html

## Requisitos
- Node.js 18+ (recomendado 20+)
- npm
- Claves en .env.local (DB + Exa + Firecrawl + OpenRouter)
- PostgreSQL accesible con la tabla lotes_agricolas (si falla el guardado del lote, el análisis igual puede correr)

## Qué incluye (últimas mejoras)
- Motor de decisión agronómica (lib/decision.ts)
- Endpoint del agente POST /api/analizar
- Validación de agua en el mapa (color OSM + satélite)
- Bloqueo por humedad de aire fuera de rango
- Diapositivas del pitch

## Nota de seguridad
Este paquete NO incluye .env.local ni 
ode_modules.
Las claves las debe configurar quien reciba el zip.

Fecha: 26 julio 2026
