import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/volunteer_view_model.dart';

/// Volunteer sign-up: role (role_type), certificate (certification_status), location-sharing note.
class VolunteerJoinView extends StatelessWidget {
  const VolunteerJoinView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<VolunteerViewModel>();
    return ScreenBody(
      children: [
        ScreenHeader(
          title: l.volJoinTitle,
          onBack: () => context.go(vm.origin),
        ),
        Text(l.volJoinLead, style: context.bodyLg),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.volRole),
            for (final r in VolunteerRole.values)
              ChoiceTile(
                icon: roleIcon(r),
                title: l.roleName(r),
                subtitle: l.roleDesc(r),
                selected: vm.draftRole == r,
                onTap: () => vm.setRole(r),
              ),
          ],
        ),
        CheckRow(
          label: l.volCert,
          value: vm.draftCertificate,
          onChanged: (_) => vm.toggleCertificate(),
        ),
        NoteLine(icon: AppIconName.pin, text: l.volLocationNote),
      ],
      pinned: [
        AppButton(
          label: l.volJoinBtn,
          icon: AppIconName.users,
          size: AppButtonSize.xl,
          onPressed: () {
            vm.register();
            context.pushReplacement('/vol');
            showToast(context, l.toastVolJoined);
          },
        ),
      ],
    );
  }
}
