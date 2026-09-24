import SwiftUI

/// SPEC §40 — Settings: Account, Workspace, Notifications, Appearance, Brand, Subscription, Security, Help.
struct SettingsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var confirmReset = false
    @State private var showDefaults = false
    @State private var twoFactor = false
    @State private var showSessions = false

    private let ratios = ["1:1", "4:5", "9:16", "16:9", "3:2"]
    private let models = StudioOptions.models
    private let styles = ["Product Photography", "Luxury", "Minimal", "Street", "Lifestyle", "Editorial", "Cinematic", "UGC", "Studio", "Fashion", "Food", "Tech"]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                Text("Settings").msTitle(30).padding(.horizontal, MSSpacing.gutter)

                section("Account") {
                    navRow("Profile", subtitle: store.user.email, icon: "person.crop.circle") { router.push(.profile) }
                    divider
                    navRow("Workspace", subtitle: "\(store.members.count) members", icon: "building.2") { router.push(.workspace) }
                }

                section("Notifications") {
                    toggleRow("Push notifications", subtitle: "Generation and export updates", icon: "bell", isOn: pref(\.pushNotifications))
                    divider
                    toggleRow("Email digest", subtitle: "Weekly summary of activity", icon: "envelope", isOn: pref(\.emailDigest))
                    divider
                    toggleRow("Haptics", subtitle: "Feedback on taps and results", icon: "hand.tap", isOn: pref(\.haptics))
                }

                section("Appearance") {
                    HStack(spacing: 12) {
                        icon("moon.fill")
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Theme").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                            Text("Marketing Studio is dark only, tuned for creative work.").msCaption()
                        }
                        Spacer()
                        MSBadge(text: "Dark", tone: .neutral)
                    }
                    .padding(.horizontal, 12).frame(minHeight: 56)
                    divider
                    HStack(spacing: 12) {
                        icon("paintbrush.pointed")
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Accent").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                            Text("Used for primary actions and selection.").msCaption()
                        }
                        Spacer()
                        HStack(spacing: 4) {
                            Circle().fill(MSColor.accent).frame(width: 16, height: 16)
                            Circle().fill(MSColor.accent2).frame(width: 16, height: 16)
                            Circle().fill(MSColor.highlight).frame(width: 16, height: 16)
                        }
                    }
                    .padding(.horizontal, 12).frame(minHeight: 56)
                    divider
                    toggleRow("Reduce motion", subtitle: "Fewer animations", icon: "figure.walk.motion", isOn: pref(\.reduceMotion))
                }

                section("Studio defaults") {
                    navRow("Aspect ratio", subtitle: store.preferences.defaultRatio, icon: "aspectratio") { showDefaults = true }
                    divider
                    navRow("Model", subtitle: store.preferences.defaultModel, icon: "cpu") { showDefaults = true }
                    divider
                    navRow("Style", subtitle: store.preferences.defaultStyle, icon: "wand.and.stars") { showDefaults = true }
                }

                section("Brand") {
                    navRow("Brand kit", subtitle: store.brand.name, icon: "paintpalette") { router.push(.brandKit) }
                    divider
                    navRow("Brand voice", subtitle: "\(store.brand.voice.tone) tone", icon: "waveform.and.mic") { router.push(.brandVoice) }
                }

                section("Subscription") {
                    navRow("Plan", subtitle: "\(store.plan.title) · $\(store.plan.monthlyPrice)/mo", icon: "creditcard") { router.push(.pricing) }
                    divider
                    navRow("Credits", subtitle: "\(store.credits.formatted()) available", icon: "bolt") { router.push(.credits) }
                }

                section("Security") {
                    toggleRow("Two-factor authentication", subtitle: twoFactor ? "Enabled via authenticator app" : "Protect your account", icon: "lock.shield", isOn: $twoFactor)
                        .onChange(of: twoFactor) { _, on in router.toast(on ? "Two-factor enabled (mock)" : "Two-factor disabled", style: on ? .success : .info) }
                    divider
                    navRow("Change password", subtitle: "Last changed 3 months ago", icon: "key") { router.toast("Password reset email sent (mock)", style: .success) }
                    divider
                    navRow("Active sessions", subtitle: "iPhone · Chrome on Mac", icon: "iphone") { showSessions = true }
                }

                section("Help") {
                    navRow("Help center", subtitle: "FAQ and contact", icon: "questionmark.circle") { router.push(.help) }
                    divider
                    navRow("Send feedback", subtitle: "Tell us what to build next", icon: "bubble.left") { router.toast("Thanks, feedback noted (mock)", style: .success) }
                }

                VStack(spacing: 10) {
                    MSButton(title: "Reset demo data", icon: "arrow.counterclockwise", style: .danger) { confirmReset = true }
                    Text("Marketing Studio \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0") · Prototype build").msCaption()
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, 6)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(isPresented: $showDefaults, detents: [.large]) { defaultsSheet }
        .msSheet(isPresented: $showSessions, detents: [.medium]) { sessionsSheet }
        .confirmationDialog("Reset demo data?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Reset everything", role: .destructive) {
                store.resetAll()
                router.popToRoot(on: .more)
                router.select(.home)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Projects, assets, campaigns, credits and preferences return to the seeded demo and onboarding starts again.")
        }
    }

    // MARK: Sheets

    private var defaultsSheet: some View {
        BottomSheetContainer(title: "Studio defaults", subtitle: "Pre-filled on every new generation.") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    pickerGroup("Aspect ratio", ratios, pref(\.defaultRatio))
                    pickerGroup("Model", models, pref(\.defaultModel))
                    pickerGroup("Style", styles, pref(\.defaultStyle))
                    MSButton(title: "Done", icon: "checkmark") { showDefaults = false; router.toast("Defaults saved", style: .success) }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }

    private func pickerGroup(_ title: String, _ options: [String], _ binding: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).msHeadline(15)
            FlowLayout(spacing: 8) {
                ForEach(options, id: \.self) { o in
                    MSChip(title: o, selected: binding.wrappedValue == o) { binding.wrappedValue = o }
                }
            }
        }
    }

    private var sessionsSheet: some View {
        BottomSheetContainer(title: "Active sessions") {
            VStack(spacing: 10) {
                sessionRow("This iPhone", "Active now", icon: "iphone", current: true)
                sessionRow("Chrome on Mac", "San Francisco · 2 hours ago", icon: "laptopcomputer", current: false)
                Spacer(minLength: 0)
                MSButton(title: "Sign out other sessions", icon: "xmark.circle", style: .danger) {
                    showSessions = false
                    router.toast("Other sessions signed out (mock)", style: .success)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
    }

    private func sessionRow(_ title: String, _ subtitle: String, icon: String, current: Bool) -> some View {
        MSCard(padding: 12) {
            HStack(spacing: 12) {
                self.icon(icon)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    Text(subtitle).msCaption()
                }
                Spacer()
                if current { MSBadge(text: "Current", tone: .success) }
            }
        }
    }

    // MARK: Row builders

    private func pref<T>(_ keyPath: WritableKeyPath<UserPreferences, T>) -> Binding<T> {
        Binding(
            get: { store.preferences[keyPath: keyPath] },
            set: { var p = store.preferences; p[keyPath: keyPath] = $0; store.updatePreferences(p) }
        )
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased()).font(.system(size: 11, weight: .semibold)).tracking(0.8).foregroundStyle(MSColor.muted).padding(.horizontal, 4)
            VStack(spacing: 0) { content() }
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var divider: some View { Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 54) }

    private func icon(_ name: String) -> some View {
        Image(systemName: name).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
            .frame(width: 30, height: 30).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    private func navRow(_ title: String, subtitle: String? = nil, icon name: String, action: @escaping () -> Void) -> some View {
        Button { MSHaptic.tap(); action() } label: {
            HStack(spacing: 12) {
                icon(name)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                    if let subtitle { Text(subtitle).msCaption().lineLimit(1) }
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
            }
            .padding(.horizontal, 12).frame(minHeight: 56)
            .contentShape(Rectangle())
        }
        .buttonStyle(MSPressStyle())
    }

    private func toggleRow(_ title: String, subtitle: String? = nil, icon name: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            icon(name)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                if let subtitle { Text(subtitle).msCaption().lineLimit(1) }
            }
            Spacer()
            Toggle("", isOn: isOn).labelsHidden().tint(MSColor.accent)
        }
        .padding(.horizontal, 12).frame(minHeight: 56)
    }
}
