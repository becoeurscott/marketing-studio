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
                Text("Réglages").msTitle(30).padding(.horizontal, MSSpacing.gutter)

                section("Compte") {
                    navRow("Profil", subtitle: store.user.email, icon: "person.crop.circle") { router.push(.profile) }
                    divider
                    navRow("Espace de travail", subtitle: "\(store.members.count) membres", icon: "building.2") { router.push(.workspace) }
                }

                section("Notifications") {
                    toggleRow("Notifications push", subtitle: "Suivi des générations et des exports", icon: "bell", isOn: pref(\.pushNotifications))
                    divider
                    toggleRow("Résumé par e-mail", subtitle: "Récapitulatif hebdomadaire de l’activité", icon: "envelope", isOn: pref(\.emailDigest))
                    divider
                    toggleRow("Retour haptique", subtitle: "Vibrations lors des actions et des résultats", icon: "hand.tap", isOn: pref(\.haptics))
                }

                section("Apparence") {
                    HStack(spacing: 12) {
                        icon("moon.fill")
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Thème").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                            Text("Sokozia existe uniquement en mode sombre, pensé pour la création.").msCaption()
                        }
                        Spacer()
                        MSBadge(text: "Sombre", tone: .neutral)
                    }
                    .padding(.horizontal, 12).frame(minHeight: 56)
                    divider
                    HStack(spacing: 12) {
                        icon("paintbrush.pointed")
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Couleur d’accent").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                            Text("Utilisée pour les actions principales et la sélection.").msCaption()
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
                    toggleRow("Réduire les animations", subtitle: "Moins d’effets de mouvement", icon: "figure.walk.motion", isOn: pref(\.reduceMotion))
                }

                section("Préférences du Studio") {
                    navRow("Format d’image", subtitle: store.preferences.defaultRatio, icon: "aspectratio") { showDefaults = true }
                    divider
                    navRow("Modèle", subtitle: store.preferences.defaultModel, icon: "cpu") { showDefaults = true }
                    divider
                    navRow("Style", subtitle: store.preferences.defaultStyle, icon: "wand.and.stars") { showDefaults = true }
                }

                section("Marque") {
                    navRow("Kit de marque", subtitle: store.brand.name, icon: "paintpalette") { router.push(.brandKit) }
                    divider
                    navRow("Ton de la marque", subtitle: "Ton \(store.brand.voice.tone)", icon: "waveform.and.mic") { router.push(.brandVoice) }
                }

                section("Abonnement") {
                    navRow("Forfait", subtitle: "\(store.plan.title) · \(store.plan.monthlyPrice) $/mois", icon: "creditcard") { router.push(.pricing) }
                    divider
                    navRow("Crédits", subtitle: "\(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) disponibles", icon: "bolt") { router.push(.credits) }
                }

                section("Sécurité") {
                    toggleRow("Double authentification", subtitle: twoFactor ? "Activée via une app d’authentification" : "Protégez votre compte", icon: "lock.shield", isOn: $twoFactor)
                        .onChange(of: twoFactor) { _, on in router.toast(on ? "Double authentification activée (démo)" : "Double authentification désactivée", style: on ? .success : .info) }
                    divider
                    navRow("Changer le mot de passe", subtitle: "Modifié il y a 3 mois", icon: "key") { router.toast("E-mail de réinitialisation envoyé (démo)", style: .success) }
                    divider
                    navRow("Sessions actives", subtitle: "iPhone · Chrome sur Mac", icon: "iphone") { showSessions = true }
                }

                section("Aide") {
                    navRow("Centre d’aide", subtitle: "FAQ et contact", icon: "questionmark.circle") { router.push(.help) }
                    divider
                    navRow("Envoyer un avis", subtitle: "Dites-nous quoi développer ensuite", icon: "bubble.left") { router.toast("Merci, avis bien reçu (démo)", style: .success) }
                }

                VStack(spacing: 10) {
                    MSButton(title: "Réinitialiser les données de démo", icon: "arrow.counterclockwise", style: .danger) { confirmReset = true }
                    Text("Sokozia \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0") · Version prototype").msCaption()
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, 6)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Réglages")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(isPresented: $showDefaults, detents: [.large]) { defaultsSheet }
        .msSheet(isPresented: $showSessions, detents: [.medium]) { sessionsSheet }
        .confirmationDialog("Réinitialiser les données de démo ?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Tout réinitialiser", role: .destructive) {
                store.resetAll()
                router.popToRoot(on: .more)
                router.select(.home)
            }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("Les projets, ressources, campagnes, crédits et préférences reviennent à la démo initiale et l’accueil recommence.")
        }
    }

    // MARK: Sheets

    private var defaultsSheet: some View {
        BottomSheetContainer(title: "Préférences du Studio", subtitle: "Pré-remplies à chaque nouvelle génération.") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    pickerGroup("Format d’image", ratios, pref(\.defaultRatio))
                    pickerGroup("Modèle", models, pref(\.defaultModel))
                    pickerGroup("Style", styles, pref(\.defaultStyle))
                    MSButton(title: "Terminé", icon: "checkmark") { showDefaults = false; router.toast("Préférences enregistrées", style: .success) }
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
        BottomSheetContainer(title: "Sessions actives") {
            VStack(spacing: 10) {
                sessionRow("Cet iPhone", "Actif maintenant", icon: "iphone", current: true)
                sessionRow("Chrome sur Mac", "San Francisco · il y a 2 heures", icon: "laptopcomputer", current: false)
                Spacer(minLength: 0)
                MSButton(title: "Déconnecter les autres sessions", icon: "xmark.circle", style: .danger) {
                    showSessions = false
                    router.toast("Autres sessions déconnectées (démo)", style: .success)
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
                if current { MSBadge(text: "Actuelle", tone: .success) }
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
            Text(title.uppercased(with: Locale(identifier: "fr_FR"))).font(.system(size: 11, weight: .semibold)).tracking(0.8).foregroundStyle(MSColor.muted).padding(.horizontal, 4)
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
