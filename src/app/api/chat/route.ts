import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function POST(req: NextRequest) {
  const { messages, locale = "it" } = await req.json();

  const supabase = await createClient();
  const [{ data: products }, { data: categories }, { data: promotions }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name_i18n, description_i18n, price, category_id, is_available")
        .eq("is_available", true),
      supabase.from("categories").select("id, name_i18n, slug"),
      supabase
        .from("promotions")
        .select("title_i18n, description_i18n, discount_type, discount_value")
        .eq("is_active", true),
    ]);

  const menuContext = (products ?? [])
    .map((p: any) => {
      const name = p.name_i18n?.[locale] ?? p.name_i18n?.it ?? "";
      const desc = p.description_i18n?.[locale] ?? p.description_i18n?.it ?? "";
      return `- ${name} (ID: ${p.id}): ${desc} — €${p.price}`;
    })
    .join("\n");

  const promoContext =
    (promotions ?? [])
      .map((pr: any) => {
        const title = pr.title_i18n?.[locale] ?? pr.title_i18n?.it ?? "";
        const desc = pr.description_i18n?.[locale] ?? pr.description_i18n?.it ?? "";
        return `- ${title}: ${desc}`;
      })
      .join("\n") || "Nessuna promozione attiva al momento.";

  const systemPrompts: Record<string, string> = {
    it: `Sei l'assistente AI di MA'N'GIA — Al Localino, una pinsa street food a lievitazione naturale. 
Sei cordiale, entusiasta e conosci perfettamente il menù.

MENÙ DISPONIBILE:
${menuContext}

PROMOZIONI ATTIVE:
${promoContext}

ISTRUZIONI:
- Rispondi SEMPRE in italiano
- Se il cliente vuole ordinare un prodotto, rispondi con un JSON speciale nel formato: {"action":"add_to_cart","product_id":"ID","product_name":"NOME","price":PREZZO}
- Metti il JSON alla fine del messaggio, dopo il testo
- Suggerisci abbinamenti quando appropriato
- Se chiede degli allergeni o ingredienti, rispondi con precisione basandoti sul menù
- Sii breve e diretto, massimo 3-4 righe per risposta
- Non inventare prodotti che non sono nel menù`,
    es: `Eres el asistente AI de MA'N'GIA — Al Localino, una pinsa street food de fermentación natural.
Eres amable, entusiasta y conoces perfectamente el menú.

MENÚ DISPONIBLE:
${menuContext}

PROMOCIONES ACTIVAS:
${promoContext}

INSTRUCCIONES:
- Responde SIEMPRE en español
- Si el cliente quiere pedir un producto, responde con un JSON especial en el formato: {"action":"add_to_cart","product_id":"ID","product_name":"NOMBRE","price":PRECIO}
- Pon el JSON al final del mensaje, después del texto
- Sugiere combinaciones cuando sea apropiado
- Si pregunta sobre alérgenos o ingredientes, responde con precisión basándote en el menú
- Sé breve y directo, máximo 3-4 líneas por respuesta`,
    en: `You are the AI assistant of MA'N'GIA — Al Localino, a natural leavening pinsa street food.
You are friendly, enthusiastic and know the menu perfectly.

AVAILABLE MENU:
${menuContext}

ACTIVE PROMOTIONS:
${promoContext}

INSTRUCTIONS:
- Always respond in English
- If the customer wants to order a product, respond with a special JSON in the format: {"action":"add_to_cart","product_id":"ID","product_name":"NAME","price":PRICE}
- Put the JSON at the end of the message, after the text
- Suggest pairings when appropriate
- If asked about allergens or ingredients, respond accurately based on the menu
- Be brief and direct, maximum 3-4 lines per response`,
  };

  const systemPrompt = systemPrompts[locale] ?? systemPrompts.it;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  let cartAction = null;
  const jsonMatch = text.match(/\{[^}]*"action"\s*:\s*"add_to_cart"[^}]*\}/);
  if (jsonMatch) {
    try { cartAction = JSON.parse(jsonMatch[0]); } catch {}
  }

  const cleanText = text.replace(/\{[^}]*"action"\s*:\s*"add_to_cart"[^}]*\}/, "").trim();

  return NextResponse.json({ text: cleanText, cartAction });
}