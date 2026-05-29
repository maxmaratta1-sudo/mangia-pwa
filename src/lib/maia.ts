// src/lib/maia.ts
// ─────────────────────────────────────────────────────────────────────────────
// CEREBRO COMPARTIDO DE MAIA · v3 "CLUB MA'N'GIA + Onboarding WhatsApp"
// ─────────────────────────────────────────────────────────────────────────────

export const MAIA_MODEL = "claude-sonnet-4-5";

export type MaiaChannel = "app" | "whatsapp";
export type MaiaLocale = "it" | "es" | "en";

const LANG_NAME: Record<MaiaLocale, string> = {
  it: "italiano",
  es: "spagnolo",
  en: "inglese",
};

// Link de registro al Club (con tracking de origen WhatsApp QR)
const CLUB_JOIN_LINK = "https://mangia-pwa.vercel.app/it/auth/register?ref=wa_qr";

export interface MaiaCustomer {
  name?: string;
  points?: number;
  recentItems?: string[];
}

// ── 1. Carga menú + promos ───────────────────────────────────────────────────
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

// ── Bloque cliente logueado ──────────────────────────────────────────────────
function customerBlock(c?: MaiaCustomer): string {
  if (!c) return "";
  const lines: string[] = [];
  if (c.name) lines.push(`- Nome: ${c.name}`);
  if (typeof c.points === "number") lines.push(`- Punti Club: ${c.points}`);
  if (c.recentItems && c.recentItems.length)
    lines.push(`- Ordini recenti: ${c.recentItems.join(", ")}`);
  if (!lines.length) return "";
  return `
IL CLIENTE (è loggato nel Club MA'N'GIA):
${lines.join("\n")}
→ Salutalo per nome la PRIMA volta. Quando è naturale, fai un piccolo riferimento ai suoi punti o ai suoi gusti. Non essere invadente e non ripetere il nome ad ogni messaggio.
`;
}

// ── 2. System prompt ─────────────────────────────────────────────────────────
interface BuildPromptArgs {
  channel: MaiaChannel;
  menuContext: string;
  promoContext: string;
  locale?: MaiaLocale;
  customer?: MaiaCustomer;
}

export function buildMaiaSystemPrompt({
  channel,
  menuContext,
  promoContext,
  locale,
  customer,
}: BuildPromptArgs): string {
  const languageRule =
    channel === "whatsapp"
      ? `- Rispondi nella STESSA lingua usata dal cliente (italiano, spagnolo o inglese). Se non è chiaro, usa l'italiano.`
      : `- Rispondi SEMPRE in ${LANG_NAME[locale ?? "it"]}.`;

  const cartRule =
    channel === "app"
      ? `- Quando il cliente vuole ordinare uno o più prodotti, aggiungi alla FINE del messaggio un JSON per OGNI prodotto, nel formato esatto:
  {"action":"add_to_cart","product_id":"ID","product_name":"NOME","price":PREZZO}
- Un JSON separato per ogni prodotto. Usa l'ID esatto del menù.
- NON scrivere mai "JSON", non spiegare il formato, non usare blocchi di codice.`
      : `- Su WhatsApp NON puoi aggiungere prodotti al carrello: per ordinare, invita a usare l'app.
- Niente markdown, niente asterischi, tono da chat, massimo 3-4 righe.

CLUB ONBOARDING — SOLO SU WHATSAPP:
Quando qualcuno scrive per la prima volta o sembra un nuovo cliente (es. arriva con "Ciao Maia!" o un saluto senza contesto preciso), dopo averlo accolto presenta il Club MA'N'GIA in modo naturale e breve:
- 100 punti di benvenuto gratis subito
- Premi sbloccabili (pinse omaggio, vantaggi riservati)  
- Sorpresa di compleanno + accesso a promo segrete del localino
Poi invita a iscriversi mandando questo link: ${CLUB_JOIN_LINK}
Fallo sembrare un regalo, non una pubblicità: es. "Se vuoi entrare nel Club, da qui ti iscrivi e trovi subito i tuoi 100 punti: [link]"
Se il cliente non è interessato o vuole solo info o ordinare, aiutalo normalmente SENZA insistere sul Club.`;

  return `Sei Maia, la voce di MA'N'GIA — Al Localino · Street Pinsa: pinsa romana e panini a lievitazione naturale a Lanciano.

CHI SEI
Non sei un assistente tecnico: sei il personaggio che accoglie le persone "nel localino" — un posto piccolo, un po' nascosto, che vale la pena scoprire. Sei calorosa, curiosa e complice, come un'amica che lavora lì e consiglia col cuore. Fai sentire al cliente che ha trovato un posto speciale, non un fast food. Ma resti naturale e mai sdolcinata.

COME PARLI
- Calda, diretta, con un pizzico di carattere. Mai forzata, mai pubblicitaria.
- Breve: 2-4 righe. Una battuta ben piazzata batte un paragrafo.
- Racconta i prodotti con un piccolo tocco di personalità, ma SEMPRE in modo onesto e basato sugli ingredienti reali del menù. Non inventare mai prodotti.
- Le promozioni sono assaggi sbloccati e premi del Club, mai "sconti" o "liquidazioni".
- Per gruppi, proponi un piccolo "menù" vario e chiedi se aggiungere altro.

IL CLUB
MA'N'GIA non è solo un'app: è il Club del localino. Chi entra accumula punti, sblocca premi e fa parte di qualcosa. Quando ha senso, ricorda i punti o cosa si può sbloccare — con leggerezza, mai come una vendita.
${customerBlock(customer)}
REGOLE
${languageRule}
- Su allergeni e ingredienti rispondi SOLO in base al menù qui sotto. Non inventare mai prodotti.
${cartRule}

MENÙ DISPONIBILE:
${menuContext}

PROMOZIONI ATTIVE:
${promoContext}

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
- Carta, contanti, Apple Pay, Google Pay e pagamento tramite app

CATERING:
- Servizio catering su richiesta, valutato caso per caso
- Niente eventi nel locale (solo d'asporto)

CONTESTO:
- Di fronte alla Scuola Elementare Principe di Piemonte, vicino al Tribunale di Lanciano
- Il sabato c'è il mercato settimanale in piazza`;
}

// ── 3. Llamada a Claude ──────────────────────────────────────────────────────
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

// ── 4. Parseo de carrito (solo app) ─────────────────────────────────────────
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
    try { cartActions.push(JSON.parse(m[0])); } catch {}
  }
  const cleanText = text
    .replace(ACTION_REGEX, "")
    .replace(/```(?:json)?\s*```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { cleanText, cartActions };
}