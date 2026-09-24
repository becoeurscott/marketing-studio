import SwiftUI

/// SPEC §12. Selected result large, 4-thumb strip, per-result actions.
/// Shared by the Studio canvas (compact) and the Image Generator screen.
struct ImageResultsView: View {
    @ObservedObject var session: ImageGenSession
    /// Compact fits inside the Studio canvas; otherwise it lays out for a scrolling screen.
    var compact: Bool = false
    /// Canvas overlay: the Studio draws the selected image full-bleed itself, so only the thumb strip + actions render.
    var canvasOverlay: Bool = false
    var onRegenerate: () -> Void

    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @State private var fullscreen: FullscreenImageItem?
    @State private var showEditor = false
    @State private var showCampaignPicker = false

    private var aspect: CGFloat { StudioOptions.aspect(session.ratio) }

    var body: some View {
        VStack(spacing: canvasOverlay ? 8 : 10) {
            if !canvasOverlay { hero }
            thumbStrip
            actions
        }
        .fullScreenCover(item: $fullscreen) { item in
            FullscreenImageViewer(url: item.url, aspect: item.aspect)
        }
        .fullScreenCover(isPresented: $showEditor) {
            if let r = session.selected {
                ImageEditorView(imageURL: r.url, ratio: session.ratio) { tool in
                    session.applyEdit(tool: tool, store: store)
                    router.toast("\(tool) applied", style: .success, icon: "wand.and.stars")
                }
            }
        }
        .msSheet(isPresented: $showCampaignPicker, detents: [.medium]) {
            if let r = session.selected {
                StudioUseInCampaignSheet(assetId: r.assetId)
            }
        }
    }

    // MARK: Hero

