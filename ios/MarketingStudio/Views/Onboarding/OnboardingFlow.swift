import SwiftUI

/// Campaign-first onboarding (see ONBOARDING_SPEC.md): one product photo → a full campaign,
/// simulated locally, then account + paywall, then into the app.
struct OnboardingFlow: View {
    @EnvironmentObject private var store: AppStore
    @StateObject private var model = OnboardingModel()

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                if model.step != .opening { header }
                content
                    .id(model.step)
                    .transition(.asymmetric(
                        insertion: .move(edge: model.forward ? .trailing : .leading).combined(with: .opacity),
                        removal: .move(edge: model.forward ? .leading : .trailing).combined(with: .opacity)))
            }
        }
        .animation(MSAnimation.snappy, value: model.step)
    }

    private var canGoBack: Bool {
        switch model.step {
        case .opening, .analysis, .generation, .after: return false
        default: return true
        }
    }

    private var header: some View {
        VStack(spacing: 14) {
            HStack {
                if canGoBack {
                    Button {
                        if model.step == .account && model.hasAccount { model.hasAccount = false; model.go(.opening) }
                        else if model.step == .photos { model.go(.boldness) }
                        else { model.back() }
                    } label: {
                        Image(systemName: "chevron.left").font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.text2)
                            .frame(width: 32, height: 32)
                    }
                    .accessibilityLabel("Retour")
                } else {
                    Color.clear.frame(width: 32, height: 32)
                }
                Spacer()
                HStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 5, style: .continuous).fill(MSColor.accentGradient).frame(width: 16, height: 16)
                    Text("Sokozia").font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text)
                }
                Spacer()
                Color.clear.frame(width: 32, height: 32)
            }
            if let i = model.step.progressIndex {
                MSProgressBar(progress: Double(i + 1) / Double(OnboardingStep.progressCount))
            }
        }
        .msGutter()
        .padding(.top, 8)
        .padding(.bottom, 16)
    }

    @ViewBuilder private var content: some View {
        Group {
            switch model.step {
            case .opening: OnboardingOpeningView(model: model)
            case .upload: OnboardingUploadView(model: model)
            case .analysis: OnboardingAnalysisView(model: model)
            case .goal: OnboardingGoalView(model: model)
            case .platforms: OnboardingPlatformsView(model: model)
            case .direction: OnboardingDirectionView(model: model)
            case .brand: OnboardingBrandView(model: model)
            case .boldness: OnboardingBoldnessView(model: model)
            case .generation: OnboardingGenerationView(model: model)
            case .photos: OnboardingPhotosView(model: model)
            case .ugc: OnboardingUGCView(model: model)
            case .ads: OnboardingAdsView(model: model)
            case .copy: OnboardingCopyView(model: model)
            case .summary: OnboardingSummaryView(model: model)
            case .formats: OnboardingFormatsView(model: model)
            case .value: OnboardingValueView(model: model)
            case .workflow: OnboardingWorkflowView(model: model)
            case .campaign: OnboardingCampaignView(model: model)
            case .calendar: OnboardingCalendarView(model: model)
            case .account:
                OnboardingAccountView(model: model) {
                    if model.hasAccount { finish() } else { model.next() }
                }
            case .paywall: OnboardingPaywallView(model: model)
            case .after: OnboardingAfterView(model: model) { finish() }
            }
        }
        .padding(.horizontal, model.step == .opening ? 0 : MSSpacing.gutter)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    private func finish() {
        MSHaptic.success()
        store.completeOnboarding(model.answers())
    }
}
