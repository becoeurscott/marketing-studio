import SwiftUI

/// Large zoomable preview, metadata and every per-asset action from SPEC §26.
struct AssetDetailView: View {
    let assetId: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var renaming = false
    @State private var moving = false
    @State private var usingInCampaign = false
    @State private var confirmDelete = false
    @State private var fullscreen = false

    private var asset: Asset? { store.asset(assetId) }

    var body: some View {
        Group {
            if let asset {
                content(asset)
            } else {
                EmptyStateView(icon: "photo.badge.exclamationmark", title: "Ressource introuvable", message: "Elle a peut-être été supprimée.", ctaTitle: "Retour à la bibliothèque") { router.pop() }
                    .msScreen()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func content(_ a: Asset) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                Group {
                    if a.kind == .video, let v = a.videoURL, !v.isEmpty {
                        ResultVideoPlayer(url: v, poster: a.imageURL)
                    } else {
                        ZoomableImage(url: a.imageURL)
                    }
                }
                    .frame(height: 420)
                    .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                    .overlay(alignment: .topLeading) {
                        HStack(spacing: 6) {
                            MSBadge(text: a.kind.title, tone: .overlay, icon: a.kind.icon)
                            if let d = a.durationSeconds { MSBadge(text: "\(d)s", tone: .overlay) }
                        }
                        .padding(10)
                    }
                    .overlay(alignment: .topTrailing) {
                        MSIconButton(icon: "arrow.up.left.and.arrow.down.right", size: 32) { fullscreen = true }.padding(8)
                    }
                    .overlay(alignment: .center) {
                        if (a.kind == .video && a.videoURL == nil) || a.kind == .audio {
                            Image(systemName: "play.fill").font(.system(size: 22, weight: .bold)).foregroundStyle(.white)
                                .frame(width: 60, height: 60).background(.black.opacity(0.55), in: Circle())
                                .allowsHitTesting(false)
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 6) {
                    Text(a.name).msTitle(24)
                    Text("Ajoutée le \(a.createdAt.formatted(Date.FormatStyle(date: .abbreviated, time: .shortened).locale(Locale(identifier: "fr_FR"))))").msCaption()
                }
                .padding(.horizontal, MSSpacing.gutter)

                HStack(spacing: 10) {
                    ShareMediaButton(url: API.exportFiles(a).first?.absoluteString ?? a.imageURL, title: "Partager")
                    MSButton(title: a.favorite ? "En favori" : "Favori", icon: a.favorite ? "heart.fill" : "heart", style: .secondary, size: .compact) {
                        store.toggleFavorite(.asset, a.id)
                        router.toast(a.favorite ? "Retirée des favoris" : "Ajoutée aux favoris", style: .success)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Détails")
                    MSCard(padding: 0) {
                        VStack(spacing: 0) {
                            detailRow("Type", a.kind.title)
                            divider
                            detailRow("Dimensions", a.width > 0 ? "\(a.width) × \(a.height)" : "—")
                            divider
                            detailRow("Project", a.projectId.flatMap { store.project($0)?.name } ?? "Non assignée")
                            divider
                            detailRow("Tags", a.tags.isEmpty ? "—" : a.tags.joined(separator: ", "))
                            divider
                            detailRow("Utilisée dans", usedIn(a))
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "Actions")
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        actionTile("Utiliser dans une campagne", "flag") { usingInCampaign = true }
                        actionTile("Modifier", "slider.horizontal.3") {
                            router.toast("Éditeur d'image bientôt disponible", icon: "slider.horizontal.3")
                        }
                        actionTile("Renommer", "pencil") { renaming = true }
                        actionTile("Déplacer vers un projet", "folder") { moving = true }
                        actionTile("Exporter", "square.and.arrow.up") { router.present(.exportAssets(ids: [a.id])) }
                        actionTile("Supprimer", "trash", tint: MSColor.danger) { confirmDelete = true }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle(a.name)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    AssetActionsMenu(asset: a, onRename: { renaming = true }, onMove: { moving = true }, onDelete: { confirmDelete = true })
                } label: {
                    Image(systemName: "ellipsis.circle").font(.system(size: 16, weight: .semibold)).foregroundStyle(MSColor.text)
                }
            }
        }
        .msSheet(isPresented: $renaming, detents: [.medium]) { RenameAssetSheet(asset: a) { renaming = false } }
        .msSheet(isPresented: $moving, detents: [.medium, .large]) { MoveAssetSheet(asset: a) { moving = false } }
        .msSheet(isPresented: $usingInCampaign, detents: [.medium, .large]) { UseInCampaignSheet(assetIds: [a.id]) { usingInCampaign = false } }
        .fullScreenCover(isPresented: $fullscreen) {
            ZStack(alignment: .topTrailing) {
                MSColor.bg.ignoresSafeArea()
                ZoomableImage(url: a.imageURL, contentMode: .fit).ignoresSafeArea()
                MSIconButton(icon: "xmark", size: 36) { fullscreen = false }.padding(16)
            }
            .preferredColorScheme(.dark)
        }
        .confirmationDialog("Supprimer \(a.name) ?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Supprimer la ressource", role: .destructive) {
                store.deleteAsset(a.id)
                router.toast("Ressource supprimée", style: .warning)
                router.pop()
            }
        } message: { Text("Elle sera retirée de tous les projets et campagnes.") }
    }

    private var divider: some View { Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 14) }

    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(label).msCaption(color: MSColor.text2).frame(width: 90, alignment: .leading)
            Text(value).font(MSFont.control(13)).foregroundStyle(MSColor.text).multilineTextAlignment(.trailing).frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
    }

    private func usedIn(_ a: Asset) -> String {
        let names = store.campaigns.filter { $0.assetIds.contains(a.id) }.map { $0.name }
        return names.isEmpty ? "Aucune campagne" : names.joined(separator: ", ")
    }

    private func actionTile(_ title: String, _ icon: String, tint: Color = MSColor.text, action: @escaping () -> Void) -> some View {
        MSCard(padding: 12, action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(tint == MSColor.text ? MSColor.text2 : tint)
                    .frame(width: 30, height: 30).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                Text(title).font(MSFont.control(13)).foregroundStyle(tint).lineLimit(1)
                Spacer(minLength: 0)
            }
        }
    }
}

/// Pinch-to-zoom + drag image, double tap to reset.
struct ZoomableImage: View {
    var url: String
    var contentMode: ContentMode = .fill
    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        RemoteImage(url: url, contentMode: contentMode)
            .scaleEffect(scale)
            .offset(offset)
            .gesture(
                MagnificationGesture()
                    .onChanged { v in scale = max(1, min(5, lastScale * v)) }
                    .onEnded { _ in lastScale = scale; if scale <= 1.02 { reset() } }
                    .simultaneously(with: DragGesture()
                        .onChanged { v in
                            guard scale > 1 else { return }
                            offset = CGSize(width: lastOffset.width + v.translation.width, height: lastOffset.height + v.translation.height)
                        }
                        .onEnded { _ in lastOffset = offset })
            )
            .onTapGesture(count: 2) {
                withAnimation(MSAnimation.snappy) { if scale > 1 { reset() } else { scale = 2.2; lastScale = 2.2 } }
            }
            .clipped()
            .animation(MSAnimation.gentle, value: scale)
    }

    private func reset() { scale = 1; lastScale = 1; offset = .zero; lastOffset = .zero }
}
