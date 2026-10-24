import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { PhoneOutgoing, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingRows } from '@/components/FormBits';
import {
  TIPI_IMPIANTO,
  fmtData,
  fmtDataLunga,
  giorniMancanti,
  testoScadenza,
  tonoScadenza,
  oggiISO,
  isBackoffice,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

const GRUPPI = [
  { id: 'scadute', label: 'Scadute', test: (g) => g < 0 },
  { id: 'settimana', label: 'Entro 7 giorni', test: (g) => g >= 0 && g <= 7 },
  { id: 'mese', label: 'Entro 30 giorni', test: (g) => g > 7 && g <= 30 },
  { id: 'oltre', label: 'Oltre 30 giorni', test: (g) => g > 30 },
];

const ScadenzarioPage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [impianti, setImpianti] = useState(null);
  const [chiamate, setChiamate] = useState([]);
  const [tab, setTab] = useState('controllo');

  const load = () => {
    pb.collection('impianti')
      .getFullList({ expand: 'cliente', sort: 'scadenza_controllo' })
      .then(setImpianti)
      .catch((e) => toast.error(e.message));
    pb.collection('chiamate')
      .getFullList({ filter: "stato != 'eseguito'", fields: 'id,impianto,tipo_scadenza' })
      .then(setChiamate)
      .catch(() => {});
  };

  useEffect(load, []);

  const field = tab === 'controllo' ? 'scadenza_controllo' : 'scadenza_bollino';

  const righe = useMemo(() => {
    if (!impianti) return [];
    return impianti
      .filter((i) => i[field])
      .map((i) => ({ imp: i, data: i[field], giorni: giorniMancanti(i[field]) }))
      .sort((a, b) => a.giorni - b.giorni);
  }, [impianti, field]);

  const inLista = (impiantoId) =>
    chiamate.some((c) => c.impianto === impiantoId && c.tipo_scadenza === tab);

  const aggiungiChiamata = async (r) => {
    try {
      await pb.collection('chiamate').create({
        cliente: r.imp.cliente,
        impianto: r.imp.id,
        tipo_scadenza: tab,
        data_scadenza: r.data,
        stato: 'da_chiamare',
        priorita: r.giorni < 0 ? 'alta' : r.giorni <= 7 ? 'media' : 'bassa',
      });
      toast.success(`${r.imp.expand?.cliente?.nome} aggiunto alla lista chiamate`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Report giornaliero: scadenze di oggi (entrambi i tipi)
  const oggi = useMemo(() => {
    if (!impianti) return [];
    const out = [];
    for (const i of impianti) {
      if (giorniMancanti(i.scadenza_controllo) === 0)
        out.push(`• CONTROLLO — ${i.expand?.cliente?.nome}: ${TIPI_IMPIANTO[i.tipo]} ${i.marca} ${i.modello} (${i.expand?.cliente?.telefono || 'senza telefono'})`);
      if (giorniMancanti(i.scadenza_bollino) === 0)
        out.push(`• BOLLINO — ${i.expand?.cliente?.nome}: ${TIPI_IMPIANTO[i.tipo]} ${i.marca} ${i.modello} (${i.expand?.cliente?.telefono || 'senza telefono'})`);
    }
    return out;
  }, [impianti]);

  const mailto = () => {
    const oggiTxt = fmtDataLunga(oggiISO());
    const body =
      oggi.length > 0
        ? oggi.join('\n')
        : 'Nessuna scadenza in data odierna.';
    return `mailto:?subject=${encodeURIComponent(`Report scadenze del ${oggiTxt}`)}&body=${encodeURIComponent(
      `Report giornaliero scadenzario — ${oggiTxt}\n\n${body}\n\n— Flowline, Termoidraulica Gibboni S.r.l.`,
    )}`;
  };

  return (
    <div>
      <Helmet>
        <title>Scadenzario — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Scadenzario automatico degli impianti: controllo periodico e bollino gestiti separatamente, con report giornaliero e invio alla lista chiamate."
        />
      </Helmet>

      <PageHeader caption="Fase 1 · Scadenzario automatico" title="Scadenzario">
        <Button asChild variant="outline">
          <a href={mailto()}>
            <Mail className="mr-1 h-4 w-4" /> Report di oggi via email
          </a>
        </Button>
      </PageHeader>

      {/* Report giornaliero */}
      <div className="mb-8 border-l-4 border-accent bg-white px-5 py-4">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Report giornaliero · {fmtDataLunga(oggiISO())}
        </p>
        {oggi.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nessuna scadenza in data odierna.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {oggi.map((r, idx) => (
              <li key={idx} className="font-mono text-xs leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tabs controllo / bollino */}
      <div className="mb-6 flex gap-px bg-border">
        {[
          { id: 'controllo', label: 'Controllo periodico' },
          { id: 'bollino', label: 'Bollino' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] transition-colors sm:flex-none sm:px-8',
              tab === t.id ? 'bg-navy text-navy-foreground' : 'bg-white text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!impianti && <LoadingRows label="Caricamento scadenze…" />}
      {impianti && righe.length === 0 && (
        <EmptyState title="Nessuna scadenza registrata" hint="Compila le date di scadenza nelle schede impianto." />
      )}

      {impianti &&
        GRUPPI.map((g) => {
          const rows = righe.filter((r) => g.test(r.giorni));
          if (rows.length === 0) return null;
          return (
            <section key={g.id} className="mb-8">
              <h2 className="mb-2 flex items-baseline gap-3 border-b border-border pb-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {g.label}
                </span>
                <span className="font-mono text-xs font-semibold text-accent">{rows.length}</span>
              </h2>
              <ul className="divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.imp.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        <Link to={`/clienti/${r.imp.cliente}`} className="hover:text-accent">
                          {r.imp.expand?.cliente?.nome}
                        </Link>
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {TIPI_IMPIANTO[r.imp.tipo]} · {r.imp.marca} {r.imp.modello} · {r.imp.expand?.cliente?.telefono || 'senza telefono'}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{fmtData(r.data)}</span>
                    <StatusBadge label={testoScadenza(r.data)} tone={tonoScadenza(r.data)} />
                    {backoffice &&
                      (inLista(r.imp.id) ? (
                        <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-emerald-700">
                          <Check className="h-3.5 w-3.5" /> In lista
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => aggiungiChiamata(r)}>
                          <PhoneOutgoing className="mr-1 h-3.5 w-3.5" /> Chiama
                        </Button>
                      ))}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
};

export default ScadenzarioPage;
