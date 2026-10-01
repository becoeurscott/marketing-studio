import SwiftUI

// MARK: - Grid cell

/// Library cell with favorite toggle, kind badge and optional selection state.
struct AssetCell: View {
    @EnvironmentObject private var store: AppStore
    var asset: Asset
    var selectable: Bool = false
    var selected: Bool = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Group {
                if asset.imageURL.isEmpty {
                    // Video without a poster (text-to-video).
                    RoundedRectangle(cornerRadius: 12, style: .continuous).fill(MSColor.elevated)
                        .overlay(Image(systemName: "play.rectangle.fill").font(.system(size: 26)).foregroundStyle(MSColor.highlight))
                } else {
                    RemoteImage(url: asset.imageURL, cornerRadius: 12)
                }
            }
                .aspectRatio(0.8, contentMode: .fit)
                .overlay(alignment: .bottomLeading) {
                    HStack(spacing: 4) {
                        Image(systemName: asset.kind.icon).font(.system(size: 9, weight: .bold))
                        if let d = asset.durationSeconds, asset.kind == .video || asset.kind == .audio {
                            Text("\(d)s").font(.system(size: 10, weight: .semibold))
                        }
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .frame(height: 20)
                    .background(.black.opacity(0.55), in: Capsule())
                    .padding(6)
                }
                .overlay(alignment: .topTrailing) {
                    if selectable {
                        Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(selected ? MSColor.accent : .white.opacity(0.85))
                            .background(Circle().fill(.black.opacity(0.35)).padding(2))
                            .padding(6)
                    } else {
                        Button {
                            MSHaptic.tap()
                            store.toggleFavorite(.asset, asset.id)
                        } label: {
                            Image(systemName: asset.favorite ? "heart.fill" : "heart")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(asset.favorite ? MSColor.highlight : .white)
                                .frame(width: 26, height: 26)
                                .background(.black.opacity(0.45), in: Circle())
                        }
                        .buttonStyle(.plain)
                        .padding(5)
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(selected ? MSColor.accent : .clear, lineWidth: 2)
                )
        }
        .buttonStyle(MSPressStyle())
    }
}

// MARK: - Context menu

/// Preview / Download / Rename / Move / Favorite / Delete. Rename and Move present sheets via `AssetSheetState`.
struct AssetActionsMenu: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var asset: Asset
    var onRename: (() -> Void)? = nil
    var onMove: (() -> Void)? = nil
    var onDelete: (() -> Void)? = nil

    var body: some View {
        Button { router.push(.assetDetail(id: asset.id)) } label: { Label("Aperçu", systemImage: "eye") }
        Button { router.toast("Téléchargement de \(asset.name)", style: .success, icon: "arrow.down.circle") } label: { Label("Télécharger", systemImage: "arrow.down.circle") }
        if let onRename { Button(action: onRename) { Label("Renommer", systemImage: "pencil") } }
        if let onMove { Button(action: onMove) { Label("Déplacer vers un projet", systemImage: "folder") } }
        Button { store.toggleFavorite(.asset, asset.id) } label: {
            Label(asset.favorite ? "Retirer des favoris" : "Ajouter aux favoris", systemImage: asset.favorite ? "heart.slash" : "heart")
        }
        Button { router.present(.exportAssets(ids: [asset.id])) } label: { Label("Exporter", systemImage: "square.and.arrow.up") }
        Button(role: .destructive) {
            if let onDelete { onDelete() } else {
                store.deleteAsset(asset.id)
                router.toast("Ressource supprimée", style: .warning)
            }
        } label: { Label("Supprimer", systemImage: "trash") }
    }
}

// MARK: - Rename sheet

struct RenameAssetSheet: View {
    var asset: Asset
    var onDone: () -> Void
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @State private var name = ""

