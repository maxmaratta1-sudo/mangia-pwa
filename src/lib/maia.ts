// src/lib/maia.ts
// ─────────────────────────────────────────────────────────────────────────────
// CEREBRO COMPARTIDO DE MAIA
// Única fuente de verdad para la app (api/chat) y WhatsApp (api/whatsapp).
// Personalidad, info del local, carga de menú, llamada a Claude y parseo del
// carrito viven AQUÍ. Para cambiar a Maia (p. ej. el mood "Club MA'N'GIA"),
// se edita solo buildMaiaSystemPrompt() y aplica a todos los canales.
// ─────────────────────────────────────────────────────────────────────────────

export const MAIA_MODEL = "claude-sonnet-4-5";

export type MaiaChannel = "app" | "whatsapp";
export type MaiaLocale = "it" | "es" | "en";

const LANG_NAME: Record<MaiaLocale, string> = {
  it: "italiano",
  es: "spagnolo",
  en: "inglese",
};

// ── 1. Carga menú + promociones desde Supabase ───────────────────────────────
// Recibe un cliente Supabase ya creado por la route (que es quien tiene cookies).
export async function loadMaiaContext(supabase: any, locale: MaiaLocale = "it") {
  const [{ data: products }, { data: promotions }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name_i18n, description_i18n, price, is_available")
      .eq("is_available", true),
    supabase
      .from("promotions")
      .select("title_i18n, description_i18n, is_active")
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

  return { menuContext, promoContext };
}

// ── 2. Construye el system prompt (LA personalidad de Maia, una sola vez) ─────
interface BuildPromptArgs {
  channel: MaiaChannel;
  menuContext: string;
  promoContext: string;
  // app: fuerza este idioma. whatsapp: ignóralo, Maia refleja el idioma del cliente.
  locale?: MaiaLocale;
}

export function buildMaiaSystemPrompt({
  channel,
  menuContext,
  promoContext,
  locale,
}: BuildPromptArgs): string {
  // Regla de idioma: la app fuerza el idioma de la UI; WhatsApp refleja al cliente.
  const languageRule =
    channel === "whatsapp"
      ? `- Rispondi nella STESSA lingua usata dal cliente (italiano, spagnolo o inglese). Se non è chiaro, usa l'italiano.`
      : `- Rispondi SEMPRE in ${LANG_NAME[locale ?? "it"]}.`;

  // Regla de carrito: SOLO en la app. En WhatsApp no se puede añadir al carrito.
  const cartRule =
    channel === "app"
      ? `- Quando il cliente vuole ordinare uno o più prodotti, aggiungi alla FINE del messaggio un JSON per OGNI prodotto, nel formato esatto:
  {"action":"add_to_cart","product_id":"ID","product_name":"NOME","price":PREZZO}
- Un JSON separato per ogni prodotto (per un gruppo di 8, otto JSON). Usa l'ID esatto del menù.
- NON scrivere mai la parola "JSON", non spiegare il formato e non usare blocchi di codice: il cliente non deve vedere nulla di tecnico.`
      : `- Su WhatsApp NON puoi aggiungere prodotti al carrello: per ordinare invita il cliente ad aprire l'app su mangia-pwa.vercel.app.
- Niente markdown, niente asterischi, tono informale da chat, massimo 3 righe.`;

  return `Sei Maia, la voce di MA'N'GIA — Al Localino · Street Pinsa: pinsa romana e panini a lievitazione naturale a Lanciano.
Non sei un assistente qualsiasi: sei il personaggio che accoglie il cliente "nel localino". Sei calorosa, curiosa ed entusiasta, e conosci il menù alla perfezione. Fai sentire al cliente che ha scoperto un posto speciale, non un fast food.

MENÙ DISPONIBILE:
${menuContext}

PROMOZIONI ATTIVE:
${promoContext}

REGOLE:
${languageRule}
- Sii breve e diretta (max 3-4 righe), calda ma mai forzata.
- Suggerisci abbinamenti quando ha senso; per gruppi proponi un piccolo "menù" con più prodotti e chiedi se vogliono aggiungere altro.
- Su allergeni/ingredienti rispondi SOLO in base al menù qui sopra. Non inventare mai prodotti che non esistono.
${cartRule}

INFORMAZIONI SUL LOCALE:
- Nome: MA'N'GIA — Al Localino · Street Pinsa
- Indirizzo: Piazza Unità d'Italia 11, Lanciano (CH)
- Solo d'asporto — non ci sono posti a sedere
- Parcheggio: ampio parcheggio gratuito davanti al locale

ORARI:
- Lunedì-Venerdì: 11:30-14:30 e 17:00-21:00
- Sabato: 08:00-14:00 (giorno di mercato in piazza!)
- Domenica: chiuso

PAGAMENTI:
- Carta di credito/debito, contanti, Apple Pay, Google Pay e pagamento tramite app

CATERING:
- Servizio catering su richiesta, valutato caso per caso
- Niente eventi nel locale (solo d'asporto)

CONTESTO:
- Di fronte alla Scuola Elementare Principe di Piemonte, vicino al Tribunale di Lanciano e agli uffici del centro
- Il sabato c'è il mercato settimanale in piazza`;
}

// ── 3. Llamada a Claude — un único punto de entrada ──────────────────────────
export async function callMaia({
  system,
  messages,
  maxTokens = 1000,
}: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MAIA_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const data = await res.json();
  return (
    (data.content ?? [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("\n") || ""
  );
}

// ── 4. Parseo de acciones de carrito (lo usa solo la app) ─────────────────────
export interface CartAction {
  action: string;
  product_id: string;
  product_name: string;
  price: number;
}

const ACTION_REGEX = /\{[^{}]*"action"\s*:\s*"add_to_cart"[^{}]*\}/g;

export function extractCartActions(text: string): {
  cleanText: string;
  cartActions: CartAction[];
} {
  const cartActions: CartAction[] = [];
  for (const m of text.matchAll(ACTION_REGEX)) {
    try {
      cartActions.push(JSON.parse(m[0]));
    } catch {
      /* JSON malformado: lo ignoramos */
    }
  }

  const cleanText = text
    .replace(ACTION_REGEX, "")          // quita TODOS los JSON
    .replace(/```(?:json)?\s*```/g, "") // quita bloques de código vacíos
    .replace(/\n{3,}/g, "\n\n")          // colapsa saltos de línea
    .trim();

  return { cleanText, cartActions };
}