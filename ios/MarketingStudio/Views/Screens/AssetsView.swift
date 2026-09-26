import SwiftUI

/// SPEC §26: asset library with type tabs, filters, search, sort, favorites, context actions and multi-select export.
struct AssetsView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var typeTab = "All"
    @State private var query = ""
    @State private var sort: SortOrder = .newest
    @State private var dateFilter: DateFilter = .any
    @State private var projectFilter: String? = nil   // project id, "none" for unassigned
    @State private var favoritesOnly = false
    @State private var showFilters = false

    @State private var selecting = false
    @State private var selected: Set<String> = []

    @State private var renaming: Asset? = nil
    @State private var moving: Asset? = nil
    @State private var deleting: Asset? = nil

    enum SortOrder: String, CaseIterable, Identifiable {
        case newest = "Newest", oldest = "Oldest", nameAZ = "Name A–Z", favoritesFirst = "Favorites first"
        var id: String { rawValue }
        var label: String {
            switch self { case .newest: return "Plus récentes"; case .oldest: return "Plus anciennes"; case .nameAZ: return "Nom A–Z"; case .favoritesFirst: return "Favoris d'abord" }
        }
    }
    enum DateFilter: String, CaseIterable, Identifiable {
        case any = "Any time", week = "Last 7 days", month = "Last 30 days", quarter = "Last 90 days"
        var id: String { rawValue }
        var label: String {
            switch self { case .any: return "Toutes dates"; case .week: return "7 derniers jours"; case .month: return "30 derniers jours"; case .quarter: return "90 derniers jours" }
        }
        var days: Double? {
            switch self { case .any: return nil; case .week: return 7; case .month: return 30; case .quarter: return 90 }
        }
    }

    private static let typeTabs = ["All"] + AssetKind.allCases.map { $0.title }

    private var activeFilterCount: Int {
        (dateFilter != .any ? 1 : 0) + (projectFilter != nil ? 1 : 0) + (favoritesOnly ? 1 : 0)
    }

    private var filtered: [Asset] {
        var list = store.assets
        if typeTab != "All", let kind = AssetKind.allCases.first(where: { $0.title == typeTab }) { list = list.filter { $0.kind == kind } }
        if let days = dateFilter.days { list = list.filter { $0.createdAt >= .daysAgo(days) } }
        if let pf = projectFilter { list = list.filter { pf == "none" ? $0.projectId == nil : $0.projectId == pf } }
        if favoritesOnly { list = list.filter { $0.favorite } }
        if !query.isEmpty {
            list = list.filter { $0.name.localizedCaseInsensitiveContains(query) || $0.tags.contains { $0.localizedCaseInsensitiveContains(query) } }
        }
        switch sort {
        case .newest: list.sort { $0.createdAt > $1.createdAt }
        case .oldest: list.sort { $0.createdAt < $1.createdAt }
        case .nameAZ: list.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        case .favoritesFirst: list.sort { ($0.favorite ? 0 : 1, $1.createdAt) < ($1.favorite ? 0 : 1, $0.createdAt) }
        }
        return list
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Ressources").msTitle(30)
                    Text("\(store.assets.count) fichiers · \(store.assets.filter { $0.favorite }.count) favoris").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 8) {
                    SearchBar(placeholder: "Rechercher des ressources", text: $query)
                    Button { showFilters = true } label: {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "line.3.horizontal.decrease")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(activeFilterCount > 0 ? MSColor.highlight : MSColor.text)
                                .frame(width: 48, height: 48)
                                .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(activeFilterCount > 0 ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1))
                            if activeFilterCount > 0 {
                                Text("\(activeFilterCount)").font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                                    .frame(width: 15, height: 15).background(MSColor.accent, in: Circle()).offset(x: 4, y: -4)
                            }
                        }
                    }
                    .buttonStyle(MSPressStyle())
                }
                .padding(.horizontal, MSSpacing.gutter)

                ChipRow(options: Self.typeTabs, selection: $typeTab)

                HStack {
                    Text("\(filtered.count) résultat\(filtered.count == 1 ? "" : "s")").msCaption()
                    Spacer()
                    Menu {
                        Picker("Trier", selection: $sort) {
                            ForEach(SortOrder.allCases) { s in Text(s.label).tag(s) }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.up.arrow.down").font(.system(size: 11, weight: .bold))
                            Text(sort.label)
                        }
                        .font(MSFont.control(13)).foregroundStyle(MSColor.text2)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                if filtered.isEmpty {
                    emptyState
                } else {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                        ForEach(filtered) { a in
                            AssetCell(asset: a, selectable: selecting, selected: selected.contains(a.id)) {
                                if selecting {
                                    MSHaptic.tap()
                                    if selected.contains(a.id) { selected.remove(a.id) } else { selected.insert(a.id) }
                                } else {
                                    router.push(.assetDetail(id: a.id))
                                }
                            }
                            .contextMenu {
                                if !selecting {
                                    AssetActionsMenu(asset: a, onRename: { renaming = a }, onMove: { moving = a }, onDelete: { deleting = a })
                                }
                            }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .animation(MSAnimation.gentle, value: filtered.map { $0.id })
                }
            }
            .padding(.top, 4)
            .padding(.bottom, selecting ? 110 : 40)
        }
        .msScreen()
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button(selecting ? "Terminé" : "Sélectionner") {
                    withAnimation(MSAnimation.snappy) { selecting.toggle(); if !selecting { selected.removeAll() } }
                }
                .font(MSFont.control(14)).foregroundStyle(MSColor.text)
            }
            MSTopBarItems()
        }
        .overlay(alignment: .bottom) { if selecting { selectionBar } }
        .msSheet(isPresented: $showFilters, detents: [.medium, .large]) { filterSheet }
        .msSheet(item: $renaming, detents: [.medium]) { a in RenameAssetSheet(asset: a) { renaming = nil } }
        .msSheet(item: $moving, detents: [.medium, .large]) { a in MoveAssetSheet(asset: a) { moving = nil } }
        .confirmationDialog("Supprimer \(deleting?.name ?? "la ressource") ?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }), titleVisibility: .visible) {
            Button("Supprimer", role: .destructive) {
                if let d = deleting { store.deleteAsset(d.id); router.toast("Ressource supprimée", style: .warning) }
                deleting = nil
            }
        } message: { Text("Elle sera retirée de tous les projets et campagnes.") }
    }

    // MARK: Pieces

    private var emptyState: some View {
        let searching = !query.isEmpty || activeFilterCount > 0
        return EmptyStateView(
            icon: searching ? "magnifyingglass" : (typeTab == "All" ? "photo.on.rectangle.angled" : (AssetKind.allCases.first { $0.title == typeTab }?.icon ?? "photo")),
            title: searching ? "Aucun résultat" : (typeTab == "All" ? "Votre bibliothèque est vide" : "Aucun élément « \(typeTab.lowercased()) » pour l'instant"),
            message: searching ? "Essayez une autre recherche ou effacez les filtres." : "Tout ce que vous générez, importez ou exportez arrive ici.",
            ctaTitle: searching ? "Effacer les filtres" : "Générer quelque chose",
            ctaIcon: searching ? nil : "sparkles"
        ) {
            if searching { query = ""; dateFilter = .any; projectFilter = nil; favoritesOnly = false } else { router.push(.studio) }
        }
    }

    private var selectionBar: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(selected.count) sélectionné(s)").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                Button(selected.count == filtered.count ? "Tout désélectionner" : "Tout sélectionner") {
                    if selected.count == filtered.count { selected.removeAll() } else { selected = Set(filtered.map { $0.id }) }
                }
                .font(MSFont.control(12)).foregroundStyle(MSColor.highlight)
            }
            Spacer()
            MSIconButton(icon: "heart", size: 38) {
                for id in selected where !(store.asset(id)?.favorite ?? true) { store.toggleFavorite(.asset, id) }
                router.toast("Ajouté aux favoris", style: .success)
            }
            .disabled(selected.isEmpty)
            MSButton(title: "Exporter la sélection", icon: "square.and.arrow.up", size: .compact, isDisabled: selected.isEmpty, fullWidth: false) {
                router.present(.exportAssets(ids: Array(selected)))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .msElevated(padding: 0, radius: MSRadius.xl)
        .padding(.horizontal, MSSpacing.gutter)
        .padding(.bottom, 8)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private var filterSheet: some View {
        BottomSheetContainer(title: "Filtres", subtitle: "Affinez la bibliothèque par date, projet ou favoris.") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date").msCaption(color: MSColor.text2)
                        FlowLayout(spacing: 8) {
                            ForEach(DateFilter.allCases) { d in MSChip(title: d.label, selected: dateFilter == d) { dateFilter = d } }
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Projet").msCaption(color: MSColor.text2)
                        FlowLayout(spacing: 8) {
                            MSChip(title: "Tous", selected: projectFilter == nil) { projectFilter = nil }
                            MSChip(title: "Non assignés", selected: projectFilter == "none") { projectFilter = "none" }
                            ForEach(store.projects) { p in
                                MSChip(title: p.name, selected: projectFilter == p.id) { projectFilter = p.id }
                            }
                        }
                    }
                    Toggle(isOn: $favoritesOnly) {
                        HStack(spacing: 8) {
                            Image(systemName: "heart").foregroundStyle(MSColor.text2)
                            Text("Favoris uniquement").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        }
                    }
                    .tint(MSColor.accent)
                    .msCard(padding: 12)

                    HStack(spacing: 10) {
                        MSButton(title: "Réinitialiser", style: .secondary) { dateFilter = .any; projectFilter = nil; favoritesOnly = false }
                        MSButton(title: "Afficher \(filtered.count)", icon: "checkmark") { showFilters = false }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }
}
