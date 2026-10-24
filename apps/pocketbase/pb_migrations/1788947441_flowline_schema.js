/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: true,
          maxSelect: 1,
          values: ["titolare", "amministrazione", "tecnico"],
        }),
      );
    }
    users.listRule = "@request.auth.id != ''";
    users.viewRule = "@request.auth.id != ''";
    users.createRule = null;
    users.updateRule =
      "(id = @request.auth.id && @request.body.role:changed = false) || @request.auth.role = 'titolare'";
    users.deleteRule = null;
    const pw = users.fields.getByName("password");
    pw.min = Math.max(pw.min || 0, 10);
    app.save(users);

    const AUTH = "@request.auth.id != ''";
    const BACKOFFICE =
      "@request.auth.role = 'titolare' || @request.auth.role = 'amministrazione'";

    const autodates = [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    // ---- clienti -------------------------------------------------------
    const clienti = new Collection({
      type: "base",
      name: "clienti",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: BACKOFFICE,
      updateRule: BACKOFFICE,
      deleteRule: BACKOFFICE,
      fields: [
        { name: "nome", type: "text", required: true, max: 200 },
        {
          name: "tipo",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["privato", "azienda", "condominio"],
        },
        { name: "telefono", type: "text", max: 40 },
        { name: "email", type: "text", max: 200 },
        { name: "indirizzo", type: "text", max: 300 },
        { name: "citta", type: "text", max: 120 },
        { name: "cap", type: "text", max: 10 },
        { name: "referente", type: "text", max: 200 },
        { name: "note", type: "text" },
        ...autodates,
      ],
      indexes: ["CREATE INDEX idx_clienti_nome ON clienti (nome)"],
    });
    app.save(clienti);

    // ---- impianti ------------------------------------------------------
    const impianti = new Collection({
      type: "base",
      name: "impianti",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: BACKOFFICE,
      updateRule: BACKOFFICE,
      deleteRule: BACKOFFICE,
      fields: [
        {
          name: "cliente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: clienti.id,
          cascadeDelete: true,
        },
        {
          name: "tipo",
          type: "select",
          required: true,
          maxSelect: 1,
          values: [
            "caldaia",
            "caldaia_condominiale",
            "climatizzatore",
            "pompa_di_calore",
            "scaldacqua",
            "altro",
          ],
        },
        { name: "marca", type: "text", max: 120 },
        { name: "modello", type: "text", max: 120 },
        { name: "matricola", type: "text", max: 120 },
        { name: "indirizzo_installazione", type: "text", max: 300 },
        { name: "data_posa", type: "date" },
        { name: "ultimo_intervento", type: "date" },
        { name: "scadenza_controllo", type: "date" },
        { name: "scadenza_bollino", type: "date" },
        { name: "potenza_kw", type: "number" },
        { name: "note", type: "text" },
        ...autodates,
      ],
      indexes: [
        "CREATE INDEX idx_impianti_cliente ON impianti (cliente)",
        "CREATE INDEX idx_impianti_scadenza_controllo ON impianti (scadenza_controllo)",
        "CREATE INDEX idx_impianti_scadenza_bollino ON impianti (scadenza_bollino)",
      ],
    });
    app.save(impianti);

    // ---- chiamate (lista quotidiana clienti da contattare) -------------
    const chiamate = new Collection({
      type: "base",
      name: "chiamate",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: BACKOFFICE,
      updateRule: BACKOFFICE,
      deleteRule: BACKOFFICE,
      fields: [
        {
          name: "cliente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: clienti.id,
          cascadeDelete: true,
        },
        {
          name: "impianto",
          type: "relation",
          maxSelect: 1,
          collectionId: impianti.id,
          cascadeDelete: false,
        },
        {
          name: "tipo_scadenza",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["controllo", "bollino"],
        },
        { name: "data_scadenza", type: "date" },
        {
          name: "stato",
          type: "select",
          required: true,
          maxSelect: 1,
          values: [
            "da_chiamare",
            "contattato",
            "appuntamento_fissato",
            "eseguito",
          ],
        },
        {
          name: "priorita",
          type: "select",
          maxSelect: 1,
          values: ["alta", "media", "bassa"],
        },
        { name: "data_contatto", type: "date" },
        { name: "note", type: "text" },
        ...autodates,
      ],
      indexes: [
        "CREATE INDEX idx_chiamate_stato ON chiamate (stato)",
        "CREATE INDEX idx_chiamate_cliente ON chiamate (cliente)",
      ],
    });
    app.save(chiamate);

    // ---- commesse ------------------------------------------------------
    const commesse = new Collection({
      type: "base",
      name: "commesse",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: BACKOFFICE,
      updateRule: BACKOFFICE,
      deleteRule: BACKOFFICE,
      fields: [
        { name: "codice", type: "text", required: true, max: 40 },
        { name: "titolo", type: "text", required: true, max: 300 },
        {
          name: "cliente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: clienti.id,
          cascadeDelete: false,
        },
        {
          name: "impianto",
          type: "relation",
          maxSelect: 1,
          collectionId: impianti.id,
          cascadeDelete: false,
        },
        {
          name: "stato",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["aperta", "in_corso", "sospesa", "completata", "chiusa"],
        },
        { name: "avanzamento", type: "number", min: 0, max: 100 },
        { name: "data_apertura", type: "date" },
        { name: "data_chiusura", type: "date" },
        { name: "descrizione", type: "text" },
        ...autodates,
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_commesse_codice ON commesse (codice)",
        "CREATE INDEX idx_commesse_stato ON commesse (stato)",
        "CREATE INDEX idx_commesse_cliente ON commesse (cliente)",
      ],
    });
    app.save(commesse);

    // ---- interventi (agenda) -------------------------------------------
    const interventi = new Collection({
      type: "base",
      name: "interventi",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: BACKOFFICE,
      updateRule:
        BACKOFFICE + " || tecnico = @request.auth.id",
      deleteRule: BACKOFFICE,
      fields: [
        {
          name: "commessa",
          type: "relation",
          maxSelect: 1,
          collectionId: commesse.id,
          cascadeDelete: false,
        },
        {
          name: "cliente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: clienti.id,
          cascadeDelete: false,
        },
        {
          name: "impianto",
          type: "relation",
          maxSelect: 1,
          collectionId: impianti.id,
          cascadeDelete: false,
        },
        {
          name: "tecnico",
          type: "relation",
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: false,
        },
        { name: "data", type: "date", required: true },
        { name: "ora", type: "text", max: 10 },
        {
          name: "tipo",
          type: "select",
          required: true,
          maxSelect: 1,
          values: [
            "sopralluogo",
            "manutenzione",
            "controllo_periodico",
            "installazione",
            "riparazione",
          ],
        },
        {
          name: "stato",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["programmato", "in_corso", "completato", "annullato"],
        },
        { name: "note", type: "text" },
        ...autodates,
      ],
      indexes: [
        "CREATE INDEX idx_interventi_data ON interventi (data)",
        "CREATE INDEX idx_interventi_tecnico ON interventi (tecnico)",
        "CREATE INDEX idx_interventi_commessa ON interventi (commessa)",
      ],
    });
    app.save(interventi);

    // ---- rapportini ----------------------------------------------------
    const rapportini = new Collection({
      type: "base",
      name: "rapportini",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule:
        BACKOFFICE + " || tecnico = @request.auth.id",
      deleteRule: BACKOFFICE,
      fields: [
        { name: "numero", type: "text", max: 40 },
        {
          name: "intervento",
          type: "relation",
          maxSelect: 1,
          collectionId: interventi.id,
          cascadeDelete: false,
        },
        {
          name: "cliente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: clienti.id,
          cascadeDelete: false,
        },
        {
          name: "impianto",
          type: "relation",
          maxSelect: 1,
          collectionId: impianti.id,
          cascadeDelete: false,
        },
        {
          name: "tecnico",
          type: "relation",
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: false,
        },
        { name: "data", type: "date" },
        {
          name: "tipo_intervento",
          type: "select",
          maxSelect: 1,
          values: [
            "controllo_periodico",
            "manutenzione_ordinaria",
            "riparazione",
            "sopralluogo",
            "bollino",
          ],
        },
        { name: "descrizione", type: "text" },
        { name: "importo", type: "number", min: 0 },
        {
          name: "pagamento",
          type: "select",
          maxSelect: 1,
          values: ["contanti", "pos", "bonifico", "assegno", "da_incassare"],
        },
        {
          name: "stato",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["bozza", "chiuso", "inviato_ufficio", "fatturato"],
        },
        ...autodates,
      ],
      indexes: [
        "CREATE INDEX idx_rapportini_cliente ON rapportini (cliente)",
        "CREATE INDEX idx_rapportini_data ON rapportini (data)",
      ],
    });
    app.save(rapportini);

    // ---- documenti (archivio con ricerca + fotografie) -----------------
    const documenti = new Collection({
      type: "base",
      name: "documenti",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: BACKOFFICE,
      deleteRule: BACKOFFICE,
      fields: [
        { name: "titolo", type: "text", required: true, max: 300 },
        {
          name: "tipo",
          type: "select",
          required: true,
          maxSelect: 1,
          values: [
            "rapportino",
            "foto",
            "bollino",
            "certificato",
            "contratto",
            "libretto",
            "altro",
          ],
        },
        {
          name: "cliente",
          type: "relation",
          maxSelect: 1,
          collectionId: clienti.id,
          cascadeDelete: false,
        },
        {
          name: "impianto",
          type: "relation",
          maxSelect: 1,
          collectionId: impianti.id,
          cascadeDelete: false,
        },
        {
          name: "commessa",
          type: "relation",
          maxSelect: 1,
          collectionId: commesse.id,
          cascadeDelete: false,
        },
        {
          name: "file",
          type: "file",
          maxSelect: 1,
          maxSize: 20971520,
        },
        { name: "data", type: "date" },
        { name: "note", type: "text" },
        ...autodates,
      ],
      indexes: [
        "CREATE INDEX idx_documenti_tipo ON documenti (tipo)",
        "CREATE INDEX idx_documenti_cliente ON documenti (cliente)",
        "CREATE INDEX idx_documenti_commessa ON documenti (commessa)",
      ],
    });
    app.save(documenti);

    // ---- documenti_richiesti (passaggio campo -> ufficio) ---------------
    const docRich = new Collection({
      type: "base",
      name: "documenti_richiesti",
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: BACKOFFICE,
      fields: [
        {
          name: "commessa",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: commesse.id,
          cascadeDelete: true,
        },
        {
          name: "intervento",
          type: "relation",
          maxSelect: 1,
          collectionId: interventi.id,
          cascadeDelete: false,
        },
        { name: "nome", type: "text", required: true, max: 300 },
        {
          name: "stato",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["da_richiedere", "richiesto", "ricevuto"],
        },
        { name: "note", type: "text" },
        ...autodates,
      ],
      indexes: [
        "CREATE INDEX idx_docrich_commessa ON documenti_richiesti (commessa)",
      ],
    });
    app.save(docRich);

    // ---- utenti demo (account richiesti per provare subito l'app) ------
    const seedUser = (email, password, name, role) => {
      try {
        app.findAuthRecordByEmail("users", email);
        return;
      } catch (_) {
        // non esiste: lo creo
      }
      const u = new Record(users);
      u.setEmail(email);
      u.setPassword(password);
      u.set("name", name);
      u.set("role", role);
      u.set("verified", true);
      app.save(u);
    };

    seedUser("titolare@gibboni.it", "Gibboni#Titolare26", "Giuseppe Gibboni", "titolare");
    seedUser("ufficio@gibboni.it", "Gibboni#Ufficio2026", "Sara Gibboni", "amministrazione");
    seedUser("marco.rossi@gibboni.it", "Gibboni#Tecnico26", "Marco Rossi", "tecnico");
    seedUser("luca.bianchi@gibboni.it", "Gibboni#Tecnico27", "Luca Bianchi", "tecnico");
  },
  (app) => {
    const names = [
      "documenti_richiesti",
      "documenti",
      "rapportini",
      "interventi",
      "commesse",
      "chiamate",
      "impianti",
      "clienti",
    ];
    for (const n of names) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }
  },
);
