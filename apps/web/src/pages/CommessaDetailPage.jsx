import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Plus,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  FileCheck2,
  Trash2,
  Download,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import InterventoDialog from '@/components/InterventoDialog';
import RapportinoDialog from '@/components/RapportinoDialog';
import DocumentoDialog from '@/components/DocumentoDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState, LoadingRows, Field, SelectInput, inputCls, optsFrom } from '@/components/FormBits';
import {
  STATI_COMMESSA,
  TONO_COMMESSA,
  TIPI_INTERVENTO,
  STATI_INTERVENTO,
  TONO_INTERVENTO,
  TIPI_RAPPORTINO,
  STATI_RAPPORTINO,
  TONO_RAPPORTINO,
  PAGAMENTI,
  TONO_PAGAMENTO,
  TIPI_DOCUMENTO,
  STATI_DOC_RICHIESTO,
  TONO_DOC_RICHIESTO,
  ORDINE_STATI_DOC,
  TIPI_IMPIANTO,
  fmtData,
  fmtEuro,
  isBackoffice,
} from '@/lib/constants';

const Caption = ({ children }) => (
  <h2 className="mb-3 border-b border-border pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
    {children}
  </h2>
);

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

const CommessaDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [commessa, setCommessa] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [interventi, setInterventi] = useState([]);
  const [rapportini, setRapportini] = useState([]);
  const [documenti, setDocumenti] = useState([]);
  const [richiesti, setRichiesti] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [interventoOpen, setInterventoOpen] = useState(false);
  const [rapportinoOpen, setRapportinoOpen] = useState(false);
  const [documentoOpen, setDocumentoOpen] = useState(false);
  const [nuovoDoc, setNuovoDoc] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    pb.collection('commesse')
      .getOne(id, { expand: 'cliente,impianto' })
      .then((k) => {
        setCommessa(k);
        const fCommessa = `commessa = "${id}"`;
        pb.collection('interventi')
          .getFullList({ filter: fCommessa, sort: 'data,ora', expand: 'tecnico' })
          .then((ints) => {
            setInterventi(ints);
            if (ints.length === 0) {
              setRapportini([]);
              return;
            }
            const fRap = ints.map((i) => `intervento = "${i.id}"`).join(' || ');
            pb.collection('rapportini')
              .getFullList({ filter: fRap, sort: '-data', expand: 'tecnico' })
              .then(setRapportini)
              .catch(() => {});
          })
          .catch(() => {});
        pb.collection('documenti')
          .getFullList({ filter: fCommessa, sort: '-data' })
          .then(setDocumenti)
          .catch(() => {});
        pb.collection('documenti_richiesti')
          .getFullList({ filter: fCommessa, sort: 'created' })
          .then(setRichiesti)
          .catch(() => {});
      })
      .catch(() => setNotFound(true));
  };

  useEffect(load, [id]);

  const openEdit = () => {
    setEditForm({
      stato: commessa.stato,
      avanzamento: commessa.avanzamento || 0,
      data_chiusura: dateOnly(commessa.data_chiusura),
      descrizione: commessa.descrizione || '',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await pb.collection('commesse').update(id, {
        ...editForm,
        avanzamento: Number(editForm.avanzamento) || 0,
      });
      toast.success('Commessa aggiornata');
      setEditOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const aggiungiRichiesto = async (e) => {
    e.preventDefault();
    const nome = nuovoDoc.trim();
    if (!nome) return;
    try {
      await pb.collection('documenti_richiesti').create({
        commessa: id,
        nome,
        stato: 'da_richiedere',
      });
      setNuovoDoc('');
      toast.success('Documento aggiunto alla lista');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const avanzaRichiesto = async (doc) => {
    const idx = ORDINE_STATI_DOC.indexOf(doc.stato);
    const next = ORDINE_STATI_DOC[Math.min(idx + 1, ORDINE_STATI_DOC.length - 1)];
    try {
      await pb.collection('documenti_richiesti').update(doc.id, { stato: next });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const eliminaRichiesto = async (doc) => {
    try {
      await pb.collection('documenti_richiesti').delete(doc.id);
      toast.success('Voce eliminata');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (notFound)
    return <EmptyState title="Commessa non trovata" hint="Il record potrebbe essere stato eliminato." />;
  if (!commessa) return <LoadingRows label="Caricamento commessa…" />;

  const cliente = commessa.expand?.cliente;
  const impianto = commessa.expand?.impianto;
  const preset = { cliente: commessa.cliente, impianto: commessa.impianto || '', commessa: id };
  const daRicevere = richiesti.filter((d) => d.stato !== 'ricevuto').length;
  const totIncassato = rapportini
    .filter((r) => r.pagamento !== 'da_incassare')
    .reduce((s, r) => s + (r.importo || 0), 0);

  return (
    <div>
      <Helmet>
        <title>{commessa.codice} · {commessa.titolo} — Commesse · Flowline</title>
        <meta
          name="description"
          content={`Commessa ${commessa.codice}: interventi, rapportini, documenti e stato di avanzamento in un unico punto.`}
        />
      </Helmet>

      <Link
        to="/commesse"
        className="mb-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-3 w-3" /> Tutte le commesse
      </Link>

      {/* Intestazione commessa */}
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-semibold text-accent">{commessa.codice}</span>
              <StatusBadge label={STATI_COMMESSA[commessa.stato]} tone={TONO_COMMESSA[commessa.stato]} />
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{commessa.titolo}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {cliente && (
                <Link to={`/clienti/${cliente.id}`} className="font-semibold text-foreground hover:text-accent">
                  {cliente.nome}
                </Link>
              )}
              {impianto && (
                <span>
                  {TIPI_IMPIANTO[impianto.tipo]} · {impianto.marca} {impianto.modello}
                </span>
              )}
              <span className="font-mono text-xs">
                aperta il {fmtData(commessa.data_apertura)}
                {commessa.data_chiusura ? ` · chiusa il ${fmtData(commessa.data_chiusura)}` : ''}
              </span>
            </div>
            {commessa.descrizione && (
              <p className="mt-3 max-w-2xl border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm">
                {commessa.descrizione}
              </p>
            )}
          </div>
          {backoffice && (
            <Button variant="outline" onClick={openEdit}>
              <Pencil className="mr-1 h-4 w-4" /> Modifica
            </Button>
          )}
        </div>

        {/* Avanzamento a colpo d'occhio */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="border border-border bg-card p-4 sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Avanzamento lavori
              </span>
              <span className="font-mono text-lg font-semibold">{commessa.avanzamento || 0}%</span>
            </div>
            <div className="h-2.5 bg-muted">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${commessa.avanzamento || 0}%` }}
              />
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {interventi.filter((i) => i.stato === 'completato').length} di {interventi.length} interventi completati
              {daRicevere > 0 ? ` · ${daRicevere} documenti ancora da ricevere` : ''}
            </p>
          </div>
          <div className="border border-border bg-card p-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Incassato a rapportino
            </span>
            <p className="mt-1 font-display text-2xl font-bold">{fmtEuro(totIncassato)}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{rapportini.length} rapportini collegati</p>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Interventi */}
        <section>
          <div className="flex items-center justify-between">
            <Caption>
              <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Interventi ({interventi.length})
            </Caption>
            {backoffice && (
              <Button size="sm" variant="outline" className="mb-3" onClick={() => setInterventoOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Intervento
              </Button>
            )}
          </div>
          {interventi.length === 0 && (
            <EmptyState title="Nessun intervento" hint="Programma il primo intervento per questa commessa." />
          )}
          <ul className="divide-y divide-border">
            {interventi.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {TIPI_INTERVENTO[i.tipo]} · {fmtData(i.data)}
                    {i.ora ? ` ore ${i.ora}` : ''}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {i.expand?.tecnico?.name || 'Tecnico da assegnare'}
                    {i.note ? ` · ${i.note}` : ''}
                  </p>
                </div>
                <StatusBadge label={STATI_INTERVENTO[i.stato]} tone={TONO_INTERVENTO[i.stato]} />
              </li>
            ))}
          </ul>
        </section>

        {/* Rapportini */}
        <section>
          <div className="flex items-center justify-between">
            <Caption>
              <ClipboardList className="mr-1 inline h-3.5 w-3.5" /> Rapportini ({rapportini.length})
            </Caption>
            <Button size="sm" variant="outline" className="mb-3" onClick={() => setRapportinoOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Rapportino
            </Button>
          </div>
          {rapportini.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">
              Nessun rapportino collegato: vengono associati tramite gli interventi della commessa.
            </p>
          )}
          <ul className="divide-y divide-border">
            {rapportini.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    <span className="font-mono text-xs text-accent">{r.numero || '—'}</span> ·{' '}
                    {TIPI_RAPPORTINO[r.tipo_intervento] || 'Intervento'} · {fmtData(r.data)}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {r.expand?.tecnico?.name || '—'} · {PAGAMENTI[r.pagamento] || '—'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-sm font-semibold">{fmtEuro(r.importo)}</span>
                  <StatusBadge label={STATI_RAPPORTINO[r.stato]} tone={TONO_RAPPORTINO[r.stato]} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Documenti */}
        <section>
          <div className="flex items-center justify-between">
            <Caption>
              <FolderOpen className="mr-1 inline h-3.5 w-3.5" /> Documenti e fotografie ({documenti.length})
            </Caption>
            <Button size="sm" variant="outline" className="mb-3" onClick={() => setDocumentoOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Documento
            </Button>
          </div>
          {documenti.length === 0 && (
            <EmptyState title="Nessun documento" hint="Archivia rapportini, foto del cantiere e certificati." />
          )}
          <ul className="divide-y divide-border">
            {documenti.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-semibold">{d.titolo}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{fmtData(d.data)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={TIPI_DOCUMENTO[d.tipo]} tone="gray" />
                  {d.file && (
                    <a
                      href={pb.files.getURL(d, d.file)}
                      target="_blank"
                      rel="noreferrer"
                      title="Apri il file"
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-accent hover:text-accent"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Documenti da richiedere */}
        <section>
          <Caption>
            <FileCheck2 className="mr-1 inline h-3.5 w-3.5" /> Documenti da richiedere ({richiesti.length})
          </Caption>
          <p className="mb-3 text-sm text-muted-foreground">
            Alla chiusura degli interventi, l'amministrazione segue qui lo stato di ogni documento da
            richiedere al cliente o all'ente.
          </p>
          <form onSubmit={aggiungiRichiesto} className="mb-4 flex gap-2">
            <input
              className={inputCls}
              placeholder="Es. Dichiarazione di conformità, libretto aggiornato…"
              value={nuovoDoc}
              onChange={(e) => setNuovoDoc(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={!nuovoDoc.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          {richiesti.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Nessun documento in attesa.</p>
          )}
          <ul className="divide-y divide-border">
            {richiesti.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <p className="min-w-0 truncate text-sm">{d.nome}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={STATI_DOC_RICHIESTO[d.stato]} tone={TONO_DOC_RICHIESTO[d.stato]} />
                  {d.stato !== 'ricevuto' && (
                    <button
                      onClick={() => avanzaRichiesto(d)}
                      title="Avanza stato"
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-accent hover:text-accent"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {backoffice && (
                    <button
                      onClick={() => eliminaRichiesto(d)}
                      title="Elimina"
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Dialog modifica commessa */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Modifica {commessa.codice}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={saveEdit} className="grid grid-cols-1 gap-4">
              <Field label="Stato">
                <SelectInput
                  value={editForm.stato}
                  onChange={(v) => setEditForm((f) => ({ ...f, stato: v }))}
                  options={optsFrom(STATI_COMMESSA)}
                />
              </Field>
              <Field label={`Avanzamento: ${editForm.avanzamento}%`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editForm.avanzamento}
                  onChange={(e) => setEditForm((f) => ({ ...f, avanzamento: e.target.value }))}
                  className="w-full accent-[hsl(var(--accent))]"
                />
              </Field>
              <Field label="Data chiusura">
                <input
                  type="date"
                  className={inputCls}
                  value={editForm.data_chiusura}
                  onChange={(e) => setEditForm((f) => ({ ...f, data_chiusura: e.target.value }))}
                />
              </Field>
              <Field label="Descrizione">
                <textarea
                  className={`${inputCls} h-20 py-2`}
                  value={editForm.descrizione}
                  onChange={(e) => setEditForm((f) => ({ ...f, descrizione: e.target.value }))}
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {busy ? 'Salvataggio…' : 'Salva'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <InterventoDialog open={interventoOpen} onOpenChange={setInterventoOpen} preset={preset} onSaved={load} />
      <RapportinoDialog open={rapportinoOpen} onOpenChange={setRapportinoOpen} preset={preset} onSaved={load} />
      <DocumentoDialog
        open={documentoOpen}
        onOpenChange={setDocumentoOpen}
        preset={{ cliente: commessa.cliente, commessa: id }}
        onSaved={load}
      />
    </div>
  );
};

export default CommessaDetailPage;
