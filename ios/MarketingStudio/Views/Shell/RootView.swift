import SwiftUI

/// Signed out → AuthView. Signed in → onboarding (first time) or the app. The workspace is loaded
/// per account and the credit balance comes from the server.
struct RootView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @EnvironmentObject private var auth: AuthService
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            if auth.restoring {
                ProgressView().tint(MSColor.accent)
            } else if auth.user == nil || store.accountId != auth.user?.id {
                AuthView()
                    .transition(.opacity)
            } else if store.onboardingDone {
                MainTabView()
                    .transition(.opacity.combined(with: .scale(scale: 1.02)))
            } else {
                OnboardingFlow()
                    .transition(.opacity)
            }
        }
        .animation(MSAnimation.slow, value: store.onboardingDone)
        .animation(MSAnimation.slow, value: auth.user?.id)
        .task { await auth.restore() }
        .onChange(of: auth.user, initial: true) { _, user in
            if let user {
                if store.accountId != user.id { store.load(for: user) }
                Task { await API.refreshAccount(store) }
            } else if store.accountId != nil {
                router.dismissSheet()
                store.unload()
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, auth.isSignedIn { Task { await API.refreshAccount(store) } }
            if phase == .background { store.saveNow() }
        }
        .toastOverlay()
        .sheet(item: $router.presentedSheet) { sheet in
            SheetHost(sheet: sheet)
                .presentationDetents(sheet.detents)
                .preferredColorScheme(.dark)
        }
    }
}
