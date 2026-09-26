import SwiftUI

/// Every section has one: icon, explanation and a clear next step.
struct EmptyStateView: View {
    var icon: String
    var title: String
    var message: String
    var ctaTitle: String? = nil
    var ctaIcon: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(MSColor.elevated)
                    .frame(width: 68, height: 68)
                    .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                Image(systemName: icon)
                    .font(.system(size: 26, weight: .medium))
                    .foregroundStyle(MSColor.text2)
            }
            VStack(spacing: 6) {
                Text(title).msHeadline(18).multilineTextAlignment(.center)
                Text(message).msBody(14).multilineTextAlignment(.center).lineSpacing(2)
            }
            .frame(maxWidth: 300)
            if let ctaTitle, let action {
                MSButton(title: ctaTitle, icon: ctaIcon, style: .primary, size: .compact, fullWidth: false, action: action)
                    .padding(.top, 4)
            }
        }
        .padding(.vertical, 40)
        .padding(.horizontal, MSSpacing.xl)
        .frame(maxWidth: .infinity)
    }
}

/// Generic error state (SPEC §45).
struct ErrorStateView: View {
    var message: String = "Une erreur s'est produite."
    var retry: () -> Void
    var back: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 28, weight: .medium))
                .foregroundStyle(MSColor.warning)
            Text(message).msHeadline(17)
            HStack(spacing: 10) {
                MSButton(title: "Réessayer", style: .primary, size: .compact, fullWidth: false, action: retry)
                if let back {
                    MSButton(title: "Retour au Studio", style: .secondary, size: .compact, fullWidth: false, action: back)
                }
            }
        }
        .padding(.vertical, 40)
        .frame(maxWidth: .infinity)
    }
}
