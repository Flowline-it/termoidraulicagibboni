import { format, differenceInCalendarDays } from 'date-fns';
import { it } from 'date-fns/locale';

export const RUOLI = {
  titolare: 'Titolare',
  amministrazione: 'Amministrazione',
  tecnico: 'Tecnico',
};

export const TIPI_CLIENTE = {
  privato: 'Privato',
  azienda: 'Azienda',
  condominio: 'Condominio',
};

export const TIPI_IMPIANTO = {
  caldaia: 'Caldaia',
  caldaia_condominiale: 'Caldaia condominiale',
  climatizzatore: 'Climatizzatore',
  pompa_di_calore: 'Pompa di calore',
  scaldacqua: 'Scaldacqua',
  altro: 'Altro',
};

export const STATI_CHIAMATA = {
  da_chiamare: 'Da chiamare',
  contattato: 'Contattato',
  appuntamento_fissato: 'Appuntamento fissato',
  eseguito: 'Eseguito',
};

export const ORDINE_STATI_CHIAMATA = [
  'da_chiamare',
  'contattato',
  'appuntamento_fissato',
  'eseguito',
];

export const PRIORITA = { alta: 'Alta', media: 'Media', bassa: 'Bassa' };

export const STATI_COMMESSA = {
  aperta: 'Aperta',
  in_corso: 'In corso',
  sospesa: 'Sospesa',
  completata: 'Completata',
  chiusa: 'Chiusa',
};

export const TIPI_INTERVENTO = {
  sopralluogo: 'Sopralluogo',
  manutenzione: 'Manutenzione',
  controllo_periodico: 'Controllo periodico',
  installazione: 'Installazione',
  riparazione: 'Riparazione',
};

export const STATI_INTERVENTO = {
  programmato: 'Programmato',
  in_corso: 'In corso',
  completato: 'Completato',
  annullato: 'Annullato',
};

export const TIPI_RAPPORTINO = {
  controllo_periodico: 'Controllo periodico',
  manutenzione_ordinaria: 'Manutenzione ordinaria',
  riparazione: 'Riparazione',
  sopralluogo: 'Sopralluogo',
  bollino: 'Bollino',
};

export const PAGAMENTI = {
  contanti: 'Contanti',
  pos: 'POS',
  bonifico: 'Bonifico',
  assegno: 'Assegno',
  da_incassare: 'Da incassare',
};

export const STATI_RAPPORTINO = {
  bozza: 'Bozza',
  chiuso: 'Chiuso',
  inviato_ufficio: 'Inviato in ufficio',
  fatturato: 'Fatturato',
};

export const TIPI_DOCUMENTO = {
  rapportino: 'Rapportino',
  foto: 'Fotografia',
  bollino: 'Bollino',
  certificato: 'Certificato',
  contratto: 'Contratto',
  libretto: 'Libretto',
  altro: 'Altro',
};

export const STATI_DOC_RICHIESTO = {
  da_richiedere: 'Da richiedere',
  richiesto: 'Richiesto',
  ricevuto: 'Ricevuto',
};

export const ORDINE_STATI_DOC = ['da_richiedere', 'richiesto', 'ricevuto'];

// Toni colore per i badge di stato
export const TONO_CHIAMATA = {
  da_chiamare: 'orange',
  contattato: 'amber',
  appuntamento_fissato: 'navy',
  eseguito: 'green',
};
export const TONO_PRIORITA = { alta: 'red', media: 'amber', bassa: 'gray' };
export const TONO_COMMESSA = {
  aperta: 'orange',
  in_corso: 'navy',
  sospesa: 'amber',
  completata: 'green',
  chiusa: 'gray',
};
export const TONO_INTERVENTO = {
  programmato: 'navy',
  in_corso: 'orange',
  completato: 'green',
  annullato: 'gray',
};
export const TONO_RAPPORTINO = {
  bozza: 'gray',
  chiuso: 'navy',
  inviato_ufficio: 'amber',
  fatturato: 'green',
};
export const TONO_PAGAMENTO = {
  contanti: 'green',
  pos: 'green',
  bonifico: 'navy',
  assegno: 'amber',
  da_incassare: 'red',
};
export const TONO_DOC_RICHIESTO = {
  da_richiedere: 'orange',
  richiesto: 'amber',
  ricevuto: 'green',
};
export const TONO_TIPO_CLIENTE = { privato: 'gray', azienda: 'navy', condominio: 'amber' };

// ---- date helpers -------------------------------------------------------
export const toDate = (v) => {
  if (!v) return null;
  const d = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtData = (v) => {
  const d = toDate(v);
  return d ? format(d, 'd MMM yyyy', { locale: it }) : '—';
};

export const fmtDataLunga = (v) => {
  const d = toDate(v);
  return d ? format(d, 'EEEE d MMMM yyyy', { locale: it }) : '—';
};

export const giorniMancanti = (v) => {
  const d = toDate(v);
  return d ? differenceInCalendarDays(d, new Date()) : null;
};

export const oggiISO = () => format(new Date(), 'yyyy-MM-dd');

// Tono di una scadenza in base ai giorni mancanti
export const tonoScadenza = (v) => {
  const g = giorniMancanti(v);
  if (g === null) return 'gray';
  if (g < 0) return 'red';
  if (g <= 7) return 'orange';
  if (g <= 30) return 'amber';
  return 'green';
};

export const testoScadenza = (v) => {
  const g = giorniMancanti(v);
  if (g === null) return '—';
  if (g < 0) return `scaduta da ${-g} gg`;
  if (g === 0) return 'scade oggi';
  if (g === 1) return 'scade domani';
  return `tra ${g} gg`;
};

// ---- permessi -----------------------------------------------------------
export const isBackoffice = (user) =>
  user?.role === 'titolare' || user?.role === 'amministrazione';

export const fmtEuro = (n) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
