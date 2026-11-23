import 'package:flutter/foundation.dart';

import '../../../../data/repositories/auth_repository.dart';

enum LoginError {
  none,
  phone,
  code,
  codeInvalid,
  unavailable,
  rateLimited,
  connection,
  server,
}

/// Phone verification backed by the auth API. Emergency features never require this screen.
class LoginViewModel extends ChangeNotifier {
  LoginViewModel(this._authRepository);

  final AuthRepository _authRepository;
  int _step = 1;
  String _phone = '';
  String _code = '';
  LoginError _error = LoginError.none;
  bool _busy = false;

  int get step => _step;
  String get phone => _phone;
  String get code => _code;
  LoginError get error => _error;
  bool get busy => _busy;

  void setPhone(String value) => _phone = value;

  void setCode(String value) => _code = value;

  /// 10 digits starting with 5 (Turkish mobile number).
  Future<bool> sendCode() async {
    if (_busy) return false;
    final digits = _phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 10 || !digits.startsWith('5')) {
      _error = LoginError.phone;
      notifyListeners();
      return false;
    }
    _error = LoginError.none;
    _busy = true;
    notifyListeners();
    try {
      await _authRepository.requestOtp(_phone);
      _step = 2;
      return true;
    } on AuthApiException catch (error) {
      _error = _loginErrorFor(error);
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<bool> submitCode() async {
    if (_busy) return false;
    if (!RegExp(r'^\d{6}$').hasMatch(_code.trim())) {
      _error = LoginError.code;
      notifyListeners();
      return false;
    }
    _error = LoginError.none;
    _busy = true;
    notifyListeners();
    try {
      await _authRepository.verifyOtp(phoneNumber: _phone, code: _code.trim());
      return true;
    } on AuthApiException catch (error) {
      _error = _loginErrorFor(error);
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  LoginError _loginErrorFor(AuthApiException error) => switch (error.code) {
    'OTP_DELIVERY_UNAVAILABLE' => LoginError.unavailable,
    'RATE_LIMIT_EXCEEDED' => LoginError.rateLimited,
    'OTP_INVALID_OR_EXPIRED' => LoginError.codeInvalid,
    'CONNECTION_FAILED' => LoginError.connection,
    _ => LoginError.server,
  };

  @override
  void dispose() {
    _authRepository.clearChallenge();
    super.dispose();
  }

  void changeNumber() {
    _authRepository.clearChallenge();
    _step = 1;
    _code = '';
    _error = LoginError.none;
    notifyListeners();
  }

  void reset() {
    _authRepository.clearChallenge();
    _step = 1;
    _code = '';
    _error = LoginError.none;
    notifyListeners();
  }
}
