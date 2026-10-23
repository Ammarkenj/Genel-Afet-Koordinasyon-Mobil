import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'app_icon.dart';

bool isLargeText(BuildContext context) =>
    MediaQuery.textScalerOf(context).scale(16) / 16 > kLargeTextScale;

enum Tone { ok, warn, info, danger }

({Color bg, Color fg}) toneColors(BuildContext context, Tone tone) {
  final c = context.colors;
  return switch (tone) {
    Tone.ok => (bg: c.safeSoft, fg: c.safeText),
    Tone.warn => (bg: c.warnSoft, fg: c.warnText),
    Tone.info => (bg: c.infoSoft, fg: c.infoText),
    Tone.danger => (bg: c.dangerSoft, fg: c.dangerText),
  };
}

/// Status pill: always an icon plus words, never colour alone.
class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.tone,
    required this.icon,
    required this.label,
  });

  final Tone tone;
  final AppIconName icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final t = toneColors(context, tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: t.bg,
        borderRadius: BorderRadius.circular(Radii.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppIcon(icon, size: IconSizes.sm, color: t.fg),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: context.label.copyWith(
                fontWeight: FontWeight.w700,
                color: t.fg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Small grey tag ("Örnek veri").
class AppTag extends StatelessWidget {
  const AppTag(this.label, {super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: context.colors.surface2,
        borderRadius: BorderRadius.circular(Radii.pill),
      ),
      child: Text(
        label,
        style: context.caption.copyWith(
          fontWeight: FontWeight.w700,
          color: context.colors.textMuted,
        ),
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.flush = false});

  final Widget child;
  final bool flush;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: Sp.s4,
        vertical: flush ? Sp.s1 : Sp.s4,
      ),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(Radii.md),
      ),
      child: child,
    );
  }
}

/// Banner with a border in the text colour (network state, offline notes).
class AppBanner extends StatelessWidget {
  const AppBanner({
    super.key,
    required this.tone,
    required this.icon,
    this.title,
    required this.body,
    this.extra,
  });

  final Tone tone;
  final AppIconName icon;
  final String? title;
  final String body;
  final Widget? extra;

  @override
  Widget build(BuildContext context) {
    final t = toneColors(context, tone);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Sp.s3),
      decoration: BoxDecoration(
        color: t.bg,
        border: Border.all(color: t.fg),
        borderRadius: BorderRadius.circular(Radii.sm),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppIcon(icon, color: t.fg),
          const SizedBox(width: Sp.s3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 2,
              children: [
                if (title != null)
                  Text(
                    title!,
                    style: context.body.copyWith(
                      fontWeight: FontWeight.w700,
                      color: t.fg,
                    ),
                  ),
                Text(body, style: context.label.copyWith(color: t.fg)),
                if (extra != null)
                  Padding(padding: const EdgeInsets.only(top: 4), child: extra),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Icon + helper sentence ("Bu bir prototiptir").
class NoteLine extends StatelessWidget {
  const NoteLine({
    super.key,
    required this.icon,
    required this.text,
    this.color,
  });

  final AppIconName icon;
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final fg = color ?? context.colors.textMuted;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 1),
          child: AppIcon(icon, size: IconSizes.sm, color: fg),
        ),
        const SizedBox(width: Sp.s2),
        Expanded(
          child: Text(text, style: context.label.copyWith(color: fg)),
        ),
      ],
    );
  }
}

/// Error text under a field: icon + words, not red alone.
class FieldError extends StatelessWidget {
  const FieldError(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    final fg = context.colors.dangerText;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppIcon(AppIconName.alert, size: IconSizes.sm, color: fg),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: context.label.copyWith(
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ),
      ],
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final title = Semantics(
      header: true,
      child: Text(text, style: context.section),
    );
    if (trailing == null) return title;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(child: title),
        trailing!,
      ],
    );
  }
}

/// Leading + main content + trailing. At large OS text sizes the trailing part drops under the text
/// instead of squeezing it to one word per line (checked at 150% and 200%).
class AdaptiveRow extends StatelessWidget {
  const AdaptiveRow({
    super.key,
    this.leading,
    required this.main,
    this.trailing,
    this.gap = Sp.s3,
    this.crossAxisAlignment = CrossAxisAlignment.center,
  });

