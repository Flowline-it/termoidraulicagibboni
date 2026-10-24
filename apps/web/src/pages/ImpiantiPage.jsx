import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import ImpiantoDialog from '@/components/ImpiantoDialog';
import { Button } from '@/components/ui/button';
import { SelectInput, inputCls, optsFrom, EmptyState, LoadingRows } from '@/components/FormBits';
import {
  TIPI_IMPIANTO,
  fmtData,
  giorniMancanti,
  testoScadenza,
  tonoScadenza,
  isBackoffice,
} from '@/lib/constants';

const ImpiantiPage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [impianti, setImpianti] = useState(null);
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('tutti');
  const [scad, setScad] = useState('tutte');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    pb.collection('impianti')
      .getFullList({ expand: 'cliente', sort: 'marca,modello' })
      .then(setImpianti)
      .catch((e) => toast.error(e.message));
  };

  useEffect(load, []);

  const filtrati = useMemo(() => {
    if (!impianti) return [];
    const q = search.trim().toLowerCase();
    return impianti.filter((i) => {
      if (tipo !== 'tutti' && i.tipo !== tipo) return false;
      if (scad !== 'tutte') {
        const giorni = [giorniMancanti(i.scadenza_controllo), giorniMancanti(i.scadenza_bollino)].filter(
          (g) => g !== null,
        );
        const min = giorni.length ? Math.min(...giorni) : null;
        if (scad === 'scadute' && !(min !== null && min < 0)) return false;
        if (scad === 'entro30' && !(min !== null && min >= 0 && min <= 30)) return false;
      }
      if (!q) return true;
      return [i.marca, i.modello, i.matricola, i.expand?.cliente?.nome, i.indirizzo_installazione]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [impianti, search, tipo, scad]);

  const rimuovi = async (i) => {
    if (!window.confirm(`Eliminare l'impianto ${i.marca} ${i.modello}?`)) return;
    try {
      await pb.collection('impianti').delete(i.id);
      toast.success('Impianto eliminato');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Impianti — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Anagrafica impianti: marca, modello, matricola, indirizzo di installazione, data di posa, ultimo intervento e scadenze bollino."
        />
      </Helmet>

      <PageHeader caption="Anagrafica unica" title="Impianti">
        {backoffice && (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Nuovo impianto
          </Button>
        )}
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Cerca marca, modello, matricola, cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectInput
          value={tipo}
          onChange={setTipo}
          options={[{ value: 'tutti', label: 'Tutti i tipi' }, ...optsFrom(TIPI_IMPIANTO)]}
        />
        <SelectInput
          value={scad}
          onChange={setScad}
          options={[
            { value: 'tutte', label: 'Tutte le scadenze' },
            { value: 'scadute', label: 'Con scadenze superate' },
            { value: 'entro30', label: 'In scadenza entro 30 gg' },
          ]}
        />
      </div>

      {!impianti && <LoadingRows label="Caricamento impianti…" />}
      {impianti && filtrati.length === 0 && (
        <EmptyState title="Nessun impianto trovato" hint="Modifica i filtri o inserisci un nuovo impianto." />
      )}

      {impianti && filtrati.length > 0 && (
        <ul className="divide-y divide-border border-t border-b border-border">
          {filtrati.map((i) => (
            <li key={i.id} className="flex items-start gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {TIPI_IMPIANTO[i.tipo]} · {i.marca} {i.modello}
                  {i.potenza_kw ? <span className="font-mono text-xs text-muted-foreground"> · {i.potenza_kw} kW</span> : null}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {i.matricola || 'senza matricola'} · posa {fmtData(i.data_posa)} · ultimo intervento {fmtData(i.ultimo_intervento)}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <Link to={`/clienti/${i.cliente}`} className="font-semibold text-foreground hover:text-accent">
                    {i.expand?.cliente?.nome}
                  </Link>
                  {i.indirizzo_installazione ? ` — ${i.indirizzo_installazione}` : ''}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {i.scadenza_controllo && (
                    <StatusBadge label={`Controllo ${testoScadenza(i.scadenza_controllo)}`} tone={tonoScadenza(i.scadenza_controllo)} />
                  )}
                  {i.scadenza_bollino && (
                    <StatusBadge label={`Bollino ${testoScadenza(i.scadenza_bollino)}`} tone={tonoScadenza(i.scadenza_bollino)} />
                  )}
                </div>
              </div>
              {backoffice && (
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label="Modifica"
                    onClick={() => {
                      setEditing(i);
                      setDialogOpen(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Elimina"
                    onClick={() => rimuovi(i)}
                    className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ImpiantoDialog open={dialogOpen} onOpenChange={setDialogOpen} impianto={editing} onSaved={load} />
    </div>
  );
};

export default ImpiantiPage;
