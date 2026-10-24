import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import DocumentoDialog from '@/components/DocumentoDialog';
import { Button } from '@/components/ui/button';
import { SelectInput, inputCls, optsFrom, EmptyState, LoadingRows } from '@/components/FormBits';
import { TIPI_DOCUMENTO, fmtData, isBackoffice } from '@/lib/constants';

const TONO_TIPO_DOC = {
  rapportino: 'navy',
  foto: 'green',
  bollino: 'amber',
  certificato: 'orange',
  contratto: 'navy',
  libretto: 'gray',
  altro: 'gray',
};

const DocumentiPage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [documenti, setDocumenti] = useState(null);
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('tutti');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    pb.collection('documenti')
      .getFullList({ expand: 'cliente,commessa,impianto', sort: '-data' })
      .then(setDocumenti)
      .catch((e) => toast.error(e.message));
  };

  useEffect(load, []);

  const filtrati = useMemo(() => {
    if (!documenti) return [];
    const q = search.trim().toLowerCase();
    return documenti.filter((d) => {
      if (tipo !== 'tutti' && d.tipo !== tipo) return false;
      if (!q) return true;
      return [d.titolo, d.note, d.expand?.cliente?.nome, d.expand?.commessa?.codice, d.expand?.commessa?.titolo]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [documenti, search, tipo]);

  const elimina = async (d) => {
    if (!window.confirm(`Eliminare "${d.titolo}" dall'archivio?`)) return;
    try {
      await pb.collection('documenti').delete(d.id);
      toast.success('Documento eliminato');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isFoto = (d) => d.tipo === 'foto' || (d.file && /\.(jpe?g|png|gif|webp|svg)$/i.test(d.file));

  return (
    <div>
      <Helmet>
        <title>Documenti — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Archivio documenti con nomenclatura coerente e ricerca: rapportini, fotografie, bollini, certificati e contratti collegati a clienti e commesse."
        />
      </Helmet>

      <PageHeader caption="Archivio · Nomenclatura coerente" title="Documenti">
        <Button onClick={() => setDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-1 h-4 w-4" /> Archivia documento
        </Button>
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Cerca per titolo, cliente o commessa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectInput
          value={tipo}
          onChange={setTipo}
          options={[{ value: 'tutti', label: 'Tutti i tipi' }, ...optsFrom(TIPI_DOCUMENTO)]}
        />
      </div>

      {!documenti && <LoadingRows label="Caricamento archivio…" />}
      {documenti && filtrati.length === 0 && (
        <EmptyState title="Nessun documento trovato" hint="Modifica i filtri o archivia un nuovo documento." />
      )}

      {documenti && filtrati.length > 0 && (
        <ul className="divide-y divide-border border-t border-b border-border">
          {filtrati.map((d) => (
            <li key={d.id} className="group flex items-center gap-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
                {isFoto(d) ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={TIPI_DOCUMENTO[d.tipo]} tone={TONO_TIPO_DOC[d.tipo]} />
                  <span className="font-mono text-[11px] text-muted-foreground">{fmtData(d.data)}</span>
                </div>
                <p className="mt-0.5 truncate font-mono text-sm font-semibold">{d.titolo}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {d.expand?.cliente ? (
                    <Link to={`/clienti/${d.cliente}`} className="hover:text-accent">
                      {d.expand.cliente.nome}
                    </Link>
                  ) : (
                    'Senza cliente'
                  )}
                  {d.expand?.commessa && (
                    <>
                      {' · '}
                      <Link to={`/commesse/${d.commessa}`} className="text-accent hover:underline">
                        {d.expand.commessa.codice}
                      </Link>
                    </>
                  )}
                  {d.expand?.impianto ? ` · ${d.expand.impianto.marca} ${d.expand.impianto.modello}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.file && (
                  <a
                    href={pb.files.getURL(d, d.file)}
                    target="_blank"
                    rel="noreferrer"
                    title="Apri o scarica il file"
                    className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-accent hover:text-accent"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                {backoffice && (
                  <button
                    onClick={() => elimina(d)}
                    title="Elimina documento"
                    className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <DocumentoDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
    </div>
  );
};

export default DocumentiPage;
