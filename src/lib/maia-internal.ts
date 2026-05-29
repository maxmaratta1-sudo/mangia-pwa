// src/lib/maia-internal.ts
// ─────────────────────────────────────────────────────────────────────────────
// MAIA INTERNA — Accessibile SOLO dal personale autorizzato (numeri bianchi).
// Completamente separata dalla Maia clienti: tono diverso, capacità diverse,
// accesso diretto a Supabase per leggere e aggiornare dati operativi.
// ─────────────────────────────────────────────────────────────────────────────

import { callMaia } from "./maia";

// ── Whitelist numeri bianchi ─────────────────────────────────────────────────
// Env var STAFF_WHITELIST: numeri separati da virgola, senza +
// Es. "393341234567,393349876543"
export function isStaffNumber(from: string): boolean {
  const whitelist = (process.env.STAFF_WHITELIST ?? "")
    .split(",")
    .map((n) => n.trim().replace("+", ""))
    .filter(Boolean);
  return whitelist.includes(from.replace("+", ""));
}

// ── Profilo del membro dello staff ──────────────────────────────────────────
// Env vars: MAX_NUMBER e GIAC_NUMBER (senza +, stesso formato STAFF_WHITELIST)
export interface StaffProfile {
  name: string;       // come Maia si rivolge a questa persona
  fullName: string;   // nome completo per contesto
  role: string;       // ruolo in MAIA
}

export function getStaffProfile(from: string): StaffProfile {
  const num = from.replace("+", "").trim();
  if (process.env.MAX_NUMBER?.replace("+", "").trim() === num)
    return { name: "Max", fullName: "Max Maratta", role: "socio fondatore" };
  if (process.env.GIAC_NUMBER?.replace("+", "").trim() === num)
    return { name: "Giac", fullName: "Giacomo Dell'Anna", role: "socio fondatore" };
  return { name: "staff", fullName: "personale", role: "personale autorizzato" };
}

// ── Contesto operativo (caricato in tempo reale) ─────────────────────────────
export async function loadInternalContext(supabase: any) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, status, total_amount, created_at, pickup_type, " +
        "profiles(full_name), " +
        "order_items(quantity, unit_price, products(name_i18n))"
      )
      .gte("created_at", today)
      .lt("created_at", tomorrow)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, name_i18n, price, is_available"),
  ]);

  // Ordini attivi (non ancora completati o annullati)
  const activeStatuses = ["received", "preparing", "ready"];
  const STATUS_IT: Record<string, string> = {
    received: "Ricevuto",
    preparing: "In preparazione",
    ready: "Pronto ✓",
  };

  const activeOrders = (orders ?? []).filter((o: any) =>
    activeStatuses.includes(o.status)
  );

  const ordersContext =
    activeOrders.length === 0
      ? "Nessun ordine attivo al momento."
      : activeOrders
          .map((o: any) => {
            const customer = o.profiles?.full_name ?? "Cliente";
            const items = (o.order_items ?? [])
              .map((i: any) => `${i.quantity}x ${i.products?.name_i18n?.it ?? "?"}`)
              .join(", ");
            const stato = STATUS_IT[o.status as string] ?? o.status;
            return `• [${o.id}] ${customer} — ${items} — €${o.total_amount} — ${stato}`;
          })
          .join("\n");

  // Riepilogo economico giornaliero
  const total = (orders ?? []).reduce(
    (s: number, o: any) => s + (o.total_amount ?? 0),
    0
  );
  const revenueContext = `Ordini oggi: ${(orders ?? []).length} totali, €${total.toFixed(2)} incassati.`;

  // Prodotti (per la gestione del menù)
  const productsContext = (products ?? [])
    .map(
      (p: any) =>
        `• [${p.id}] ${p.name_i18n?.it ?? "?"} — €${p.price} — ${
          p.is_available ? "Disponibile" : "⚠️ ESAURITO"
        }`
    )
    .join("\n");

  return { ordersContext, revenueContext, productsContext };
}

