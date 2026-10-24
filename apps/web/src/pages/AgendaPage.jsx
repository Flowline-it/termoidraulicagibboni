import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import InterventoDialog from '@/components/InterventoDialog';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingRows } from '@/components/FormBits';
import {
  TIPI_INTERVENTO,
  STATI_INTERVENTO,
  TONO_INTERVENTO,
  oggiISO,
  isBackoffice,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

const AgendaPage = () => {
  const { user } = useAuth();
  const backoffice = isBackoffice(user);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [interventi, setInterventi] = useState(null);
  const [soloMiei, setSoloMiei] = useState(user?.role === 'tecnico');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preset, setPreset] = useState({});

  const giorni = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const load = () => {
    const da = format(weekStart, 'yyyy-MM-dd');
    const a = format(addDays(weekStart, 6), 'yyyy-MM-dd');
    pb.collection('interventi')
      .getFullList({
        filter: `data >= "${da}" && data <= "${a} 23:59:59"`,
        expand: 'cliente,tecnico,impianto,commessa',
        sort: 'data,ora',
      })
      .then(setInterventi)
      .catch((e) => toast.error(e.message));
  };

  useEffect(load, [weekStart]);

  const visibili = useMemo(() => {
    if (!interventi) return [];
    return soloMiei ? interventi.filter((i) => i.tecnico === user?.id) : interventi;
  }, [interventi, soloMiei, user]);

  const perGiorno = (g) => {
    const key = format(g, 'yyyy-MM-dd');
    return visibili.filter((i) => String(i.data).slice(0, 10) === key);
  };

  const completa = async (i, ev) => {
    ev.stopPropagation();
    try {
      await pb.collection('interventi').update(i.id, { stato: 'completato' });
      toast.success('Intervento completato');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const sposta = (n) => setWeekStart((w) => addDays(w, n * 7));

  return (
    <div>
      <Helmet>
        <title>Agenda — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Agenda degli interventi con assegnazione di tecnico e data: ogni tecnico apre il telefono e vede la propria giornata."
        />
      </Helmet>

      <PageHeader caption="Fase 2 · Agenda interventi" title="Agenda">
        <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <input
            type="checkbox"
            checked={soloMiei}
            onChange={(e) => setSoloMiei(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--accent))]"
          />
          Solo i miei
        </label>
        {backoffice && (
          <Button
            onClick={() => {
              setEditing(null);
              setPreset({});
              setDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Nuovo intervento
          </Button>
        )}
      </PageHeader>

      <div className="mb-5 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => sposta(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Prec.
        </Button>
        <div className="text-center">
          <p className="font-display text-lg font-semibold capitalize">
            {format(weekStart, 'MMMM yyyy', { locale: it })}
          </p>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
          >
            Settimana corrente
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => sposta(1)}>
          Succ. <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {!interventi && <LoadingRows label="Caricamento agenda…" />}

      {interventi && (
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-7">
          {giorni.map((g) => {
            const rows = perGiorno(g);
            const isOggi = format(g, 'yyyy-MM-dd') === oggiISO();
            return (
              <div key={g.toISOString()} className={cn('min-h-32 bg-white p-2.5', isOggi && 'bg-accent/5')}>
                <div className={cn('mb-2 flex items-baseline justify-between border-b pb-1.5', isOggi ? 'border-accent' : 'border-border')}>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {format(g, 'EEE', { locale: it })}
                  </span>
                  <span className={cn('font-mono text-sm font-semibold', isOggi ? 'text-accent' : 'text-foreground')}>
                    {format(g, 'd')}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {rows.map((i) => {
                    const mio = i.tecnico === user?.id;
                    const editabile = backoffice || mio;
                    return (
                      <div
                        key={i.id}
                        onClick={() => {
                          if (!editabile) return;
                          setEditing(i);
                          setDialogOpen(true);
                        }}
                        className={cn(
                          'border-l-2 bg-background p-2 text-left',
                          i.stato === 'completato' ? 'border-emerald-500 opacity-70' : 'border-accent',
                          editabile && 'cursor-pointer hover:bg-muted',
                        )}
                      >
                        <p className="font-mono text-[11px] font-semibold text-accent">
                          {i.ora || '--:--'} · {TIPI_INTERVENTO[i.tipo]}
                        </p>
                        <p className="truncate text-xs font-semibold leading-snug">
                          {i.expand?.cliente?.nome}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {i.expand?.tecnico?.name || 'Da assegnare'}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <StatusBadge label={STATI_INTERVENTO[i.stato]} tone={TONO_INTERVENTO[i.stato]} />
                          {editabile && i.stato !== 'completato' && i.stato !== 'annullato' && (
                            <button
                              title="Segna completato"
                              onClick={(ev) => completa(i, ev)}
                              className="text-muted-foreground hover:text-emerald-600"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {rows.length === 0 && (
                    <p className="py-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      —
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {interventi && visibili.length === 0 && (
        <div className="mt-6">
          <EmptyState title="Nessun intervento questa settimana" hint="Programma un nuovo intervento o cambia settimana." />
        </div>
      )}

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Da smartphone il tecnico vede la propria giornata e aggiorna lo stato sul campo.{' '}
        <Link to="/rapportini" className="text-accent hover:underline">
          Vai ai rapportini
        </Link>
      </p>

      <InterventoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        intervento={editing}
        preset={preset}
        onSaved={load}
      />
    </div>
  );
};

export default AgendaPage;
