import SwiftUI

// MARK: - Platform icons

/// Compact row of platform glyphs used on campaign cards and headers.
struct PlatformIconRow: View {
    var platforms: [SocialPlatform]
    var size: CGFloat = 24

    var body: some View {
        HStack(spacing: -6) {
            ForEach(platforms) { p in
                Image(systemName: p.icon)
                    .font(.system(size: size * 0.5, weight: .semibold))
                    .foregroundStyle(MSColor.text2)
                    .frame(width: size, height: size)
                    .background(MSColor.elevated, in: Circle())
                    .overlay(Circle().strokeBorder(MSColor.card, lineWidth: 1.5))
            }
        }
    }
}

// MARK: - Campaign card

struct CampaignCard: View {
    @EnvironmentObject private var store: AppStore
    var campaign: Campaign
    var action: () -> Void

    private var project: Project? { campaign.projectId.flatMap { store.project($0) } }
    private var cover: String? {
        campaign.assetIds.compactMap { store.asset($0) }.first?.imageURL ?? project?.thumbnailURL
    }

    var body: some View {
        MSCard(padding: 12, action: action) {
            HStack(spacing: 12) {
                RemoteImage(url: cover, cornerRadius: 12)
                    .frame(width: 72, height: 72)
                    .overlay(alignment: .bottomLeading) {
                        Image(systemName: campaign.objective.icon)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 20, height: 20)
                            .background(.black.opacity(0.6), in: Circle())
                            .padding(5)
                    }
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .top) {
                        Text(campaign.name)
                            .font(MSFont.control(15))
                            .foregroundStyle(MSColor.text)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        Spacer(minLength: 6)
                        MSBadge(text: campaign.status.title, tone: MSBadge.tone(for: campaign.status))
                    }
                    Text(campaign.objective.title + (project.map { " · \($0.name)" } ?? ""))
                        .msCaption()
                        .lineLimit(1)
                    HStack(spacing: 10) {
                        PlatformIconRow(platforms: campaign.platforms, size: 22)
                        Label("\(campaign.assetIds.count)", systemImage: "photo.on.rectangle").msCaption()
                        Label("\(campaign.variations.count)", systemImage: "rectangle.stack").msCaption()
                    }
                }
            }
        }
    }
}

// MARK: - Calendar item editor

/// Add or edit a calendar item. Used from the Content Calendar and the `.addCalendarItem` sheet.
struct CalendarItemEditSheet: View {
    let campaignId: String
    var item: CalendarItem? = nil
    var onDone: () -> Void

    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var title = ""
    @State private var date = Date()
    @State private var platform: SocialPlatform = .instagram
    @State private var format = "Image"
    @State private var status: CalendarStatus = .draft
    @State private var assetId: String? = nil
    @State private var pickingAsset = false

    static let formats = ["Image", "Reel", "Video", "Story", "Carousel", "Short", "Pin"]
    static func formatLabel(_ f: String) -> String {
        ["Video": "Vidéo", "Carousel": "Carrousel", "Pin": "Épingle"][f] ?? f
    }

    private var campaign: Campaign? { store.campaign(campaignId) }
    private var isEditing: Bool { item != nil }

