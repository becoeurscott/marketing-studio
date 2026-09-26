import SwiftUI

/// SPEC §21 dashboard: all campaigns with status, platforms, asset and variation counts.
struct CampaignsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var filter = "Toutes"
    @State private var query = ""

    private static let filters = ["Toutes", "Brouillon", "Prête", "Planifiée", "En cours", "Terminée"]

    private var filtered: [Campaign] {
        store.campaigns
            .filter { c in
                switch filter {
                case "Brouillon": return c.status == .draft
                case "Prête": return c.status == .ready
                case "Planifiée": return c.status == .scheduled
                case "En cours": return c.status == .live
                case "Terminée": return c.status == .completed
                default: return true
                }
            }
            .filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) || $0.audience.localizedCaseInsensitiveContains(query) }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var liveCount: Int { store.campaigns.filter { $0.status == .live }.count }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Campagnes").msTitle(30)
                    Text("\(store.campaigns.count) campagne\(store.campaigns.count > 1 ? "s" : "") · \(liveCount) en cours").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                SearchBar(placeholder: "Rechercher une campagne", text: $query)
                    .padding(.horizontal, MSSpacing.gutter)
                ChipRow(options: Self.filters, selection: $filter)

                if filtered.isEmpty {
                    EmptyStateView(
                        icon: query.isEmpty ? "flag.badge.ellipsis" : "magnifyingglass",
                        title: query.isEmpty ? (filter == "Toutes" ? "Aucune campagne pour l'instant" : "Aucune campagne : \(filter.lowercased())") : "Aucun résultat",
                        message: query.isEmpty ? "Transformez un produit en campagne multiplateforme en cinq étapes : objectif, audience, plateformes, formats, génération." : "Essayez un autre nom ou effacez la recherche.",
                        ctaTitle: query.isEmpty ? "Nouvelle campagne" : "Effacer la recherche",
                        ctaIcon: query.isEmpty ? "plus" : nil
                    ) {
                        if query.isEmpty { router.push(.campaignBuilder) } else { query = "" }
                    }
                } else {
                    VStack(spacing: 10) {
                        ForEach(filtered) { c in
                            CampaignCard(campaign: c) { router.push(.campaignDetail(id: c.id)) }
                                .contextMenu {
                                    Menu {
                                        ForEach(CampaignStatus.allCases) { s in
                                            Button(s.title) { store.setCampaignStatus(c.id, s); router.toast("Statut : \(s.title.lowercased())") }
                                        }
                                    } label: { Label("Changer le statut", systemImage: "flag") }
                                    Button { router.push(.contentCalendar(campaignId: c.id)) } label: { Label("Ouvrir le calendrier", systemImage: "calendar") }
                                    Button(role: .destructive) {
                                        store.deleteCampaign(c.id)
                                        router.toast("Campagne supprimée", style: .warning)
                                    } label: { Label("Supprimer", systemImage: "trash") }
                                }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .animation(MSAnimation.gentle, value: filtered.map { $0.id })
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Campagnes")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 8) {
                    CreditBadge()
                    MSIconButton(icon: "plus", size: 30) { router.push(.campaignBuilder) }
                }
            }
        }
    }
}
