import type { Role } from './firebase/auth';

/** Where each role lands after signing in. */
export const homeFor = (role: Role | null): string => (role === 'admin' ? '/admin' : role === 'center' ? '/center' : '/login');

/** Each role has its own sign-in page; /login only lets a person choose. */
export const loginFor = (role: Role): string => (role === 'admin' ? '/admin/login' : '/center/login');