    var body: some View {
        BottomSheetContainer(title: isEditing ? "Modifier le contenu" : "Programmer un contenu", subtitle: campaign?.name) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    MSTextField(label: "Titre", placeholder: "ex. Post phare", text: $title, icon: "textformat")

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Jour").msCaption(color: MSColor.text2)
                        DatePicker("", selection: $date, displayedComponents: .date)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                            .environment(\.locale, Locale(identifier: "fr_FR"))
                            .tint(MSColor.accent)
                            .padding(.horizontal, 12)
                            .frame(height: 48)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Plateforme").msCaption(color: MSColor.text2)
                        FlowLayout(spacing: 8) {
                            ForEach(campaign?.platforms.isEmpty == false ? campaign!.platforms : SocialPlatform.allCases) { p in
                                MSChip(title: p.title, icon: p.icon, selected: platform == p) { platform = p }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Format").msCaption(color: MSColor.text2)
                        FlowLayout(spacing: 8) {
                            ForEach(Self.formats, id: \.self) { f in
                                MSChip(title: Self.formatLabel(f), selected: format == f) { format = f }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Statut").msCaption(color: MSColor.text2)
                        HStack(spacing: 8) {
                            ForEach(CalendarStatus.allCases) { s in
                                MSChip(title: s.title, selected: status == s) { status = s }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Ressource").msCaption(color: MSColor.text2)
                        Button { pickingAsset = true } label: {
                            HStack(spacing: 12) {
                                if let a = assetId.flatMap({ store.asset($0) }) {
                                    RemoteImage(url: a.imageURL, cornerRadius: 8).frame(width: 44, height: 44)
                                    Text(a.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                                } else {
                                    Image(systemName: "photo.badge.plus").foregroundStyle(MSColor.muted).frame(width: 44, height: 44)
                                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                                    Text("Choisir une ressource").msBody(14)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.muted)
                            }
                            .padding(10)
                            .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                        }
                        .buttonStyle(MSPressStyle())
                    }

                    VStack(spacing: 10) {
                        MSButton(title: isEditing ? "Enregistrer les modifications" : "Ajouter au calendrier", icon: isEditing ? "checkmark" : "calendar.badge.plus", isDisabled: title.trimmingCharacters(in: .whitespaces).isEmpty) {
                            save()
                        }
                        if let item {
                            MSButton(title: "Retirer du calendrier", icon: "trash", style: .danger) {
                                store.removeCalendarItem(item.id, from: campaignId)
                                router.toast("Retiré du calendrier", style: .warning)
                                onDone()
                            }
                        }
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
        .onAppear {
            if let item {
                title = item.title; date = item.date; platform = item.platform
                format = item.format; status = item.status; assetId = item.assetId
            } else if let first = campaign?.platforms.first {
                platform = first
            }
        }
        .msSheet(isPresented: $pickingAsset, detents: [.large]) {
            AssetPickerSheet(title: "Choisir une ressource", preferredIds: campaign?.assetIds ?? [], multiple: false, initial: assetId.map { [$0] } ?? []) { ids in
                assetId = ids.first
            }
        }
    }

    private func save() {
        let trimmed = title.trimmingCharacters(in: .whitespaces)
        if var existing = item {
            existing.title = trimmed; existing.date = date; existing.platform = platform
            existing.format = format; existing.status = status; existing.assetId = assetId
            store.updateCalendarItem(existing, in: campaignId)
            router.toast("Contenu mis à jour", style: .success)
        } else {
            let new = CalendarItem(id: IDGen.make("cal"), title: trimmed, date: date, platform: platform, format: format, status: status, assetId: assetId)
            store.addCalendarItem(new, to: campaignId)
            router.toast("Ajouté au calendrier", style: .success)
        }
        MSHaptic.success()
        onDone()
    }
}

// MARK: - Analytics (mock)

/// Deterministic mock numbers per campaign so charts are stable between launches.
struct CampaignAnalytics {
    var reach: [Int]
    var engagement: [Int]
    var clicks: [Int]
    var byPlatform: [(SocialPlatform, Int)]

    var totalReach: Int { reach.reduce(0, +) }
    var totalEngagement: Int { engagement.reduce(0, +) }
    var totalClicks: Int { clicks.reduce(0, +) }
    var ctr: Double { totalReach == 0 ? 0 : Double(totalClicks) / Double(totalReach) * 100 }

    init(campaign: Campaign) {
        var seed = campaign.id.unicodeScalars.reduce(UInt64(17)) { ($0 &* 31) &+ UInt64($1.value) }
        func next(_ range: ClosedRange<Int>) -> Int {
            seed = seed &* 6364136223846793005 &+ 1442695040888963407
            let span = UInt64(range.upperBound - range.lowerBound + 1)
            return range.lowerBound + Int((seed >> 33) % span)
        }
        let scale: Int
        switch campaign.status {
        case .draft: scale = 0
        case .ready: scale = 1
        case .scheduled: scale = 2
        case .live: scale = 6
        case .completed: scale = 9
        }
        reach = (0..<14).map { i in scale == 0 ? 0 : next(400...1400) * scale + i * 60 * scale }
        engagement = reach.map { $0 == 0 ? 0 : $0 * next(4...11) / 100 }
        clicks = reach.map { $0 == 0 ? 0 : $0 * next(1...4) / 100 }
        byPlatform = campaign.platforms.map { ($0, scale == 0 ? 0 : next(1800...9800) * scale) }
    }
}

/// Simple bar chart drawn with capsules.
struct MSBarChart: View {
    var values: [Int]
    var tint: Color = MSColor.accent
    var height: CGFloat = 110

    var body: some View {
        let maxV = max(values.max() ?? 1, 1)
        HStack(alignment: .bottom, spacing: 5) {
            ForEach(Array(values.enumerated()), id: \.offset) { _, v in
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(LinearGradient(colors: [tint, tint.opacity(0.45)], startPoint: .top, endPoint: .bottom))
                    .frame(height: max(3, CGFloat(v) / CGFloat(maxV) * height))
                    .frame(maxWidth: .infinity)
            }
        }
        .frame(height: height, alignment: .bottom)
    }
}

/// Sparkline with a soft area fill.
struct MSSparkline: View {
    var values: [Int]
    var tint: Color = MSColor.success
    var height: CGFloat = 60

    var body: some View {
        GeometryReader { geo in
            let pts = points(in: geo.size)
            ZStack {
                if pts.count > 1 {
                    Path { p in
                        p.move(to: CGPoint(x: pts[0].x, y: geo.size.height))
                        for pt in pts { p.addLine(to: pt) }
                        p.addLine(to: CGPoint(x: pts[pts.count - 1].x, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(LinearGradient(colors: [tint.opacity(0.28), .clear], startPoint: .top, endPoint: .bottom))
                    Path { p in
                        p.move(to: pts[0])
                        for pt in pts.dropFirst() { p.addLine(to: pt) }
                    }
                    .stroke(tint, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                    Circle().fill(tint).frame(width: 6, height: 6).position(pts[pts.count - 1])
                }
            }
        }
        .frame(height: height)
    }

    private func points(in size: CGSize) -> [CGPoint] {
        guard values.count > 1 else { return [] }
        let maxV = CGFloat(max(values.max() ?? 1, 1))
        let stepX = size.width / CGFloat(values.count - 1)
        return values.enumerated().map { i, v in
            CGPoint(x: CGFloat(i) * stepX, y: size.height - (CGFloat(v) / maxV) * (size.height - 6) - 3)
        }
    }
}

extension Int {
    /// 12.4K style formatting for analytics tiles.
    var compactString: String {
        if self >= 1_000_000 { return String(format: "%.1fM", Double(self) / 1_000_000) }
        if self >= 1_000 { return String(format: "%.1fK", Double(self) / 1_000) }
        return "\(self)"
    }
}
