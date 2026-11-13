import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type Role } from '../../firebase/auth';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/iconPaths';
import { LangSwitch } from '../../components/parts';
import { useTheme } from '../../hooks/useTheme';
import { homeFor, loginFor } from '../../routes';

/** Someone who is already signed in goes straight to their own area (or back to where they were headed). */
function useAlreadySignedIn(): string | null {
  const auth = useAuth();
  const loc = useLocation();
  if (auth.status === 'in' && auth.role) {
    const from = (loc.state as { from?: string } | null)?.from;
    return from && from.startsWith(homeFor(auth.role)) ? from : homeFor(auth.role);
  }
  return null;
}

function Brand({ icon }: { icon: IconName }) {
  const { t } = useTranslation();
  return (
    <div className="brand" style={{ padding: 0 }}>
      <span className="brand-mark"><Icon name={icon} size="lg" /></span>
      <div><b>{t('app.name')}</b><small>{t('app.sub')}</small></div>
    </div>
  );
}

/** Sign-in page of one portal. Only that kind of account gets in; the other kind is told where to go. */
export function PortalLoginPage({ portal }: { portal: Role }) {
  const { t } = useTranslation();
  const auth = useAuth();
  useTheme();
  const target = useAlreadySignedIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = `${t(`login.${portal}.title`)} · ${t('app.name')}`;
  }, [t, portal]);

  if (target) return <Navigate to={target} replace />;

  const other: Role = portal === 'admin' ? 'center' : 'admin';
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = await auth.signIn(email, password, portal);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <main className="login" id="main">
      <form className="login-card" onSubmit={submit} aria-labelledby="h-login" noValidate data-portal={portal}>
        <div className="login-tools">
          <Brand icon={portal === 'admin' ? 'lifebuoy' : 'ambulance'} />
          <LangSwitch />
        </div>
        <div>
          <h1 id="h-login" style={{ font: 'var(--text-headline)' }}>{t(`login.${portal}.title`)}</h1>
          <p className="muted">{t(`login.${portal}.sub`)}</p>
        </div>
        <label className="field">
          <span>{t('login.email')}</span>
          <input className="input" type="email" name="email" autoComplete="username" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>{t('login.pass')}</span>
          <input className="input" type="password" name="password" autoComplete="current-password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <span className="hint"><Icon name="lock" size="sm" /> {t('login.hint')}</span>
        </label>
        {error && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t(error)}</span></div>}
        <button type="submit" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy || !email || !password}>
          {busy ? t('auth.signingIn') : t('login.go')}
        </button>
        <div className="login-switch">
          <Link to={loginFor(other)}>{t(other === 'center' ? 'login.toCenter' : 'login.toAdmin')}</Link>
        </div>
      </form>
    </main>
  );
}

/** /login: a page to choose between the two sign-in pages. */
export function ChoosePortalPage() {
  const { t } = useTranslation();
  useTheme();
  const target = useAlreadySignedIn();

  useEffect(() => {
    document.title = `${t('login.choose')} · ${t('app.name')}`;
  }, [t]);

  if (target) return <Navigate to={target} replace />;

  return (
    <main className="login" id="main">
      <section className="login-card" aria-labelledby="h-choose">
        <div className="login-tools">
          <Brand icon="lifebuoy" />
          <LangSwitch />
        </div>
        <div>
          <h1 id="h-choose" style={{ font: 'var(--text-headline)' }}>{t('login.choose')}</h1>
          <p className="muted">{t('login.chooseSub')}</p>
        </div>
        <div className="portal-grid">
          <Link className="portal-card" to={loginFor('admin')}>
            <span className="portal-ico"><Icon name="lifebuoy" size="lg" /></span>
            <span><b>{t('login.chooseAdmin')}</b><span className="d">{t('login.chooseAdminDesc')}</span></span>
            <Icon name="chevron" flip />
          </Link>
          <Link className="portal-card" to={loginFor('center')}>
            <span className="portal-ico center"><Icon name="ambulance" size="lg" /></span>
            <span><b>{t('login.chooseCenter')}</b><span className="d">{t('login.chooseCenterDesc')}</span></span>
            <Icon name="chevron" flip />
          </Link>
        </div>
      </section>
    </main>
  );
}
