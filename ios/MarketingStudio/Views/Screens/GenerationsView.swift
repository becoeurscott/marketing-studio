import SwiftUI

/// SPEC §33: generation history with thumbnail, prompt, type, date, project and status; filters; detail with rerun / open asset.
struct GenerationsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var filter = "All"
    @State private var query = ""
    @State private var selected: Generation? = nil

    private static let filters = ["All"] + GenerationKind.allCases.map { $0.title }

    private var filtered: [Generation] {
        store.recentGenerations
            .filter { g in filter == "All" || g.kind.title == filter }
            .filter { query.isEmpty || $0.prompt.localizedCaseInsensitiveContains(query) }
    }

    private var grouped: [(String, [Generation])] {
        let cal = Calendar.current
        var buckets: [(String, [Generation])] = []
        for g in filtered {
            let key: String
            if cal.isDateInToday(g.createdAt) { key = "Today" }
            else if cal.isDateInYesterday(g.createdAt) { key = "Yesterday" }
            else if g.createdAt > .daysAgo(7) { key = "This week" }
            else { key = "Earlier" }
            if let i = buckets.firstIndex(where: { $0.0 == key }) { buckets[i].1.append(g) } else { buckets.append((key, [g])) }
        }
        return buckets
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Generations").msTitle(30)
                    Text("\(store.generations.count) total · \(store.generations.reduce(0) { $0 + $1.creditsSpent }) credits spent").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)
                SearchBar(placeholder: "Search prompts", text: $query).padding(.horizontal, MSSpacing.gutter)
                ChipRow(options: Self.filters, selection: $filter)

                if filtered.isEmpty {
                    EmptyStateView(
                        icon: query.isEmpty ? "clock.arrow.circlepath" : "magnifyingglass",
                        title: query.isEmpty ? "No generations yet" : "No matches",
                        message: query.isEmpty ? "Every image, video, ad and copy you generate is logged here so you can rerun it later." : "Try a different prompt keyword.",
                        ctaTitle: query.isEmpty ? "Open Studio" : "Clear search",
                        ctaIcon: query.isEmpty ? "sparkles" : nil
                    ) { if query.isEmpty { router.push(.studio) } else { query = "" } }
                } else {
                    ForEach(grouped, id: \.0) { title, gens in
                        VStack(alignment: .leading, spacing: 8) {
                            SectionHeader(title: title, subtitle: "\(gens.count)")
                            VStack(spacing: 8) {
                                ForEach(gens) { g in
                                    GenerationHistoryRow(generation: g) { selected = g }
                                        .contextMenu {
                                            Button { selected = g } label: { Label("Details", systemImage: "info.circle") }
                                            Button { store.toggleFavorite(.prompt, g.id) } label: {
                                                Label(store.isFavorite(.prompt, g.id) ? "Unsave prompt" : "Save prompt", systemImage: "bookmark")
                                            }
                                            Button(role: .destructive) { store.deleteGeneration(g.id) } label: { Label("Delete", systemImage: "trash") }
                                        }
                                }
                            }
                            .padding(.horizontal, MSSpacing.gutter)
                        }
                    }
                    .animation(MSAnimation.gentle, value: filtered.map { $0.id })
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Generations")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(item: $selected, detents: [.large]) { g in
            GenerationDetailSheet(generationId: g.id) { selected = nil }
        }
    }
}

struct GenerationHistoryRow: View {
    @EnvironmentObject private var store: AppStore
    var generation: Generation
    var action: () -> Void

    var body: some View {
        MSCard(padding: 10, action: action) {
            HStack(spacing: 12) {
                ZStack {
                    if let t = generation.thumbnails.first {
                        RemoteImage(url: t, cornerRadius: 10)
                    } else {
                        RoundedRectangle(cornerRadius: 10, style: .continuous).fill(MSColor.elevated)
                        Image(systemName: generation.kind.icon).foregroundStyle(MSColor.text2)
                    }
                }
                .frame(width: 60, height: 60)
                .overlay(alignment: .bottomTrailing) {
                    if generation.thumbnails.count > 1 {
                        Text("\(generation.thumbnails.count)").font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 5).frame(height: 16).background(.black.opacity(0.6), in: Capsule()).padding(4)
                    }
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(generation.prompt).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(2).multilineTextAlignment(.leading)
                    HStack(spacing: 5) {
                        Image(systemName: generation.kind.icon).font(.system(size: 9, weight: .bold))
                        Text(generation.kind.title)
                        Text("·")
                        Text(generation.createdAt.relativeString)
                        if let p = generation.projectId.flatMap({ store.project($0) }) {
                            Text("·")
                            Text(p.name).lineLimit(1)
                        }
                    }
                    .msCaption()
                }
                Spacer(minLength: 4)
                MSBadge(text: generation.status.title, tone: MSBadge.tone(for: generation.status))
            }
        }
    }
}

