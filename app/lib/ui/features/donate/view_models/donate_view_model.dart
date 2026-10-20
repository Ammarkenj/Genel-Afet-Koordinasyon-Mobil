import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

enum Fund { food, shelter, rescue }

enum PayMethod { card, transfer }

/// Secure donation form. Payment is simulated: no real money moves in this prototype.
class DonateViewModel extends ChangeNotifier {
  DonateViewModel({this.processingDelay = const Duration(milliseconds: 1200)});

  static const amounts = [100, 250, 500, 1000];
  static const minimum = 10;

  final Duration processingDelay;

  Fund _fund = Fund.food;
  int _amount = 250;
  String _custom = '';
  PayMethod _method = PayMethod.card;
  bool _error = false;
  bool _processing = false;
  String? _receipt;
  int _paid = 0;
  Timer? _timer;

  Fund get fund => _fund;
  int get amount => _amount;
  String get custom => _custom;
  PayMethod get method => _method;
  bool get error => _error;
  bool get processing => _processing;
  String? get receipt => _receipt;
  int get paid => _paid;

  void setFund(Fund f) {
    _fund = f;
    notifyListeners();
  }

  void setAmount(int a) {
    _amount = a;
    _custom = '';
    _error = false;
    notifyListeners();
  }

  void setCustom(String text) {
    _custom = text;
    notifyListeners();
  }

  void setMethod(PayMethod m) {
    _method = m;
    notifyListeners();
  }

  /// Returns false when the custom amount is invalid (the error then shows under the field).
  bool confirm() {
    if (_processing) return true;
    final custom = _custom.trim();
    var amount = _amount;
    if (custom.isNotEmpty) {
      final parsed = int.tryParse(custom);
      if (parsed == null ||
          !RegExp(r'^\d+$').hasMatch(custom) ||
          parsed < minimum) {
        _error = true;
        notifyListeners();
        return false;
      }
      amount = parsed;
    }
    _error = false;
    _processing = true;
    notifyListeners();
    _timer = Timer(processingDelay, () {
      _processing = false;
      _paid = amount;
      _receipt = 'YH-${100000 + Random().nextInt(900000)}';
      notifyListeners();
    });
    return true;
  }

  void again() {
    _receipt = null;
    _custom = '';
    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
