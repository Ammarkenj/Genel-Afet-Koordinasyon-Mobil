# YaşamHattı operations platform (React + Firebase)

Web app for the emergency operations room and for each service center (fire, AFAD rescue, search and rescue, ambulance).
It reads the reports the Flutter app writes, suggests the nearest suitable centers, assigns reports to them and notifies the
center live (and by push when the page is closed).

* **Admin** (`/admin/*`): overview, live map, reports (+ assignment drawer with vehicle-aware suggestions), volunteers and needs, centers (live vehicle / staff / crew counts; **center detail page** with the same numbers the center sees: stats, fleet, team, ready crews with their state today, recent jobs with the crew that went), assembly areas.
* **Center** (`/center/*`): a full console for the center. **Dashboard** (status switch, cards for active/done today, average accept and arrival time, vehicles ready/total, staff on duty/total, 7-day chart, recent activity), **Reports** (all its assignments, filters, detail with map, steps, crew; plus a **live panel** with a map and the list of open assignments (a new one has an **Accept** button right there, which opens the crew picker without leaving the page), beside the table on screens of 1500px or more and above it on narrower ones), **Team**, with two tabs: **Ready crews** (a crew = a vehicle + its people + its own working days, defined once; the state today is shown in words: ready, ready with a member missing, not on duty today, on a mission, vehicle unavailable) and **Staff** (add, edit, delete; each person has **working days** chosen with day chips or the "weekdays" / "every day" presets), and **Vehicles** (add, edit, delete; "on a mission" is derived from the running assignments), **Settings** (info, notifications, language, theme). Accepting an assignment opens the crew picker: **one tap on a ready crew** (several for a big incident), or "form a crew by hand" as the fallback. Phone: bottom navigation and card tables; desktop: side navigation.
* Turkish and Arabic (RTL), light and dark. Design rules: `../design-system/yasamhatti/MASTER.md`. The static design mockup is in `design/`.

## Layout

```
src/domain        types, geo, suggestCenters, crew (busy/free), centerStats, workdays, stats (all with tests)
src/data          Firestore mappers, live hooks, providers, write operations (repos.ts)
src/firebase      app init (emulator switch), auth with role claims, push (FCM) helpers
src/features      auth/, admin/, center/
src/components    icons, badges, dialogs, map (Leaflet), toast
src/i18n          tr.json / ar.json (same keys in both)
functions/        Cloud Functions: createCenter, setCenterActive, deleteCenter, onAssignmentCreated, onVehicleWritten / onStaffWritten (keep center stats)
firestore.rules   security rules          tests/rules   rules tests
tests/e2e         client code against Auth+Firestore+Functions emulators
tests/ui          browser check (screenshots, flows) against the emulators
scripts/          seed.ts (emulator sample data), make-admin.ts
```

## Sign-in pages

Two separate pages: **`/admin/login`** (operations room) and **`/center/login`** (service centers); `/login` only offers the choice. Each page accepts only its own kind of account: an admin account on the center page, or a center account on the admin page, is refused with a pointer to the right page and is not left signed in. Opening `/admin` or `/center` while signed out sends you to the matching page.

## Roles and security

Roles are Auth custom claims set only by the server: `role: 'admin' | 'center'` and `centerId` for a center.
A center can read only its own `centers/{id}` document, its own `staff`, `vehicles` and `crews`, and its own `assignments`, can change only an assignment's
`status`/`seen` (forward steps only: notified > accepted > enroute > arrived > done, or declined from notified) and its own
availability. It never reads `reports`. The assignment holds a safe snapshot of the report (no device id). Anonymous app users can only
create well-formed reports. On accepting, a center writes the **crew** (vehicles and people that go out) and server-time stamps for each step; the crew cannot change after "arrived". Centers manage their own staff, vehicles and ready crews; admins only read them; the counts on the center document (`stats`) are written by Cloud Functions only. Everything not listed in `firestore.rules` is closed.

## Run locally (no Firebase project needed)

Needs Node 22+ and Java 21 (for the Firestore emulator).

One time: `npm install` and `npm --prefix functions install`. Then everything starts with one command
(or double-click `start-local.cmd`):

```
npm run local         # builds functions, starts the emulators, seeds sample data, starts the app, opens the browser
```

It prints the links and demo accounts, and Ctrl+C stops it all. To run the pieces by hand instead:

```
npm run emulators     # terminal 1: Auth, Firestore, Functions (project id demo-yasamhatti)
npm run seed          # terminal 2: sample data and demo accounts
npm run dev           # terminal 3: http://127.0.0.1:5173
```

