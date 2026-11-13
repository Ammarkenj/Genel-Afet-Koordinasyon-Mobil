import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { useAuth } from '../../firebase/auth';
import { currentPushState, enablePush, type PushState } from '../../firebase/messaging';
import { Icon } from '../../components/Icon';
import { CenterStatusBadge, CenterTypeCell } from '../../components/badges';
import { LangSwitch, ThemeButton } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../hooks/useTheme';
import { useCenterUi } from './centerUi';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const auth = useAuth();
  const { center, centerId } = useCenterData();
  const { sound, setSound } = useCenterUi();
  const [theme, toggleTheme] = useTheme();
  const [push, setPush] = useState<PushState>(() => currentPushState(centerId));
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!center) return null;

  const enable = async () => {
    setBusy(true);
    setFailure(null);
    const res = await enablePush(centerId, i18n.language);
    setBusy(false);
    if (res === 'failed') setFailure('cp.notifFailed');
    else if (res === 'unsupported') setFailure('cp.notifUnsupported');
    else {
      setPush(res);
      if (res === 'on') toast.show(t('cp.notifOn'));
    }
  };

  return (
    <>
      <div className="page-h"><h1>{t('cnav.settings')}</h1></div>

      <section className="card" aria-labelledby="h-info">
        <div className="card-h"><h2 id="h-info">{t('se.info')}</h2></div>
        <div>
          <div className="kv-row"><span>{t('cf.name')}</span><b>{center.name}</b></div>
          <div className="kv-row"><span>{t('cf.type')}</span><b><CenterTypeCell type={center.type} /></b></div>
          <div className="kv-row"><span>{t('cf.status')}</span><CenterStatusBadge status={center.status} /></div>
          <div className="kv-row"><span>{t('cf.phone')}</span><b dir="ltr">{center.phone || '—'}</b></div>
          <div className="kv-row"><span>{t('cf.address')}</span><b>{center.address || '—'}</b></div>
          <div className="kv-row"><span>{t('cf.email')}</span><b dir="ltr">{center.email}</b></div>
        </div>
        <p className="hint" style={{ marginBlockStart: 8 }}><Icon name="lock" size="sm" /> {t('se.readOnly')}</p>
      </section>

      <section className="card" aria-labelledby="h-notif">
        <div className="card-h">
          <h2 id="h-notif">{t('cp.notif')}</h2>
          <span className="grow" />
          <button type="button" className="chip" aria-pressed={sound} onClick={() => setSound(!sound)}>
            <Icon name={sound ? 'volume' : 'volumeOff'} size="sm" />{t(sound ? 'cp.soundOn' : 'cp.soundOff')}
          </button>
        </div>
        {failure && <div className="callout danger" role="alert" style={{ marginBlockEnd: 12 }}><Icon name="alert" /><span>{t(failure)}</span></div>}
        <div className="grid">
          {push === 'on' && <span className="badge safe"><Icon name="bell" size="sm" />{t('cp.notifOn')}</span>}
          {push === 'blocked' && (
            <>
              <span className="badge warn"><Icon name="bellOff" size="sm" />{t('cp.notifBlocked')}</span>
              <div className="callout warn"><Icon name="info" /><span>{t('cp.notifBlockedDesc')}</span></div>
            </>
          )}
          {push === 'unsupported' && <div className="callout warn"><Icon name="info" /><span>{t('cp.notifUnsupported')}</span></div>}
          {push === 'off' && (
            <>
              <span className="badge warn"><Icon name="bellOff" size="sm" />{t('cp.notifOff')}</span>
              <p className="muted">{t('cp.notifOffDesc')}</p>
              <button type="button" className="btn primary" style={{ minBlockSize: 52 }} onClick={() => void enable()} disabled={busy}><Icon name="bell" />{t('cp.notifEnable')}</button>
            </>
          )}
          <span className="hint"><Icon name="info" size="sm" /> {t('cp.notifIos')}</span>
        </div>
      </section>

      <section className="card" aria-labelledby="h-look">
        <div className="card-h"><h2 id="h-look">{t('se.appearance')}</h2></div>
        <div className="row-between"><span>{t('lang.switch')}</span><LangSwitch /></div>
        <div className="row-between" style={{ marginBlockStart: 12 }}><span>{t('theme.switch')}</span><ThemeButton theme={theme} onToggle={toggleTheme} /></div>
      </section>

      <section className="card" aria-labelledby="h-acc">
        <div className="card-h"><h2 id="h-acc">{t('se.account')}</h2></div>
        <p className="muted" dir="ltr" style={{ marginBlockEnd: 12 }}>{auth.user?.email}</p>
        <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={() => void auth.signOut()}><Icon name="lock" size="sm" />{t('cp.logout')}</button>
      </section>
    </>
  );
}