    @ViewBuilder
    private var hero: some View {
        if let r = session.selected {
            ZStack(alignment: .topLeading) {
                if compact {
                    // The badge rides on the fitted image so it never floats in the canvas gutter.
                    StudioZoomableImage(url: r.url, aspect: aspect, badge: (compactBadge(r), r.upscaled ? "arrow.up.left.and.arrow.down.right" : "sparkles")) {
                        fullscreen = FullscreenImageItem(url: r.url, aspect: aspect)
                    }
                } else {
                    RemoteImage(url: r.url, contentMode: .fill, cornerRadius: MSRadius.lg)
                        .aspectRatio(aspect, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .frame(maxHeight: 460)
                        .onTapGesture { fullscreen = FullscreenImageItem(url: r.url, aspect: aspect) }
                    HStack(spacing: 6) {
                        MSBadge(text: "\(session.style)", tone: .neutral)
                        MSBadge(text: session.ratio, tone: .neutral)
                        if r.upscaled { MSBadge(text: "2×", tone: .accent, icon: "arrow.up.left.and.arrow.down.right") }
                    }
                    .padding(10)
                }
            }
            .frame(maxWidth: .infinity)
            .id(r.url)
        }
    }

    private func compactBadge(_ r: ImageResult) -> String {
        var parts = [session.style, session.ratio]
        if r.upscaled { parts.append("2×") }
        return parts.joined(separator: " · ")
    }

    // MARK: Thumbs

    private var thumbStrip: some View {
        HStack(spacing: 8) {
            if canvasOverlay { Spacer(minLength: 0) }
            ForEach(Array(session.results.enumerated()), id: \.element.id) { i, r in
                let selected = r.id == session.selected?.id
                Button {
                    MSHaptic.tap()
                    withAnimation(MSAnimation.snappy) { session.selectedId = r.id }
                } label: {
                    RemoteImage(url: r.url, contentMode: .fill, cornerRadius: MSRadius.sm)
                        .aspectRatio(1, contentMode: .fill)
                        .frame(height: canvasOverlay ? 52 : (compact ? 56 : 72))
                        .frame(maxWidth: canvasOverlay ? 52 : .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.sm, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: MSRadius.sm, style: .continuous)
                                .strokeBorder(selected ? MSColor.accent : MSColor.border, lineWidth: selected ? 2 : 1)
                        )
                        .overlay(alignment: .bottomLeading) {
                            Text("\(i + 1)")
                                .font(MSFont.caption(10))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 5).padding(.vertical, 2)
                                .background(.black.opacity(0.55), in: Capsule())
                                .padding(4)
                        }
                        .overlay(alignment: .topTrailing) {
                            if store.isFavorite(.asset, r.assetId) {
                                Image(systemName: "heart.fill").font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(MSColor.danger).padding(5)
                            }
                        }
                        .opacity(selected ? 1 : 0.75)
                }
                .buttonStyle(.plain)
            }
            if canvasOverlay { Spacer(minLength: 0) }
        }
    }

    // MARK: Actions

    private var actions: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                action("Download", "arrow.down.to.line") {
                    router.toast("Saved to Photos", style: .success, icon: "checkmark.circle.fill")
                }
                let fav = session.selected.map { store.isFavorite(.asset, $0.assetId) } ?? false
                action(fav ? "Favorited" : "Favorite", fav ? "heart.fill" : "heart", tint: fav ? MSColor.danger : nil) {
                    guard let r = session.selected else { return }
                    store.toggleFavorite(.asset, r.assetId)
                    router.toast(fav ? "Removed from favorites" : "Added to favorites", style: .info, icon: "heart")
                }
                action("Edit", "slider.horizontal.3") { showEditor = true }
                action(session.busyAction == "upscale" ? "Upscaling" : "Upscale", "arrow.up.left.and.arrow.down.right", loading: session.busyAction == "upscale") {
                    Task { await session.upscaleSelected(store: store, router: router) }
                }
                action("Regenerate", "arrow.clockwise") { onRegenerate() }
                action("Use in Campaign", "flag") { showCampaignPicker = true }
            }
            .padding(.horizontal, 2)
        }
    }

    private func action(_ title: String, _ icon: String, tint: Color? = nil, loading: Bool = false, run: @escaping () -> Void) -> some View {
        Button {
            guard !loading else { return }
            MSHaptic.tap()
            run()
        } label: {
            HStack(spacing: 5) {
                if loading {
                    ProgressView().tint(MSColor.text).scaleEffect(0.6).frame(width: 12, height: 12)
                } else {
                    Image(systemName: icon).font(.system(size: 12, weight: .semibold))
                }
                Text(title).font(MSFont.control(12))
            }
            .foregroundStyle(tint ?? MSColor.text)
            .padding(.horizontal, 11)
            .frame(height: 32)
            .background(MSColor.card, in: Capsule())
            .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}

// MARK: - Use in campaign picker

struct StudioUseInCampaignSheet: View {
    var assetId: String
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        BottomSheetContainer(title: "Use in campaign", subtitle: "Add this visual to a campaign's asset set.") {
            if store.campaigns.isEmpty {
                EmptyStateView(icon: "flag", title: "No campaigns yet", message: "Build a campaign and the asset will be waiting for you.", ctaTitle: "Create campaign") {
                    dismiss()
                    router.push(.campaignBuilder)
                }
            } else {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(store.campaigns) { c in
                            let already = c.assetIds.contains(assetId)
                            Button {
                                MSHaptic.success()
                                store.addAssets([assetId], toCampaign: c.id)
                                router.toast("Added to \(c.name)", style: .success, icon: "flag.fill")
                                dismiss()
                            } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: c.objective.icon)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(MSColor.highlight)
                                        .frame(width: 36, height: 36)
                                        .background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(c.name).msHeadline(15).lineLimit(1)
                                        Text("\(c.assetIds.count) assets · \(c.platforms.map { $0.title }.joined(separator: ", "))").msCaption().lineLimit(1)
                                    }
                                    Spacer()
                                    if already {
                                        MSBadge(text: "Added", tone: .success, icon: "checkmark")
                                    } else {
                                        Image(systemName: "plus.circle").foregroundStyle(MSColor.text2)
                                    }
                                }
                                .msCard(padding: 12)
                            }
                            .buttonStyle(MSPressStyle())
                            .disabled(already)
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.bottom, 24)
                }
            }
        }
    }
}