    var body: some View {
        BottomSheetContainer(title: "Renommer la ressource") {
            VStack(spacing: 14) {
                MSTextField(label: "Nom", placeholder: "Nom de la ressource", text: $name, icon: "photo")
                Spacer(minLength: 0)
                MSButton(title: "Enregistrer", icon: "checkmark", isDisabled: name.trimmingCharacters(in: .whitespaces).isEmpty) {
                    store.renameAsset(asset.id, to: name.trimmingCharacters(in: .whitespaces))
                    router.toast("Renommé", style: .success)
                    onDone()
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 16)
        }
        .onAppear { name = asset.name }
    }
}

// MARK: - Move sheet

struct MoveAssetSheet: View {
    var asset: Asset
    var onDone: () -> Void
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var body: some View {
        BottomSheetContainer(title: "Déplacer vers un projet", subtitle: asset.name) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 8) {
                    projectRow(nil, name: "Aucun projet", thumb: nil)
                    ForEach(store.activeProjects) { p in
                        projectRow(p.id, name: p.name, thumb: p.thumbnailURL)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }

    private func projectRow(_ id: String?, name: String, thumb: String?) -> some View {
        let current = asset.projectId == id
        return MSCard(padding: 10, action: {
            store.moveAsset(asset.id, to: id)
            router.toast("Déplacé vers \(name)", style: .success)
            onDone()
        }) {
            HStack(spacing: 12) {
                if let thumb {
                    RemoteImage(url: thumb, cornerRadius: 8).frame(width: 40, height: 40)
                } else {
                    RoundedRectangle(cornerRadius: 8, style: .continuous).fill(MSColor.elevated).frame(width: 40, height: 40)
                        .overlay(Image(systemName: "tray").foregroundStyle(MSColor.muted).font(.system(size: 13)))
                }
                Text(name).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                Spacer()
                if current { Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.highlight) }
            }
        }
    }
}

// MARK: - Use in campaign

struct UseInCampaignSheet: View {
    var assetIds: [String]
    var onDone: () -> Void
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    var body: some View {
        BottomSheetContainer(title: "Utiliser dans une campagne", subtitle: "\(assetIds.count) ressource\(assetIds.count == 1 ? "" : "s")") {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 8) {
                    if store.campaigns.isEmpty {
                        EmptyStateView(icon: "flag", title: "Aucune campagne", message: "Créez d'abord une campagne, puis ajoutez-y des ressources.", ctaTitle: "Nouvelle campagne", ctaIcon: "plus") {
                            onDone()
                            router.push(.campaignBuilder)
                        }
                    }
                    ForEach(store.campaigns.sorted { $0.createdAt > $1.createdAt }) { c in
                        let already = assetIds.allSatisfy { c.assetIds.contains($0) }
                        MSCard(padding: 10, action: {
                            store.addAssets(assetIds, toCampaign: c.id)
                            MSHaptic.success()
                            router.toast("Ajouté à \(c.name)", style: .success)
                            onDone()
                        }) {
                            HStack(spacing: 12) {
                                Image(systemName: c.objective.icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
                                    .frame(width: 36, height: 36).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(c.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                                    Text("\(c.assetIds.count) ressources").msCaption()
                                }
                                Spacer()
                                if already { MSBadge(text: "Ajouté", tone: .success, icon: "checkmark") } else { MSBadge(text: c.status.title, tone: MSBadge.tone(for: c.status)) }
                            }
                        }
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 24)
            }
        }
    }
}

// MARK: - Picker

/// Pick one or many assets from the library (with a search box). `preferredIds` are listed first.
struct AssetPickerSheet: View {
    var title: String
    var preferredIds: [String] = []
    var multiple: Bool = true
    var initial: [String] = []
    var excluded: Set<String> = []
    var onPick: ([String]) -> Void

    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var selected: Set<String> = []

    private var ordered: [Asset] {
        let all = store.assets.filter { !excluded.contains($0.id) && ($0.kind == .image || $0.kind == .video || $0.kind == .brand || $0.kind == .logo) }
        let pref = preferredIds.compactMap { id in all.first { $0.id == id } }
        let rest = all.filter { !preferredIds.contains($0.id) }.sorted { $0.createdAt > $1.createdAt }
        return (pref + rest).filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        BottomSheetContainer(title: title, subtitle: multiple ? "\(selected.count) sélectionné\(selected.count > 1 ? "s" : "")" : nil) {
            VStack(spacing: 12) {
                SearchBar(placeholder: "Rechercher des ressources", text: $query).padding(.horizontal, MSSpacing.gutter)
                ScrollView(showsIndicators: false) {
                    if ordered.isEmpty {
                        EmptyStateView(icon: "photo.on.rectangle", title: "Aucune ressource", message: "Aucun résultat pour cette recherche.")
                    } else {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                            ForEach(ordered) { a in
                                AssetCell(asset: a, selectable: true, selected: selected.contains(a.id)) {
                                    MSHaptic.tap()
                                    if multiple {
                                        if selected.contains(a.id) { selected.remove(a.id) } else { selected.insert(a.id) }
                                    } else {
                                        onPick([a.id])
                                        dismiss()
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, MSSpacing.gutter)
                        .padding(.bottom, 90)
                    }
                }
            }
            .overlay(alignment: .bottom) {
                if multiple {
                    MSButton(title: selected.isEmpty ? "Sélectionner des ressources" : "Ajouter \(selected.count)", icon: "checkmark", isDisabled: selected.isEmpty) {
                        onPick(Array(selected))
                        dismiss()
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.bottom, 12)
                    .background(LinearGradient(colors: [.clear, MSColor.surface], startPoint: .top, endPoint: .bottom).frame(height: 90).allowsHitTesting(false), alignment: .bottom)
                }
            }
        }
        .onAppear { selected = Set(initial) }
    }
}
