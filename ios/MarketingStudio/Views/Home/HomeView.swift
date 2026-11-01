import SwiftUI

// MARK: - Community post (matches web /api/community response)

private struct CommunityPost: Decodable, Identifiable {
    var id: String
    var url: String
    var poster: String?
    var prompt: String
    var author: String
    var modelLabel: String
    var kind: String?
}

/// The showcase clips bundled with Sokozia. They are displayed alongside live community posts.
private var sokoziaShowcasePosts: [CommunityPost] {
    Showcase.allVideos.map { name in
        CommunityPost(
            id: "sokozia-\(name)",
            url: Showcase.video(name),
            poster: Showcase.poster(name),
            prompt: "Exemple Sokozia · \(name.replacingOccurrences(of: "-", with: " "))",
            author: "Sokozia",
            modelLabel: "Marketing Studio",
            kind: "video"
        )
    }
}

// MARK: - Feature pill for the banner

private struct FeaturePill: Identifiable {
    let id = UUID()
    var label: String
    var icon: String
    var route: AppRoute?
    var accent: Bool = false
}

private let featurePills: [FeaturePill] = [
    .init(label: "Studio IA", icon: "sparkles", route: .studio, accent: true),
    .init(label: "Shooting produit", icon: "camera.aperture", route: .productShoot),
    .init(label: "Vidéos UGC", icon: "person.wave.2", route: .ugcCreator),
    .init(label: "Publicités", icon: "megaphone", route: .adCreator),
    .init(label: "Rédaction IA", icon: "text.alignleft", route: .copywriter),
    .init(label: "75 templates", icon: "rectangle.grid.2x2", route: .templates),
    .init(label: "Créateurs", icon: "person.2", route: .creators),
    .init(label: "Multi-modèles", icon: "cpu", route: nil),
    .init(label: "Formats tendance", icon: "flame", route: nil),
]

// MARK: - Gallery category

private enum GalleryCategory: String, CaseIterable, Identifiable {
    case all = "Tout"
    case images = "Images"
    case videos = "Vidéos"
    case ads = "Pubs"
    case texts = "Textes"

    var id: String { rawValue }

    func matches(_ gen: Generation) -> Bool {
        switch self {
        case .all: return true
        case .images: return gen.kind == .image
        case .videos: return gen.kind == .video
        case .ads: return gen.kind == .ad
        case .texts: return gen.kind == .copy
        }
    }
}

// MARK: - Home

