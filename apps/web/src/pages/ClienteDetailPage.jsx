import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Phone, Mail, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import ClienteDialog from '@/components/ClienteDialog';
import ImpiantoDialog from '@/components/ImpiantoDialog';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingRows } from '@/components/FormBits';
import {
  TIPI_CLIENTE,
  TONO_TIPO_CLIENTE,
  TIPI_IMPIANTO,
  STATI_COMMESSA,
  TONO_COMMESSA,
  STATI_CHIAMATA,
  TONO_CHIAMATA,
  TIPI_DOCUMENTO,
  fmtData,
  testoScadenza,
  tonoScadenza,
  fmtEuro,
  isBackoffice,
} from '@/lib/constants';

const Caption = ({ children }) => (
  <h2 className="mb-3 border-b border-border pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
    {children}
  </h2>
);

const ClienteDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [cliente, setCliente] = useState(null);
  const [impianti, setImpianti] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [documenti, setDocumenti] = useState([]);
  const [rapportini, setRapportini] = useState([]);
  const [chiamate, setChiamate] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [impiantoOpen, setImpiantoOpen] = useState(false);

  const load = () => {
    pb.collection('clienti')
      .getOne(id)
      .then(setCliente)
      .catch(() => setNotFound(true));
    const filt = `cliente = "${id}"`;
    pb.collection('impianti').getFullList({ filter: filt }).then(setImpianti).catch(() => {});
    pb.collection('commesse').getFullList({ filter: filt, sort: '-created' }).then(setCommesse).catch(() => {});
    pb.collection('documenti').getFullList({ filter: filt, sort: '-data' }).then(setDocumenti).catch(() => {});
    pb.collection('rapportini').getFullList({ filter: filt, sort: '-data' }).then(setRapportini).catch(() => {});
    pb.collection('chiamate').getFullList({ filter: filt, sort: '-created' }).then(setChiamate).catch(() => {});
  };

  useEffect(load, [id]);

  if (notFound)
    return (
      <EmptyState title="Cliente non trovato" hint="Il record potrebbe essere stato eliminato." />
    );
  if (!cliente) return <LoadingRows label="Caricamento scheda cliente…" />;

  return (
    <div>
      <Helmet>
        <title>{cliente.nome} — Clienti · Flowline</title>
        <meta
          name="description"
          content={`Scheda cliente ${cliente.nome}: impianti, scadenze, commesse, rapportini e documenti.`}
        />
      </Helmet>

      <Link
        to="/clienti"
        className="mb-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-3 w-3" /> Tutti i clienti
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <StatusBadge label={TIPI_CLIENTE[cliente.tipo]} tone={TONO_TIPO_CLIENTE[cliente.tipo]} />
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Cliente dal {fmtData(cliente.created)}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{cliente.nome}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {cliente.telefono && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-accent" /> {cliente.telefono}
              </span>
            )}
            {cliente.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-accent" /> {cliente.email}
              </span>
            )}
            {(cliente.indirizzo || cliente.citta) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                {[cliente.indirizzo, cliente.cap, cliente.citta].filter(Boolean).join(', ')}
              </span>
            )}
            {cliente.referente && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-accent" /> {cliente.referente}
              </span>
            )}
          </div>
          {cliente.note && (
            <p className="mt-3 max-w-2xl border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm">
              {cliente.note}
            </p>
          )}
        </div>
        {backoffice && (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" /> Modifica
          </Button>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <Caption>Impianti ({impianti.length})</Caption>
            {backoffice && (
              <Button size="sm" variant="outline" className="mb-3" onClick={() => setImpiantoOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Impianto
              </Button>
            )}
          </div>
          {impianti.length === 0 && <EmptyState title="Nessun impianto" hint="Aggiungi il primo impianto di questo cliente." />}
          <ul className="divide-y divide-border">
            {impianti.map((i) => (
              <li key={i.id} className="py-3">
                <p className="text-sm font-semibold">
                  {TIPI_IMPIANTO[i.tipo]} · {i.marca} {i.modello}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {i.matricola || 'senza matricola'} · posa {fmtData(i.data_posa)} · ultimo intervento {fmtData(i.ultimo_intervento)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {i.scadenza_controllo && (
                    <StatusBadge label={`Controllo ${testoScadenza(i.scadenza_controllo)}`} tone={tonoScadenza(i.scadenza_controllo)} />
                  )}
                  {i.scadenza_bollino && (
                    <StatusBadge label={`Bollino ${testoScadenza(i.scadenza_bollino)}`} tone={tonoScadenza(i.scadenza_bollino)} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Caption>Commesse ({commesse.length})</Caption>
          {commesse.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nessuna commessa collegata.</p>}
          <ul className="divide-y divide-border">
            {commesse.map((k) => (
              <li key={k.id}>
                <Link to={`/commesse/${k.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      <span className="font-mono text-xs text-accent">{k.codice}</span> · {k.titolo}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">aperta il {fmtData(k.data_apertura)}</p>
                  </div>
                  <StatusBadge label={STATI_COMMESSA[k.stato]} tone={TONO_COMMESSA[k.stato]} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Caption>Rapportini ({rapportini.length})</Caption>
          {rapportini.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nessun rapportino registrato.</p>}
          <ul className="divide-y divide-border">
            {rapportini.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    <span className="font-mono text-xs text-accent">{r.numero || '—'}</span> · {fmtData(r.data)}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{r.descrizione}</p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold">{fmtEuro(r.importo)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Caption>Documenti ({documenti.length})</Caption>
          {documenti.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nessun documento in archivio.</p>}
          <ul className="divide-y divide-border">
            {documenti.slice(0, 8).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <p className="min-w-0 truncate font-mono text-xs">{d.titolo}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{fmtData(d.data)}</span>
                  <StatusBadge label={TIPI_DOCUMENTO[d.tipo]} tone="gray" />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Caption>Chiamate recenti ({chiamate.length})</Caption>
            {chiamate.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nessuna chiamata registrata.</p>}
            <ul className="divide-y divide-border">
              {chiamate.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="min-w-0 truncate text-sm">
                    {c.tipo_scadenza === 'bollino' ? 'Bollino' : 'Controllo'} · scadenza {fmtData(c.data_scadenza)}
                  </p>
                  <StatusBadge label={STATI_CHIAMATA[c.stato]} tone={TONO_CHIAMATA[c.stato]} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <ClienteDialog open={editOpen} onOpenChange={setEditOpen} cliente={cliente} onSaved={load} />
      <ImpiantoDialog open={impiantoOpen} onOpenChange={setImpiantoOpen} clienteId={id} onSaved={load} />
    </div>
  );
};

export default ClienteDetailPage;
