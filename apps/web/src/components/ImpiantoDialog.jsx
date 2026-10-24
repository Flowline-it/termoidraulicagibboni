import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, SelectInput, inputCls, optsFrom } from '@/components/FormBits';
import { TIPI_IMPIANTO } from '@/lib/constants';

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

const EMPTY = {
  cliente: '',
  tipo: 'caldaia',
  marca: '',
  modello: '',
  matricola: '',
  indirizzo_installazione: '',
  data_posa: '',
  ultimo_intervento: '',
  scadenza_controllo: '',
  scadenza_bollino: '',
  potenza_kw: '',
  note: '',
};

const ImpiantoDialog = ({ open, onOpenChange, impianto, clienteId, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [clienti, setClienti] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    pb.collection('clienti')
      .getFullList({ sort: 'nome' })
      .then(setClienti)
      .catch(() => {});
    if (impianto) {
      setForm({
        ...EMPTY,
        ...impianto,
        data_posa: dateOnly(impianto.data_posa),
        ultimo_intervento: dateOnly(impianto.ultimo_intervento),
        scadenza_controllo: dateOnly(impianto.scadenza_controllo),
        scadenza_bollino: dateOnly(impianto.scadenza_bollino),
      });
    } else {
      setForm({ ...EMPTY, cliente: clienteId || '' });
    }
  }, [open, impianto, clienteId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      potenza_kw: form.potenza_kw === '' ? 0 : Number(form.potenza_kw),
    };
    try {
      if (impianto) {
        await pb.collection('impianti').update(impianto.id, payload);
        toast.success('Impianto aggiornato');
      } else {
        await pb.collection('impianti').create(payload);
        toast.success('Impianto inserito');
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
            {impianto ? 'Modifica impianto' : 'Nuovo impianto'}
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
          <Field label="Tipo impianto">
            <SelectInput value={form.tipo} onChange={set('tipo')} options={optsFrom(TIPI_IMPIANTO)} />
          </Field>
          <Field label="Potenza (kW)">
            <input type="number" step="0.1" min="0" className={inputCls} value={form.potenza_kw} onChange={set('potenza_kw')} />
          </Field>
          <Field label="Marca">
            <input className={inputCls} value={form.marca} onChange={set('marca')} placeholder="Es. Vaillant" />
          </Field>
          <Field label="Modello">
            <input className={inputCls} value={form.modello} onChange={set('modello')} placeholder="Es. ecoTEC plus" />
          </Field>
          <Field label="Matricola">
            <input className={`${inputCls} font-mono`} value={form.matricola} onChange={set('matricola')} placeholder="Es. VA-2019-55207" />
          </Field>
          <Field label="Indirizzo di installazione">
            <input className={inputCls} value={form.indirizzo_installazione} onChange={set('indirizzo_installazione')} />
          </Field>
          <Field label="Data di posa">
            <input type="date" className={inputCls} value={form.data_posa} onChange={set('data_posa')} />
          </Field>
          <Field label="Ultimo intervento">
            <input type="date" className={inputCls} value={form.ultimo_intervento} onChange={set('ultimo_intervento')} />
          </Field>
          <Field label="Scadenza controllo periodico">
            <input type="date" className={inputCls} value={form.scadenza_controllo} onChange={set('scadenza_controllo')} />
          </Field>
          <Field label="Scadenza bollino">
            <input type="date" className={inputCls} value={form.scadenza_bollino} onChange={set('scadenza_bollino')} />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <textarea className={`${inputCls} h-20 py-2`} value={form.note} onChange={set('note')} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={busy || !form.cliente} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? 'Salvataggio…' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImpiantoDialog;
