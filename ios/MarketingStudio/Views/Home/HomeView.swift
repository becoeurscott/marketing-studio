import SwiftUI

/// Home: greeting, quick actions, upcoming promo moments (Tabaski, Noël…), real examples for new
/// accounts, then the user's projects and creations.
struct HomeView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

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
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 28) {
                brandMark
                hero
                quickActions
                promoMoments
                if store.assets.count < 4 { examples }
                stats
                recentProjects
                continueCreating
                templatesRow
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
            Text("Sokozia").font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(MSColor.text2)
        }
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, -12)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(greeting).msTitle(30)
                Text("Qu'allons-nous créer aujourd'hui ?").msBody(16)
            }
            MSButton(title: "Créer quelque chose", icon: "sparkles") {
                router.select(.studio)
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var stats: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            StatTile(label: "Projets", value: "\(store.activeProjects.count)", icon: "folder") { router.select(.projects) }
            StatTile(label: "Visuels", value: "\(store.assets.count)", icon: "photo.on.rectangle") { router.select(.assets) }
            StatTile(label: "Campagnes", value: "\(store.campaigns.count)", icon: "flag") { router.push(.campaigns) }
            StatTile(label: "Crédits", value: store.credits.formatted(), icon: "bolt", tint: MSColor.highlight) { router.push(.credits) }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var recentProjects: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Projets récents", actionTitle: "Tout") { router.select(.projects) }
            if store.activeProjects.isEmpty {
                EmptyStateView(icon: "folder.badge.plus", title: "Aucun projet pour l'instant", message: "Créez un projet pour organiser vos visuels et campagnes.", ctaTitle: "Nouveau projet") {
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
            SectionHeader(title: "Continuer à créer", subtitle: "Reprenez là où vous en étiez", actionTitle: "Historique") { router.push(.generations) }
            if gens.isEmpty {
                EmptyStateView(icon: "sparkles", title: "Rien en cours", message: "Générez une image, une vidéo ou un texte et il apparaîtra ici.", ctaTitle: "Ouvrir le Studio") { router.select(.studio) }
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
            SectionHeader(title: "Modèles", actionTitle: "Parcourir") { router.push(.templates) }
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

    private var quickActions: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            quickAction("Photo produit", "Votre produit dans un beau décor", icon: "camera.aperture") { router.push(.productShoot) }
            quickAction("Vidéo UGC", "Un créateur présente votre produit", icon: "person.wave.2") { router.push(.ugcCreator) }
            quickAction("Statuts WhatsApp", "5 statuts pour la semaine", icon: "message") { router.push(.copywriter) }
            quickAction("Pub avec prix", "Visuels + textes en \(Market.currencies[store.country.currency]?.symbol ?? "FCFA")", icon: "megaphone") { router.push(.adCreator) }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private func quickAction(_ title: String, _ subtitle: String, icon: String, action: @escaping () -> Void) -> some View {
        Button { MSHaptic.tap(); action() } label: {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: icon).font(.system(size: 15, weight: .semibold)).foregroundStyle(MSColor.highlight)
                    .frame(width: 34, height: 34).background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                Text(title).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                Text(subtitle).msCaption().lineLimit(2).multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, minHeight: 118, alignment: .topLeading)
            .padding(12)
            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }

    /// Local promo calendar: each moment opens a matching template.
    private var promoMoments: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Temps forts à préparer")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Market.upcomingMoments().prefix(4), id: \.moment.id) { item in
                        let template = item.moment.templateIds.first.flatMap { store.template($0) }
                        Button {
                            MSHaptic.tap()
                            if let template { router.push(.templateDetail(id: template.id)) } else { router.push(.templates) }
                        } label: {
                            HStack(spacing: 10) {
                                RemoteImage(url: template?.thumbnailURL, cornerRadius: 10).frame(width: 56, height: 70)
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(item.moment.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                                    Text(item.daysLeft == 0 ? "Aujourd'hui" : "Dans \(item.daysLeft) jours").font(MSFont.caption(12)).foregroundStyle(MSColor.highlight)
                                    Text(item.moment.pitch).msCaption().lineLimit(2).multilineTextAlignment(.leading)
                                }
                                .frame(width: 180, alignment: .leading)
                            }
                            .padding(10)
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

    /// Real results made with Sokozia, so a new account sees what it can get.
    private var examples: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Exemples faits avec Sokozia", actionTitle: "Créateurs") { router.push(.creators) }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Array(Catalog.creators.filter(\.featured).prefix(2))) { c in
                        Button { store.pendingCreatorId = c.id; router.push(.ugcCreator) } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                CreatorIntroView(creator: c).frame(width: 120, height: 190)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                Text("UGC · \(c.name)").font(MSFont.caption(12)).foregroundStyle(MSColor.text)
                            }
                        }
                        .buttonStyle(MSPressStyle())
                    }
                    ForEach(Catalog.styles.prefix(6)) { st in
                        Button { router.push(.productShoot) } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                RemoteImage(url: st.imageURL, cornerRadius: 12).frame(width: 120, height: 190)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                Text("\(st.name) · \(st.product)").font(MSFont.caption(12)).foregroundStyle(MSColor.text).lineLimit(1).frame(width: 120, alignment: .leading)
                            }
                        }
                        .buttonStyle(MSPressStyle())
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private var trendingFormats: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Formats tendance")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(Array(Catalog.trendingFormats.enumerated()), id: \.offset) { _, f in
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
            SectionHeader(title: "Visuels récents", actionTitle: "Bibliothèque") { router.select(.assets) }
            let items = store.recentAssets.filter { $0.kind == .image || $0.kind == .video }.prefix(6)
            if items.isEmpty {
                EmptyStateView(icon: "photo.on.rectangle", title: "Aucun visuel pour l'instant", message: "Vos fichiers générés et importés sont rangés ici.", ctaTitle: "Importer un produit") { router.present(.uploadProduct) }
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
