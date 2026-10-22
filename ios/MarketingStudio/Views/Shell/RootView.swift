import SwiftUI

/// Signed out → AuthView. Signed in → onboarding (first time) or the app. The workspace is loaded
/// per account and the credit balance comes from the server.
struct RootView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @EnvironmentObject private var auth: AuthService
    @Environment(\.scenePhase) private var scenePhase
    @State private var splash = true
    @State private var opening = true

    /// Loading screen while the account loads, then the home screen eases in.
    private func playOpening() async {
        splash = true
        opening = true
        let started = Date()
        await API.refreshAccount(store)
        let left = 1.1 - Date().timeIntervalSince(started)
        if left > 0 { try? await Task.sleep(for: .seconds(left)) }
        withAnimation(.easeOut(duration: 0.55)) { splash = false }
        withAnimation(.spring(response: 0.7, dampingFraction: 0.85).delay(0.1)) { opening = false }
    }

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            if auth.restoring {
                LaunchSplash()
            } else if auth.user == nil || store.accountId != auth.user?.id {
                AuthView()
                    .transition(.opacity)
            } else if store.onboardingDone {
                MainTabView()
                    .scaleEffect(opening ? 1.04 : 1)
                    .opacity(opening ? 0 : 1)
                    .transition(.opacity)
                    .overlay {
                        if splash {
                            LaunchSplash().transition(.opacity.combined(with: .scale(scale: 1.08)))
                        }
                    }
                    .task(id: auth.user?.id) { await playOpening() }
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


/// Brand loading screen: glowing "M" mark, name and a thin progress shimmer.
struct LaunchSplash: View {
    @State private var pulse = false
    @State private var sweep = false

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            RadialGradient(colors: [MSColor.accent.opacity(pulse ? 0.22 : 0.10), .clear], center: .center, startRadius: 10, endRadius: 260)
                .ignoresSafeArea()
            VStack(spacing: 18) {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(MSColor.accentGradient)
                    .frame(width: 84, height: 84)
                    .overlay(Text("M").font(.system(size: 46, weight: .heavy, design: .rounded)).foregroundStyle(MSColor.onAccent))
                    .shadow(color: MSColor.accent.opacity(0.45), radius: pulse ? 30 : 14)
                    .scaleEffect(pulse ? 1.04 : 0.96)
                Text("Marketing Studio").font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
                Capsule().fill(MSColor.elevated).frame(width: 120, height: 4)
                    .overlay(alignment: .leading) {
                        Capsule().fill(MSColor.accent).frame(width: 40, height: 4).offset(x: sweep ? 80 : 0)
                    }
                    .clipShape(Capsule())
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) { pulse = true }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) { sweep = true }
        }
    }
}
