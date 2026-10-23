import 'package:integration_test/integration_test.dart';

import 'suites/flows_suite.dart';

/// `flutter drive --target=test/drive_flows.dart` runs the flow tests in a real browser
/// (for machines where flutter_tester.exe is blocked, e.g. Windows Smart App Control).
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  flowsSuite();
}
