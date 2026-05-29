export default function TermsPage() {
  return (
    <div className="px-4 pt-6 pb-10 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-6">
        Condizioni d'uso
      </h1>
      <div className="prose text-graphite-600 text-sm leading-relaxed space-y-4">
        <p>Utilizzando l'app MA'N'GIA accetti le seguenti condizioni d'uso.</p>
        <h2 className="font-display font-bold text-graphite-800 text-lg">Servizio</h2>
        <p>MA'N'GIA offre un servizio di ordinazione online per ritiro in sede presso Piazza Unità d'Italia 11, Lanciano (CH).</p>
        <h2 className="font-display font-bold text-graphite-800 text-lg">Pagamenti</h2>
        <p>I pagamenti sono gestiti in modo sicuro tramite Stripe. MA'N'GIA non conserva i dati delle carte di credito.</p>
        <h2 className="font-display font-bold text-graphite-800 text-lg">Programma fedeltà</h2>
        <p>I punti fedeltà sono personali e non trasferibili. MA'N'GIA si riserva il diritto di modificare il programma fedeltà.</p>
        <h2 className="font-display font-bold text-graphite-800 text-lg">Contatti</h2>
        <p>Per qualsiasi richiesta: mai3llapinse@gmail.com</p>
      </div>
    </div>
  );
}