import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, SelectInput, inputCls, optsFrom } from '@/components/FormBits';
import { TIPI_CLIENTE } from '@/lib/constants';

const EMPTY = {
  nome: '',
  tipo: 'privato',
  telefono: '',
  email: '',
  indirizzo: '',
  citta: '',
  cap: '',
  referente: '',
  note: '',
};

const ClienteDialog = ({ open, onOpenChange, cliente, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(cliente ? { ...EMPTY, ...cliente } : EMPTY);
  }, [open, cliente]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (cliente) {
        await pb.collection('clienti').update(cliente.id, form);
        toast.success('Cliente aggiornato');
      } else {
        await pb.collection('clienti').create(form);
        toast.success('Cliente creato');
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {cliente ? 'Modifica cliente' : 'Nuovo cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome / Ragione sociale" className="sm:col-span-2">
            <input required className={inputCls} value={form.nome} onChange={set('nome')} placeholder="Es. Condominio Via Roma 12" />
          </Field>
          <Field label="Tipo">
            <SelectInput value={form.tipo} onChange={set('tipo')} options={optsFrom(TIPI_CLIENTE)} />
          </Field>
          <Field label="Telefono">
            <input className={inputCls} value={form.telefono} onChange={set('telefono')} placeholder="041 000 000" />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="cliente@email.it" />
          </Field>
          <Field label="Referente">
            <input className={inputCls} value={form.referente} onChange={set('referente')} placeholder="Nome del referente" />
          </Field>
          <Field label="Indirizzo" className="sm:col-span-2">
            <input className={inputCls} value={form.indirizzo} onChange={set('indirizzo')} placeholder="Via, numero civico" />
          </Field>
          <Field label="Città">
            <input className={inputCls} value={form.citta} onChange={set('citta')} placeholder="Mestre" />
          </Field>
          <Field label="CAP">
            <input className={inputCls} value={form.cap} onChange={set('cap')} placeholder="24100" />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <textarea className={`${inputCls} h-20 py-2`} value={form.note} onChange={set('note')} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? 'Salvataggio…' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteDialog;
