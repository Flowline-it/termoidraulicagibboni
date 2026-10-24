/// <reference path="../pb_data/types.d.ts" />

// Dati demo realistici per Termoidraulica Gibboni S.r.l. (provincia di Venezia).
// Riferimento temporale: "oggi" = 9 settembre 2026.

migrate(
  (app) => {
    const existing = app.findRecordsByFilter("clienti", "id != ''", "", 1, 0);
    if (existing.length > 0) return; // già popolato: no-op intenzionale

    const col = (name) => app.findCollectionByNameOrId(name);
    const clientiCol = col("clienti");
    const impiantiCol = col("impianti");
    const chiamateCol = col("chiamate");
    const commesseCol = col("commesse");
    const interventiCol = col("interventi");
    const rapportiniCol = col("rapportini");
    const documentiCol = col("documenti");
    const docRichCol = col("documenti_richiesti");

    const mk = (collection, data) => {
      const r = new Record(collection);
      for (const k in data) r.set(k, data[k]);
      app.save(r);
      return r;
    };
    const d = (s) => (s ? s + " 00:00:00.000Z" : "");

    // ---------------- clienti ----------------
    const cViaRoma = mk(clientiCol, {
      nome: "Condominio Via Roma 12",
      tipo: "condominio",
      telefono: "041 210 4471",
      email: "amministrazione@studiofabbri.ve.it",
      indirizzo: "Via Roma 12",
      citta: "Mirano",
      cap: "30035",
      referente: "Rag. Franco Fabbri (amministratore)",
      note: "Centrale termica a servizio di 18 unità. Accesso locale caldaia concordato con il portinaio.",
    });
    const cBelvedere = mk(clientiCol, {
      nome: "Hotel Belvedere S.r.l.",
      tipo: "azienda",
      telefono: "041 402 118",
      email: "direzione@hotelbelvedere.ve.it",
      indirizzo: "Gran Viale Santa Maria Elisabetta 27",
      citta: "Venezia Lido",
      cap: "30126",
      referente: "Sig.ra Elena Torri (direttrice)",
      note: "Contratto di manutenzione programmata attivo. Interventi preferibilmente al mattino.",
    });
    const cColombo = mk(clientiCol, {
      nome: "Famiglia Colombo",
      tipo: "privato",
      telefono: "348 221 9045",
      email: "roberto.colombo@libero.it",
      indirizzo: "Via Miranese 84",
      citta: "Mestre",
      cap: "30174",
      referente: "Sig. Roberto Colombo",
    });
    const cDaNino = mk(clientiCol, {
      nome: "Ristorante Da Nino",
      tipo: "azienda",
      telefono: "041 572 330",
      email: "info@ristorantedanino.it",
      indirizzo: "Corso del Popolo 51",
      citta: "Chioggia",
      cap: "30015",
      referente: "Sig. Nino Carrara",
      note: "Cucina professionale: bollino blu obbligatorio ogni anno.",
    });
    const cGervasoni = mk(clientiCol, {
      nome: "Sig.ra Maria Gervasoni",
      tipo: "privato",
      telefono: "347 665 1208",
      email: "maria.gervasoni@gmail.com",
      indirizzo: "Via Roma 4",
      citta: "Spinea",
      cap: "30038",
    });
    const cParco = mk(clientiCol, {
      nome: "Condominio Parco delle Rose",
      tipo: "condominio",
      telefono: "041 611 209",
      email: "parcodellerose@amministrazioni.it",
      indirizzo: "Via delle Rose 3",
      citta: "Dolo",
      cap: "30031",
      referente: "Geom. Alberto Signorelli",
    });
    const cPanificio = mk(clientiCol, {
      nome: "Panificio Tre Spighe",
      tipo: "azienda",
      telefono: "041 790 442",
      email: "trespighe@virgilio.it",
      indirizzo: "Via Jesolo 19",
      citta: "San Donà di Piave",
      cap: "30027",
      referente: "Sig. Davide Ongaro",
    });
    const cMarchetti = mk(clientiCol, {
      nome: "Sig. Paolo Marchetti",
      tipo: "privato",
      telefono: "335 802 7714",
      email: "p.marchetti@outlook.it",
      indirizzo: "Via Matteotti 22",
      citta: "Noale",
      cap: "30033",
    });
    const cFitClub = mk(clientiCol, {
      nome: "Palestra FitClub",
      tipo: "azienda",
      telefono: "041 335 890",
      email: "info@fitclubmestre.it",
      indirizzo: "Via Torino 96",
      citta: "Mestre",
      cap: "30172",
      referente: "Sig. Simone Vitali",
    });
    const cRiva = mk(clientiCol, {
      nome: "Famiglia Riva",
      tipo: "privato",
      telefono: "349 118 5520",
      email: "famiglia.riva@gmail.com",
      indirizzo: "Via Castellana 7",
      citta: "Martellago",
      cap: "30030",
      referente: "Sig.ra Chiara Riva",
      note: "Interessati a sostituire la caldaia con pompa di calore: sopralluogo fissato.",
    });
    const cNotaio = mk(clientiCol, {
      nome: "Studio Notarile Dott. Sessa",
      tipo: "azienda",
      telefono: "041 249 011",
      email: "segreteria@notaiosessa.it",
      indirizzo: "Piazza Ferretto 14",
      citta: "Mestre",
      cap: "30174",
    });
    const cLocatelli = mk(clientiCol, {
      nome: "Sig.ra Anna Locatelli",
      tipo: "privato",
      telefono: "340 992 6317",
      email: "anna.locatelli@tiscali.it",
      indirizzo: "Via Mestrina 30",
      citta: "Mestre",
      cap: "30172",
    });

    // ---------------- impianti ----------------
    const iViaRoma1 = mk(impiantiCol, {
      cliente: cViaRoma.id,
      tipo: "caldaia_condominiale",
      marca: "Riello",
      modello: "Condexa Pro 100",
      matricola: "RL-2014-88412",
      indirizzo_installazione: "Via Roma 12, locale caldaia interrato, Mirano",
      data_posa: d("2014-10-02"),
      ultimo_intervento: d("2025-09-15"),
      scadenza_controllo: d("2026-09-12"),
      scadenza_bollino: d("2026-10-01"),
      potenza_kw: 98,
      note: "Impianto vicino a fine vita: valutare sostituzione (commessa aperta).",
    });
    const iViaRoma2 = mk(impiantiCol, {
      cliente: cViaRoma.id,
      tipo: "caldaia_condominiale",
      marca: "Riello",
      modello: "Condexa Pro 100",
      matricola: "RL-2014-88413",
      indirizzo_installazione: "Via Roma 12, locale caldaia interrato, Mirano",
      data_posa: d("2014-10-02"),
      ultimo_intervento: d("2025-09-15"),
      scadenza_controllo: d("2026-09-12"),
      scadenza_bollino: d("2026-10-01"),
      potenza_kw: 98,
    });
    const iBelvedere1 = mk(impiantiCol, {
      cliente: cBelvedere.id,
      tipo: "caldaia",
      marca: "Vaillant",
      modello: "ecoTEC plus VC 246",
      matricola: "VA-2019-55207",
      indirizzo_installazione: "Gran Viale Santa Maria Elisabetta 27, centrale termica, Venezia Lido",
      data_posa: d("2019-04-11"),
      ultimo_intervento: d("2026-06-20"),
      scadenza_controllo: d("2026-09-25"),
      scadenza_bollino: d("2026-09-15"),
      potenza_kw: 24,
    });
    const iBelvedere2 = mk(impiantiCol, {
      cliente: cBelvedere.id,
      tipo: "climatizzatore",
      marca: "Daikin",
      modello: "Multi Split 4MXM80N",
      matricola: "DK-2022-31098",
      indirizzo_installazione: "Gran Viale Santa Maria Elisabetta 27, piano camere, Venezia Lido",
      data_posa: d("2022-05-30"),
      ultimo_intervento: d("2026-06-20"),
      scadenza_controllo: d("2027-06-01"),
      potenza_kw: 8,
    });
    const iColombo1 = mk(impiantiCol, {
      cliente: cColombo.id,
      tipo: "caldaia",
      marca: "Baxi",
      modello: "Luna Duo-tec E 24",
      matricola: "BX-2016-77450",
      indirizzo_installazione: "Via Miranese 84, cucina, Mestre",
      data_posa: d("2016-11-08"),
      ultimo_intervento: d("2025-08-28"),
      scadenza_controllo: d("2026-08-28"),
      scadenza_bollino: d("2027-03-10"),
      potenza_kw: 24,
    });
    const iColombo2 = mk(impiantiCol, {
      cliente: cColombo.id,
      tipo: "climatizzatore",
      marca: "Mitsubishi",
      modello: "Kirigamine MSZ-AP35",
      matricola: "MI-2021-09334",
      indirizzo_installazione: "Via Miranese 84, soggiorno, Mestre",
      data_posa: d("2021-06-14"),
      ultimo_intervento: d("2025-09-30"),
      scadenza_controllo: d("2026-09-28"),
      potenza_kw: 3.5,
    });
    const iDaNino1 = mk(impiantiCol, {
      cliente: cDaNino.id,
      tipo: "caldaia",
      marca: "Ferroli",
      modello: "Divacondens D 28",
      matricola: "FE-2018-41126",
      indirizzo_installazione: "Corso del Popolo 51, retro cucina, Chioggia",
      data_posa: d("2018-03-22"),
      ultimo_intervento: d("2025-09-09"),
      scadenza_controllo: d("2026-09-09"),
      scadenza_bollino: d("2026-09-09"),
      potenza_kw: 28,
    });
    const iDaNino2 = mk(impiantiCol, {
      cliente: cDaNino.id,
      tipo: "climatizzatore",
      marca: "Daikin",
      modello: "Perfera FTXM50R",
      matricola: "DK-2020-66781",
      indirizzo_installazione: "Corso del Popolo 51, sala, Chioggia",
      data_posa: d("2020-04-18"),
      ultimo_intervento: d("2026-04-18"),
      scadenza_controllo: d("2027-04-18"),
      potenza_kw: 5,
    });
    const iGervasoni = mk(impiantiCol, {
      cliente: cGervasoni.id,
      tipo: "scaldacqua",
      marca: "Junkers",
      modello: "HydroPower WTD 14",
      matricola: "JU-2015-20987",
      indirizzo_installazione: "Via Roma 4, bagno, Spinea",
      data_posa: d("2015-09-01"),
      ultimo_intervento: d("2026-09-08"),
      scadenza_controllo: d("2026-11-20"),
      potenza_kw: 14,
    });
    const iParco = mk(impiantiCol, {
      cliente: cParco.id,
      tipo: "caldaia_condominiale",
      marca: "Viessmann",
      modello: "Vitodens 200-W 150",
      matricola: "VS-2017-12045",
      indirizzo_installazione: "Via delle Rose 3, centrale termica, Dolo",
      data_posa: d("2017-02-15"),
      ultimo_intervento: d("2026-09-02"),
      scadenza_controllo: d("2026-09-18"),
      scadenza_bollino: d("2026-09-30"),
      potenza_kw: 150,
    });
    const iPanificio = mk(impiantiCol, {
      cliente: cPanificio.id,
      tipo: "caldaia",
      marca: "Riello",
      modello: "Start Condens 25",
      matricola: "RL-2013-65502",
      indirizzo_installazione: "Via Jesolo 19, laboratorio, San Donà di Piave",
      data_posa: d("2013-06-25"),
      ultimo_intervento: d("2026-09-02"),
      scadenza_controllo: d("2026-08-15"),
      scadenza_bollino: d("2026-08-30"),
      potenza_kw: 25,
      note: "Locale caldaia da adeguare: commessa sospesa in attesa del muratore.",
    });
    const iMarchetti = mk(impiantiCol, {
      cliente: cMarchetti.id,
      tipo: "caldaia",
      marca: "Baxi",
      modello: "Luna 3 Comfort 24",
      matricola: "BX-2012-30815",
      indirizzo_installazione: "Via Matteotti 22, balcone, Noale",
      data_posa: d("2012-10-30"),
      ultimo_intervento: d("2026-09-07"),
      scadenza_controllo: d("2027-05-12"),
      scadenza_bollino: d("2026-12-01"),
      potenza_kw: 24,
    });
    const iFitClub = mk(impiantiCol, {
      cliente: cFitClub.id,
      tipo: "pompa_di_calore",
      marca: "Daikin",
      modello: "Altherma 3 H 16",
      matricola: "DK-2023-18420",
      indirizzo_installazione: "Via Torino 96, centrale tecnica, Mestre",
      data_posa: d("2023-09-12"),
      ultimo_intervento: d("2025-09-22"),
      scadenza_controllo: d("2026-09-22"),
      potenza_kw: 16,
    });
    const iRiva = mk(impiantiCol, {
      cliente: cRiva.id,
      tipo: "climatizzatore",
      marca: "Mitsubishi",
      modello: "Dual Split MXZ-2F53",
      matricola: "MI-2019-44771",
      indirizzo_installazione: "Via Castellana 7, camere, Martellago",
      data_posa: d("2019-07-02"),
      ultimo_intervento: d("2026-02-14"),
      scadenza_controllo: d("2027-02-14"),
      potenza_kw: 5.3,
    });
    const iNotaio = mk(impiantiCol, {
      cliente: cNotaio.id,
      tipo: "climatizzatore",
      marca: "Daikin",
      modello: "Stylish FTXA42",
      matricola: "DK-2021-90312",
      indirizzo_installazione: "Piazza Ferretto 14, uffici, Mestre",
      data_posa: d("2021-10-05"),
      ultimo_intervento: d("2025-10-05"),
      scadenza_controllo: d("2026-10-05"),
      potenza_kw: 4.2,
    });
    const iLocatelli = mk(impiantiCol, {
      cliente: cLocatelli.id,
      tipo: "caldaia",
      marca: "Vaillant",
      modello: "ecoTEC pure VMW 236",
      matricola: "VA-2020-71883",
      indirizzo_installazione: "Via Mestrina 30, cucina, Mestre",
      data_posa: d("2020-01-20"),
      ultimo_intervento: d("2025-09-10"),
      scadenza_controllo: d("2026-09-10"),
      scadenza_bollino: d("2026-09-20"),
      potenza_kw: 23,
    });

    // ---------------- utenti (per assegnazioni) ----------------
    const marco = app.findAuthRecordByEmail("users", "marco.rossi@gibboni.it");
    const luca = app.findAuthRecordByEmail("users", "luca.bianchi@gibboni.it");

    // ---------------- commesse ----------------
    const kViaRoma = mk(commesseCol, {
      codice: "C-2026-021",
      titolo: "Sostituzione caldaia centrale termica",
      cliente: cViaRoma.id,
      impianto: iViaRoma1.id,
      stato: "in_corso",
      avanzamento: 65,
      data_apertura: d("2026-07-28"),
      descrizione:
        "Rimozione delle due Condexa Pro a fine vita e posa di una nuova cascata a condensazione. Delibera assembleare approvata a giugno.",
    });
    const kBelvedere = mk(commesseCol, {
      codice: "C-2026-019",
      titolo: "Installazione climatizzatori piano camere",
      cliente: cBelvedere.id,
      impianto: iBelvedere2.id,
      stato: "in_corso",
      avanzamento: 40,
      data_apertura: d("2026-07-10"),
      descrizione:
        "Posa di 6 unità interne e 2 unità esterne al piano camere. Lavori concordati nei giorni di bassa occupazione.",
    });
    const kParco = mk(commesseCol, {
      codice: "C-2026-017",
      titolo: "Manutenzione straordinaria centrale termica",
      cliente: cParco.id,
      impianto: iParco.id,
      stato: "completata",
      avanzamento: 100,
      data_apertura: d("2026-06-15"),
      data_chiusura: d("2026-09-02"),
      descrizione:
        "Sostituzione circolatore, pulizia scambiatore e verifica tenuta vaso di espansione.",
    });
    const kRiva = mk(commesseCol, {
      codice: "C-2026-023",
      titolo: "Sopralluogo per pompa di calore",
      cliente: cRiva.id,
      impianto: iRiva.id,
      stato: "aperta",
      avanzamento: 10,
      data_apertura: d("2026-09-04"),
      descrizione:
        "Rilievo misure e verifica quadro elettrico per la sostituzione della caldaia con pompa di calore ibrida.",
    });
    const kPanificio = mk(commesseCol, {
      codice: "C-2026-015",
      titolo: "Adeguamento locale caldaia",
      cliente: cPanificio.id,
      impianto: iPanificio.id,
      stato: "sospesa",
      avanzamento: 55,
      data_apertura: d("2026-05-20"),
      descrizione:
        "Apertura feritoia di ventilazione e rivestimento pareti. In attesa del muratore del cliente.",
    });
    const kDaNino = mk(commesseCol, {
      codice: "C-2026-024",
      titolo: "Controllo fumi e bollino blu annuale",
      cliente: cDaNino.id,
      impianto: iDaNino1.id,
      stato: "in_corso",
      avanzamento: 25,
      data_apertura: d("2026-09-05"),
      descrizione:
        "Controllo periodico con analisi fumi e rinnovo bollino blu prima della stagione invernale.",
    });

    // ---------------- interventi (agenda) ----------------
    const vGervasoni = mk(interventiCol, {
      cliente: cGervasoni.id,
      impianto: iGervasoni.id,
      tecnico: marco.id,
      data: d("2026-09-08"),
      ora: "10:30",
      tipo: "manutenzione",
      stato: "completato",
      note: "Pulizia bruciatore e verifica tiraggio.",
    });
    const vMarchetti = mk(interventiCol, {
      cliente: cMarchetti.id,
      impianto: iMarchetti.id,
      tecnico: luca.id,
      data: d("2026-09-07"),
      ora: "16:00",
      tipo: "riparazione",
      stato: "completato",
      note: "Sostituita scheda di accensione guasta.",
    });
    const vPanificio = mk(interventiCol, {
      cliente: cPanificio.id,
      impianto: iPanificio.id,
      tecnico: marco.id,
      data: d("2026-09-02"),
      ora: "07:30",
      tipo: "manutenzione",
      stato: "completato",
      note: "Manutenzione ordinaria prima del fermo per i lavori murari.",
    });
    const vParco = mk(interventiCol, {
      commessa: kParco.id,
      cliente: cParco.id,
      impianto: iParco.id,
      tecnico: luca.id,
      data: d("2026-09-02"),
      ora: "09:00",
      tipo: "manutenzione",
      stato: "completato",
      note: "Chiusura lavori straordinari: collaudo finale eseguito.",
    });
    const vDaNino = mk(interventiCol, {
      commessa: kDaNino.id,
      cliente: cDaNino.id,
      impianto: iDaNino1.id,
      tecnico: marco.id,
      data: d("2026-09-09"),
      ora: "09:00",
      tipo: "controllo_periodico",
      stato: "in_corso",
      note: "Analisi fumi + bollino. Portare il modulo blu.",
    });
    mk(interventiCol, {
      commessa: kRiva.id,
      cliente: cRiva.id,
      impianto: iRiva.id,
      tecnico: luca.id,
      data: d("2026-09-09"),
      ora: "14:30",
      tipo: "sopralluogo",
      stato: "programmato",
      note: "Rilievo misure, foto locale caldaia e verifica quadro elettrico.",
    });
    mk(interventiCol, {
      cliente: cLocatelli.id,
      impianto: iLocatelli.id,
      tecnico: marco.id,
      data: d("2026-09-10"),
      ora: "08:30",
      tipo: "controllo_periodico",
      stato: "programmato",
    });
    mk(interventiCol, {
      cliente: cFitClub.id,
      impianto: iFitClub.id,
      tecnico: luca.id,
      data: d("2026-09-10"),
      ora: "11:00",
      tipo: "manutenzione",
      stato: "programmato",
      note: "Controllo pressione circuito e pulizia filtri.",
    });
    mk(interventiCol, {
      commessa: kViaRoma.id,
      cliente: cViaRoma.id,
      impianto: iViaRoma1.id,
      tecnico: marco.id,
      data: d("2026-09-11"),
      ora: "09:00",
      tipo: "installazione",
      stato: "programmato",
      note: "Consegna nuova cascata in mattinata: inizio smontaggio.",
    });
    mk(interventiCol, {
      cliente: cViaRoma.id,
      impianto: iViaRoma2.id,
      tecnico: luca.id,
      data: d("2026-09-12"),
      ora: "10:00",
      tipo: "controllo_periodico",
      stato: "programmato",
    });
    mk(interventiCol, {
      commessa: kBelvedere.id,
      cliente: cBelvedere.id,
      impianto: iBelvedere2.id,
      tecnico: luca.id,
      data: d("2026-09-14"),
      ora: "09:30",
      tipo: "installazione",
      stato: "programmato",
      note: "Posa unità esterne sul terrazzo tecnico.",
    });
    mk(interventiCol, {
      cliente: cBelvedere.id,
      impianto: iBelvedere1.id,
      tecnico: marco.id,
      data: d("2026-09-15"),
      ora: "15:00",
      tipo: "controllo_periodico",
      stato: "programmato",
      note: "Controllo fumi e rinnovo bollino blu.",
    });

    // ---------------- rapportini ----------------
    mk(rapportiniCol, {
      numero: "R-2026-118",
      intervento: vGervasoni.id,
      cliente: cGervasoni.id,
      impianto: iGervasoni.id,
      tecnico: marco.id,
      data: d("2026-09-08"),
      tipo_intervento: "manutenzione_ordinaria",
      descrizione:
        "Pulizia bruciatore, controllo tiraggio e verifica tenuta gas. Funzionamento regolare.",
      importo: 120,
      pagamento: "pos",
      stato: "chiuso",
    });
    mk(rapportiniCol, {
      numero: "R-2026-117",
      intervento: vMarchetti.id,
      cliente: cMarchetti.id,
      impianto: iMarchetti.id,
      tecnico: luca.id,
      data: d("2026-09-07"),
      tipo_intervento: "riparazione",
      descrizione:
        "Sostituzione scheda di accensione e prova di funzionamento. Ricambio fatturato a parte.",
      importo: 240,
      pagamento: "bonifico",
      stato: "inviato_ufficio",
    });
    mk(rapportiniCol, {
      numero: "R-2026-116",
      intervento: vPanificio.id,
      cliente: cPanificio.id,
      impianto: iPanificio.id,
      tecnico: marco.id,
      data: d("2026-09-02"),
      tipo_intervento: "manutenzione_ordinaria",
      descrizione: "Manutenzione ordinaria con pulizia scambiatore primario.",
      importo: 180,
      pagamento: "contanti",
      stato: "fatturato",
    });
    mk(rapportiniCol, {
      numero: "R-2026-115",
      cliente: cColombo.id,
      impianto: iColombo1.id,
      tecnico: marco.id,
      data: d("2026-08-28"),
      tipo_intervento: "controllo_periodico",
      descrizione: "Controllo periodico: rendimento nella norma.",
      importo: 90,
      pagamento: "da_incassare",
      stato: "bozza",
    });
    mk(rapportiniCol, {
      numero: "R-2026-114",
      cliente: cBelvedere.id,
      impianto: iBelvedere1.id,
      tecnico: luca.id,
      data: d("2026-06-20"),
      tipo_intervento: "manutenzione_ordinaria",
      descrizione:
        "Manutenzione programmata da contratto: caldaia e unità esterne climatizzazione.",
      importo: 450,
      pagamento: "bonifico",
      stato: "fatturato",
    });
    mk(rapportiniCol, {
      numero: "R-2026-113",
      cliente: cLocatelli.id,
      impianto: iLocatelli.id,
      tecnico: marco.id,
      data: d("2025-09-10"),
      tipo_intervento: "controllo_periodico",
      descrizione: "Controllo periodico e pulizia filtri.",
      importo: 110,
      pagamento: "pos",
      stato: "fatturato",
    });
    mk(rapportiniCol, {
      numero: "R-2026-112",
      intervento: vParco.id,
      cliente: cParco.id,
      impianto: iParco.id,
      tecnico: luca.id,
      data: d("2026-09-02"),
      tipo_intervento: "manutenzione_ordinaria",
      descrizione:
        "Chiusura manutenzione straordinaria: sostituzione circolatore e collaudo finale.",
      importo: 380,
      pagamento: "assegno",
      stato: "inviato_ufficio",
    });
    mk(rapportiniCol, {
      numero: "R-2026-111",
      cliente: cDaNino.id,
      impianto: iDaNino1.id,
      tecnico: marco.id,
      data: d("2025-09-09"),
      tipo_intervento: "bollino",
      descrizione: "Controllo fumi e rinnovo bollino blu.",
      importo: 130,
      pagamento: "contanti",
      stato: "fatturato",
    });

    // ---------------- documenti (archivio) ----------------
    const doc = (data) => mk(documentiCol, data);
    doc({
      titolo: "2026-09_RAP_Manutenzione_Gervasoni",
      tipo: "rapportino",
      cliente: cGervasoni.id,
      impianto: iGervasoni.id,
      data: d("2026-09-08"),
    });
    doc({
      titolo: "2026-09_BOL_BollinoBlu_DaNino",
      tipo: "bollino",
      cliente: cDaNino.id,
      impianto: iDaNino1.id,
      commessa: kDaNino.id,
      data: d("2026-09-09"),
      note: "Da allegare a fine intervento.",
    });
    doc({
      titolo: "2026-08_LIB_LibrettoImpianto_ViaRoma12",
      tipo: "libretto",
      cliente: cViaRoma.id,
      impianto: iViaRoma1.id,
      commessa: kViaRoma.id,
      data: d("2026-08-30"),
    });
    doc({
      titolo: "2026-09_FOTO_Sopralluogo_Riva_LocaleCaldaia",
      tipo: "foto",
      cliente: cRiva.id,
      impianto: iRiva.id,
      commessa: kRiva.id,
      data: d("2026-09-09"),
      note: "Foto del rilievo: parete di posa e quadro elettrico.",
    });
    doc({
      titolo: "2026-07_CON_ContrattoManutenzione_Belvedere",
      tipo: "contratto",
      cliente: cBelvedere.id,
      data: d("2026-07-01"),
    });
    doc({
      titolo: "2026-09_RAP_Riparazione_Marchetti",
      tipo: "rapportino",
      cliente: cMarchetti.id,
      impianto: iMarchetti.id,
      data: d("2026-09-07"),
    });
    doc({
      titolo: "2026-06_CER_CertificatoCentraleTermica_ParcoDelleRose",
      tipo: "certificato",
      cliente: cParco.id,
      impianto: iParco.id,
      commessa: kParco.id,
      data: d("2026-06-30"),
    });
    doc({
      titolo: "2026-09_FOTO_LocaleCaldaia_Panificio",
      tipo: "foto",
      cliente: cPanificio.id,
      impianto: iPanificio.id,
      commessa: kPanificio.id,
      data: d("2026-09-02"),
      note: "Stato del locale prima dei lavori murari.",
    });
    doc({
      titolo: "2026-08_BOL_Bollino_Colombo",
      tipo: "bollino",
      cliente: cColombo.id,
      impianto: iColombo1.id,
      data: d("2026-08-28"),
    });
    doc({
      titolo: "2025-09_RAP_Controllo_Locatelli",
      tipo: "rapportino",
      cliente: cLocatelli.id,
      impianto: iLocatelli.id,
      data: d("2025-09-10"),
    });

    // ---------------- documenti richiesti (campo -> ufficio) ----------------
    mk(docRichCol, {
      commessa: kViaRoma.id,
      nome: "Dichiarazione di conformità (predisposta esternamente)",
      stato: "da_richiedere",
    });
    mk(docRichCol, {
      commessa: kViaRoma.id,
      nome: "Libretto di impianto aggiornato",
      stato: "richiesto",
    });
    mk(docRichCol, {
      commessa: kViaRoma.id,
      nome: "Fotografie fine lavori",
      stato: "da_richiedere",
    });
    mk(docRichCol, {
      commessa: kBelvedere.id,
      nome: "Planimetria unità esterne",
      stato: "ricevuto",
    });
    mk(docRichCol, {
      commessa: kBelvedere.id,
      nome: "Rapportino firmato dal direttore",
      stato: "richiesto",
    });
    mk(docRichCol, {
      commessa: kParco.id,
      intervento: vParco.id,
      nome: "Rapportino firmato",
      stato: "ricevuto",
    });
    mk(docRichCol, {
      commessa: kParco.id,
      nome: "Certificato di collaudo",
      stato: "ricevuto",
    });
    mk(docRichCol, {
      commessa: kDaNino.id,
      intervento: vDaNino.id,
      nome: "Modulo bollino blu compilato",
      stato: "da_richiedere",
    });

    // ---------------- lista quotidiana chiamate ----------------
    const tel = (data) => mk(chiamateCol, data);
    tel({
      cliente: cColombo.id,
      impianto: iColombo1.id,
      tipo_scadenza: "controllo",
      data_scadenza: d("2026-08-28"),
      stato: "da_chiamare",
      priorita: "alta",
      note: "Controllo scaduto: richiamare con insistenza.",
    });
    tel({
      cliente: cPanificio.id,
      impianto: iPanificio.id,
      tipo_scadenza: "bollino",
      data_scadenza: d("2026-08-30"),
      stato: "contattato",
      priorita: "alta",
      data_contatto: d("2026-09-08"),
      note: "Il titolare aspetta la fine dei lavori murari: risentire a fine mese.",
    });
    tel({
      cliente: cViaRoma.id,
      impianto: iViaRoma1.id,
      tipo_scadenza: "controllo",
      data_scadenza: d("2026-09-12"),
      stato: "appuntamento_fissato",
      priorita: "media",
      data_contatto: d("2026-09-05"),
      note: "Intervento del 12/09 con Luca, ore 10:00.",
    });
    tel({
      cliente: cDaNino.id,
      impianto: iDaNino1.id,
      tipo_scadenza: "bollino",
      data_scadenza: d("2026-09-09"),
      stato: "da_chiamare",
      priorita: "alta",
      note: "Bollino in scadenza oggi: confermare l'intervento in corso.",
    });
    tel({
      cliente: cLocatelli.id,
      impianto: iLocatelli.id,
      tipo_scadenza: "controllo",
      data_scadenza: d("2026-09-10"),
      stato: "contattato",
      priorita: "media",
      data_contatto: d("2026-09-07"),
      note: "Confermato per il 10/09 ore 8:30.",
    });
    tel({
      cliente: cParco.id,
      impianto: iParco.id,
      tipo_scadenza: "controllo",
      data_scadenza: d("2026-09-18"),
      stato: "da_chiamare",
      priorita: "media",
    });
    tel({
      cliente: cBelvedere.id,
      impianto: iBelvedere1.id,
      tipo_scadenza: "bollino",
      data_scadenza: d("2026-09-15"),
      stato: "appuntamento_fissato",
      priorita: "media",
      data_contatto: d("2026-09-04"),
      note: "Fissato il 15/09 ore 15:00 con Marco.",
    });
    tel({
      cliente: cGervasoni.id,
      impianto: iGervasoni.id,
      tipo_scadenza: "controllo",
      data_scadenza: d("2026-11-20"),
      stato: "eseguito",
      priorita: "bassa",
      data_contatto: d("2026-09-08"),
      note: "Manutenzione eseguita l'8/09: prossimo controllo a novembre.",
    });
  },
  (app) => {
    const tables = [
      "documenti_richiesti",
      "documenti",
      "rapportini",
      "interventi",
      "commesse",
      "chiamate",
      "impianti",
      "clienti",
    ];
    for (const t of tables) {
      const rows = app.findRecordsByFilter(t, "id != ''", "", 500, 0);
      for (const r of rows) app.delete(r);
    }
  },
);
