import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../data/repositories/connectivity_repository.dart';
import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/donate_view_model.dart';

/// Secure donation (simulated). Needs the internet: offline, the button is disabled and the reason is written.
class DonateView extends StatefulWidget {
  const DonateView({super.key});

  @override
  State<DonateView> createState() => _DonateViewState();
}

class _DonateViewState extends State<DonateView> {
  late final TextEditingController _custom;

  @override
  void initState() {
    super.initState();
    _custom = TextEditingController(
      text: context.read<DonateViewModel>().custom,
    );
  }

  @override
  void dispose() {
    _custom.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<DonateViewModel>();
    final offline =
        context.watch<ConnectivityRepository>().status == NetworkStatus.offline;
    if (vm.custom.isEmpty && _custom.text.isNotEmpty) _custom.clear();

    if (vm.receipt != null) {
      final fundName = switch (vm.fund) {
        Fund.food => l.fundFood,
        Fund.shelter => l.fundShelter,
        Fund.rescue => l.fundRescue,
      };
      return ScreenBody(
        children: [
          ResultHeader(
            tone: Tone.ok,
            icon: AppIconName.checkCircle,
            title: l.donateDoneTitle,
            description: l.donateDoneDesc,
          ),
          KvCard(
            rows: [
              (l.donateReceipt, KvText(vm.receipt!, ltr: true)),
              (l.donatePurpose, KvText(fundName)),
              (l.donateTotal, KvText('${vm.paid} ₺', ltr: true)),
            ],
          ),
          NoteLine(icon: AppIconName.info, text: l.donateProto),
          AppButton(label: l.donateAgain, onPressed: vm.again),
        ],
      );
    }

    final funds = [
      (Fund.food, AppIconName.drop, l.fundFood, l.fundFoodDesc),
      (Fund.shelter, AppIconName.tent, l.fundShelter, l.fundShelterDesc),
      (Fund.rescue, AppIconName.lifebuoy, l.fundRescue, l.fundRescueDesc),
    ];
    final methods = [
      (PayMethod.card, AppIconName.card, l.donateCard),
      (PayMethod.transfer, AppIconName.bank, l.donateTransfer),
    ];

    return ScreenBody(
      children: [
        ScreenHeader(title: l.donateTitle),
        AppBanner(tone: Tone.ok, icon: AppIconName.lock, body: l.donateSecure),
        if (offline)
          AppBanner(
            tone: Tone.warn,
            icon: AppIconName.wifiOff,
            body: l.donateOffline,
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.donatePurpose),
            for (final f in funds)
              ChoiceTile(
                icon: f.$2,
                title: f.$3,
                subtitle: f.$4,
                selected: vm.fund == f.$1,
                onTap: () => vm.setFund(f.$1),
              ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.donateAmount),
            // Two rows of two (not a GridView: a shrink-wrapped viewport cannot be measured inside the screen's sliver).
            for (var row = 0; row < DonateViewModel.amounts.length; row += 2)
              Row(
                spacing: Sp.s2,
                children: [
                  for (final a in DonateViewModel.amounts.skip(row).take(2))
                    Expanded(
                      child: Directionality(
                        textDirection: TextDirection.ltr,
                        child: ChoiceTile(
                          title: '$a ₺',
                          center: true,
                          selected: vm.custom.isEmpty && vm.amount == a,
                          onTap: () => vm.setAmount(a),
                        ),
                      ),
                    ),
                ],
              ),
            LabeledField(
              label: l.donateCustom,
              controller: _custom,
              maxLength: 6,
              hint: l.donateCustomHint,
              error: vm.error ? l.donateCustomError : null,
              onChanged: vm.setCustom,
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.donateMethod),
            for (final m in methods)
              ChoiceTile(
                icon: m.$2,
                title: m.$3,
                selected: vm.method == m.$1,
                onTap: () => vm.setMethod(m.$1),
              ),
          ],
        ),
        AppButton(
          label: vm.processing ? l.donateProcessing : l.donateConfirm,
          icon: vm.processing ? null : AppIconName.lock,
          size: AppButtonSize.xl,
          busy: vm.processing,
          onPressed: offline ? null : vm.confirm,
        ),
        NoteLine(icon: AppIconName.info, text: l.donateProto),
      ],
    );
  }
}