struct HomeView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @State private var trendingPosts: [CommunityPost] = []
    @State private var loadingTrending = true
    @State private var selectedCategory: GalleryCategory = .all
    @State private var tabsPinned = false
    @State private var bannerIndex = 0
    private let bannerTimer = Timer.publish(every: 4, on: .main, in: .common).autoconnect()

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let firstName = store.user.name.split(separator: " ").first.map(String.init) ?? store.user.name
        switch hour {
        case 5..<12: return "Bonjour, \(firstName)."
        case 12..<17: return "Bon après-midi, \(firstName)."
        case 17..<22: return "Bonsoir, \(firstName)."
        default: return "Toujours en pleine création, \(firstName) ?"
        }
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    // 1. Header — compact greeting
                    header

                    // 2. Auto-scrolling banner — app features showcase
                    bannerCarousel

                    // 3. Quick actions — compact single-row buttons
                    quickActions

                    // 4. Trending videos — horizontal scroll
                    trendingSection

                    // 5. Community creations grid
                    communitySection

                    // 6. User generations — category tabs + grid
                    gallerySection
                }
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .msScreen()
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .task { await fetchTrending() }
    }

    // MARK: - Header (compact)

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                MSBrandMark(size: 20)
            }
            Text(greeting).font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(MSColor.text)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    // MARK: - Auto-scrolling banner carousel

    private struct BannerSlide: Identifiable {
        let id = UUID()
        var icon: String
        var title: String
        var subtitle: String
        var gradient: [Color]
        var route: AppRoute?
        var cta: String?
    }

    private var bannerSlides: [BannerSlide] { [
        .init(icon: "sparkles", title: "Studio IA", subtitle: "Photos, vidéos UGC et pubs générées pour votre marque", gradient: [MSColor.accent.opacity(0.3), MSColor.accent.opacity(0.08)], route: .studio, cta: "Ouvrir"),
        .init(icon: "camera.aperture", title: "Shooting produit", subtitle: "Mettez votre produit en scène avec l'IA", gradient: [Color.purple.opacity(0.25), Color.purple.opacity(0.06)], route: .productShoot, cta: "Essayer"),
        .init(icon: "person.wave.2", title: "Vidéos UGC", subtitle: "Créez des vidéos avec des créateurs IA réalistes", gradient: [Color.blue.opacity(0.25), Color.blue.opacity(0.06)], route: .ugcCreator, cta: "Créer"),
        .init(icon: "cpu", title: "Multi-modèles IA", subtitle: "Standard, HD, Nano Banana Pro, Éco — choisissez votre style", gradient: [Color.orange.opacity(0.25), Color.orange.opacity(0.06)]),
        .init(icon: "megaphone", title: "75 templates", subtitle: "Publicités prêtes à poster pour tous les réseaux sociaux", gradient: [Color.pink.opacity(0.25), Color.pink.opacity(0.06)], route: .adCreator, cta: "Explorer"),
    ] }

    private var bannerCarousel: some View {
        VStack(spacing: 8) {
            TabView(selection: $bannerIndex) {
                ForEach(Array(bannerSlides.enumerated()), id: \.element.id) { i, slide in
                    Button {
                        MSHaptic.tap()
                        if let route = slide.route { router.push(route) }
                    } label: {
                        ZStack(alignment: .bottomLeading) {
                            LinearGradient(colors: slide.gradient + [MSColor.card], startPoint: .topLeading, endPoint: .bottomTrailing)
                            VStack(alignment: .leading, spacing: 6) {
                                Image(systemName: slide.icon)
                                    .font(.system(size: 28, weight: .semibold))
                                    .foregroundStyle(MSColor.highlight)
                                Text(slide.title)
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .foregroundStyle(MSColor.text)
                                Text(slide.subtitle)
                                    .font(MSFont.body(13))
                                    .foregroundStyle(MSColor.text2)
                                    .lineLimit(2)
                                if let cta = slide.cta {
                                    HStack(spacing: 4) {
                                        Text(cta).font(MSFont.control(12)).foregroundStyle(MSColor.highlight)
                                        Image(systemName: "arrow.right").font(.system(size: 10, weight: .bold)).foregroundStyle(MSColor.highlight)
                                    }
                                    .padding(.top, 2)
                                }
                            }
                            .padding(16)
                        }
                        .frame(maxWidth: .infinity, minHeight: 140)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border.opacity(0.5), lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                    .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 160)
            .padding(.horizontal, MSSpacing.gutter)
            .onReceive(bannerTimer) { _ in
                withAnimation(.easeInOut(duration: 0.5)) {
                    bannerIndex = (bannerIndex + 1) % bannerSlides.count
                }
            }

            // Page dots
            HStack(spacing: 5) {
                ForEach(0..<bannerSlides.count, id: \.self) { i in
                    Circle()
                        .fill(i == bannerIndex ? MSColor.accent : MSColor.muted.opacity(0.4))
                        .frame(width: i == bannerIndex ? 7 : 5, height: i == bannerIndex ? 7 : 5)
                        .animation(.easeInOut(duration: 0.2), value: bannerIndex)
                }
            }
        }
    }

    // MARK: - Quick actions (compact horizontal scroll)

    private struct QuickAction {
        var icon: String; var label: String; var route: AppRoute; var accent: Bool
    }

    private let actions: [QuickAction] = [
        .init(icon: "sparkles", label: "Image IA", route: .imageGenerator, accent: true),
        .init(icon: "video", label: "Vidéo", route: .videoGenerator, accent: false),
        .init(icon: "camera.aperture", label: "Shooting", route: .productShoot, accent: false),
        .init(icon: "megaphone", label: "Pub", route: .adCreator, accent: false),
        .init(icon: "text.alignleft", label: "Texte", route: .copywriter, accent: false),
        .init(icon: "photo.on.rectangle", label: "Ressources", route: .assets, accent: false),
    ]

    private var quickActions: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(actions.enumerated()), id: \.offset) { _, a in
                    Button {
                        MSHaptic.tap()
                        if a.route == .assets { router.select(.assets) } else { router.push(a.route) }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: a.icon)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(a.accent ? MSColor.highlight : MSColor.text)
                                .frame(width: 40, height: 40)
                                .background(a.accent ? MSColor.accent.opacity(0.15) : MSColor.elevated, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            Text(a.label).font(.system(size: 11, weight: .medium)).foregroundStyle(MSColor.text2).lineLimit(1)
                        }
                        .frame(width: 68)
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    // MARK: - Trending videos (horizontal)

    private var trendingSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "flame.fill").font(.system(size: 13)).foregroundStyle(MSColor.highlight)
                Text("Tendances").font(.system(size: 17, weight: .semibold)).foregroundStyle(MSColor.text)
            }
            .padding(.horizontal, MSSpacing.gutter)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    if loadingTrending {
                        ForEach(0..<4, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: 14, style: .continuous).fill(MSColor.elevated).frame(width: 130, height: 230)
                        }
                    } else if trendingPosts.isEmpty {
                        HStack(spacing: 8) {
                            Image(systemName: "sparkles").foregroundStyle(MSColor.muted)
                            Text("Bientôt des créations tendance ici").font(MSFont.body(13)).foregroundStyle(MSColor.muted)
                        }
                        .padding(.vertical, 40)
                    } else {
                        ForEach(trendingPosts) { post in
                            TrendingVideoCard(post: post)
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: - Community creations

    private var communitySection: some View {
        let posts = sokoziaShowcasePosts + trendingPosts
        return VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Communauté", actionTitle: "Voir tout") { router.push(.generations) }

            if loadingTrending && trendingPosts.isEmpty {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                    ForEach(0..<4, id: \.self) { _ in
                        RoundedRectangle(cornerRadius: 12, style: .continuous).fill(MSColor.elevated).aspectRatio(9.0/16.0, contentMode: .fit)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            } else if posts.isEmpty {
                EmptyStateView(icon: "person.3", title: "Pas encore de créations", message: "Les vidéos créées par la communauté apparaîtront ici.", ctaTitle: "Créer") { router.select(.studio) }
                    .padding(.horizontal, MSSpacing.gutter)
            } else {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                    ForEach(posts) { post in
                        CommunityVideoCard(post: post)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    // MARK: - User gallery with category tabs

    private var gallerySection: some View {
        let allGens = store.generations.sorted { $0.createdAt > $1.createdAt }
        let filtered = allGens.filter { selectedCategory.matches($0) }

        return VStack(alignment: .leading, spacing: 0) {
            SectionHeader(title: "Mes créations", actionTitle: "Tout voir") { router.push(.generations) }
                .padding(.bottom, 10)

            categoryTabs(allGens: allGens)
                .padding(.bottom, 12)
                .background(
                    GeometryReader { geo in
                        Color.clear.preference(key: TabsPinnedKey.self, value: geo.frame(in: .global).minY <= 0)
                    }
                )

            if filtered.isEmpty {
                EmptyStateView(
                    icon: "sparkles",
                    title: selectedCategory == .all ? "Aucune création" : "Rien dans \(selectedCategory.rawValue)",
                    message: selectedCategory == .all ? "Générez une image, vidéo ou texte pour la voir ici." : "Essayez une autre catégorie.",
                    ctaTitle: "Ouvrir le Studio"
                ) { router.select(.studio) }
                .padding(.horizontal, MSSpacing.gutter)
            } else {
                let imageGens = filtered.filter { $0.kind != .copy }
                let textGens = filtered.filter { $0.kind == .copy }

                if !imageGens.isEmpty {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                        ForEach(imageGens) { gen in
                            galleryCard(gen)
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }

                if !textGens.isEmpty {
                    VStack(spacing: 8) {
                        ForEach(textGens) { gen in
                            GenerationRow(generation: gen) {
                                router.push(routeForGeneration(gen))
                            }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.top, imageGens.isEmpty ? 0 : 8)
                }
            }
        }
    }

    private func categoryTabs(allGens: [Generation]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(GalleryCategory.allCases) { cat in
                    let count = allGens.filter { cat.matches($0) }.count
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) { selectedCategory = cat }
                    } label: {
                        HStack(spacing: 4) {
                            Text(cat.rawValue).font(.system(size: 13, weight: selectedCategory == cat ? .semibold : .medium))
                            if count > 0 {
                                Text("\(count)").font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(selectedCategory == cat ? MSColor.bg : MSColor.text2)
                                    .padding(.horizontal, 5)
                                    .padding(.vertical, 1)
                                    .background(selectedCategory == cat ? MSColor.text.opacity(0.3) : MSColor.elevated, in: Capsule())
                            }
                        }
                        .foregroundStyle(selectedCategory == cat ? MSColor.bg : MSColor.text)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 7)
                        .background(selectedCategory == cat ? MSColor.accent : MSColor.card, in: Capsule())
                        .overlay(selectedCategory == cat ? nil : Capsule().strokeBorder(MSColor.border, lineWidth: 1))
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private func galleryCard(_ gen: Generation) -> some View {
        Button {
            MSHaptic.tap()
            router.push(routeForGeneration(gen))
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                if let thumb = gen.thumbnails.first {
                    RemoteImage(url: thumb, cornerRadius: 0)
                        .aspectRatio(gen.kind == .video ? 9.0/16.0 : 1, contentMode: .fill)
                        .frame(maxWidth: .infinity)
                        .clipped()
                        .overlay(alignment: .bottomLeading) {
                            if gen.kind == .video {
                                Image(systemName: "play.fill")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 24, height: 24)
                                    .background(.black.opacity(0.5), in: Circle())
                                    .padding(6)
                            }
                        }
                } else {
                    RoundedRectangle(cornerRadius: 0).fill(MSColor.elevated)
                        .aspectRatio(1, contentMode: .fill)
                        .overlay(Image(systemName: gen.kind.icon).foregroundStyle(MSColor.text2))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(gen.prompt).font(.system(size: 11)).foregroundStyle(MSColor.text).lineLimit(2)
                    Text("\(gen.kind.title) · \(gen.createdAt.relativeString)").font(.system(size: 10)).foregroundStyle(MSColor.text2)
                }
                .padding(8)
            }
            .background(MSColor.card)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }

    private func routeForGeneration(_ g: Generation) -> AppRoute {
        switch g.kind {
        case .image: return .imageGenerator
        case .video: return .videoGenerator
        case .copy: return .copywriter
        case .ad: return .adCreator
        }
    }

    // MARK: - Networking

    private func fetchTrending() async {
        guard let url = URL(string: SokoziaConfig.siteURL.absoluteString + "/api/community?kind=video") else { return }
        do {
            var req = URLRequest(url: url)
            req.timeoutInterval = 10
            let (data, _) = try await URLSession.shared.data(for: req)
            struct Resp: Decodable { var posts: [CommunityPost]? }
            let resp = try JSONDecoder().decode(Resp.self, from: data)
            await MainActor.run { trendingPosts = resp.posts ?? []; loadingTrending = false }
        } catch {
            await MainActor.run { loadingTrending = false }
        }
    }
}

private struct TabsPinnedKey: PreferenceKey {
    static var defaultValue = false
    static func reduce(value: inout Bool, nextValue: () -> Bool) { value = value || nextValue() }
}

// MARK: - Trending video card

private struct TrendingVideoCard: View {
    var post: CommunityPost

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                if let posterURL = post.poster {
                    RemoteImage(url: posterURL, cornerRadius: 0)
                } else {
                    Color.black
                }
                Image(systemName: "play.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 32, height: 32)
                    .background(.black.opacity(0.4), in: Circle())
            }
            .aspectRatio(9.0/16.0, contentMode: .fill)
            .frame(width: 130)
            .clipped()

            VStack(alignment: .leading, spacing: 2) {
                Text(post.prompt).font(.system(size: 11)).foregroundStyle(.white).lineLimit(2)
                Text(post.author).font(.system(size: 10)).foregroundStyle(.white.opacity(0.5))
            }
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.black.opacity(0.7))
        }
        .frame(width: 130)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }
}

// MARK: - Community video card (vertical grid)

private struct CommunityVideoCard: View {
    var post: CommunityPost

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                if let posterURL = post.poster {
                    RemoteImage(url: posterURL, cornerRadius: 0)
                } else {
                    Color.black
                }
                Image(systemName: "play.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 32, height: 32)
                    .background(.black.opacity(0.4), in: Circle())
            }
            .aspectRatio(9.0/16.0, contentMode: .fill)
            .frame(maxWidth: .infinity)
            .clipped()

            VStack(alignment: .leading, spacing: 3) {
                Text(post.prompt).font(.system(size: 12)).foregroundStyle(MSColor.text).lineLimit(2)
                HStack(spacing: 4) {
                    Circle().fill(MSColor.elevated).frame(width: 16, height: 16)
                        .overlay(Text(String(post.author.prefix(1))).font(.system(size: 8, weight: .bold)).foregroundStyle(MSColor.highlight))
                    Text(post.author).font(.system(size: 10)).foregroundStyle(MSColor.muted)
                }
            }
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(MSColor.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
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
                    Text("\(store.assets(in: project.id).count) visuels · \(project.updatedAt.relativeString)").msCaption()
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
