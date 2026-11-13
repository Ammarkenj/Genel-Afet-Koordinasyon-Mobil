import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './app';
import { registerDevice } from '../data/repos';

export type PushState = 'off' | 'on' | 'blocked' | 'unsupported';

const flagKey = (centerId: string) => `yh-push:${centerId}`;

export function currentPushState(centerId: string): PushState {
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  try {
    if (Notification.permission === 'granted' && localStorage.getItem(flagKey(centerId)) === '1') return 'on';
  } catch {
    /* storage can be blocked */
  }
  return 'off';
}

/** Asks for permission (must be called from a click), registers the service worker, gets the FCM token and stores it for this center.
 *  Returns the new state, or "failed" when the token could not be obtained. */
export async function enablePush(centerId: string, lang: string): Promise<PushState | 'failed'> {
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !(await isSupported().catch(() => false))) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission === 'denied') return 'blocked';
  if (permission !== 'granted') return 'off';
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return 'failed';
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return 'failed';
    await registerDevice(centerId, token, lang);
    try {
      localStorage.setItem(flagKey(centerId), '1');
    } catch {
      /* ignore */
    }
    return 'on';
  } catch {
    return 'failed';
  }
}

/** Short two-tone alert for a new assignment (WebAudio, no asset). Browsers only allow it after the page has had a click. */
export function playAlertSound(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const tone = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.3);
    };
    tone(880, 0);
    tone(660, 0.32);
    tone(880, 0.64);
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* sound is a convenience; the banner is the real alert */
  }
}
