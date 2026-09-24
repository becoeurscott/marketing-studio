import SwiftUI

/// SPEC §35: format, quality, scope (selected assets or a whole campaign), mock progress and a completion state.
/// Used as a pushed screen (`.exportCenter`) and inside the `.exportAssets(ids:)` sheet (`inSheet: true`).
struct ExportCenterView: View {
    var preselectedIds: [String] = []
    var inSheet: Bool = false

    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var scope = 0   // 0 selected, 1 campaign
    @State private var selectedIds: [String] = []
    @State private var campaignId: String? = nil
    @State private var format: ExportFormat = .png
    @State private var quality: ExportQuality = .high
    @State private var picking = false

    @State private var exporting = false
    @State private var progress: Double = 0
    @State private var stepLabel = ""
    @State private var result: Asset? = nil

    private var ids: [String] {
        scope == 0 ? selectedIds : (campaignId.flatMap { store.campaign($0)?.assetIds } ?? [])
    }
    private var estimatedMB: Double {
        let per: Double = quality == .standard ? 1.2 : (quality == .high ? 3.4 : 8.1)
        return Double(ids.count) * per * (format == .mp4 ? 4 : (format == .pdf ? 0.6 : 1))
    }

    var body: some View {
        Group {
            if inSheet {
                BottomSheetContainer(title: "Export Center", subtitle: "Choose a format and quality.") {
                    ScrollView(showsIndicators: false) { body_.padding(.bottom, 24) }
                }
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Export Center").msTitle(30)
                        Text("Download assets and campaigns in any format.").msBody(14)
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.bottom, 10)
                    body_.padding(.bottom, 40)
                }
                .msScreen()
                .navigationTitle("Export Center")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { MSTopBarItems() }
            }
        }
        .onAppear {
            if selectedIds.isEmpty { selectedIds = preselectedIds }
            if campaignId == nil { campaignId = store.campaigns.first?.id }
        }
        .msSheet(isPresented: $picking, detents: [.large]) {
            AssetPickerSheet(title: "Select assets", preferredIds: [], multiple: true, initial: selectedIds) { selectedIds = $0 }
        }
    }

    @ViewBuilder private var body_: some View {
        if let result {
            completion(result)
        } else if exporting {
            progressView
        } else {
            form
        }
    }

    // MARK: Form

    private var form: some View {
        VStack(alignment: .leading, spacing: 18) {
            SegmentedTabs(tabs: ["Export selected", "Export campaign"], selection: $scope)
                .padding(.horizontal, MSSpacing.gutter)

            if scope == 0 { selectedScope } else { campaignScope }

            VStack(alignment: .leading, spacing: 8) {
                Text("Format").msCaption(color: MSColor.text2)
                HStack(spacing: 8) {
                    ForEach(ExportFormat.allCases) { f in
                        MSChip(title: f.rawValue, icon: formatIcon(f), selected: format == f) { format = f }
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)

            VStack(alignment: .leading, spacing: 8) {
                Text("Quality").msCaption(color: MSColor.text2)
                HStack(spacing: 8) {
                    ForEach(ExportQuality.allCases) { q in
                        MSChip(title: q.rawValue, selected: quality == q) { quality = q }
                    }
                }
                Text(qualityHint).msCaption()
            }
            .padding(.horizontal, MSSpacing.gutter)

            MSCard(padding: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(ids.count) file\(ids.count == 1 ? "" : "s") · \(format.rawValue) · \(quality.rawValue)").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        Text(String(format: "About %.1f MB", estimatedMB)).msCaption()
                    }
                    Spacer()
                    Image(systemName: "shippingbox").foregroundStyle(MSColor.text2)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)

            MSButton(title: "Export \(ids.count) file\(ids.count == 1 ? "" : "s")", icon: "square.and.arrow.down", isDisabled: ids.isEmpty) { export() }
                .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var selectedScope: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("\(selectedIds.count) asset\(selectedIds.count == 1 ? "" : "s") selected").msHeadline(15)
                Spacer()
                Button(selectedIds.isEmpty ? "Choose assets" : "Change") { picking = true }
                    .font(MSFont.control(13)).foregroundStyle(MSColor.highlight)
            }
            .padding(.horizontal, MSSpacing.gutter)
            if selectedIds.isEmpty {
                EmptyStateView(icon: "checkmark.rectangle.stack", title: "Nothing selected", message: "Pick assets from your library to export them together.", ctaTitle: "Choose assets", ctaIcon: "plus") { picking = true }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(selectedIds.compactMap { store.asset($0) }) { a in
                            RemoteImage(url: a.imageURL, cornerRadius: 10)
                                .frame(width: 76, height: 96)
                                .overlay(alignment: .topTrailing) {
                                    Button { selectedIds.removeAll { $0 == a.id } } label: {
                                        Image(systemName: "xmark").font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                                            .frame(width: 20, height: 20).background(.black.opacity(0.6), in: Circle())
                                    }
                                    .padding(4)
                                }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
        }
    }

    private var campaignScope: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Campaign").msCaption(color: MSColor.text2).padding(.horizontal, MSSpacing.gutter)
            if store.campaigns.isEmpty {
                EmptyStateView(icon: "flag", title: "No campaigns", message: "Build a campaign to export it as a package.", ctaTitle: "New campaign", ctaIcon: "plus") {
                    if inSheet { router.dismissSheet() }
                    router.push(.campaignBuilder)
                }
            } else {
                VStack(spacing: 8) {
                    ForEach(store.campaigns.sorted { $0.createdAt > $1.createdAt }) { c in
                        let on = campaignId == c.id
                        MSCard(padding: 10, action: { campaignId = c.id }) {
                            HStack(spacing: 12) {
                                Image(systemName: on ? "checkmark.circle.fill" : "circle").foregroundStyle(on ? MSColor.accent : MSColor.muted)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(c.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                                    Text("\(c.assetIds.count) assets · \(c.variations.count) ads").msCaption()
                                }
                                Spacer()
                                MSBadge(text: c.status.title, tone: MSBadge.tone(for: c.status))
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private func formatIcon(_ f: ExportFormat) -> String {
        switch f {
        case .png, .jpg: return "photo"
        case .mp4: return "film"
        case .pdf: return "doc.richtext"
        }
    }

    private var qualityHint: String {
        switch quality {
        case .standard: return "Web-ready, smallest files."
        case .high: return "Balanced for social platforms."
        case .maximum: return "Full resolution for print and ads."
        }
    }

    // MARK: Progress

    private var progressView: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle().strokeBorder(MSColor.elevated, lineWidth: 8).frame(width: 110, height: 110)
                Circle().trim(from: 0, to: progress)
                    .stroke(MSColor.accentGradient, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 110, height: 110)
                    .animation(MSAnimation.slow, value: progress)
                Text("\(Int(progress * 100))%").msHeadline(22).contentTransition(.numericText())
            }
            VStack(spacing: 4) {
                Text(stepLabel.isEmpty ? "Preparing" : stepLabel).msHeadline(17)
                Text("\(ids.count) files · \(format.rawValue) · \(quality.rawValue)").msCaption()
            }
            MSProgressBar(progress: progress, height: 6).padding(.horizontal, 40)
            ProgressIndicator(steps: MockAPI.exportSteps, currentStep: MockAPI.exportSteps.firstIndex(of: stepLabel) ?? 0)
                .msCard()
                .padding(.horizontal, MSSpacing.gutter)
        }
        .padding(.top, 24)
        .frame(maxWidth: .infinity)
    }

    // MARK: Completion

    private func completion(_ a: Asset) -> some View {
        VStack(spacing: 18) {
            ZStack {
                Circle().fill(MSColor.success.opacity(0.14)).frame(width: 84, height: 84)
                Image(systemName: "checkmark").font(.system(size: 34, weight: .bold)).foregroundStyle(MSColor.success)
            }
            VStack(spacing: 4) {
                Text("Export complete").msHeadline(20)
                Text(a.name).msBody(14).multilineTextAlignment(.center)
            }
            MSCard(padding: 12) {
                HStack(spacing: 12) {
                    RemoteImage(url: a.imageURL, cornerRadius: 8).frame(width: 48, height: 48)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(String(format: "%.1f MB · %@", estimatedMB, format.rawValue)).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        Text("Saved to Exports").msCaption()
                    }
                    Spacer()
                    MSBadge(text: "Ready", tone: .success)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            VStack(spacing: 10) {
                MSButton(title: "Download", icon: "arrow.down.circle") {
                    router.toast("Saved to Files", style: .success, icon: "arrow.down.circle")
                }
                MSButton(title: "View in Assets", icon: "photo.on.rectangle", style: .secondary) {
                    if inSheet { router.dismissSheet() }
                    router.push(.assetDetail(id: a.id), on: .assets)
                }
                MSButton(title: "Export another", style: .ghost) { withAnimation(MSAnimation.gentle) { result = nil; progress = 0 } }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
        .padding(.top, 24)
        .frame(maxWidth: .infinity)
    }

    // MARK: Action

    private func export() {
        guard !ids.isEmpty else { return }
        progress = 0
        stepLabel = ""
        withAnimation(MSAnimation.gentle) { exporting = true }
        Task {
            do {
                let a = try await MockAPI.exportAssets(ids: ids, format: format, quality: quality, store: store) { p, label in
                    progress = p
                    stepLabel = label
                }
                MSHaptic.success()
                withAnimation(MSAnimation.gentle) { result = a; exporting = false }
            } catch {
                exporting = false
                router.toast(error.localizedDescription, style: .error)
            }
        }
    }
}
