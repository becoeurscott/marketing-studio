import SwiftUI

/// SPEC §45. Generic failure ("Something went wrong.") and the "Not enough credits" variant.
struct GenerationErrorView: View {
    var failure: GenerationFailure
    var retry: () -> Void
    var back: (() -> Void)? = nil
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var body: some View {
        switch failure {
        case .insufficientCredits(let needed):
            VStack(spacing: 14) {
                ZStack {
                    Circle().fill(MSColor.warning.opacity(0.12)).frame(width: 64, height: 64)
                    Image(systemName: "bolt.slash.fill")
                        .font(.system(size: 26, weight: .medium))
                        .foregroundStyle(MSColor.warning)
                }
                Text("Not enough credits").msHeadline(18)
                Text("This needs \(needed) credits and you have \(store.credits). Top up to keep creating.")
                    .msBody(14)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                HStack(spacing: 10) {
                    MSButton(title: "Get credits", icon: "bolt.fill", style: .primary, size: .compact, fullWidth: false) {
                        router.push(.credits, on: .more)
                    }
                    if let back {
                        MSButton(title: "Back to Studio", style: .secondary, size: .compact, fullWidth: false, action: back)
                    } else {
                        MSButton(title: "Try Again", style: .secondary, size: .compact, fullWidth: false, action: retry)
                    }
                }
            }
            .padding(.vertical, 32)
            .frame(maxWidth: .infinity)
        case .generic(let message):
            VStack(spacing: 6) {
                ErrorStateView(message: "Something went wrong.", retry: retry, back: back)
                if !message.isEmpty {
                    Text(message).msCaption().multilineTextAlignment(.center).padding(.horizontal, 24).padding(.top, -28)
                }
            }
        }
    }
}
