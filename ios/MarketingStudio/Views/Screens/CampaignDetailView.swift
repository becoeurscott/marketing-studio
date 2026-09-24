import SwiftUI

/// SPEC §22: campaign workspace with Overview / Assets / Ads / Videos / Copy / Calendar / Analytics.
struct CampaignDetailView: View {
    let campaignId: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var tab = 0
    @State private var confirmDelete = false
    @State private var generatingMore = false
    @State private var addingAssets = false
    @State private var editingItem: CalendarItem? = nil
    @State private var addingItem = false

    private static let tabs = ["Overview", "Assets", "Ads", "Videos", "Copy", "Calendar", "Analytics"]

    private var campaign: Campaign? { store.campaign(campaignId) }

    var body: some View {
        Group {
            if let campaign {
                content(campaign)
            } else {
                EmptyStateView(icon: "flag.slash", title: "Campaign not found", message: "It may have been deleted.", ctaTitle: "Back to campaigns") { router.pop() }
                    .msScreen()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func content(_ c: Campaign) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                header(c)
                UnderlineTabs(tabs: Self.tabs, selection: $tab)
                Group {
                    switch tab {
                    case 0: overview(c)
                    case 1: assetsGrid(c.assetIds.compactMap { store.asset($0) }, empty: ("No assets yet", "Generate more creatives to fill this campaign."))
                    case 2: adsTab(c)
                    case 3: assetsGrid(c.assetIds.compactMap { store.asset($0) }.filter { $0.kind == .video }, empty: ("No videos", "Video ads and UGC clips for this campaign show up here."))
                    case 4: copyTab(c)
                    case 5: calendarTab(c)
                    default: analyticsTab(c)
                    }
                }
                .animation(MSAnimation.gentle, value: tab)
            }
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle(c.name)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Menu {
                        ForEach(CampaignStatus.allCases) { s in
                            Button { store.setCampaignStatus(c.id, s); router.toast("Marked \(s.title.lowercased())") } label: {
                                Label(s.title, systemImage: c.status == s ? "checkmark" : "")
                            }
                        }
                    } label: { Label("Change status", systemImage: "flag") }
                    Button { addingAssets = true } label: { Label("Add existing assets", systemImage: "plus.rectangle.on.rectangle") }
                    Button { router.present(.exportAssets(ids: c.assetIds)) } label: { Label("Export campaign", systemImage: "square.and.arrow.up") }
                    Button(role: .destructive) { confirmDelete = true } label: { Label("Delete campaign", systemImage: "trash") }
                } label: {
                    Image(systemName: "ellipsis.circle").font(.system(size: 16, weight: .semibold)).foregroundStyle(MSColor.text)
                }
            }
        }
        .confirmationDialog("Delete \(c.name)?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete campaign", role: .destructive) {
                store.deleteCampaign(c.id)
                router.toast("Campaign deleted", style: .warning)
                router.pop()
            }
        } message: { Text("Assets stay in your library. This cannot be undone.") }
        .msSheet(isPresented: $addingAssets, detents: [.large]) {
            AssetPickerSheet(title: "Add to campaign", preferredIds: [], multiple: true, initial: [], excluded: Set(c.assetIds)) { ids in
                store.addAssets(ids, toCampaign: c.id)
                router.toast("Added \(ids.count) asset\(ids.count == 1 ? "" : "s")", style: .success)
            }
        }
        .msSheet(item: $editingItem, detents: [.large]) { item in
            CalendarItemEditSheet(campaignId: c.id, item: item) { editingItem = nil }
        }
        .msSheet(isPresented: $addingItem, detents: [.large]) {
            CalendarItemEditSheet(campaignId: c.id) { addingItem = false }
        }
    }

    // MARK: Header

    private func header(_ c: Campaign) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(c.name).msTitle(26)
                    Text("\(c.objective.title) · Created \(c.createdAt.shortString)").msCaption()
                }
                Spacer()
                Menu {
                    ForEach(CampaignStatus.allCases) { s in
                        Button(s.title) { store.setCampaignStatus(c.id, s); router.toast("Marked \(s.title.lowercased())") }
                    }
                } label: {
                    HStack(spacing: 4) {
                        MSBadge(text: c.status.title, tone: MSBadge.tone(for: c.status))
                        Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.muted)
                    }
                }
            }
            HStack(spacing: 8) {
                PlatformIconRow(platforms: c.platforms, size: 26)
                Text(c.platforms.map { $0.title }.joined(separator: " · ")).msCaption().lineLimit(1)
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: Overview

    private func overview(_ c: Campaign) -> some View {
        let assets = c.assetIds.compactMap { store.asset($0) }
        let videos = assets.filter { $0.kind == .video }.count
        return VStack(alignment: .leading, spacing: 18) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                StatTile(label: "Assets", value: "\(assets.count)", icon: "photo.on.rectangle") { tab = 1 }
                StatTile(label: "Ad variations", value: "\(c.variations.count)", icon: "rectangle.stack") { tab = 2 }
                StatTile(label: "Videos", value: "\(videos)", icon: "video") { tab = 3 }
                StatTile(label: "Scheduled", value: "\(c.calendarItems.filter { $0.status != .draft }.count)", icon: "calendar") { tab = 5 }
                StatTile(label: "Platforms", value: "\(c.platforms.count)", icon: "square.grid.2x2")
                StatTile(label: "Formats", value: "\(c.formats.count)", icon: "square.on.square")
            }
            .padding(.horizontal, MSSpacing.gutter)

            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Quick actions")
                HStack(spacing: 10) {
                    MSButton(title: "Generate more", icon: "sparkles", size: .compact, isLoading: generatingMore) { generateMore(c) }
                    MSButton(title: "Export campaign", icon: "square.and.arrow.up", style: .secondary, size: .compact) {
                        router.present(.exportAssets(ids: c.assetIds))
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }

            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Brief")
                VStack(spacing: 8) {
                    briefRow("Objective", c.objective.title, icon: c.objective.icon)
                    briefRow("Audience", c.audience, icon: "person.2")
                    briefRow("Platforms", c.platforms.map { $0.title }.joined(separator: ", "), icon: "square.grid.2x2")
                    briefRow("Formats", c.formats.map { $0.title }.joined(separator: ", "), icon: "rectangle.stack")
                    if let p = c.projectId.flatMap({ store.project($0) }) {
                        MSCard(padding: 12, action: { router.push(.projectDetail(id: p.id), on: .projects) }) {
                            HStack(spacing: 12) {
                                RemoteImage(url: p.thumbnailURL, cornerRadius: 8).frame(width: 40, height: 40)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Project").msCaption()
                                    Text(p.name).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }

            if !assets.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Latest creatives", actionTitle: "All") { tab = 1 }
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(assets.prefix(8)) { a in
                                AssetThumb(asset: a) { router.push(.assetDetail(id: a.id)) }
                                    .frame(width: 120)
                            }
                        }
                        .padding(.horizontal, MSSpacing.gutter)
                    }
                }
            }

            if !c.calendarItems.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Up next", actionTitle: "Calendar") { tab = 5 }
                    VStack(spacing: 8) {
                        ForEach(c.calendarItems.filter { $0.date >= Calendar.current.startOfDay(for: Date()) }.prefix(3)) { item in
                            CalendarItemRow(item: item) { editingItem = item }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
        }
    }

    private func briefRow(_ label: String, _ value: String, icon: String) -> some View {
        MSCard(padding: 12) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2).frame(width: 20)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).msCaption()
                    Text(value).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                }
            }
        }
    }

    // MARK: Assets / Videos

    private func assetsGrid(_ assets: [Asset], empty: (String, String)) -> some View {
        Group {
            if assets.isEmpty {
                EmptyStateView(icon: "photo.on.rectangle.angled", title: empty.0, message: empty.1, ctaTitle: "Generate more", ctaIcon: "sparkles") {
                    if let c = campaign { generateMore(c) }
                }
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                    ForEach(assets) { a in
                        AssetThumb(asset: a) { router.push(.assetDetail(id: a.id)) }
                            .contextMenu { AssetActionsMenu(asset: a) }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: Ads

    private func adsTab(_ c: Campaign) -> some View {
        Group {
            if c.variations.isEmpty {
                EmptyStateView(icon: "rectangle.stack", title: "No ad variations", message: "Generate Creative A–D with headline, primary text and CTA.", ctaTitle: "Open Ad Creator", ctaIcon: "sparkles") { router.push(.adCreator) }
            } else {
                VStack(spacing: 12) {
                    ForEach(c.variations) { v in
                        AdVariationCard(variation: v)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: Copy

    private func copyTab(_ c: Campaign) -> some View {
        let copies = c.variations.map { ($0.label, $0.headline, $0.primaryText, $0.cta) }
        return Group {
            if copies.isEmpty {
                EmptyStateView(icon: "text.alignleft", title: "No copy yet", message: "Headlines, captions and CTAs for this campaign live here.", ctaTitle: "Open Copywriter", ctaIcon: "pencil.line") { router.push(.copywriter) }
            } else {
                VStack(spacing: 10) {
                    ForEach(Array(copies.enumerated()), id: \.offset) { _, row in
                        MSCard(padding: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(row.0).msCaption(color: MSColor.text2)
                                    Spacer()
                                    Button {
                                        UIPasteboard.general.string = "\(row.1)\n\n\(row.2)\n\n\(row.3)"
                                        router.toast("Copied", style: .success, icon: "doc.on.doc")
                                    } label: {
                                        Image(systemName: "doc.on.doc").font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
                                    }
                                }
                                Text(row.1).msHeadline(16)
                                Text(row.2).msBody(14).lineSpacing(2)
                                MSBadge(text: row.3, tone: .accent, icon: "arrow.right")
                            }
                        }
                    }
                    MSButton(title: "Write more copy", icon: "pencil.line", style: .secondary, size: .compact) { router.push(.copywriter) }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: Calendar

    private func calendarTab(_ c: Campaign) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                MSButton(title: "Open full calendar", icon: "calendar", size: .compact) { router.push(.contentCalendar(campaignId: c.id)) }
                MSButton(title: "Add", icon: "plus", style: .secondary, size: .compact, fullWidth: false) { addingItem = true }
            }
            .padding(.horizontal, MSSpacing.gutter)
            if c.calendarItems.isEmpty {
                EmptyStateView(icon: "calendar.badge.plus", title: "Nothing scheduled", message: "Plan posts by day, platform and format. No real publishing happens.", ctaTitle: "Schedule content", ctaIcon: "plus") { addingItem = true }
            } else {
                VStack(spacing: 8) {
                    ForEach(c.calendarItems.sorted { $0.date < $1.date }) { item in
                        CalendarItemRow(item: item) { editingItem = item }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: Analytics

    private func analyticsTab(_ c: Campaign) -> some View {
        let a = CampaignAnalytics(campaign: c)
        return VStack(alignment: .leading, spacing: 16) {
            if a.totalReach == 0 {
                EmptyStateView(icon: "chart.bar.xaxis", title: "No data yet", message: "Analytics appear once the campaign is live. Mark it live to preview sample metrics.", ctaTitle: "Mark as live", ctaIcon: "dot.radiowaves.left.and.right") {
                    store.setCampaignStatus(c.id, .live)
                    router.toast("Campaign is live", style: .success)
                }
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                    StatTile(label: "Reach", value: a.totalReach.compactString, icon: "eye", tint: MSColor.highlight)
                    StatTile(label: "Engagement", value: a.totalEngagement.compactString, icon: "heart", tint: MSColor.success)
                    StatTile(label: "Clicks", value: a.totalClicks.compactString, icon: "cursorarrow.click", tint: Color(hex: 0x60A5FA))
                }
                .padding(.horizontal, MSSpacing.gutter)

                MSCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Reach · last 14 days").msHeadline(15)
                                Text("Daily impressions across platforms").msCaption()
                            }
                            Spacer()
                            MSBadge(text: "+\(Int.random(in: 8...24))%", tone: .success, icon: "arrow.up.right")
                        }
                        MSBarChart(values: a.reach)
                        HStack {
                            Text("14d ago").msCaption()
                            Spacer()
                            Text("Today").msCaption()
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 10) {
                    MSCard(padding: 14) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Engagement").msCaption(color: MSColor.text2)
                            Text(a.totalEngagement.compactString).msHeadline(20)
                            MSSparkline(values: a.engagement, tint: MSColor.success, height: 44)
                        }
                    }
                    MSCard(padding: 14) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("CTR").msCaption(color: MSColor.text2)
                            Text(String(format: "%.1f%%", a.ctr)).msHeadline(20)
                            MSSparkline(values: a.clicks, tint: Color(hex: 0x60A5FA), height: 44)
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                MSCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Reach by platform").msHeadline(15)
                        let maxV = max(a.byPlatform.map { $0.1 }.max() ?? 1, 1)
                        ForEach(a.byPlatform, id: \.0) { p, v in
                            HStack(spacing: 10) {
                                Image(systemName: p.icon).font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.text2).frame(width: 18)
                                Text(p.title).font(MSFont.control(13)).foregroundStyle(MSColor.text).frame(width: 74, alignment: .leading)
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        Capsule().fill(MSColor.elevated)
                                        Capsule().fill(MSColor.accentGradient).frame(width: geo.size.width * CGFloat(v) / CGFloat(maxV))
                                    }
                                }
                                .frame(height: 8)
                                Text(v.compactString).msCaption().frame(width: 46, alignment: .trailing)
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: Actions

    private func generateMore(_ c: Campaign) {
        guard !generatingMore else { return }
        generatingMore = true
        Task {
            do {
                let images = try await MockAPI.generateImage(ImageGenParams(prompt: "\(c.name) · \(c.formats.first?.title ?? "Product photos") for \(c.audience)", projectId: c.projectId), store: store)
                let ids = images.map { store.addAsset(name: "\(c.name) creative", kind: .image, imageURL: $0.url, projectId: c.projectId, tags: ["campaign"]).id }
                store.addAssets(ids, toCampaign: c.id)
                MSHaptic.success()
                router.toast("4 new creatives added", style: .success)
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
            generatingMore = false
        }
    }
}

// MARK: - Rows / cards

struct CalendarItemRow: View {
    @EnvironmentObject private var store: AppStore
    var item: CalendarItem
    var action: () -> Void

    var body: some View {
        MSCard(padding: 10, action: action) {
            HStack(spacing: 12) {
                VStack(spacing: 1) {
                    Text(item.date.formatted(.dateTime.weekday(.abbreviated))).msCaption()
                    Text(item.date.formatted(.dateTime.day())).msHeadline(18)
                }
                .frame(width: 42)
                if let a = item.assetId.flatMap({ store.asset($0) }) {
                    RemoteImage(url: a.imageURL, cornerRadius: 8).frame(width: 44, height: 44)
                } else {
                    RoundedRectangle(cornerRadius: 8, style: .continuous).fill(MSColor.elevated).frame(width: 44, height: 44)
                        .overlay(Image(systemName: "photo").foregroundStyle(MSColor.muted).font(.system(size: 13)))
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                    HStack(spacing: 5) {
                        Image(systemName: item.platform.icon).font(.system(size: 10, weight: .semibold))
                        Text("\(item.platform.title) · \(item.format)")
                    }
                    .msCaption()
                }
                Spacer()
                MSBadge(text: item.status.title, tone: MSBadge.tone(for: item.status))
            }
        }
    }
}

struct AdVariationCard: View {
    @EnvironmentObject private var router: Router
    var variation: AdVariation

    var body: some View {
        MSCard(padding: 0) {
            VStack(alignment: .leading, spacing: 0) {
                RemoteImage(url: variation.visualURL)
                    .frame(height: 190)
                    .overlay(alignment: .topLeading) {
                        HStack(spacing: 6) {
                            MSBadge(text: variation.label, tone: .accent)
                            MSBadge(text: variation.platform.title, tone: .neutral, icon: variation.platform.icon)
                        }
                        .padding(10)
                    }
                VStack(alignment: .leading, spacing: 8) {
                    Text(variation.headline).msHeadline(16)
                    Text(variation.primaryText).msBody(14).lineSpacing(2)
                    HStack {
                        MSBadge(text: variation.cta, tone: .accent, icon: "arrow.right")
                        Spacer()
                        HStack(spacing: 6) {
                            MSIconButton(icon: "pencil", size: 30) { router.push(.adCreator) }
                            MSIconButton(icon: "doc.on.doc", size: 30) {
                                UIPasteboard.general.string = "\(variation.headline)\n\(variation.primaryText)\n\(variation.cta)"
                                router.toast("Copy duplicated to clipboard", style: .success)
                            }
                            MSIconButton(icon: "square.and.arrow.up", size: 30) { router.toast("Exported \(variation.label)", style: .success) }
                        }
                    }
                }
                .padding(14)
            }
            .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        }
    }
}
