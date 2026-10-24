import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, SelectInput, inputCls, optsFrom, EmptyState, LoadingRows } from '@/components/FormBits';
import { STATI_COMMESSA, TONO_COMMESSA, fmtData, isBackoffice, oggiISO } from '@/lib/constants';

const EMPTY = {
  codice: '',
  titolo: '',
  cliente: '',
  impianto: '',
  stato: 'aperta',
  avanzamento: 0,
  data_apertura: oggiISO(),
  data_chiusura: '',
  descrizione: '',
};

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

const CommessePage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [commesse, setCommesse] = useState(null);
  const [search, setSearch] = useState('');
  const [stato, setStato] = useState('attive');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [clienti, setClienti] = useState([]);
  const [impianti, setImpianti] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    pb.collection('commesse')
      .getFullList({ expand: 'cliente,impianto', sort: '-created' })
      .then(setCommesse)
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
    if (editing) {
      setForm({
        ...EMPTY,
        ...editing,
        data_apertura: dateOnly(editing.data_apertura),
        data_chiusura: dateOnly(editing.data_chiusura),
      });
    } else {
      const anno = new Date().getFullYear();
      const prog = String((commesse?.length || 0) + 25).padStart(3, '0');
      setForm({ ...EMPTY, codice: `C-${anno}-${prog}`, data_apertura: oggiISO() });
    }
  }, [dialogOpen, editing]);

  const filtrate = useMemo(() => {
    if (!commesse) return [];
    const q = search.trim().toLowerCase();
    return commesse.filter((k) => {
      if (stato === 'attive' && !['aperta', 'in_corso'].includes(k.stato)) return false;
      if (stato !== 'attive' && stato !== 'tutte' && k.stato !== stato) return false;
      if (!q) return true;
      return [k.codice, k.titolo, k.expand?.cliente?.nome]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [commesse, search, stato]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, avanzamento: Number(form.avanzamento) || 0 };
    try {
      if (editing) {
        await pb.collection('commesse').update(editing.id, payload);
        toast.success('Commessa aggiornata');
      } else {
        await pb.collection('commesse').create(payload);
        toast.success('Commessa creata');
      }
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
        <title>Commesse — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Gestione delle commesse collegate a clienti e impianti: documenti, fotografie, rapportini e stato di avanzamento in un unico punto."
        />
      </Helmet>

      <PageHeader caption="Fase 2 · Commessa e campo" title="Commesse">
        {backoffice && (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Nuova commessa
          </Button>
        )}
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Cerca per codice, titolo o cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectInput
          value={stato}
          onChange={setStato}
          options={[
            { value: 'attive', label: 'Attive' },
            { value: 'tutte', label: 'Tutte' },
            ...optsFrom(STATI_COMMESSA),
          ]}
        />
      </div>

      {!commesse && <LoadingRows label="Caricamento commesse…" />}
      {commesse && filtrate.length === 0 && (
        <EmptyState title="Nessuna commessa trovata" hint="Modifica i filtri o crea una nuova commessa." />
      )}

      {commesse && filtrate.length > 0 && (
        <ul className="divide-y divide-border border-t border-b border-border">
          {filtrate.map((k) => (
            <li key={k.id} className="group flex items-center gap-4 py-3.5">
              <Link to={`/commesse/${k.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-accent">{k.codice}</span>
                  <StatusBadge label={STATI_COMMESSA[k.stato]} tone={TONO_COMMESSA[k.stato]} />
                </div>
                <p className="mt-0.5 truncate font-display text-lg font-semibold leading-snug group-hover:text-accent">
                  {k.titolo}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {k.expand?.cliente?.nome} · aperta il {fmtData(k.data_apertura)}
                  {k.expand?.impianto ? ` · ${k.expand.impianto.marca} ${k.expand.impianto.modello}` : ''}
                </p>
                <div className="mt-2 flex max-w-md items-center gap-3">
                  <div className="h-1.5 flex-1 bg-muted">
                    <div className="h-full bg-accent" style={{ width: `${k.avanzamento || 0}%` }} />
                  </div>
                  <span className="font-mono text-xs font-semibold">{k.avanzamento || 0}%</span>
                </div>
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent" />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? `Modifica ${editing.codice}` : 'Nuova commessa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Codice">
              <input required className={`${inputCls} font-mono`} value={form.codice} onChange={(e) => setForm((f) => ({ ...f, codice: e.target.value }))} />
            </Field>
            <Field label="Stato">
              <SelectInput value={form.stato} onChange={(v) => setForm((f) => ({ ...f, stato: v }))} options={optsFrom(STATI_COMMESSA)} />
            </Field>
            <Field label="Titolo" className="sm:col-span-2">
              <input required className={inputCls} value={form.titolo} onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))} placeholder="Es. Sostituzione caldaia centrale termica" />
            </Field>
            <Field label="Cliente">
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
            <Field label={`Avanzamento: ${form.avanzamento}%`} className="sm:col-span-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.avanzamento}
                onChange={(e) => setForm((f) => ({ ...f, avanzamento: e.target.value }))}
                className="w-full accent-[hsl(var(--accent))]"
              />
            </Field>
            <Field label="Data apertura">
              <input type="date" className={inputCls} value={form.data_apertura} onChange={(e) => setForm((f) => ({ ...f, data_apertura: e.target.value }))} />
            </Field>
            <Field label="Data chiusura">
              <input type="date" className={inputCls} value={form.data_chiusura} onChange={(e) => setForm((f) => ({ ...f, data_chiusura: e.target.value }))} />
            </Field>
            <Field label="Descrizione" className="sm:col-span-2">
              <textarea className={`${inputCls} h-20 py-2`} value={form.descrizione} onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))} />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={busy || !form.cliente} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {busy ? 'Salvataggio…' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommessePage;
