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
