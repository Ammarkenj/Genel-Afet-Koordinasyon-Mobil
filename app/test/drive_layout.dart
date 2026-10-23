import 'package:integration_test/integration_test.dart';

import 'suites/layout_suite.dart';

/// `flutter drive --target=test/drive_layout.dart` runs the layout matrix in a real browser.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  layoutSuite();
}
