import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, SelectInput, inputCls, optsFrom } from '@/components/FormBits';
import { TIPI_RAPPORTINO, PAGAMENTI, STATI_RAPPORTINO, oggiISO } from '@/lib/constants';

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

const EMPTY = {
  numero: '',
  intervento: '',
  cliente: '',
  impianto: '',
  tecnico: '',
  data: oggiISO(),
  tipo_intervento: 'manutenzione_ordinaria',
  descrizione: '',
  importo: '',
  pagamento: 'da_incassare',
  stato: 'bozza',
};

const RapportinoDialog = ({ open, onOpenChange, rapportino, preset = {}, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [clienti, setClienti] = useState([]);
  const [impianti, setImpianti] = useState([]);
  const [tecnici, setTecnici] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      pb.collection('clienti').getFullList({ sort: 'nome' }),
      pb.collection('impianti').getFullList({ sort: 'marca' }),
      pb.collection('users').getFullList({ filter: "role = 'tecnico'", sort: 'name' }),
    ])
      .then(([c, i, t]) => {
        setClienti(c);
        setImpianti(i);
        setTecnici(t);
      })
      .catch(() => {});

    if (rapportino) {
      setForm({ ...EMPTY, ...rapportino, data: dateOnly(rapportino.data) });
    } else {
      const anno = new Date().getFullYear();
      const progressivo = String(Math.floor(Math.random() * 900) + 100);
      setForm({
        ...EMPTY,
        numero: `R-${anno}-${progressivo}`,
        data: oggiISO(),
        ...preset,
      });
    }
  }, [open, rapportino]);

  const set = (k) => (e) =>
    setForm((f) => {
      const v = e.target ? e.target.value : e;
      const next = { ...f, [k]: v };
      if (k === 'cliente') next.impianto = '';
      return next;
    });

  const impiantiCliente = impianti.filter((i) => !form.cliente || i.cliente === form.cliente);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, importo: form.importo === '' ? 0 : Number(form.importo) };
    try {
      if (rapportino) {
        await pb.collection('rapportini').update(rapportino.id, payload);
        toast.success('Rapportino aggiornato');
      } else {
        await pb.collection('rapportini').create(payload);
        toast.success('Rapportino registrato');
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Salvataggio non riuscito');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {rapportino ? `Rapportino ${rapportino.numero || ''}` : 'Nuovo rapportino di manutenzione'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Numero">
            <input className={`${inputCls} font-mono`} value={form.numero} onChange={set('numero')} placeholder="R-2026-000" />
          </Field>
          <Field label="Data">
            <input type="date" className={inputCls} value={form.data} onChange={set('data')} />
          </Field>
          <Field label="Cliente" className="sm:col-span-2">
            <SelectInput
              value={form.cliente}
              onChange={set('cliente')}
              placeholder="Seleziona cliente…"
              options={clienti.map((c) => ({ value: c.id, label: c.nome }))}
            />
          </Field>
          <Field label="Impianto">
            <SelectInput
              value={form.impianto}
              onChange={set('impianto')}
              placeholder="—"
              options={impiantiCliente.map((i) => ({
                value: i.id,
                label: `${i.marca} ${i.modello} (${i.matricola || 's/m'})`,
              }))}
            />
          </Field>
          <Field label="Tecnico">
            <SelectInput
              value={form.tecnico}
              onChange={set('tecnico')}
              placeholder="—"
              options={tecnici.map((t) => ({ value: t.id, label: t.name || t.email }))}
            />
          </Field>
          <Field label="Tipo di intervento">
            <SelectInput value={form.tipo_intervento} onChange={set('tipo_intervento')} options={optsFrom(TIPI_RAPPORTINO)} />
          </Field>
          <Field label="Stato">
            <SelectInput value={form.stato} onChange={set('stato')} options={optsFrom(STATI_RAPPORTINO)} />
          </Field>
          <Field label="Descrizione lavoro" className="sm:col-span-2">
            <textarea
              className={`${inputCls} h-24 py-2`}
              value={form.descrizione}
              onChange={set('descrizione')}
              placeholder="Lavori eseguiti, ricambi, esiti dei controlli…"
            />
          </Field>
          <Field label="Importo incassato (€)">
            <input type="number" step="0.01" min="0" className={`${inputCls} font-mono`} value={form.importo} onChange={set('importo')} placeholder="0,00" />
          </Field>
          <Field label="Modalità di pagamento">
            <SelectInput value={form.pagamento} onChange={set('pagamento')} options={optsFrom(PAGAMENTI)} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={busy || !form.cliente}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {busy ? 'Salvataggio…' : 'Salva rapportino'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RapportinoDialog;
