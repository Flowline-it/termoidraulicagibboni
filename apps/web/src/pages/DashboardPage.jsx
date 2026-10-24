import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, CalendarClock, CalendarDays, Briefcase } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CountUp from '@/components/CountUp';
import StatusBadge from '@/components/StatusBadge';
import { PageHeader } from '@/components/Layout';
import { LoadingRows } from '@/components/FormBits';
import {
  fmtData,
  fmtDataLunga,
  giorniMancanti,
  testoScadenza,
  tonoScadenza,
  STATI_CHIAMATA,
  TONO_CHIAMATA,
  TIPI_INTERVENTO,
  STATI_COMMESSA,
  TONO_COMMESSA,
  TIPI_IMPIANTO,
  fmtEuro,
  toDate,
} from '@/lib/constants';

const SectionTitle = ({ icon: Icon, children, to }) => (
  <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
    <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-4 w-4 text-accent" strokeWidth={1.8} />
      {children}
    </h2>
    {to && (
      <Link
        to={to}
        className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
      >
        Apri <ArrowRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    Promise.all([
      pb.collection('impianti').getFullList({ expand: 'cliente' }),
      pb.collection('chiamate').getFullList({ expand: 'cliente,impianto' }),
      pb.collection('interventi').getFullList({ expand: 'cliente,tecnico', sort: 'data' }),
      pb.collection('commesse').getFullList({ expand: 'cliente' }),
      pb.collection('rapportini').getFullList(),
    ])
      .then((r) =>
        on &&
        setData({
          impianti: r[0],
          chiamate: r[1],
          interventi: r[2],
          commesse: r[3],
          rapportini: r[4],
        }),
      )
      .catch((e) => on && setError(e.message));
    return () => {
      on = false;
    };
  }, []);

  const scadenze = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (const imp of data.impianti) {
      for (const [field, tipo] of [
        ['scadenza_controllo', 'Controllo'],
        ['scadenza_bollino', 'Bollino'],
      ]) {
        const g = giorniMancanti(imp[field]);
        if (g !== null && g <= 30)
          out.push({ key: imp.id + field, imp, tipo, data: imp[field], giorni: g });
      }
    }
    return out.sort((a, b) => a.giorni - b.giorni);
  }, [data]);

  const daChiamare = useMemo(
    () => (data ? data.chiamate.filter((c) => c.stato === 'da_chiamare') : []),
    [data],
  );

  const prossimi = useMemo(() => {
    if (!data) return [];
    return data.interventi
      .filter(
        (i) =>
          (i.stato === 'programmato' || i.stato === 'in_corso') &&
          giorniMancanti(i.data) !== null &&
          giorniMancanti(i.data) >= 0,
      )
      .slice(0, 6);
  }, [data]);

  const commesseAttive = useMemo(
    () =>
      data
        ? data.commesse.filter((c) => c.stato === 'aperta' || c.stato === 'in_corso')
        : [],
    [data],
  );

  const { incassatoMese, daIncassare } = useMemo(() => {
    if (!data) return { incassatoMese: 0, daIncassare: 0 };
    const now = new Date();
    let inc = 0;
    let daInc = 0;
    for (const r of data.rapportini) {
      const d = toDate(r.data);
      if (r.pagamento === 'da_incassare') daInc += r.importo || 0;
      else if (d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
        inc += r.importo || 0;
    }
    return { incassatoMese: inc, daIncassare: daInc };
  }, [data]);

  const saluto = () => {
    const h = new Date().getHours();
    if (h < 13) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  return (
    <div>
      <Helmet>
        <title>Dashboard — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Indicatori operativi, scadenze imminenti, clienti da contattare, interventi programmati e andamento delle commesse di Termoidraulica Gibboni."
        />
      </Helmet>

      <PageHeader caption={fmtDataLunga(new Date())} title={`${saluto()}, ${(user?.name || '').split(' ')[0] || 'utente'}`} />

      {error && <p className="mb-4 border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {!data && !error && <LoadingRows label="Caricamento indicatori…" />}

      {data && (
        <div className="flex flex-col gap-8">
          {/* Banda indicatori */}
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-5">
            {[
              { label: 'Scadenze ≤ 30 gg', value: scadenze.length, to: '/scadenzario' },
              { label: 'Da chiamare', value: daChiamare.length, to: '/chiamate' },
              { label: 'Interventi in programma', value: prossimi.length, to: '/agenda' },
              { label: 'Commesse attive', value: commesseAttive.length, to: '/commesse' },
            ].map((k) => (
              <Link key={k.label} to={k.to} className="group bg-navy px-4 py-5 transition-colors hover:bg-navy/90">
                <p className="font-mono text-4xl font-semibold text-white">
                  <CountUp value={k.value} />
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 group-hover:text-accent">
                  {k.label}
                </p>
              </Link>
            ))}
            <Link to="/rapportini" className="group col-span-2 bg-accent px-4 py-5 transition-colors hover:bg-accent/90 md:col-span-1">
              <p className="font-mono text-4xl font-semibold text-accent-foreground">
                <CountUp value={Math.round(incassatoMese)} suffix=" €" />
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-foreground/70">
                Incassato questo mese
              </p>
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Scadenze imminenti */}
            <section>
              <SectionTitle icon={CalendarClock} to="/scadenzario">
                Scadenze imminenti
              </SectionTitle>
              {scadenze.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Nessuna scadenza nei prossimi 30 giorni.</p>
              )}
              <ul className="divide-y divide-border">
                {scadenze.slice(0, 6).map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {s.imp.expand?.cliente?.nome || 'Cliente'}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {s.tipo} · {TIPI_IMPIANTO[s.imp.tipo]} {s.imp.marca} {s.imp.modello}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{fmtData(s.data)}</span>
                      <StatusBadge label={testoScadenza(s.data)} tone={tonoScadenza(s.data)} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Clienti da contattare */}
            <section>
              <SectionTitle icon={Phone} to="/chiamate">
                Clienti da contattare
              </SectionTitle>
              {daChiamare.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Lista chiamate vuota: tutto gestito.</p>
              )}
              <ul className="divide-y divide-border">
                {daChiamare.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.expand?.cliente?.nome}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {c.expand?.cliente?.telefono} · {c.tipo_scadenza === 'bollino' ? 'Bollino' : 'Controllo'} del {fmtData(c.data_scadenza)}
                      </p>
                    </div>
                    <StatusBadge label={STATI_CHIAMATA[c.stato]} tone={TONO_CHIAMATA[c.stato]} />
                  </li>
                ))}
              </ul>
            </section>

            {/* Interventi programmati */}
            <section>
              <SectionTitle icon={CalendarDays} to="/agenda">
                Prossimi interventi
              </SectionTitle>
              {prossimi.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Nessun intervento in programma.</p>
              )}
              <ul className="divide-y divide-border">
                {prossimi.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {TIPI_INTERVENTO[i.tipo]} · {i.expand?.cliente?.nome}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {i.expand?.tecnico?.name || 'Da assegnare'} {i.ora ? `· ore ${i.ora}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-semibold text-accent">
                      {fmtData(i.data)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Andamento commesse */}
            <section>
              <SectionTitle icon={Briefcase} to="/commesse">
                Andamento commesse
              </SectionTitle>
              {commesseAttive.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Nessuna commessa attiva.</p>
              )}
              <ul className="divide-y divide-border">
                {commesseAttive.map((c) => (
                  <li key={c.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          <span className="font-mono text-xs text-accent">{c.codice}</span> · {c.titolo}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {c.expand?.cliente?.nome}
                        </p>
                      </div>
                      <StatusBadge label={STATI_COMMESSA[c.stato]} tone={TONO_COMMESSA[c.stato]} />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-muted">
                        <div className="h-full bg-accent" style={{ width: `${c.avanzamento || 0}%` }} />
                      </div>
                      <span className="font-mono text-xs font-semibold">{c.avanzamento || 0}%</span>
                    </div>
                  </li>
                ))}
              </ul>
              {daIncassare > 0 && (
                <p className="mt-3 border-l-2 border-accent bg-accent/10 px-3 py-2 text-sm">
                  Da incassare: <span className="font-mono font-semibold">{fmtEuro(daIncassare)}</span>
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
