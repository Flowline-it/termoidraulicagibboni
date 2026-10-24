# Flowline — Gestionale Termoidraulica Gibboni

Gestionale per commesse, scadenzario manutenzioni, anagrafica clienti/impianti, agenda, rapportini e documenti.

- **Frontend:** React 18 + Vite + Tailwind (`apps/web`)
- **Backend/DB:** PocketBase 0.40.4 (`apps/pocketbase`): schema, regole di accesso e dati demo stanno nelle migrazioni in `pb_migrations/`, applicate in automatico all'avvio.

Il binario di PocketBase **non** è nel repository: viene scaricato da solo dalle release ufficiali al primo avvio (Linux, macOS, Windows; x64 e ARM).

---

## Avvio con un clic da GitHub (Codespaces)

1. Sulla pagina del repository: **Code → Codespaces → Create codespace on main**.
2. Attendi il setup (la prima volta 1–2 minuti: installa le dipendenze e scarica PocketBase).
3. L'app parte da sola e si apre nel browser sulla porta **3000** (scheda *Ports* → "Gestionale" se non si apre).

Per riavviarla a mano, nel terminale del Codespace:

```bash
npm run dev
```

La porta 3000 è privata per default: la vede solo chi è loggato su GitHub con accesso al Codespace. Per farla vedere al cliente: scheda *Ports* → tasto destro su 3000 → *Port Visibility → Public* (solo per demo, poi riportala a privata).

## Avvio sul proprio computer

Serve Node.js 20 o superiore.

```bash
npm run setup
npm run dev
```

Apri http://localhost:3000

## Credenziali demo

| Ruolo | Email | Password |
|---|---|---|
| Titolare | titolare@gibboni.it | Gibboni#Titolare26 |
| Amministrazione | ufficio@gibboni.it | Gibboni#Ufficio2026 |
| Tecnico | marco.rossi@gibboni.it | Gibboni#Tecnico26 |
| Tecnico | luca.bianchi@gibboni.it | Gibboni#Tecnico27 |

**Pannello database (PocketBase):** http://localhost:3000/_/ (in Codespaces: stesso indirizzo dell'app + `/_/`)
Superuser: `admin@gibboni.it` / `Gibboni#Admin2026`, modificabile con le variabili `PB_SUPERUSER_EMAIL` e `PB_SUPERUSER_PASSWORD`.

> Sono credenziali da demo, scritte nel codice: tenete il repository **privato** e cambiatele prima di qualsiasi uso reale.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run setup` | Installa le dipendenze e scarica PocketBase |
| `npm run dev` | Frontend (porta 3000, con hot reload) + PocketBase (porta 8090, interna) |
| `npm run build` | Compila il frontend in `apps/web/dist` |
| `npm start` | Modalità produzione: compila e fa servire app + API a PocketBase su un'unica porta (8090) |
| `npm run db:reset` | Cancella il database locale; al prossimo avvio si ricrea con i dati demo |
| `npm run pb --prefix apps/pocketbase -- <comando>` | Esegue un comando PocketBase qualsiasi (es. `migrate collections`) |

## Struttura

```
apps/
  web/                 frontend React
    src/pages/         una pagina per sezione (Scadenzario, Clienti, Commesse…)
    src/lib/pocketbaseClient.js
  pocketbase/
    pb_migrations/     schema, regole, utenti e dati demo
    scripts/pocketbase.mjs   scarica e avvia PocketBase
.devcontainer/         configurazione Codespaces
.github/workflows/     build automatica a ogni push
```

In sviluppo Vite inoltra `/api` e `/_/` a PocketBase, quindi il frontend parla sempre con la stessa origine. Per puntare a un PocketBase esterno impostare `VITE_POCKETBASE_URL` in fase di build.

## Variabili d'ambiente (opzionali)

| Variabile | Default | Uso |
|---|---|---|
| `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD` | vedi sopra | Account amministratore del database |
| `PB_HTTP` | `127.0.0.1:8090` (dev), `0.0.0.0:8090` (start) | Indirizzo di ascolto di PocketBase |
| `PB_DATA_DIR` | `apps/pocketbase/pb_data` | Cartella del database |
| `PB_APP_URL` | `http://localhost:3000` | URL pubblico, usato nelle email di PocketBase |
| `VITE_POCKETBASE_URL` | `/` | URL dell'API se PocketBase sta su un altro dominio |

## Note

- Il database di Codespaces vive dentro il Codespace: se il Codespace viene eliminato, i dati inseriti si perdono (al riavvio tornano i dati demo). Va bene per demo e sviluppo, non come ambiente di produzione.
- Il progetto è nato su Hostinger Horizons; le parti specifiche di quella piattaforma (editor visuale, proxy `/hcgi/platform`, hook di promozione dati, mailer e dashboard remoti) sono state rimosse.
