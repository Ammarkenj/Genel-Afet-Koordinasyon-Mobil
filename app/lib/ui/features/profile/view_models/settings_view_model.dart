import 'package:flutter/material.dart';

/// App-wide settings: language, theme and the two safety switches. In memory for now.
// ignore_for_file: prefer_initializing_formals
class SettingsViewModel extends ChangeNotifier {
  SettingsViewModel({
    Locale locale = const Locale('tr'),
    ThemeMode themeMode = ThemeMode.system,
  }) : _locale = locale,
       _themeMode = themeMode;

  Locale _locale;
  ThemeMode _themeMode;
  bool _autoDetect = true;
  bool _smsBackup = true;

  Locale get locale => _locale;
  ThemeMode get themeMode => _themeMode;
  bool get autoDetect => _autoDetect;
  bool get smsBackup => _smsBackup;
  bool get isArabic => _locale.languageCode == 'ar';

  void setLanguage(String code) {
    _locale = Locale(code);
    notifyListeners();
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  void setAutoDetect(bool value) {
    _autoDetect = value;
    notifyListeners();
  }

  void setSmsBackup(bool value) {
    _smsBackup = value;
    notifyListeners();
  }
}