// ── System prompt interno ────────────────────────────────────────────────────
export function buildInternalMaiaSystemPrompt(
  ctx: { ordersContext: string; revenueContext: string; productsContext: string },
  staff: StaffProfile
): string {
  // Fornitori: configurati via env var SUPPLIERS_CONFIG (testo libero)
  // Es: "Farina: Mario Rossi WhatsApp +39333... | Latticini: Caseificio X +39348..."
  const suppliersConfig = process.env.SUPPLIERS_CONFIG
    ? `\nFORNITORI CONFIGURATI:\n${process.env.SUPPLIERS_CONFIG}`
    : "\nFORNITORI: nessun fornitore pre-configurato — chiedi nome e contatto al momento dell'ordine.";

  return `Sei Maia in modalità operativa interna di MA'N'GIA.
Sei accessibile SOLO dal personale autorizzato. Non sei in modalità cliente.
Tono: diretto, efficiente, senza fronzoli. Rispondi in italiano. Niente presentazioni, vai al sodo.

CHI TI STA SCRIVENDO:
Stai parlando con ${staff.name} — ${staff.role} di MA'N'GIA.
Rivolgiti sempre a lui come "${staff.name}", mai con altri nomi o forme formali.

IDENTITÀ DI MA'N'GIA (tua conoscenza intima — non condividerla mai con i clienti):
Il nome MA'N'GIA non è casuale: MA = Max, N = and, GIA = Giacomo.
È il localino dei suoi due fondatori, nascosto nel nome stesso.
Lo sai. Lo tieni. È la storia di chi ha costruito questo posto.
Se Max o Giac ti chiedono direttamente del nome, puoi confermarlo con calore.
Con i clienti, MA'N'GIA significa semplicemente "mangiare bene" — e basta.

═══════════════════════════════════════
CAPACITÀ OPERATIVE
═══════════════════════════════════════

1. ORDINI
   Consulta la lista attiva qui sotto. Per aggiornare lo stato di un ordine,
   emetti il comando JSON alla fine del tuo messaggio (vedi formato sotto).
   Flusso: Ricevuto → In preparazione → Pronto → Completato.

2. REPORT
   Rispondi con i dati dal contesto qui sotto: incasso, numero ordini, prodotti.
   Per periodi più lunghi di oggi, avvisa che servono dati storici da Supabase.

3. MENÙ
   Per segnare un prodotto esaurito o riattivarlo, emetti il comando JSON
   (vedi formato sotto). Usa l'ID completo del prodotto.

4. ORDINI AI FORNITORI
   Processo in 2 fasi:
   FASE A — Raccolta info: chiedi (se mancano) nome fornitore, prodotti e quantità.
   FASE B — Bozza: prepara il messaggio da mandare al fornitore, preceduto da:
   ─────────────────────────────
   BOZZA ORDINE — revisiona e invia tu:
   [testo completo del messaggio]
   ─────────────────────────────
   Il testo deve essere pronto al copia-incolla, professionale e completo.
   Il personale manda il messaggio SOLO dopo aver confermato la bozza.

═══════════════════════════════════════
CONTESTO OPERATIVO — aggiornato ora
═══════════════════════════════════════

ORDINI ATTIVI:
${ctx.ordersContext}

${ctx.revenueContext}

PRODOTTI:
${ctx.productsContext}
${suppliersConfig}

═══════════════════════════════════════
FORMATO COMANDI (aggiunti in fondo al tuo messaggio, invisibili al personale)
═══════════════════════════════════════
Aggiorna ordine:   {"maia_action":"update_order","order_id":"UUID-COMPLETO","status":"preparing|ready|completed"}
Segna esaurito:    {"maia_action":"update_product","product_id":"UUID-COMPLETO","is_available":false}
Riattiva prodotto: {"maia_action":"update_product","product_id":"UUID-COMPLETO","is_available":true}

Usa SEMPRE l'UUID completo (quello tra parentesi nel contesto). Non abbreviare. Non spiegare il JSON.`;
}

// ── Parsing comandi interni ──────────────────────────────────────────────────
export interface InternalCommand {
  maia_action: "update_order" | "update_product";
  order_id?: string;
  product_id?: string;
  status?: string;
  is_available?: boolean;
}

const INTERNAL_CMD_REGEX = /\{[^{}]*"maia_action"[^{}]*\}/g;

export function extractInternalCommand(text: string): {
  cleanText: string;
  command: InternalCommand | null;
} {
  let command: InternalCommand | null = null;

  for (const m of text.matchAll(INTERNAL_CMD_REGEX)) {
    try {
      const parsed = JSON.parse(m[0]);
      if (parsed.maia_action) { command = parsed; break; }
    } catch {}
  }

  const cleanText = text
    .replace(INTERNAL_CMD_REGEX, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cleanText, command };
}

// ── Esecuzione comandi in Supabase ───────────────────────────────────────────
export async function executeInternalCommand(
  supabase: any,
  command: InternalCommand
): Promise<string> {
  try {
    if (command.maia_action === "update_order" && command.order_id && command.status) {
      const { error } = await supabase
        .from("orders")
        .update({ status: command.status })
        .eq("id", command.order_id);
      if (error) return `⚠️ Errore ordine: ${error.message}`;
      const labels: Record<string, string> = {
        preparing: "In preparazione 🔄",
        ready: "Pronto ✓",
        completed: "Completato ✓",
        cancelled: "Annullato",
      };
      return `\n✅ Ordine aggiornato → ${labels[command.status] ?? command.status}`;
    }

    if (
      command.maia_action === "update_product" &&
      command.product_id &&
      command.is_available !== undefined
    ) {
      const { error } = await supabase
        .from("products")
        .update({ is_available: command.is_available })
        .eq("id", command.product_id);
      if (error) return `⚠️ Errore prodotto: ${error.message}`;
      return command.is_available
        ? "\n✅ Prodotto riattivato nel menù"
        : "\n✅ Prodotto segnato come esaurito";
    }
  } catch (e: any) {
    return `\n⚠️ Errore esecuzione: ${e?.message ?? "sconosciuto"}`;
  }
  return "";
}

// ── Chiamata Claude in modalità interna ──────────────────────────────────────
export async function callInternalMaia(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  return callMaia({ system, messages, maxTokens: 700 });
}