import SwiftUI

/// Settings: account (sign-out), market (country, language, light videos), notifications,
/// appearance, Studio defaults, brand, credits, help.
struct SettingsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @Environment(\.openURL) private var openURL
    @State private var confirmReset = false
    @State private var confirmSignOut = false
    @State private var showDefaults = false
    @State private var showCountry = false

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
                    navRow("Se déconnecter", subtitle: "Vos créations restent sur cet appareil", icon: "rectangle.portrait.and.arrow.right") { confirmSignOut = true }
                }

                section("Pays et langue") {
                    navRow("Pays", subtitle: "\(store.country.flag) \(store.country.name) · prix en \(Market.currencies[store.country.currency]?.symbol ?? "FCFA")", icon: "globe.europe.africa") { showCountry = true }
                    divider
                    Menu {
                        ForEach(Market.languages) { l in
                            Button(l.label) { pref(\.language).wrappedValue = l.id }
                        }
                    } label: {
                        HStack(spacing: 12) {
                            icon("character.bubble")
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Langue des textes et vidéos").font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                Text(Market.languageLabel(store.preferences.language)).msCaption()
                            }
                            Spacer()
                            Image(systemName: "chevron.up.chevron.down").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted)
                        }
                        .padding(.horizontal, 12).frame(minHeight: 56)
                    }
                    divider
                    toggleRow("Vidéos légères", subtitle: "480p : plus rapides à envoyer sur WhatsApp", icon: "antenna.radiowaves.left.and.right", isOn: pref(\.lightVideos))
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
                    navRow("Forfait", subtitle: "Packs sans abonnement · forfaits dès \(store.price(Plan.starter.monthlyPriceXof))/mois", icon: "creditcard") { router.push(.pricing) }
                    divider
                    navRow("Crédits", subtitle: "\(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))) disponibles", icon: "bolt") { router.push(.credits) }
                }

                section("Configuration") {
                    navRow("Revoir la configuration", subtitle: "Pays, activité, objectifs", icon: "arrow.uturn.backward.circle") { store.onboardingDone = false }
                }

                section("Aide") {
                    navRow("Centre d’aide", subtitle: "FAQ et contact", icon: "questionmark.circle") { router.push(.help) }
                    divider
                    navRow("Nous écrire sur WhatsApp", subtitle: "Questions, recharges, idées", icon: "message") {
                        if let url = Market.whatsappLink(Market.sokoziaWhatsApp, message: "Bonjour Sokozia, ") { openURL(url) }
                    }
                }

                VStack(spacing: 10) {
                    MSButton(title: "Effacer les données de cet appareil", icon: "trash", style: .danger) { confirmReset = true }
                    Text("Sokozia \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")").msCaption()
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
        .msSheet(isPresented: $showCountry, detents: [.large]) { countrySheet }
        .confirmationDialog("Effacer les données de cet appareil ?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Tout effacer", role: .destructive) {
                store.resetAll()
                router.popToRoot(on: .more)
                router.select(.home)
            }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("Projets, ressources et campagnes enregistrés sur cet iPhone seront supprimés. Vos crédits sont conservés sur votre compte.")
        }
        .confirmationDialog("Se déconnecter ?", isPresented: $confirmSignOut, titleVisibility: .visible) {
            Button("Se déconnecter", role: .destructive) { Task { await AuthService.shared.signOut() } }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("Vous pourrez vous reconnecter avec le même compte ; vos crédits sont gardés.")
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

    private var countrySheet: some View {
        BottomSheetContainer(title: "Pays", subtitle: "Change la devise et les moyens de paiement affichés.") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 8) {
                    ForEach(Market.countries) { c in
                        Button {
                            MSHaptic.tap()
                            var p = store.preferences
                            p.country = c.code
                            if !c.languages.contains(p.language) { p.language = c.languages.first ?? "fr" }
                            store.updatePreferences(p)
                            showCountry = false
                        } label: {
                            HStack(spacing: 12) {
                                Text(c.flag).font(.system(size: 24))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(c.name).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                    Text(c.payments.compactMap { Market.paymentMethods[$0]?.label }.joined(separator: " · ")).msCaption().lineLimit(1)
                                }
                                Spacer()
                                if store.preferences.country == c.code { Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.accent) }
                            }
                            .padding(12)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        }
                        .buttonStyle(MSPressStyle())
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
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
