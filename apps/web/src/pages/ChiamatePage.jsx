import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Phone, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, SelectInput, inputCls, EmptyState, LoadingRows } from '@/components/FormBits';
import {
  STATI_CHIAMATA,
  ORDINE_STATI_CHIAMATA,
  TONO_CHIAMATA,
  PRIORITA,
  TONO_PRIORITA,
  TIPI_IMPIANTO,
  fmtData,
  oggiISO,
  isBackoffice,
} from '@/lib/constants';

const EMPTY = {
  cliente: '',
  impianto: '',
  tipo_scadenza: 'controllo',
  data_scadenza: '',
  priorita: 'media',
  note: '',
};

const ChiamatePage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [chiamate, setChiamate] = useState(null);
  const [filtro, setFiltro] = useState('aperte');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [clienti, setClienti] = useState([]);
  const [impianti, setImpianti] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    pb.collection('chiamate')
      .getFullList({ expand: 'cliente,impianto', sort: '-created' })
      .then(setChiamate)
      .catch((e) => toast.error(e.message));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!dialogOpen) return;
    Promise.all([
      pb.collection('clienti').getFullList({ sort: 'nome' }),
      pb.collection('impianti').getFullList(),
    ])
      .then(([c, i]) => {
        setClienti(c);
        setImpianti(i);
      })
      .catch(() => {});
    setForm(EMPTY);
  }, [dialogOpen]);

  const filtrate = useMemo(() => {
    if (!chiamate) return [];
    let rows = chiamate;
    if (filtro === 'aperte') rows = rows.filter((c) => c.stato !== 'eseguito');
    else if (filtro !== 'tutte') rows = rows.filter((c) => c.stato === filtro);
    const peso = { alta: 0, media: 1, bassa: 2 };
    return [...rows].sort(
      (a, b) =>
        ORDINE_STATI_CHIAMATA.indexOf(a.stato) - ORDINE_STATI_CHIAMATA.indexOf(b.stato) ||
        (peso[a.priorita] ?? 1) - (peso[b.priorita] ?? 1),
    );
  }, [chiamate, filtro]);

  const avanza = async (c) => {
    const idx = ORDINE_STATI_CHIAMATA.indexOf(c.stato);
    const next = ORDINE_STATI_CHIAMATA[Math.min(idx + 1, ORDINE_STATI_CHIAMATA.length - 1)];
    try {
      await pb.collection('chiamate').update(c.id, {
        stato: next,
        data_contatto: next === 'contattato' ? oggiISO() : c.data_contatto || '',
      });
      toast.success(`Stato aggiornato: ${STATI_CHIAMATA[next]}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const rimuovi = async (c) => {
    if (!window.confirm('Eliminare questa chiamata dalla lista?')) return;
    try {
      await pb.collection('chiamate').delete(c.id);
      toast.success('Chiamata eliminata');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const crea = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await pb.collection('chiamate').create({ ...form, stato: 'da_chiamare' });
      toast.success('Cliente aggiunto alla lista chiamate');
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const impiantiCliente = impianti.filter((i) => !form.cliente || i.cliente === form.cliente);

  return (
    <div>
      <Helmet>
        <title>Chiamate — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Lista quotidiana dei clienti da contattare per le scadenze: da chiamare, contattato, appuntamento fissato, eseguito."
        />
      </Helmet>

      <PageHeader caption="Fase 1 · Lista quotidiana" title="Clienti da contattare">
        {backoffice && (
          <Button onClick={() => setDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-1 h-4 w-4" /> Aggiungi alla lista
          </Button>
        )}
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-px bg-border">
        {[
          { value: 'aperte', label: 'Aperte' },
          { value: 'tutte', label: 'Tutte' },
          ...ORDINE_STATI_CHIAMATA.map((s) => ({ value: s, label: STATI_CHIAMATA[s] })),
        ].map((o) => (
          <button
            key={o.value}
            onClick={() => setFiltro(o.value)}
            className={
              filtro === o.value
                ? 'bg-navy px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-navy-foreground'
                : 'bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground'
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {!chiamate && <LoadingRows label="Caricamento lista chiamate…" />}
      {chiamate && filtrate.length === 0 && (
        <EmptyState title="Nessuna chiamata in questo stato" hint="Le scadenze dello scadenzario possono essere inviate qui con un clic." />
      )}

      {chiamate && filtrate.length > 0 && (
        <ul className="divide-y divide-border border-t border-b border-border">
          {filtrate.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-navy/5">
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  <Link to={`/clienti/${c.cliente}`} className="hover:text-accent">
                    {c.expand?.cliente?.nome}
                  </Link>
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                    {c.expand?.cliente?.telefono}
                  </span>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {c.tipo_scadenza === 'bollino' ? 'Bollino' : 'Controllo'} · scadenza {fmtData(c.data_scadenza)}
                  {c.expand?.impianto ? ` · ${TIPI_IMPIANTO[c.expand.impianto.tipo]} ${c.expand.impianto.marca}` : ''}
                  {c.data_contatto ? ` · contattato il ${fmtData(c.data_contatto)}` : ''}
                </p>
                {c.note && <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.note}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {c.priorita && <StatusBadge label={PRIORITA[c.priorita]} tone={TONO_PRIORITA[c.priorita]} />}
                <StatusBadge label={STATI_CHIAMATA[c.stato]} tone={TONO_CHIAMATA[c.stato]} />
                {backoffice && c.stato !== 'eseguito' && (
                  <Button size="sm" variant="outline" onClick={() => avanza(c)}>
                    {STATI_CHIAMATA[ORDINE_STATI_CHIAMATA[ORDINE_STATI_CHIAMATA.indexOf(c.stato) + 1]]}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
                {backoffice && (
                  <button
                    aria-label="Elimina"
                    onClick={() => rimuovi(c)}
                    className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Aggiungi alla lista chiamate</DialogTitle>
          </DialogHeader>
          <form onSubmit={crea} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente" className="sm:col-span-2">
              <SelectInput
                value={form.cliente}
                onChange={(v) => setForm((f) => ({ ...f, cliente: v, impianto: '' }))}
                placeholder="Seleziona cliente…"
                options={clienti.map((c) => ({ value: c.id, label: c.nome }))}
              />
            </Field>
            <Field label="Impianto">
              <SelectInput
                value={form.impianto}
                onChange={(v) => setForm((f) => ({ ...f, impianto: v }))}
                placeholder="—"
                options={impiantiCliente.map((i) => ({ value: i.id, label: `${i.marca} ${i.modello}` }))}
              />
            </Field>
            <Field label="Tipo scadenza">
              <SelectInput
                value={form.tipo_scadenza}
                onChange={(v) => setForm((f) => ({ ...f, tipo_scadenza: v }))}
                options={[
                  { value: 'controllo', label: 'Controllo periodico' },
                  { value: 'bollino', label: 'Bollino' },
                ]}
              />
            </Field>
            <Field label="Data scadenza">
              <input type="date" className={inputCls} value={form.data_scadenza} onChange={(e) => setForm((f) => ({ ...f, data_scadenza: e.target.value }))} />
            </Field>
            <Field label="Priorità">
              <SelectInput
                value={form.priorita}
                onChange={(v) => setForm((f) => ({ ...f, priorita: v }))}
                options={Object.entries(PRIORITA).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Note" className="sm:col-span-2">
              <textarea className={`${inputCls} h-16 py-2`} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={busy || !form.cliente} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? 'Salvataggio…' : 'Aggiungi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChiamatePage;
