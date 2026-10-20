import 'package:flutter/foundation.dart';

enum LoginError { none, phone, code }

/// Phone + SMS code (prototype: any 6 digits are accepted). Emergency features never require this screen.
class LoginViewModel extends ChangeNotifier {
  int _step = 1;
  String _phone = '';
  String _code = '';
  LoginError _error = LoginError.none;

  int get step => _step;
  String get phone => _phone;
  String get code => _code;
  LoginError get error => _error;

  void setPhone(String value) => _phone = value;

  void setCode(String value) => _code = value;

  /// 10 digits starting with 5 (Turkish mobile number).
  bool sendCode() {
    final digits = _phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 10 || !digits.startsWith('5')) {
      _error = LoginError.phone;
      notifyListeners();
      return false;
    }
    _error = LoginError.none;
    _step = 2;
    notifyListeners();
    return true;
  }

  bool submitCode() {
    if (!RegExp(r'^\d{6}$').hasMatch(_code.trim())) {
      _error = LoginError.code;
      notifyListeners();
      return false;
    }
    _error = LoginError.none;
    return true;
  }

  void changeNumber() {
    _step = 1;
    _code = '';
    _error = LoginError.none;
    notifyListeners();
  }

  void reset() {
    _step = 1;
    _code = '';
    _error = LoginError.none;
    notifyListeners();
  }
}
