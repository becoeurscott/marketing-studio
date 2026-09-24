import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            if store.onboardingDone {
                MainTabView()
                    .transition(.opacity.combined(with: .scale(scale: 1.02)))
            } else {
                OnboardingFlow()
                    .transition(.opacity)
            }
        }
        .animation(MSAnimation.slow, value: store.onboardingDone)
        .toastOverlay()
        .sheet(item: $router.presentedSheet) { sheet in
            SheetHost(sheet: sheet)
                .presentationDetents(sheet.detents)
                .preferredColorScheme(.dark)
        }
    }
}
