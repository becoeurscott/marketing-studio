import SwiftUI

/// Help: FAQ accordion, quick links, contact, version.
struct HelpView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.openURL) private var openURL

    @State private var query = ""
    @State private var expanded: Set<String> = []

    private struct FAQ: Identifiable {
        let id: String
        let q: String
        let a: String
    }

    private let faqs: [FAQ] = [
        FAQ(id: "credits", q: "Comment fonctionnent les crédits ?", a: "Chaque génération consomme des crédits : 10 par image, 50 par vidéo, 15 par agrandissement, 20 par série de publicités et 2 par texte généré. Votre forfait recharge vos crédits chaque mois et vous pouvez en ajouter à tout moment depuis l'écran Crédits."),
        FAQ(id: "template", q: "Que se passe-t-il quand j'utilise un modèle ?", a: "Le Studio s'ouvre avec le prompt, le style et le format du modèle déjà renseignés. Ajoutez votre produit, ajustez le prompt et générez."),
        FAQ(id: "brand", q: "Quel est l'effet du kit de marque sur les résultats ?", a: "Les couleurs, les polices et le ton de votre marque sont transmis à chaque générateur. Les textes suivent votre ton et votre style d'écriture ; les visuels s'appuient sur votre palette."),
        FAQ(id: "ugc", q: "Les créateurs sont-ils de vraies personnes ?", a: "Non. Chaque créateur est un présentateur IA fictif. Choisissez-en un dans Créateurs, puis utilisez-le dans le Créateur UGC avec votre script, votre ton et votre produit."),
        FAQ(id: "campaign", q: "Puis-je publier directement sur Instagram ou TikTok ?", a: "Pas dans ce prototype. Le calendrier de contenu planifie les publications par plateforme et par statut ; les exports vous fournissent les fichiers à publier vous-même."),
        FAQ(id: "export", q: "Quels formats d'export sont pris en charge ?", a: "PNG, JPG, MP4 et PDF en qualité Standard, Haute ou Maximale. Exportez une sélection de ressources ou une campagne entière depuis le Centre d'export."),
        FAQ(id: "team", q: "Combien de coéquipiers puis-je inviter ?", a: "Starter inclut 1 place, Creator 3, Studio 10 et Agency un nombre illimité. Les propriétaires et administrateurs gèrent les membres depuis l'écran Espace de travail."),
        FAQ(id: "data", q: "Où sont stockées mes données ?", a: "Dans ce prototype, tout est conservé sur cet appareil. « Réinitialiser les données de démo » dans Réglages efface tout et relance l'accueil."),
    ]

    private var filteredFAQs: [FAQ] {
        query.isEmpty ? faqs : faqs.filter { $0.q.localizedCaseInsensitiveContains(query) || $0.a.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Aide").msTitle(30)
                    Text("Des réponses, des raccourcis et un moyen de nous contacter.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                SearchBar(placeholder: "Rechercher dans l'aide", text: $query).padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Liens rapides")
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    quickLink("Premiers pas", "Importer, générer, exporter", icon: "play.circle") { router.select(.studio) }
                    quickLink("Modèles", "Préréglages prêts à l'emploi", icon: "rectangle.on.rectangle") { router.push(.templates) }
                    quickLink("Crédits et forfaits", "Ce que coûte chaque action", icon: "bolt") { router.push(.credits) }
                    quickLink("Kit de marque", "Restez fidèle à votre marque", icon: "paintpalette") { router.push(.brandKit) }
                }
                .padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "FAQ", subtitle: "\(filteredFAQs.count) question\(filteredFAQs.count > 1 ? "s" : "")")
                if filteredFAQs.isEmpty {
                    EmptyStateView(icon: "questionmark.circle", title: "Aucune réponse trouvée", message: "Essayez un autre mot-clé ou contactez l'assistance.", ctaTitle: "Effacer la recherche") { query = "" }
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(filteredFAQs.enumerated()), id: \.element.id) { i, f in
                            faqRow(f)
                            if i < filteredFAQs.count - 1 { Rectangle().fill(MSColor.border).frame(height: 1) }
                        }
                    }
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    .padding(.horizontal, MSSpacing.gutter)
                }

                SectionHeader(title: "Contact")
                MSCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 16, weight: .semibold)).foregroundStyle(MSColor.highlight)
                                .frame(width: 36, height: 36).background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Parlez à l'équipe").msHeadline(15)
                                Text("Nous répondons sous un jour ouvré.").msCaption()
                            }
                        }
                        HStack(spacing: 8) {
                            MSButton(title: "Écrire à l'assistance", icon: "envelope", style: .secondary, size: .compact) {
                                if let url = URL(string: "mailto:support@marketingstudio.app?subject=Assistance%20Sokozia") {
                                    openURL(url) { ok in if !ok { router.toast("Mail n'est pas configuré sur cet appareil", style: .warning) } }
                                }
                            }
                            MSButton(title: "Signaler un bug", icon: "ladybug", style: .ghost, size: .compact) {
                                router.toast("Signalement de bug envoyé (simulation)", style: .success)
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(spacing: 4) {
                    Text("Sokozia").font(MSFont.control(13)).foregroundStyle(MSColor.text2)
                    Text("Version \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0") (\(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")) · Prototype").msCaption()
                    Text("Connecté en tant que \(store.user.email)").msCaption()
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Aide")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func quickLink(_ title: String, _ subtitle: String, icon: String, action: @escaping () -> Void) -> some View {
        MSCard(padding: 14, action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: icon).font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.text2)
                    .frame(width: 32, height: 32).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                    Text(subtitle).msCaption()
                }
            }
        }
    }

    private func faqRow(_ f: FAQ) -> some View {
        let open = expanded.contains(f.id)
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                MSHaptic.tap()
                withAnimation(MSAnimation.snappy) {
                    if open { expanded.remove(f.id) } else { expanded.insert(f.id) }
                }
            } label: {
                HStack(spacing: 12) {
                    Text(f.q).font(MSFont.control(15)).foregroundStyle(MSColor.text).multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: "chevron.down").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
                        .rotationEffect(.degrees(open ? 180 : 0))
                }
                .padding(.horizontal, 14).padding(.vertical, 14)
                .contentShape(Rectangle())
            }
            .buttonStyle(MSPressStyle())
            if open {
                Text(f.a).msBody(14).lineSpacing(3)
                    .padding(.horizontal, 14).padding(.bottom, 14)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .clipped()
    }
}
