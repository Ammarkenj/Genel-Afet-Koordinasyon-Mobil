# YaşamHattı (Flutter)

Phase 1: the **phone UI layer** with sample data, built from the HTML prototype in `../prototype`
(design rules: `../design-system/yasamhatti/MASTER.md`). Not built yet: Wear OS watch, real sensors,
local database + API, offline map, SMS and payments.

## Structure (MVVM, `ChangeNotifier` + `provider`, `go_router`)

```
lib/
  domain/models        plain models and enums
  data/repositories    in-memory fakes (connectivity, reports, volunteer): swap for Room/Drift + API later
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

## Firebase (reports reach the operations dashboard)

Reports can be stored in Cloud Firestore project `yasamahatti` (collection `reports`), which the dashboard in `../dashboard` reads.
The app signs in anonymously and uses real GPS (fixed Elazığ fallback if refused).

    flutter build apk --release --dart-define=BACKEND=firebase --dart-define=LAB=false

* Android package: `yasamayatti.com` (must match `android/app/google-services.json`).
* Needs Authentication > Anonymous enabled and the rules in `../dashboard/firestore.rules` deployed.
* Without `BACKEND=firebase` the app uses the in-memory fakes (tests and visual review always do).
* Windows: `android/gradle.properties` sets `kotlin.incremental=false` because the pub cache (C:) and the project (E:) are on different drives.

With `BACKEND=firebase` the app also reads the network state for real (`connectivity_plus`), shows the real GPS position on the status screen, and loads the assembly areas from Firestore (`assemblyAreas`, added by the admin in the dashboard). A report the server refuses (rules, anonymous sign-in disabled) shows the error code instead of "no internet".

Tools tab: the siren (bundled looping wail, `assets/audio/siren.wav`, plays offline) and the SOS flash (camera torch, Morse S-O-S) are real on the phone via `audioplayers` and `torch_light` (`lib/data/tools_hardware.dart`). Tests and the web build use a silent stand-in. 112 calls and SMS are still simulated.
