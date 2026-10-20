/// Spacing, shape and size tokens (prototype/css/tokens.css). 4/8 rhythm.
abstract final class Sp {
  static const double s1 = 4;
  static const double s2 = 8;
  static const double s3 = 12;
  static const double s4 = 16;
  static const double s6 = 24;
  static const double s8 = 32;
  static const double s12 = 48;
}

abstract final class Radii {
  static const double sm = 12; // fields, choices
  static const double md = 16; // buttons, cards
  static const double lg = 20; // dialogs
  static const double pill = 999;
}

/// Touch targets in logical pixels (dp).
abstract final class Tap {
  static const double min = 48; // anything tappable
  static const double control = 56; // buttons, inputs, choices
  static const double emergency = 72; // main emergency actions
  static const double critical = 96; // "I need help", countdown cancel
}

abstract final class IconSizes {
  static const double sm = 20;
  static const double md = 24;
  static const double lg = 32;
  static const double xl = 48;
}

/// Above this OS text scale, rows that mix text and chips/buttons stack instead of squeezing the text.
const double kLargeTextScale = 1.3;
