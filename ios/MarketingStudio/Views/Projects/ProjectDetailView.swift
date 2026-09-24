import SwiftUI

/// SPEC §25.
struct ProjectDetailView: View {
    let projectId: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var tab = 0
    @State private var confirmDelete = false

    private var project: Project? { store.project(projectId) }

    var body: some View {
        Group {
            if let project {
                content(project)
            } else {
                EmptyStateView(icon: "folder.badge.questionmark", title: "Project not found", message: "It may have been deleted.", ctaTitle: "Back to projects") { router.pop() }
                    .msScreen()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func content(_ project: Project) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                header(project)
                SegmentedTabs(tabs: ["Overview", "Assets", "Generations", "Campaigns"], selection: $tab)
                    .padding(.horizontal, MSSpacing.gutter)
                Group {
                    switch tab {
                    case 0: overview(project)
                    case 1: assetsTab(project)
                    case 2: generationsTab(project)
                    default: campaignsTab(project)
                    }
                }
                .animation(MSAnimation.gentle, value: tab)
            }
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle(project.name)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    ProjectMenu(project: project) { router.pop() }
                } label: {
                    Image(systemName: "ellipsis.circle").font(.system(size: 16, weight: .semibold)).foregroundStyle(MSColor.text)
                }
            }
        }
        .onAppear { store.setCurrentProject(project.id) }
    }

    // MARK: Header

    private func header(_ project: Project) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            RemoteImage(url: project.thumbnailURL, cornerRadius: MSRadius.lg)
                .frame(height: 180)
                .overlay(alignment: .bottomLeading) {
                    HStack(spacing: 6) {
                        MSBadge(text: project.status == .active ? "Active" : "Archived", tone: project.status == .active ? .success : .neutral)
                        if let bid = project.brandId, bid == store.brand.id {
                            MSBadge(text: store.brand.name, tone: .accent, icon: "paintpalette")
                        }
                    }
                    .padding(6)
                    .background(.black.opacity(0.55), in: Capsule())
                    .padding(10)
                }
            VStack(alignment: .leading, spacing: 6) {
                Text(project.name).msTitle(26)
                Text(project.description).msBody(14).lineSpacing(2)
                Text("Created \(project.createdAt.formatted(date: .abbreviated, time: .omitted)) · Updated \(project.updatedAt.relativeString)").msCaption()
            }
            HStack(spacing: 10) {
                MSButton(title: "Generate", icon: "sparkles", size: .compact) { router.push(.studio) }
                MSButton(title: "New campaign", icon: "flag", style: .secondary, size: .compact) { router.push(.campaignBuilder) }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: Tabs

    private func overview(_ project: Project) -> some View {
        let assets = store.assets(in: project.id)
        let gens = store.generations(in: project.id)
        let camps = store.campaigns(in: project.id)
        return VStack(alignment: .leading, spacing: 18) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                StatTile(label: "Assets", value: "\(assets.count)", icon: "photo.on.rectangle") { tab = 1 }
                StatTile(label: "Generations", value: "\(gens.count)", icon: "sparkles") { tab = 2 }
                StatTile(label: "Campaigns", value: "\(camps.count)", icon: "flag") { tab = 3 }
            }
            .padding(.horizontal, MSSpacing.gutter)

            if !assets.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Latest assets", actionTitle: "All") { tab = 1 }
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                        ForEach(assets.prefix(6)) { a in
                            AssetThumb(asset: a) { router.push(.assetDetail(id: a.id)) }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
            if !gens.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Recent generations", actionTitle: "All") { tab = 2 }
                    VStack(spacing: 8) {
                        ForEach(gens.prefix(3)) { g in GenerationRow(generation: g) { router.push(.generations) } }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
            if assets.isEmpty && gens.isEmpty {
                EmptyStateView(icon: "sparkles", title: "This project is empty", message: "Generate your first visual or upload a product photo to get started.", ctaTitle: "Open Studio", ctaIcon: "sparkles") { router.push(.studio) }
            }
        }
    }

    private func assetsTab(_ project: Project) -> some View {
        let assets = store.assets(in: project.id)
        return Group {
            if assets.isEmpty {
                EmptyStateView(icon: "photo.on.rectangle", title: "No assets", message: "Generated images, videos and exports for this project show up here.", ctaTitle: "Upload product", ctaIcon: "square.and.arrow.up") { router.present(.uploadProduct) }
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                    ForEach(assets) { a in
                        AssetThumb(asset: a) { router.push(.assetDetail(id: a.id)) }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private func generationsTab(_ project: Project) -> some View {
        let gens = store.generations(in: project.id)
        return Group {
            if gens.isEmpty {
                EmptyStateView(icon: "clock.arrow.circlepath", title: "No generations", message: "Every image, video and copy you generate in this project is logged here.", ctaTitle: "Generate", ctaIcon: "sparkles") { router.push(.studio) }
            } else {
                VStack(spacing: 8) {
                    ForEach(gens) { g in GenerationRow(generation: g) { router.push(.generations) } }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private func campaignsTab(_ project: Project) -> some View {
        let camps = store.campaigns(in: project.id)
        return Group {
            if camps.isEmpty {
                EmptyStateView(icon: "flag", title: "No campaigns", message: "Turn this project's assets into a multi-platform campaign.", ctaTitle: "Build campaign", ctaIcon: "flag") { router.push(.campaignBuilder) }
            } else {
                VStack(spacing: 8) {
                    ForEach(camps) { c in
                        MSCard(padding: 12, action: { router.push(.campaignDetail(id: c.id)) }) {
                            HStack(spacing: 12) {
                                Image(systemName: c.objective.icon)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(MSColor.text2)
                                    .frame(width: 36, height: 36)
                                    .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(c.name).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                                    Text("\(c.platforms.map { $0.title }.joined(separator: " · ")) · \(c.assetIds.count) assets").msCaption().lineLimit(1)
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
}