  final Widget? leading;
  final Widget main;
  final Widget? trailing;
  final double gap;
  final CrossAxisAlignment crossAxisAlignment;

  @override
  Widget build(BuildContext context) {
    final stack = isLargeText(context) && trailing != null;
    return Row(
      crossAxisAlignment: crossAxisAlignment,
      children: [
        if (leading != null) ...[leading!, SizedBox(width: gap)],
        Expanded(
          child: stack
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: Sp.s1,
                  children: [main, trailing!],
                )
              : main,
        ),
        if (!stack && trailing != null) ...[SizedBox(width: gap), trailing!],
      ],
    );
  }
}

/// Tappable card row: leading icon/number, title + hint, optional extra under the text, optional chip, chevron.
class ListRowButton extends StatelessWidget {
  const ListRowButton({
    super.key,
    this.leading,
    required this.title,
    this.subtitle,
    this.extra,
    this.chip,
    this.chevron = false,
    this.selected = false,
    required this.onTap,
    this.semanticLabel,
  });

  final Widget? leading;
  final String title;
  final String? subtitle;
  final Widget? extra;
  final Widget? chip;
  final bool chevron;
  final bool selected;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = selected ? c.infoText : c.text;
    final main = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: context.body.copyWith(fontWeight: FontWeight.w700, color: fg),
        ),
        if (subtitle != null)
          Text(
            subtitle!,
            style: context.hint.copyWith(
              color: selected ? c.infoText : c.textMuted,
            ),
          ),
        ?extra,
      ],
    );
    final trailing = (chip != null || chevron || selected)
        ? Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (chip != null) Flexible(child: chip!),
              if (chip != null && (chevron || selected))
                const SizedBox(width: Sp.s2),
              if (selected) AppIcon(AppIconName.check, color: c.infoText),
              if (chevron)
                AppIcon(AppIconName.chevron, flip: true, color: c.text),
            ],
          )
        : null;
    return Semantics(
      button: true,
      selected: selected,
      label: semanticLabel,
      child: Material(
        color: selected ? c.infoSoft : c.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.sm),
          side: BorderSide(
            color: selected ? c.info : c.border,
            width: selected ? 2 : 1,
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(Radii.sm),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: Tap.control),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Sp.s3,
                vertical: Sp.s2,
              ),
              child: AdaptiveRow(
                leading: leading == null
                    ? null
                    : IconTheme(
                        data: IconThemeData(color: fg),
                        child: leading!,
                      ),
                main: main,
                trailing: trailing,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Number badge (assembly areas).
class NumberBadge extends StatelessWidget {
  const NumberBadge(this.number, {super.key});

  final int number;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      width: 28,
      height: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: c.safe, shape: BoxShape.circle),
      child: ExcludeSemantics(
        child: Text(
          '$number',
          style: context.label.copyWith(
            fontWeight: FontWeight.w700,
            color: c.onSafe,
            height: 1,
          ),
        ),
      ),
    );
  }
}

/// A selectable card (language, role, fund, payment method). Selected = fill + check + bold.
class ChoiceTile extends StatelessWidget {
  const ChoiceTile({
    super.key,
    this.icon,
    required this.title,
    this.subtitle,
    required this.selected,
    required this.onTap,
    this.large = false,
    this.center = false,
  });

