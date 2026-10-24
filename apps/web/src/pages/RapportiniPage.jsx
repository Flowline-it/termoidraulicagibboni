import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import RapportinoDialog from '@/components/RapportinoDialog';
import { Button } from '@/components/ui/button';
import { SelectInput, inputCls, optsFrom, EmptyState, LoadingRows } from '@/components/FormBits';
import {
  TIPI_RAPPORTINO,
  STATI_RAPPORTINO,
  TONO_RAPPORTINO,
  PAGAMENTI,
  TONO_PAGAMENTO,
  fmtData,
  fmtEuro,
  isBackoffice,
} from '@/lib/constants';

const RapportiniPage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [rapportini, setRapportini] = useState(null);
  const [search, setSearch] = useState('');
  const [stato, setStato] = useState('tutti');
  const [pagamento, setPagamento] = useState('tutti');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    pb.collection('rapportini')
      .getFullList({ expand: 'cliente,impianto,tecnico', sort: '-data' })
      .then(setRapportini)
      .catch((e) => toast.error(e.message));
  };

  useEffect(load, []);

  const filtrati = useMemo(() => {
    if (!rapportini) return [];
    const q = search.trim().toLowerCase();
    return rapportini.filter((r) => {
      if (stato !== 'tutti' && r.stato !== stato) return false;
      if (pagamento !== 'tutti' && r.pagamento !== pagamento) return false;
      if (!q) return true;
      return [r.numero, r.descrizione, r.expand?.cliente?.nome, r.expand?.tecnico?.name]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [rapportini, search, stato, pagamento]);

  const totali = useMemo(() => {
    const rows = filtrati;
    return {
      incassato: rows.filter((r) => r.pagamento !== 'da_incassare').reduce((s, r) => s + (r.importo || 0), 0),
      daIncassare: rows.filter((r) => r.pagamento === 'da_incassare').reduce((s, r) => s + (r.importo || 0), 0),
    };
  }, [filtrati]);

  const canEdit = (r) => backoffice || r.tecnico === user?.id;

  return (
    <div>
      <Helmet>
        <title>Rapportini — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Rapportini digitali di manutenzione: compilazione in meno di un minuto, importo incassato e modalità di pagamento."
        />
      </Helmet>

      <PageHeader caption="Fase 2 · Dal campo all'ufficio" title="Rapportini">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Nuovo rapportino
        </Button>
      </PageHeader>

      {rapportini && rapportini.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="border border-border bg-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Rapportini</p>
            <p className="mt-1 font-display text-2xl font-bold">{filtrati.length}</p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Incassato</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-700">{fmtEuro(totali.incassato)}</p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Da incassare</p>
            <p className="mt-1 font-display text-2xl font-bold text-red-700">{fmtEuro(totali.daIncassare)}</p>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Cerca per numero, cliente o descrizione…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectInput
          value={stato}
          onChange={setStato}
          options={[{ value: 'tutti', label: 'Tutti gli stati' }, ...optsFrom(STATI_RAPPORTINO)]}
        />
        <SelectInput
          value={pagamento}
          onChange={setPagamento}
          options={[{ value: 'tutti', label: 'Tutti i pagamenti' }, ...optsFrom(PAGAMENTI)]}
        />
      </div>

      {!rapportini && <LoadingRows label="Caricamento rapportini…" />}
      {rapportini && filtrati.length === 0 && (
        <EmptyState title="Nessun rapportino trovato" hint="Modifica i filtri o registra un nuovo rapportino." />
      )}

      {rapportini && filtrati.length > 0 && (
        <ul className="divide-y divide-border border-t border-b border-border">
          {filtrati.map((r) => (
            <li key={r.id} className="group flex items-center gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-accent">{r.numero || '—'}</span>
                  <StatusBadge label={STATI_RAPPORTINO[r.stato]} tone={TONO_RAPPORTINO[r.stato]} />
                  <StatusBadge label={PAGAMENTI[r.pagamento]} tone={TONO_PAGAMENTO[r.pagamento]} />
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold">
                  {r.expand?.cliente ? (
                    <Link to={`/clienti/${r.cliente}`} className="hover:text-accent">
                      {r.expand.cliente.nome}
                    </Link>
                  ) : (
                    '—'
                  )}
                  {' · '}
                  {TIPI_RAPPORTINO[r.tipo_intervento] || 'Intervento'} · {fmtData(r.data)}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {r.expand?.tecnico?.name || 'Tecnico —'}
                  {r.expand?.impianto ? ` · ${r.expand.impianto.marca} ${r.expand.impianto.modello}` : ''}
                  {r.descrizione ? ` · ${r.descrizione}` : ''}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold">{fmtEuro(r.importo)}</span>
              {canEdit(r) && (
                <button
                  onClick={() => {
                    setEditing(r);
                    setDialogOpen(true);
                  }}
                  title="Modifica rapportino"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-accent hover:text-accent"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <RapportinoDialog open={dialogOpen} onOpenChange={setDialogOpen} rapportino={editing} onSaved={load} />
    </div>
  );
};

export default RapportiniPage;
