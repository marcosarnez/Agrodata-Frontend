# Contrato JSON — API AgroData SCZ

> **Este documento es la única fuente de verdad** entre Frontend y Backend
> (según el plan de sprints, lo custodia el Integrador/PM).
> Cualquier cambio debe acordarse aquí ANTES de tocar código, y debe
> actualizarse también `data/mockResponse.json` en el frontend.

## Endpoint

```
POST {API_URL}/analizar
Content-Type: application/json
```

`{API_URL}` = URL pública del backend en Render (pendiente de entregar al frontend).

---

## 1. Petición (lo que el Frontend enviará)

Datos que salen del formulario de registro de lote:

```json
{
  "nombre": "Lote Norte 4",
  "superficie": 10,
  "cultivo": "soja",
  "humedad_suelo": 25,
  "ph_suelo": 6.5,
  "materia_organica": "Media",
  "latitud": -17.7833,
  "longitud": -63.1821
}
```

| Campo | Tipo | Valores posibles / notas |
|---|---|---|
| `nombre` | string | Nombre o código del lote |
| `superficie` | number | Hectáreas (mínimo 0.1) |
| `cultivo` | string | `"soja"` \| `"maiz"` \| `"sorgo"` \| `"trigo"` |
| `humedad_suelo` | number | Porcentaje 0–100 |
| `ph_suelo` | number | 0–14 |
| `materia_organica` | string | `"Baja"` \| `"Media"` \| `"Alta"` (opcional) |
| `latitud` | number | Del clic en el mapa (zona SCZ) |
| `longitud` | number | Del clic en el mapa (zona SCZ) |

---

## 2. Respuesta (lo que el Backend debe devolver)

**Debe tener EXACTAMENTE esta estructura** (es la que la UI ya renderiza):

```json
{
  "lote_id": "LOTE-101",
  "nombre": "Lote Norte 4",
  "cultivo": "Soja",
  "recomendacion": {
    "estado": "OPTIMO",
    "color": "VERDE",
    "titulo": "Condiciones óptimas para la siembra 🌿",
    "mensaje": "El porcentaje de humedad (25%) y el pH (6.5) están en los rangos idóneos. No se prevén lluvias extremas en las próximas 48 horas.",
    "accion_sugerida": "Puedes proceder con la siembra de Soja inmediatamente."
  },
  "alertas": [
    {
      "tipo": "INFO",
      "mensaje": "Materia orgánica en nivel medio. Se sugiere compost o enmienda orgánica tras la cosecha."
    }
  ]
}
```

| Campo | Tipo | Valores posibles / notas |
|---|---|---|
| `lote_id` | string | Identificador generado por el backend |
| `nombre` | string | Eco del nombre enviado |
| `cultivo` | string | Nombre del cultivo evaluado |
| `recomendacion.estado` | string | `"OPTIMO"` \| `"PRECAUCION"` \| `"NO_RECOMENDADO"` (exacto, en mayúsculas) |
| `recomendacion.color` | string | `"VERDE"` \| `"AMARILLO"` \| `"ROJO"` (exacto, en mayúsculas — controla el semáforo) |
| `recomendacion.titulo` | string | Título corto del resultado |
| `recomendacion.mensaje` | string | Explicación para el usuario |
| `recomendacion.accion_sugerida` | string | Acción recomendada |
| `alertas` | array | Puede ser `[]` vacío, nunca `null` |
| `alertas[].tipo` | string | Ej. `"INFO"`, `"WARNING"` |
| `alertas[].mensaje` | string | Texto de la nota complementaria |

### Reglas importantes

1. Los valores de `estado` y `color` van en MAYÚSCULAS y sin tildes, tal cual la tabla. El frontend hace un mapeo directo de `color` → estilos del semáforo.
2. `alertas` siempre presente: si no hay alertas, devolver `[]`.
3. Errores: si algo falla, devolver un HTTP 4xx/5xx con `{ "detail": "mensaje" }` (formato por defecto de FastAPI). El frontend mostrará un mensaje de error genérico.
4. CORS: el backend debe permitir el origen de Netlify y `http://localhost:3000`.

---

## Checklist de confirmación (cada rol marca lo suyo)

- [ ] **Backend**: confirmo que `/analizar` recibirá la petición de la sección 1
- [ ] **Backend**: confirmo que la respuesta tendrá la estructura de la sección 2
- [ ] **Backend**: CORS habilitado para localhost:3000 y el dominio de Netlify
- [ ] **Datos**: los polígonos de Pailón/Okinawa devuelven datos para estas coordenadas
- [ ] **PM**: este documento queda como versión oficial del contrato
- [ ] **Frontend**: `data/mockResponse.json` coincide con la sección 2
