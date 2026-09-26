import SwiftUI

/// "More" tab: entry to every secondary screen.
struct MoreView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    private struct Row: Identifiable {
        let id = UUID()
        let title: String
        let icon: String
        let route: AppRoute
        var badge: String? = nil
    }

    private var sections: [(String, [Row])] {
        [
            ("Créer", [
                Row(title: "Campagnes", icon: "flag", route: .campaigns, badge: "\(store.campaigns.count)"),
                Row(title: "Modèles", icon: "rectangle.on.rectangle", route: .templates),
                Row(title: "Kit de marque", icon: "paintpalette", route: .brandKit),
                Row(title: "Créateurs", icon: "person.2", route: .creators),
            ]),
            ("Outils", [
                Row(title: "Générateur d'images", icon: "photo.on.rectangle.angled", route: .imageGenerator),
                Row(title: "Générateur de vidéos", icon: "video", route: .videoGenerator),
                Row(title: "Créateur UGC", icon: "person.crop.rectangle", route: .ugcCreator),
                Row(title: "Shooting produit", icon: "camera", route: .productShoot),
                Row(title: "Créateur de pubs", icon: "megaphone", route: .adCreator),
                Row(title: "Rédaction", icon: "text.alignleft", route: .copywriter),
                Row(title: "Générateur d'accroches", icon: "quote.opening", route: .hookGenerator),
                Row(title: "Assistant IA", icon: "bubble.left.and.text.bubble.right", route: .assistant),
            ]),
            ("Bibliothèque", [
                Row(title: "Generations", icon: "clock.arrow.circlepath", route: .generations, badge: "\(store.generations.count)"),
                Row(title: "Favoris", icon: "heart", route: .favorites),
                Row(title: "Centre d'export", icon: "square.and.arrow.down", route: .exportCenter),
            ]),
            ("Compte", [
                Row(title: "Crédits", icon: "bolt", route: .credits, badge: store.credits.formatted(.number.locale(Locale(identifier: "fr_FR")))),
                Row(title: "Tarifs", icon: "creditcard", route: .pricing, badge: store.plan.title),
                Row(title: "Notifications", icon: "bell", route: .notifications, badge: store.unreadNotificationCount > 0 ? "\(store.unreadNotificationCount)" : nil),
                Row(title: "Espace de travail", icon: "building.2", route: .workspace),
                Row(title: "Profil", icon: "person.crop.circle", route: .profile),
                Row(title: "Réglages", icon: "gearshape", route: .settings),
                Row(title: "Aide", icon: "questionmark.circle", route: .help),
            ]),
        ]
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("Plus").msTitle(30).frame(maxWidth: .infinity, alignment: .leading)
                profileCard
                ForEach(sections, id: \.0) { title, rows in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(title.uppercased())
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(0.8)
                            .foregroundStyle(MSColor.muted)
                            .padding(.horizontal, 4)
                        VStack(spacing: 0) {
                            ForEach(Array(rows.enumerated()), id: \.element.id) { i, row in
                                Button { router.push(row.route) } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: row.icon)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundStyle(MSColor.text2)
                                            .frame(width: 30, height: 30)
                                            .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                                        Text(row.title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                        Spacer()
                                        if let badge = row.badge { MSBadge(text: badge, tone: .neutral) }
                                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
                                    }
                                    .padding(.horizontal, 14)
                                    .frame(height: 52)
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(MSPressStyle())
                                if i < rows.count - 1 {
                                    Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 56)
                                }
                            }
                        }
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 32)
        }
        .msScreen()
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }

    private var profileCard: some View {
        MSCard(action: { router.push(.profile) }) {
            HStack(spacing: 12) {
                AvatarView(url: store.user.avatarURL, name: store.user.name, size: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.user.name).msHeadline(16)
                    Text(store.user.company).msCaption()
                }
                Spacer()
                MSBadge(text: store.plan.title, tone: .accent)
            }
        }
    }
}
