import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, SelectInput, inputCls, optsFrom } from '@/components/FormBits';
import { TIPI_INTERVENTO, STATI_INTERVENTO, oggiISO } from '@/lib/constants';

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

const EMPTY = {
  cliente: '',
  impianto: '',
  commessa: '',
  tecnico: '',
  data: oggiISO(),
  ora: '',
  tipo: 'manutenzione',
  stato: 'programmato',
  note: '',
};

const InterventoDialog = ({ open, onOpenChange, intervento, preset = {}, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [clienti, setClienti] = useState([]);
  const [impianti, setImpianti] = useState([]);
  const [tecnici, setTecnici] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      pb.collection('clienti').getFullList({ sort: 'nome' }),
      pb.collection('impianti').getFullList({ sort: 'marca' }),
      pb.collection('users').getFullList({ filter: "role = 'tecnico'", sort: 'name' }),
      pb.collection('commesse').getFullList({ sort: '-created' }),
    ])
      .then(([c, i, t, k]) => {
        setClienti(c);
        setImpianti(i);
        setTecnici(t);
        setCommesse(k);
      })
      .catch(() => {});

    if (intervento) {
      setForm({ ...EMPTY, ...intervento, data: dateOnly(intervento.data) });
    } else {
      setForm({ ...EMPTY, ...preset, data: preset.data || oggiISO() });
    }
  }, [open, intervento]);

  const set = (k) => (e) =>
    setForm((f) => {
      const v = e.target ? e.target.value : e;
      const next = { ...f, [k]: v };
      if (k === 'cliente') {
        next.impianto = '';
        next.commessa = '';
      }
      return next;
    });

  const impiantiCliente = impianti.filter((i) => !form.cliente || i.cliente === form.cliente);
  const commesseCliente = commesse.filter((k) => !form.cliente || k.cliente === form.cliente);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (intervento) {
        await pb.collection('interventi').update(intervento.id, form);
        toast.success('Intervento aggiornato');
      } else {
        await pb.collection('interventi').create(form);
        toast.success('Intervento programmato');
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
            {intervento ? 'Modifica intervento' : 'Nuovo intervento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Field label="Commessa">
            <SelectInput
              value={form.commessa}
              onChange={set('commessa')}
              placeholder="Nessuna"
              options={commesseCliente.map((k) => ({ value: k.id, label: `${k.codice} · ${k.titolo}` }))}
            />
          </Field>
          <Field label="Tecnico assegnato">
            <SelectInput
              value={form.tecnico}
              onChange={set('tecnico')}
              placeholder="Da assegnare"
              options={tecnici.map((t) => ({ value: t.id, label: t.name || t.email }))}
            />
          </Field>
          <Field label="Tipo">
            <SelectInput value={form.tipo} onChange={set('tipo')} options={optsFrom(TIPI_INTERVENTO)} />
          </Field>
          <Field label="Data">
            <input type="date" required className={inputCls} value={form.data} onChange={set('data')} />
          </Field>
          <Field label="Ora">
            <input type="time" className={inputCls} value={form.ora} onChange={set('ora')} />
          </Field>
          <Field label="Stato">
            <SelectInput value={form.stato} onChange={set('stato')} options={optsFrom(STATI_INTERVENTO)} />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <textarea
              className={`${inputCls} h-20 py-2`}
              value={form.note}
              onChange={set('note')}
              placeholder="Rilievi, misure, indicazioni per il tecnico…"
            />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={busy || !form.cliente || !form.data}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {busy ? 'Salvataggio…' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InterventoDialog;