  final AppIconName? icon;
  final String title;
  final String? subtitle;
  final bool selected;
  final VoidCallback onTap;
  final bool large;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = selected ? c.infoText : c.text;
    final titleStyle = context.body.copyWith(
      fontSize: large ? 20 : (center ? 18 : 16),
      fontWeight: selected || large || center
          ? FontWeight.w700
          : FontWeight.w500,
      color: fg,
    );
    return Semantics(
      button: true,
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: Material(
        color: selected ? c.infoSoft : c.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.sm),
          side: BorderSide(color: selected ? c.info : c.borderStrong, width: 2),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(Radii.sm),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: large ? Tap.emergency : Tap.control,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Sp.s3,
                vertical: Sp.s2,
              ),
              child: Row(
                mainAxisAlignment: center
                    ? MainAxisAlignment.center
                    : MainAxisAlignment.start,
                children: [
                  if (selected && center) ...[
                    AppIcon(AppIconName.check, size: IconSizes.sm, color: fg),
                    const SizedBox(width: 6),
                  ],
                  if (icon != null) ...[
                    AppIcon(icon!, color: fg),
                    const SizedBox(width: Sp.s3),
                  ],
                  Flexible(
                    child: Column(
                      crossAxisAlignment: center
                          ? CrossAxisAlignment.center
                          : CrossAxisAlignment.start,
                      children: [
                        Text(title, style: titleStyle),
                        if (subtitle != null)
                          Text(
                            subtitle!,
                            style: context.hint.copyWith(
                              color: selected ? c.infoText : c.textMuted,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (selected && !center) ...[
                    const SizedBox(width: Sp.s3),
                    AppIcon(AppIconName.check, color: fg),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Whole-row switch. "On" is shown with the word as well as the green track and knob.
class SwitchRow extends StatelessWidget {
  const SwitchRow({
    super.key,
    required this.title,
    this.description,
    required this.value,
    required this.stateLabel,
    required this.onChanged,
  });

  final String title;
  final String? description;
  final bool value;
  final String stateLabel;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      toggled: value,
      label: title,
      hint: description,
      child: InkWell(
        onTap: () => onChanged(!value),
        borderRadius: BorderRadius.circular(Radii.sm),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: Tap.control),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: Sp.s2),
            child: ExcludeSemantics(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 2,
                      children: [
                        Text(
                          title,
                          style: context.body.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (description != null)
                          Text(description!, style: context.hint),
                      ],
                    ),
                  ),
                  const SizedBox(width: Sp.s3),
                  Text(
                    stateLabel,
                    style: context.label.copyWith(
                      fontWeight: FontWeight.w700,
                      color: value ? c.safeText : c.textMuted,
                    ),
                  ),
                  const SizedBox(width: Sp.s3),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 52,
                    height: 32,
                    decoration: BoxDecoration(
                      color: value ? c.safe : c.surface2,
                      border: Border.all(
                        color: value ? c.safe : c.borderStrong,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(Radii.pill),
                    ),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 200),
                      alignment: value
                          ? AlignmentDirectional.centerEnd
                          : AlignmentDirectional.centerStart,
                      child: Container(
                        margin: const EdgeInsets.all(2),
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: value ? c.onSafe : c.borderStrong,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Label/value rows inside a card (status details, profile).
class KvCard extends StatelessWidget {
  const KvCard({super.key, required this.rows, this.card = true});

  final List<(String, Widget)> rows;
  final bool card;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final children = <Widget>[];
    for (var i = 0; i < rows.length; i++) {
      final (label, value) = rows[i];
      if (i > 0) {
        children.add(Divider(height: 1, thickness: 1, color: c.border));
      }
      children.add(
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: isLargeText(context)
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 2,
                    children: [
                      Text(label, style: context.hint),
                      value,
                    ],
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(child: Text(label, style: context.hint)),
                      const SizedBox(width: Sp.s3),
                      // The value gets most of the row (flex 3 vs 1) so a chip like "Yardım istiyorum" stays on one line.
                      Flexible(
                        flex: 3,
                        child: Align(
                          alignment: AlignmentDirectional.centerEnd,
                          child: value,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      );
    }
    final list = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    );
    return card ? AppCard(child: list) : list;
  }
}

/// Bold value text for [KvCard] rows. Numbers and coordinates stay left-to-right in Arabic.
class KvText extends StatelessWidget {
  const KvText(this.text, {super.key, this.ltr = false});

  final String text;
  final bool ltr;

  @override
  Widget build(BuildContext context) {
    final t = Text(
      text,
      style: context.body.copyWith(fontWeight: FontWeight.w700),
      textAlign: TextAlign.end,
    );
    return ltr ? Directionality(textDirection: TextDirection.ltr, child: t) : t;
  }
}

/// Result header (sent / queued / done): tone colour + large icon + title + sentence.
class ResultHeader extends StatelessWidget {
  const ResultHeader({
    super.key,
    required this.tone,
    required this.icon,
    required this.title,
    required this.description,
    this.note,
  });

  final Tone tone;
  final AppIconName icon;
  final String title;
  final String description;
  final String? note;

  @override
  Widget build(BuildContext context) {
    final t = toneColors(context, tone);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Sp.s4),
      decoration: BoxDecoration(
        color: t.bg,
        borderRadius: BorderRadius.circular(Radii.md),
      ),
      child: Column(
        spacing: Sp.s2,
        children: [
          AppIcon(icon, size: 64, color: t.fg),
          Semantics(
            header: true,
            child: Text(
              title,
              style: context.headline.copyWith(color: t.fg),
              textAlign: TextAlign.center,
            ),
          ),
          Text(
            description,
            style: context.bodyLg.copyWith(color: t.fg),
            textAlign: TextAlign.center,
          ),
          if (note != null)
            NoteLine(icon: AppIconName.info, text: note!, color: t.fg),
        ],
      ),
    );
  }
}

/// Urgency = dots + words, never colour alone and never red (red is only for "I need help").
class UrgencyLabel extends StatelessWidget {
  const UrgencyLabel({super.key, required this.level, required this.text});

  final int level;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ExcludeSemantics(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            spacing: 4,
            children: [
              for (var i = 1; i <= 3; i++)
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i <= level ? c.info : Colors.transparent,
                    border: Border.all(
                      color: i <= level ? c.info : c.borderStrong,
                      width: 2,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: Sp.s2),
        Flexible(
          child: Text(
            text,
            style: context.label.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

/// Checkbox with a label, 48dp tall.
class CheckRow extends StatelessWidget {
  const CheckRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.invalid = false,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final bool invalid;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      checked: value,
      label: label,
      child: InkWell(
        onTap: () => onChanged(!value),
        borderRadius: BorderRadius.circular(Radii.sm),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: Tap.min),
          child: ExcludeSemantics(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: value ? c.info : c.surface,
                    border: Border.all(
                      color: invalid
                          ? c.dangerAccent
                          : (value ? c.info : c.borderStrong),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: value
                      ? AppIcon(
                          AppIconName.check,
                          size: IconSizes.sm,
                          color: c.onInfo,
                        )
                      : null,
                ),
                const SizedBox(width: Sp.s3),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Text(
                      label,
                      style: context.label.copyWith(
                        fontSize: 15,
                        color: c.text,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Labelled text field: visible label above, hint under, error under the field itself.
class LabeledField extends StatelessWidget {
  const LabeledField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.error,
    this.prefix,
    this.keyboardType = TextInputType.number,
    this.maxLength,
    this.onChanged,
    this.onSubmitted,
    this.fieldKey,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? error;
  final String? prefix;
  final TextInputType keyboardType;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final Key? fieldKey;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    OutlineInputBorder border(Color color) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(Radii.sm),
      borderSide: BorderSide(color: color, width: 2),
    );
    final field = TextField(
      key: fieldKey,
      controller: controller,
      keyboardType: keyboardType,
      maxLength: maxLength,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      style: context.bodyLg,
      textDirection: TextDirection.ltr,
      decoration: InputDecoration(
        counterText: '',
        filled: true,
        fillColor: c.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Sp.s4,
          vertical: 14,
        ),
        enabledBorder: border(error != null ? c.dangerAccent : c.borderStrong),
        focusedBorder: border(error != null ? c.dangerAccent : c.focus),
        constraints: const BoxConstraints(minHeight: Tap.control),
        semanticCounterText: '',
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 6,
      children: [
        Text(label, style: context.body.copyWith(fontWeight: FontWeight.w500)),
        if (prefix == null)
          field
        else
          Directionality(
            textDirection: TextDirection.ltr,
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    constraints: const BoxConstraints(minHeight: Tap.control),
                    padding: const EdgeInsets.symmetric(horizontal: Sp.s3),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: c.surface2,
                      border: Border.all(color: c.borderStrong, width: 2),
                      borderRadius: BorderRadius.circular(Radii.sm),
                    ),
                    child: Text(
                      prefix!,
                      style: context.bodyLg.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: Sp.s2),
                  Expanded(child: field),
                ],
              ),
            ),
          ),
        if (hint != null) Text(hint!, style: context.hint),
        if (error != null) FieldError(error!),
      ],
    );
  }
}
