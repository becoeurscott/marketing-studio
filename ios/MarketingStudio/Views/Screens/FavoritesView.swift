import SwiftUI

/// SPEC §34: saved assets, templates, prompts and creators.
struct FavoritesView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var section = "All"
    private static let sections = ["All"] + FavoriteKind.allCases.map { $0.title }

    private var assets: [Asset] { store.favoriteIds(.asset).compactMap { store.asset($0) } }
    private var templates: [Template] { store.favoriteIds(.template).compactMap { store.template($0) } }
    private var prompts: [Generation] { store.favoriteIds(.prompt).compactMap { store.generation($0) } }
    private var creators: [Creator] { store.favoriteIds(.creator).compactMap { store.creator($0) } }
    private var total: Int { assets.count + templates.count + prompts.count + creators.count }

    private func shows(_ k: FavoriteKind) -> Bool { section == "All" || section == k.title }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Favorites").msTitle(30)
                    Text("\(total) saved item\(total == 1 ? "" : "s")").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)
                ChipRow(options: Self.sections, selection: $section)

                if total == 0 || (section != "All" && sectionCount == 0) {
                    EmptyStateView(
                        icon: "heart",
                        title: section == "All" ? "Nothing saved yet" : "No saved \(section.lowercased())",
                        message: "Tap the heart on any asset, template, prompt or creator to keep it here for quick access.",
                        ctaTitle: "Browse \(section == "All" || section == "Assets" ? "assets" : section.lowercased())",
                        ctaIcon: "arrow.right"
                    ) {
                        switch section {
                        case "Templates": router.push(.templates)
                        case "Prompts": router.push(.generations)
                        case "Creators": router.push(.creators)
                        default: router.push(.assets)
                        }
                    }
                } else {
                    if shows(.asset), !assets.isEmpty { assetsSection }
                    if shows(.template), !templates.isEmpty { templatesSection }
                    if shows(.prompt), !prompts.isEmpty { promptsSection }
                    if shows(.creator), !creators.isEmpty { creatorsSection }
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
            .animation(MSAnimation.gentle, value: section)
        }
        .msScreen()
        .navigationTitle("Favorites")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
    }

    private var sectionCount: Int {
        switch section {
        case "Assets": return assets.count
        case "Templates": return templates.count
        case "Prompts": return prompts.count
        case "Creators": return creators.count
        default: return total
        }
    }

    private var assetsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Assets", subtitle: "\(assets.count)", actionTitle: "Library") { router.push(.assets) }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                ForEach(assets) { a in
                    AssetCell(asset: a) { router.push(.assetDetail(id: a.id)) }
                        .contextMenu { AssetActionsMenu(asset: a) }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var templatesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Templates", subtitle: "\(templates.count)", actionTitle: "All") { router.push(.templates) }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(templates) { t in
                        TemplateCardCompact(template: t) { router.push(.templateDetail(id: t.id)) }
                            .contextMenu {
                                Button { store.toggleFavorite(.template, t.id) } label: { Label("Remove from favorites", systemImage: "heart.slash") }
                            }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
            }
        }
    }

    private var promptsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Prompts", subtitle: "\(prompts.count)", actionTitle: "History") { router.push(.generations) }
            VStack(spacing: 8) {
                ForEach(prompts) { g in
                    MSCard(padding: 12, action: { router.push(.generations) }) {
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: g.kind.icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
                                .frame(width: 34, height: 34).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                            VStack(alignment: .leading, spacing: 4) {
                                Text(g.prompt).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(3).multilineTextAlignment(.leading)
                                Text("\(g.kind.title) · \(g.model)").msCaption()
                            }
                            Spacer()
                            Button {
                                UIPasteboard.general.string = g.prompt
                                router.toast("Prompt copied", style: .success, icon: "doc.on.doc")
                            } label: { Image(systemName: "doc.on.doc").font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2) }
                        }
                    }
                    .contextMenu {
                        Button { store.toggleFavorite(.prompt, g.id) } label: { Label("Remove from favorites", systemImage: "heart.slash") }
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var creatorsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Creators", subtitle: "\(creators.count)", actionTitle: "All") { router.push(.creators) }
            VStack(spacing: 8) {
                ForEach(creators) { c in
                    MSCard(padding: 12, action: { router.push(.ugcCreator) }) {
                        HStack(spacing: 12) {
                            AvatarView(url: c.avatarURL, name: c.name, size: 46)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(c.name).font(MSFont.control(15)).foregroundStyle(MSColor.text)
                                Text("\(c.age) · \(c.style) · \(c.languages.joined(separator: ", "))").msCaption().lineLimit(1)
                            }
                            Spacer()
                            Button { store.toggleFavorite(.creator, c.id) } label: {
                                Image(systemName: "heart.fill").font(.system(size: 14, weight: .semibold)).foregroundStyle(MSColor.highlight)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }
}
