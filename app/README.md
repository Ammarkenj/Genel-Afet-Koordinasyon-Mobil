# YaşamHattı (Flutter)

The phone UI is built from the HTML prototype in `../prototype` (design rules:
`../design-system/yasamhatti/MASTER.md`). Guest emergency reports use the backend API; other sample-data
features, Wear OS watch, real sensors, persistent offline report storage, offline map, SMS and payments
are not built yet.

## Structure (MVVM, `ChangeNotifier` + `provider`, `go_router`)

```
lib/
  domain/models        plain models and enums
  data/repositories    API-backed guest reports; in-memory fakes for tests and other features
  ui/core              theme (tokens in theme/app_colors.dart), shared widgets, labels
  ui/features/<name>/  view_models/ + views/
  l10n/                app_tr.arb (template) and app_ar.arb; AppLocalizations is generated
```

Colours, sizes and strings come from the prototype (`prototype/css/tokens.css`, `prototype/js/i18n.js`);
`lib/ui/core/icons/icon_paths.dart` is generated from `prototype/js/icons.js`.

## Run

```
flutter pub get
flutter run -d chrome          # or an Android device/emulator
```

For the Android emulator, start the backend from `../backend` with `npm start`, then run:

```
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Guest reports request the device's current location and send the incident type, UTC time and coordinates
to `POST /api/v1/reports`. If location or server delivery fails, the status screen shows the failure and
lets the user retry. Failed reports are currently kept only in app memory; restart-safe offline queuing
is not implemented yet. Follow-up answers (injury/trapped/people count) and the separate “I am safe” flow
remain local-only. Reports can no longer be undone after the API request starts because the backend has
no cancellation endpoint.

In debug builds a round button opens the **lab panel** (network state, shake/crash/fall countdown, AFAD alert).
Review links (debug/`--dart-define=LAB=true`): `/?route=/status&seed=help&lang=ar&theme=dark&net=offline`
(`seed`: help, safe, vol, fall, crash, quake).

## Test

```
flutter analyze
flutter test                   # contrast, user flows, layout matrix (tr/ar, light/dark, 150%/200% text, 320dp)
```

On Windows with Smart App Control, `flutter_tester.exe` is blocked. The same suites run in a real browser:
start `chromedriver --port=4444`, then
`flutter drive --driver=test_driver/integration_test.dart --target=test/drive_flows.dart -d web-server --browser-name=chrome --chrome-binary=<chrome.exe> --headless`
(`test/drive_layout.dart` for the layout matrix).
