import SwiftUI

/// SPEC §8.
struct HomeView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let firstName = store.user.name.split(separator: " ").first.map(String.init) ?? store.user.name
        switch hour {
        case 5..<12: return "Good morning, \(firstName)."
        case 12..<17: return "Good afternoon, \(firstName)."
        case 17..<22: return "Good evening, \(firstName)."
        default: return "Still creating, \(firstName)?"
        }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 28) {
                brandMark
                hero
                stats
                recentProjects
                continueCreating
                templatesRow
                trendingFormats
                recentAssets
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }

    // MARK: Sections

    private var brandMark: some View {
        HStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 6, style: .continuous).fill(MSColor.accentGradient).frame(width: 20, height: 20)
            Text("Marketing Studio").font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text2)
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, -12)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(greeting).msTitle(30)
                Text("What are we creating today?").msBody(16)
            }
            MSButton(title: "Create something", icon: "sparkles") {
                router.select(.studio)
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var stats: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            StatTile(label: "Projects", value: "\(store.activeProjects.count)", icon: "folder") { router.select(.projects) }
            StatTile(label: "Assets", value: "\(store.assets.count)", icon: "photo.on.rectangle") { router.select(.assets) }
            StatTile(label: "Campaigns", value: "\(store.campaigns.count)", icon: "flag") { router.push(.campaigns) }
            StatTile(label: "Credits", value: store.credits.formatted(), icon: "bolt", tint: MSColor.highlight) { router.push(.credits) }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var recentProjects: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Recent projects", actionTitle: "All") { router.select(.projects) }
            if store.activeProjects.isEmpty {
                EmptyStateView(icon: "folder.badge.plus", title: "No projects yet", message: "Create a project to organise assets and campaigns.", ctaTitle: "New project") {
                    router.present(.newProject)
                }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(store.activeProjects.prefix(6)) { project in
                            ProjectCardCompact(project: project) {
                                router.push(.projectDetail(id: project.id), on: .projects)
                            }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
        }
    }

    private var continueCreating: some View {
        let gens = store.recentGenerations.filter { $0.status != .failed }.prefix(3)
        return VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Continue creating", subtitle: "Pick up where you left off", actionTitle: "History") { router.push(.generations) }
            if gens.isEmpty {
                EmptyStateView(icon: "sparkles", title: "Nothing in progress", message: "Generate an image, video or copy and it shows up here.", ctaTitle: "Open Studio") { router.select(.studio) }
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(gens)) { gen in
                        GenerationRow(generation: gen) {
                            router.push(routeForGeneration(gen))
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private func routeForGeneration(_ g: Generation) -> AppRoute {
        switch g.kind {
        case .image: return .imageGenerator
        case .video: return .videoGenerator
        case .copy: return .copywriter
        case .ad: return .adCreator
        }
    }

    private var templatesRow: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Templates", actionTitle: "Browse") { router.push(.templates) }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(store.templates.prefix(8)) { tpl in
                        TemplateCardCompact(template: tpl) { router.push(.templateDetail(id: tpl.id)) }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private var trendingFormats: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Trending formats")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Array(MockData.trendingFormats.enumerated()), id: \.offset) { _, f in
                        Button { router.select(.studio) } label: {
                            HStack(spacing: 10) {
                                Image(systemName: f.icon)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(MSColor.highlight)
                                    .frame(width: 32, height: 32)
                                    .background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(f.title).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                                    Text(f.subtitle).msCaption()
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                        }
                        .buttonStyle(MSPressStyle())
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private var recentAssets: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Recent assets", actionTitle: "Library") { router.select(.assets) }
            let items = store.recentAssets.filter { $0.kind == .image || $0.kind == .video }.prefix(6)
            if items.isEmpty {
                EmptyStateView(icon: "photo.on.rectangle", title: "No assets yet", message: "Generated and uploaded files live here.", ctaTitle: "Upload product") { router.present(.uploadProduct) }
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                    ForEach(Array(items)) { asset in
                        AssetThumb(asset: asset) { router.push(.assetDetail(id: asset.id), on: .assets) }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }
}

// MARK: - Shared row/card views used by Home + others

struct ProjectCardCompact: View {
    @EnvironmentObject private var store: AppStore
    var project: Project
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                RemoteImage(url: project.thumbnailURL, cornerRadius: 12)
                    .frame(width: 200, height: 120)
                VStack(alignment: .leading, spacing: 3) {
                    Text(project.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                    Text("\(store.assets(in: project.id).count) assets · \(project.updatedAt.relativeString)").msCaption()
                }
            }
            .padding(10)
            .frame(width: 220, alignment: .leading)
            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}

struct TemplateCardCompact: View {
    var template: Template
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                RemoteImage(url: template.thumbnailURL, cornerRadius: 12)
                    .frame(width: 140, height: 175)
                    .overlay(alignment: .topLeading) {
                        MSBadge(text: template.format, tone: .overlay).padding(8)
                    }
                Text(template.title).font(MSFont.control(13)).foregroundStyle(MSColor.text).lineLimit(1)
                Text(template.category.title).msCaption()
            }
            .frame(width: 140, alignment: .leading)
        }
        .buttonStyle(MSPressStyle())
    }
}

struct GenerationRow: View {
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
                .frame(width: 52, height: 52)
                VStack(alignment: .leading, spacing: 3) {
                    Text(generation.prompt).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                    Text("\(generation.kind.title) · \(generation.createdAt.relativeString)").msCaption().lineLimit(1)
                }
                Spacer(minLength: 8)
                MSBadge(text: generation.status.title, tone: MSBadge.tone(for: generation.status)).fixedSize()
            }
        }
    }
}

struct AssetThumb: View {
    var asset: Asset
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            RemoteImage(url: asset.imageURL, cornerRadius: 12)
                .aspectRatio(0.8, contentMode: .fit)
                .overlay(alignment: .bottomLeading) {
                    if asset.kind == .video {
                        Image(systemName: "play.fill")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 20, height: 20)
                            .background(.black.opacity(0.55), in: Circle())
                            .padding(6)
                    }
                }
                .overlay(alignment: .topTrailing) {
                    if asset.favorite {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(MSColor.highlight)
                            .padding(6)
                    }
                }
        }
        .buttonStyle(MSPressStyle())
    }
}