/// Detail of one generation: outputs, prompt, result text, rerun and open asset.
struct GenerationDetailSheet: View {
    let generationId: String
    var onDone: () -> Void
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @State private var rerunning = false

    private var generation: Generation? { store.generation(generationId) }

    var body: some View {
        BottomSheetContainer(title: generation?.kind.title ?? "Generation", subtitle: generation.map { "\($0.model) · \($0.creditsSpent) credits · \($0.createdAt.formatted(date: .abbreviated, time: .shortened))" }) {
            if let g = generation {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            MSBadge(text: g.status.title, tone: MSBadge.tone(for: g.status))
                            if let p = g.projectId.flatMap({ store.project($0) }) { MSBadge(text: p.name, tone: .neutral, icon: "folder") }
                            Spacer()
                            Button { store.toggleFavorite(.prompt, g.id) } label: {
                                Image(systemName: store.isFavorite(.prompt, g.id) ? "bookmark.fill" : "bookmark")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(store.isFavorite(.prompt, g.id) ? MSColor.highlight : MSColor.text2)
                            }
                        }

                        if !g.thumbnails.isEmpty {
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: g.thumbnails.count == 1 ? 1 : 2), spacing: 8) {
                                ForEach(Array(g.thumbnails.enumerated()), id: \.offset) { _, t in
                                    Button { openAsset(t, g) } label: {
                                        RemoteImage(url: t, cornerRadius: 12)
                                            .aspectRatio(g.thumbnails.count == 1 ? 1.2 : 0.8, contentMode: .fit)
                                            .overlay(alignment: .bottomTrailing) {
                                                Image(systemName: "arrow.up.right.square").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                                                    .frame(width: 24, height: 24).background(.black.opacity(0.55), in: Circle()).padding(6)
                                            }
                                    }
                                    .buttonStyle(MSPressStyle())
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Prompt").msCaption(color: MSColor.text2)
                            Text(g.prompt).msBody(15, color: MSColor.text).lineSpacing(2)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .msCard(padding: 12)
                        }

                        if let text = g.resultText, !text.isEmpty {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text("Result").msCaption(color: MSColor.text2)
                                    Spacer()
                                    Button {
                                        UIPasteboard.general.string = text
                                        router.toast("Copied", style: .success, icon: "doc.on.doc")
                                    } label: { Image(systemName: "doc.on.doc").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.text2) }
                                }
                                Text(text).msBody(14).lineSpacing(3)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .msCard(padding: 12)
                            }
                        }

                        VStack(spacing: 10) {
                            MSButton(title: "Rerun · \(g.creditsSpent) credits", icon: "arrow.clockwise", isLoading: rerunning) { rerun(g) }
                            if let first = g.thumbnails.first {
                                MSButton(title: "Open asset", icon: "photo", style: .secondary) { openAsset(first, g) }
                            }
                            if g.status == .failed {
                                MSButton(title: "Delete", icon: "trash", style: .danger) {
                                    store.deleteGeneration(g.id)
                                    onDone()
                                }
                            }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.bottom, 24)
                }
            } else {
                EmptyStateView(icon: "clock.badge.xmark", title: "Generation removed", message: "", ctaTitle: "Close") { onDone() }
            }
        }
    }

    private func openAsset(_ url: String, _ g: Generation) {
        let a = store.assets.first { $0.imageURL == url } ?? store.addAsset(
            name: String(g.prompt.prefix(40)), kind: g.kind == .video ? .video : .image, imageURL: url,
            projectId: g.projectId, tags: [g.kind.rawValue, "generated"], durationSeconds: g.kind == .video ? 10 : nil
        )
        onDone()
        router.push(.assetDetail(id: a.id), on: .assets)
    }

    private func rerun(_ g: Generation) {
        guard !rerunning else { return }
        rerunning = true
        Task {
            do {
                switch g.kind {
                case .image:
                    _ = try await MockAPI.generateImage(ImageGenParams(prompt: g.prompt, projectId: g.projectId), store: store)
                case .video:
                    _ = try await MockAPI.generateVideo(VideoGenParams(prompt: g.prompt, projectId: g.projectId), store: store) { _ in }
                case .copy:
                    _ = try await MockAPI.generateCopy(CopyParams(product: store.brand.name, audience: store.brand.audience), store: store)
                case .ad:
                    _ = try await MockAPI.generateAds(AdParams(product: store.brand.name, offer: "Launch offer", audience: store.brand.audience, projectId: g.projectId), store: store)
                }
                MSHaptic.success()
                router.toast("Rerun complete", style: .success)
                onDone()
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
            rerunning = false
        }
    }
}
