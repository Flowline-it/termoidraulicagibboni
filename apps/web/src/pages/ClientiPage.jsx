import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import ClienteDialog from '@/components/ClienteDialog';
import { Button } from '@/components/ui/button';
import { Field, SelectInput, inputCls, optsFrom, EmptyState, LoadingRows } from '@/components/FormBits';
import { TIPI_CLIENTE, TONO_TIPO_CLIENTE, isBackoffice } from '@/lib/constants';

const ClientiPage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [clienti, setClienti] = useState(null);
  const [conteggi, setConteggi] = useState({});
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('tutti');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    Promise.all([
      pb.collection('clienti').getFullList({ sort: 'nome' }),
      pb.collection('impianti').getFullList({ fields: 'id,cliente' }),
    ])
      .then(([c, i]) => {
        setClienti(c);
        const map = {};
        i.forEach((imp) => {
          map[imp.cliente] = (map[imp.cliente] || 0) + 1;
        });
        setConteggi(map);
      })
      .catch((e) => toast.error(e.message));
  };

  useEffect(load, []);

  const filtrati = useMemo(() => {
    if (!clienti) return [];
    const q = search.trim().toLowerCase();
    return clienti.filter((c) => {
      if (tipo !== 'tutti' && c.tipo !== tipo) return false;
      if (!q) return true;
      return [c.nome, c.citta, c.telefono, c.referente, c.email]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [clienti, search, tipo]);

  const rimuovi = async (c) => {
    if (!window.confirm(`Eliminare "${c.nome}"? Verranno eliminati anche i suoi impianti.`)) return;
    try {
      await pb.collection('clienti').delete(c.id);
      toast.success('Cliente eliminato');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Clienti — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Anagrafica unica dei clienti di Termoidraulica Gibboni: contatti, indirizzi, impianti collegati e ricerca rapida."
        />
      </Helmet>

      <PageHeader caption="Anagrafica unica" title="Clienti">
        {backoffice && (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Nuovo cliente
          </Button>
        )}
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Cerca per nome, città, telefono, referente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectInput
          value={tipo}
          onChange={setTipo}
          options={[{ value: 'tutti', label: 'Tutti i tipi' }, ...optsFrom(TIPI_CLIENTE)]}
        />
      </div>

      {!clienti && <LoadingRows label="Caricamento clienti…" />}
      {clienti && filtrati.length === 0 && (
        <EmptyState title="Nessun cliente trovato" hint="Modifica la ricerca o inserisci un nuovo cliente." />
      )}

      {clienti && filtrati.length > 0 && (
        <ul className="divide-y divide-border border-t border-b border-border">
          {filtrati.map((c) => (
            <li key={c.id} className="group flex items-center gap-4 py-3">
              <Link to={`/clienti/${c.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold leading-snug group-hover:text-accent">
                    {c.nome}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {[c.indirizzo, c.citta].filter(Boolean).join(', ') || 'Indirizzo non indicato'}
                    {c.telefono ? ` · ${c.telefono}` : ''}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                  <span className="font-mono text-xs text-muted-foreground">
                    {conteggi[c.id] || 0} impianti
                  </span>
                  <StatusBadge label={TIPI_CLIENTE[c.tipo]} tone={TONO_TIPO_CLIENTE[c.tipo]} />
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent" />
              </Link>
              {backoffice && (
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label="Modifica"
                    onClick={() => {
                      setEditing(c);
                      setDialogOpen(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Elimina"
                    onClick={() => rimuovi(c)}
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

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={editing}
        onSaved={load}
      />
    </div>
  );
};

export default ClientiPage;
