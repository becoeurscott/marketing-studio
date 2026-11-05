import SwiftUI

/// Signed out → AuthView. Signed in → onboarding (first time) or the app. The workspace is loaded
/// per account and the credit balance comes from the server.
struct RootView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @EnvironmentObject private var auth: AuthService
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("hasSeenOpening") private var hasSeenOpening = false
    @State private var splash = true
    @State private var opening = true
    @State private var signInBurst = false
    /// Account id whose server state (credits, onboarding) has been loaded at least once.
    @State private var accountChecked: String?

    /// Loading screen while the account loads, then the home screen eases in.
    private func playOpening() async {
        if store.preferences.reduceMotion {
            await API.refreshAccount(store)
            splash = false
            opening = false
            return
        }
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
            if !hasSeenOpening {
                WelcomeOpening { withAnimation(MSAnimation.slow) { hasSeenOpening = true } }
                    .transition(.opacity)
            } else if auth.restoring {
                LaunchSplash()
            } else if auth.user == nil || store.accountId != auth.user?.id {
                AuthView()
                    .transition(.opacity)
            } else if !store.onboardingDone && accountChecked != auth.user?.id {
                LaunchSplash()
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
        .tint(MSColor.accent)
        .transaction { transaction in
            if store.preferences.reduceMotion {
                transaction.animation = nil
                transaction.disablesAnimations = true
            }
        }
        .animation(MSAnimation.slow, value: store.onboardingDone)
        .animation(MSAnimation.slow, value: auth.user?.id)
        .task { await auth.restore() }
        .onChange(of: auth.user, initial: true) { old, user in
            if old == nil, user != nil, !auth.restoring, !store.preferences.reduceMotion {
                withAnimation(.easeOut(duration: 0.2)) { signInBurst = true }
                Task {
                    try? await Task.sleep(for: .seconds(2.2))
                    withAnimation(.easeInOut(duration: 0.45)) { signInBurst = false }
                }
            }
            if let user {
                if store.accountId != user.id { store.load(for: user) }
                Task {
                    await API.refreshAccount(store)
                    accountChecked = user.id
                }
            } else if store.accountId != nil {
                router.dismissSheet()
                store.unload()
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, auth.isSignedIn { Task { await API.refreshAccount(store) } }
            if phase == .background { store.saveNow() }
        }
        .overlay {
            if signInBurst {
                SignInLogoAnimation(name: auth.user?.name ?? "", returning: store.onboardingDone)
                    .transition(.opacity)
                    .zIndex(10)
            }
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
                MSBrandMark(size: 88)
                    .shadow(color: MSColor.accent.opacity(0.45), radius: pulse ? 30 : 14)
                    .scaleEffect(pulse ? 1.04 : 0.96)
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


/// Played once right after a fresh sign-in: the logo pops in, light rings ripple out, a check mark
/// lands on it and the user is greeted before the app appears.
struct SignInLogoAnimation: View {
    var name: String
    /// Account already set up: greet with "welcome back" and go straight to the app.
    var returning = false
    @State private var logoIn = false
    @State private var ripple = false
    @State private var check = false
    @State private var textIn = false

    private var firstName: String { name.split(separator: " ").first.map(String.init) ?? "" }

    var body: some View {
        ZStack {
            MSColor.bg.ignoresSafeArea()
            RadialGradient(colors: [MSColor.accent.opacity(logoIn ? 0.25 : 0), .clear], center: .center, startRadius: 10, endRadius: 320)
                .ignoresSafeArea()
            VStack(spacing: 26) {
                ZStack {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .strokeBorder(MSColor.accent.opacity(0.5), lineWidth: 2)
                            .frame(width: 110, height: 110)
                            .scaleEffect(ripple ? 2.6 + CGFloat(i) * 0.5 : 0.8)
                            .opacity(ripple ? 0 : 0.8)
                            .animation(.easeOut(duration: 1.4).delay(0.25 + Double(i) * 0.18), value: ripple)
                    }
                    MSBrandMark(size: 96)
                        .shadow(color: MSColor.accent.opacity(0.6), radius: logoIn ? 32 : 0)
                        .scaleEffect(logoIn ? 1 : 0.2)
                        .rotationEffect(.degrees(logoIn ? 0 : -90))
                        .opacity(logoIn ? 1 : 0)
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(MSColor.onAccent, MSColor.accent)
                        .background(Circle().fill(MSColor.bg).padding(2))
                        .offset(x: 44, y: 40)
                        .scaleEffect(check ? 1 : 0.01)
                        .opacity(check ? 1 : 0)
                }
                .frame(height: 160)
                VStack(spacing: 6) {
                    Text(returning
                         ? (firstName.isEmpty ? "Bon retour !" : "Bon retour, \(firstName) !")
                         : (firstName.isEmpty ? "Bienvenue !" : "Bienvenue, \(firstName) !"))
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(MSColor.text)
                    Text(returning ? "Content de vous revoir." : "Votre studio est prêt.")
                        .font(MSFont.body(15))
                        .foregroundStyle(MSColor.text2)
                }
                .opacity(textIn ? 1 : 0)
                .offset(y: textIn ? 0 : 14)
            }
        }
        .onAppear {
            MSHaptic.success()
            withAnimation(.spring(response: 0.6, dampingFraction: 0.62)) { logoIn = true }
            ripple = true
            withAnimation(.spring(response: 0.4, dampingFraction: 0.55).delay(0.7)) { check = true }
            withAnimation(.easeOut(duration: 0.5).delay(0.9)) { textIn = true }
        }
    }
}
