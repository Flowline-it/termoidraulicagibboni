import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, SelectInput, inputCls, optsFrom } from '@/components/FormBits';
import { TIPI_DOCUMENTO, oggiISO } from '@/lib/constants';

const EMPTY = {
  titolo: '',
  tipo: 'rapportino',
  cliente: '',
  impianto: '',
  commessa: '',
  data: oggiISO(),
  note: '',
};

const DocumentoDialog = ({ open, onOpenChange, preset = {}, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [clienti, setClienti] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      pb.collection('clienti').getFullList({ sort: 'nome' }),
      pb.collection('commesse').getFullList({ sort: '-created' }),
    ])
      .then(([c, k]) => {
        setClienti(c);
        setCommesse(k);
      })
      .catch(() => {});
    setForm({ ...EMPTY, ...preset, data: oggiISO() });
    setFile(null);
  }, [open]);

  const set = (k) => (e) =>
    setForm((f) => {
      const v = e.target ? e.target.value : e;
      const next = { ...f, [k]: v };
      if (k === 'cliente') next.commessa = '';
      return next;
    });

  const commesseCliente = commesse.filter((k) => !form.cliente || k.cliente === form.cliente);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ''));
      if (file) fd.append('file', file);
      await pb.collection('documenti').create(fd);
      toast.success('Documento archiviato');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Caricamento non riuscito');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Archivia documento o fotografia</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Titolo (nomenclatura archivio)" className="sm:col-span-2">
            <input
              required
              className={`${inputCls} font-mono`}
              value={form.titolo}
              onChange={set('titolo')}
              placeholder="2026-09_RAP_Controllo_Cliente"
            />
          </Field>
          <Field label="Tipo">
            <SelectInput value={form.tipo} onChange={set('tipo')} options={optsFrom(TIPI_DOCUMENTO)} />
          </Field>
          <Field label="Data">
            <input type="date" className={inputCls} value={form.data} onChange={set('data')} />
          </Field>
          <Field label="Cliente">
            <SelectInput
              value={form.cliente}
              onChange={set('cliente')}
              placeholder="—"
              options={clienti.map((c) => ({ value: c.id, label: c.nome }))}
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
          <Field label="File o fotografia" className="sm:col-span-2">
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="w-full text-sm text-muted-foreground file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-navy file:px-4 file:font-mono file:text-xs file:uppercase file:tracking-widest file:text-navy-foreground hover:file:bg-navy/90"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="font-mono text-[11px] text-muted-foreground">
              Le foto scattate da smartphone vengono allegate qui e associate a cliente e commessa.
            </p>
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <textarea className={`${inputCls} h-16 py-2`} value={form.note} onChange={set('note')} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? 'Caricamento…' : 'Archivia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentoDialog;