Demo accounts (emulator only, printed by the seed script): `admin@ornek.org / Admin-2026-demo!`,
`kadikoy.112@ornek.org / Merkez-2026-demo!`, `yeni.merkez@ornek.org / Gecici-2026-demo!` (a center that has never signed in).

## Checks

```
npm run typecheck && npm run lint && npm test     # unit tests (domain, stats, notification text)
npm run test:rules                                # security rules on the Firestore emulator
npm run test:e2e                                  # createCenter > sign in > assign > status flow > delete
node tests/ui/ui-check.mjs <dir>                  # needs emulators + seed + dev server running; saves screenshots
```

## Going live (needs your decisions; nothing here has been done yet)

1. Create a Firebase project and add a Web app; copy `.env.example` to `.env.production` and fill it in.
2. Upgrade the project to the **Blaze** plan (Cloud Functions need it; the free quota is large for this size). Set a budget alert.
3. Cloud Messaging > Web Push certificates: create the key pair and put the public key in `VITE_FIREBASE_VAPID_KEY`.
4. Create your own user in Authentication, then `GOOGLE_APPLICATION_CREDENTIALS=key.json npx tsx scripts/make-admin.ts you@example.org --project <id>`.
5. `firebase use <project-id>`, then `npm run build` and
   `firebase deploy --only hosting,firestore:rules,firestore:indexes,functions`.
6. Real push cannot be emulated: test it on a phone (Android/Chrome; iPhone only after adding the page to the Home Screen).

## Sample data on the real project

The local seed uses well-known passwords, so it must never run as-is on a public project. Against a real project the seed is **secure**: no admin account (the admin is a real person's own account, made with `scripts/make-admin.ts`), every center gets a **random** password (there is no forced change at first sign-in, so hand it over safely), emails use the reserved domain `example.org`, an existing account keeps its password, and the new passwords are appended to a file you choose (keep it outside the repo).

```
set GOOGLE_APPLICATION_CREDENTIALS=<service-account key, outside the repo>
npx tsx scripts/seed.ts --allow-remote --project <id> --passwords-file <path>   # add the sample data
npm run seed:clean -- --allow-remote --project <id>                            # dry run: what would be removed
npm run seed:clean -- --allow-remote --project <id> --confirm                  # remove it (only the seed's fixed ids and those centers' accounts)
```

Add `--region elazig` to also create 4 centers and 6 assembly points around Elazığ (c12-c15, a7-a12), for testing from a phone that is not in Istanbul; `seed:clean` removes them too.

The seed refuses to write if it finds documents that are not its own (pass `--force-existing` to add next to them). Until the Cloud Functions are deployed (they need the Blaze plan) nothing keeps the center counts (`stats`) up to date, so they stay as seeded.

## Known limits

* Working days are a hard rule when accepting: a crew that is not scheduled today is not offered, and the manual form does not list people who are off duty, on leave or not scheduled today (a muted line says how many are hidden). Someone already on a mission is shown disabled with the reason. A crew with some members missing is still offered, without them and with a warning naming who and why. A center that needs someone on a day off changes that person's or crew's days first.
* A ready crew is not a lock on its vehicle or people: it is a shortcut. Vehicles and people count as busy only through running assignments (derived, never stored), so a crew cannot be double-booked.
* The counts on the admin list are stored (vehicles, ready vehicles, staff, crews). "On duty today" depends on the day and on running jobs, so it is computed from the records on the center detail page instead.
* A long local session can exhaust Windows temporary ports (the emulators and tests open thousands of connections) and the emulators then stall; restart `npm run local` after a few minutes of heavy use. The seed now writes only what changed to keep this low.
* No offline cache: Firestore uses an in-memory cache. The IndexedDB cache made reloads hang about half the time in a browser test (the new page waited for the old page's lease), which is unacceptable for a live operations tool. A center that goes offline keeps its open page, and its buttons say why they are disabled.
* Push delivery is only testable against the real FCM service.
* There is no forced password change at first sign-in: the password the admin hands out stays until it is changed in Firebase Auth. (A page for a center to change its own password is not built.)
* Map tiles come from OpenStreetMap (fine for light use; use a tile provider for heavy traffic).
* `npm audit` flags `@grpc/grpc-js` (pulled in by the Firebase web SDK for Node). It is used only by the Node-side tests; it is not in the browser bundle (checked: no `grpc-js` in `dist/`). Update `firebase` when a release moves it off 1.9.
* Tasks and volunteers are admin-only until the Flutter app is connected (the app needs its own rules for them).
