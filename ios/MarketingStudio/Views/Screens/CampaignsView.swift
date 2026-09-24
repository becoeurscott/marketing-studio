import SwiftUI

/// SPEC §21 dashboard: all campaigns with status, platforms, asset and variation counts.
struct CampaignsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var filter = "All"
    @State private var query = ""

    private static let filters = ["All", "Draft", "Ready", "Scheduled", "Live", "Completed"]

    private var filtered: [Campaign] {
        store.campaigns
            .filter { c in
                switch filter {
                case "Draft": return c.status == .draft
                case "Ready": return c.status == .ready
                case "Scheduled": return c.status == .scheduled
                case "Live": return c.status == .live
                case "Completed": return c.status == .completed
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
                    Text("Campaigns").msTitle(30)
                    Text("\(store.campaigns.count) campaigns · \(liveCount) live").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                SearchBar(placeholder: "Search campaigns", text: $query)
                    .padding(.horizontal, MSSpacing.gutter)
                ChipRow(options: Self.filters, selection: $filter)

                if filtered.isEmpty {
                    EmptyStateView(
                        icon: query.isEmpty ? "flag.badge.ellipsis" : "magnifyingglass",
                        title: query.isEmpty ? (filter == "All" ? "No campaigns yet" : "No \(filter.lowercased()) campaigns") : "No matches",
                        message: query.isEmpty ? "Turn a product into a multi-platform campaign in five steps: objective, audience, platforms, formats, generate." : "Try a different name or clear the search.",
                        ctaTitle: query.isEmpty ? "New campaign" : "Clear search",
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
                                            Button(s.title) { store.setCampaignStatus(c.id, s); router.toast("Marked \(s.title.lowercased())") }
                                        }
                                    } label: { Label("Change status", systemImage: "flag") }
                                    Button { router.push(.contentCalendar(campaignId: c.id)) } label: { Label("Open calendar", systemImage: "calendar") }
                                    Button(role: .destructive) {
                                        store.deleteCampaign(c.id)
                                        router.toast("Campaign deleted", style: .warning)
                                    } label: { Label("Delete", systemImage: "trash") }
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
        .navigationTitle("Campaigns")
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
