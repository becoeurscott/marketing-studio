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
        FAQ(id: "credits", q: "Comment fonctionnent les crédits ?", a: "Chaque génération consomme des crédits : \(AIModels.imageModel(nil).credits) par photo produit Standard, \(AIModels.imageModel("soul-2").credits) par image Éco et \(AIModels.videoModel(nil).creditsPerSecond) par seconde de vidéo UGC. Les textes et accroches sont gratuits. Si une génération échoue, vos crédits sont rendus automatiquement."),
        FAQ(id: "payment", q: "Comment recharger ?", a: "Choisissez un pack dans Crédits (dès 1 000 FCFA). Le paiement Mobile Money (Wave, Orange Money, MTN MoMo…) arrive bientôt ; en attendant, écrivez-nous sur WhatsApp pour recharger."),
        FAQ(id: "ugc", q: "Les créateurs sont-ils de vraies personnes ?", a: "Non. Ce sont des créateurs IA africains. Chacun a une fiche personnage pour garder le même visage, la même coiffure et la même tenue dans toutes vos vidéos."),
        FAQ(id: "product", q: "Ma photo produit doit-elle être professionnelle ?", a: "Non. Une photo nette prise au téléphone suffit : Sokozia garde votre produit identique et refait le décor, la lumière et le cadrage."),
        FAQ(id: "whatsapp", q: "Comment publier sur WhatsApp ?", a: "Sur chaque résultat, touchez « WhatsApp » ou « Partager » : le fichier part directement dans vos statuts, groupes ou catalogue. Activez « Vidéos légères » dans Réglages pour des envois plus rapides."),
        FAQ(id: "template", q: "Que se passe-t-il quand j'utilise un modèle ?", a: "Le modèle ouvre le bon outil (image, vidéo, UGC, pub ou texte) avec les réglages remplis. Ajoutez votre produit et générez."),
        FAQ(id: "data", q: "Où sont stockées mes créations ?", a: "Les images et vidéos générées sont hébergées sur votre compte Sokozia. La liste de vos projets est enregistrée sur cet appareil."),
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
                            MSButton(title: "Écrire sur WhatsApp", icon: "message", style: .secondary, size: .compact) {
                                if let url = Market.whatsappLink(Market.sokoziaWhatsApp, message: "Bonjour Sokozia, ") { openURL(url) }
                            }
                            MSButton(title: "Signaler un bug", icon: "ladybug", style: .ghost, size: .compact) {
                                if let url = Market.whatsappLink(Market.sokoziaWhatsApp, message: "Bonjour Sokozia, j'ai un problème avec l'app iPhone : ") { openURL(url) }
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
