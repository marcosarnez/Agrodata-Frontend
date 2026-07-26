/**
 * Pipeline Exa → Firecrawl → Gemini.
 * Devuelve SOLO el resumen de las 10 noticias (un párrafo).
 */

export const maxDuration = 120;

const NUM_NOTICIAS = 10;
const MAX_CHARS_POR_NOTICIA = 4000;

async function buscarNoticiasExa(apiKey: string) {
  const respuesta = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "noticias sobre cultivos y agricultura en Santa Cruz, Bolivia",
      numResults: NUM_NOTICIAS,
      type: "auto",
      category: "news",
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Exa falló (${respuesta.status})`);
  }

  const data = await respuesta.json();
  const resultados = data.results ?? [];
  if (!resultados.length) {
    throw new Error("Exa no devolvió resultados");
  }
  return resultados as Array<{ title?: string; url: string }>;
}

async function scrapearFirecrawl(url: string, apiKey: string) {
  try {
    const respuesta = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    if (!respuesta.ok) return "";
    const data = await respuesta.json();
    return (data.data?.markdown as string) || "";
  } catch {
    return "";
  }
}

async function resumirConGemini(
  noticias: Array<{ titulo: string; url: string; markdown: string }>,
  apiKey: string
) {
  const bloques = noticias.map((n, i) => {
    const contenido =
      n.markdown.slice(0, MAX_CHARS_POR_NOTICIA) ||
      "(no se pudo obtener el contenido)";
    return `--- NOTICIA ${i + 1} ---\nTítulo: ${n.titulo}\nURL: ${n.url}\n\n${contenido}`;
  });

  const prompt =
    "A continuación tienes el contenido de varias noticias sobre cultivos y " +
    "agricultura en Santa Cruz, Bolivia. Escribe UN SOLO PÁRRAFO en español " +
    "que resuma los puntos más importantes de todas las noticias en conjunto. " +
    "No uses listas, títulos ni saltos de línea: solo un párrafo continuo.\n\n" +
    bloques.join("\n\n");

  const respuesta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!respuesta.ok) {
    const errText = await respuesta.text();
    throw new Error(`Gemini falló (${respuesta.status}): ${errText.slice(0, 200)}`);
  }

  const data = await respuesta.json();
  const texto =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  if (!texto) throw new Error("Gemini no devolvió texto");
  return texto;
}

export async function GET() {
  const EXA_API_KEY = process.env.EXA_API_KEY;
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!EXA_API_KEY || !FIRECRAWL_API_KEY || !GEMINI_API_KEY) {
    return Response.json(
      { error: "Faltan claves API (EXA, FIRECRAWL o GEMINI) en .env.local" },
      { status: 500 }
    );
  }

  try {
    const resultados = await buscarNoticiasExa(EXA_API_KEY);

    const noticias = [];
    for (const r of resultados) {
      const markdown = await scrapearFirecrawl(r.url, FIRECRAWL_API_KEY);
      noticias.push({
        titulo: r.title || "(sin título)",
        url: r.url,
        markdown,
      });
    }

    const resumen = await resumirConGemini(noticias, GEMINI_API_KEY);

    return Response.json({
      resumen,
      fuentes: noticias.map((n) => ({ titulo: n.titulo, url: n.url })),
    });
  } catch (error) {
    console.error("Error noticias:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar el resumen de noticias",
      },
      { status: 500 }
    );
  }
}
