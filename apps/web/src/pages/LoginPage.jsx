import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { inputCls, Field } from '@/components/FormBits';
import { Button } from '@/components/ui/button';
import { IS_DEMO } from '@/lib/pocketbaseClient';
import { DEMO_USERS } from '@/demo/users';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (_) {
      setError('Credenziali non valide. Controlla email e password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-navy">
      <Helmet>
        <title>Accesso — Flowline · Termoidraulica Gibboni</title>
        <meta
          name="description"
          content="Accesso al gestionale Flowline di Termoidraulica Gibboni S.r.l. per la conduzione di commesse e manutenzioni."
        />
      </Helmet>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center bg-accent font-display text-2xl font-bold text-accent-foreground">
              F
            </span>
            <div>
              <p className="font-display text-3xl font-bold tracking-wide text-white">FLOWLINE</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
                Termoidraulica Gibboni S.r.l.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-accent bg-white p-6 md:p-8">
            <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
              Area riservata
            </p>
            <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
              Accedi al gestionale
            </h1>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Email">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className={inputCls}
                  placeholder="nome@gibboni.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputCls}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && (
                <p className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="mt-2 h-11 rounded-md bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {busy ? 'Accesso in corso…' : 'Entra'}
              </Button>
            </form>
          </div>

          {IS_DEMO ? (
            <div className="mt-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
                Anteprima · entra con un profilo di prova
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(u.password);
                      setError('');
                    }}
                    className="rounded-sm border border-white/25 px-2 py-2 text-sm font-medium text-white hover:border-accent hover:bg-white/5"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
              Ruoli: titolare · amministrazione · tecnico
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
