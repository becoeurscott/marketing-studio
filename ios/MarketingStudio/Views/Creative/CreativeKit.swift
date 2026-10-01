import SwiftUI

// Shared building blocks for the creative tools (UGC, Product Shoot, Ads, Copywriter, Hooks).

/// Labelled field group used by every generator form.
struct CreativeSection<Content: View>: View {
    var title: String
    var subtitle: String? = nil
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(MSFont.control(13)).foregroundStyle(MSColor.text2)
                if let subtitle { Text(subtitle).msCaption() }
            }
            content()
        }
        .padding(.horizontal, MSSpacing.gutter)
    }
}

/// Horizontal product picker sourced from image/brand assets in the store.
struct ProductPicker: View {
    @EnvironmentObject private var store: AppStore
    @Binding var selectedId: String?
    var onUpload: (() -> Void)? = nil

    private var products: [Asset] {
        store.recentAssets.filter { $0.kind == .image || $0.kind == .brand }.prefix(12).map { $0 }
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                if let onUpload {
                    Button(action: onUpload) {
                        VStack(spacing: 6) {
                            Image(systemName: "plus").font(.system(size: 18, weight: .semibold)).foregroundStyle(MSColor.text)
                            Text("Importer").msCaption(color: MSColor.text2)
                        }
                        .frame(width: 84, height: 104)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
                    }
                    .buttonStyle(MSPressStyle())
                }
                ForEach(products) { asset in
                    let selected = asset.id == selectedId
                    Button {
                        MSHaptic.tap()
                        withAnimation(MSAnimation.snappy) { selectedId = selected ? nil : asset.id }
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            RemoteImage(url: asset.imageURL, cornerRadius: 10)
                                .frame(width: 84, height: 84)
                                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(selected ? MSColor.accent : .clear, lineWidth: 2))
                                .overlay(alignment: .topTrailing) {
                                    if selected {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundStyle(.white, MSColor.accent)
                                            .padding(5)
                                    }
                                }
                            Text(asset.name).msCaption(color: selected ? MSColor.text : MSColor.muted).lineLimit(1).frame(width: 84, alignment: .leading)
                        }
                    }
                    .buttonStyle(MSPressStyle())
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
        .padding(.horizontal, -MSSpacing.gutter)
    }
}

/// Aspect-ratio frame that mimics a platform placement (9:16 story/reel, 1:1 feed, 4:5 portrait, 16:9 landscape).
struct PlatformPreviewFrame<Content: View>: View {
    var ratio: CGFloat
    var label: String
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            content()
                .aspectRatio(ratio, contentMode: .fit)
                .clipShape(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
            Text(label).msCaption()
        }
    }
}

/// Pill row showing what a generation will cost against the current balance.
struct CreditCostRow: View {
    @EnvironmentObject private var store: AppStore
    var cost: Int
    var label: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "bolt.fill").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.highlight)
            Text(cost == 0 ? "Gratuit · \(label)" : "\(cost) crédits · \(label)").msCaption(color: MSColor.text2)
            Spacer()
            Text("Solde \(store.credits.formatted(.number.locale(Locale(identifier: "fr_FR"))))").msCaption(color: store.canAfford(cost) ? MSColor.muted : MSColor.danger)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }
}

/// Small pill action used under result cards (Copy / Save / Regenerate ...).
struct ResultAction: View {
    var title: String
    var icon: String
    var tint: Color = MSColor.text
    var action: () -> Void

    var body: some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 11, weight: .semibold))
                Text(title).font(MSFont.control(12))
            }
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(MSColor.elevated, in: Capsule())
            .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}

/// Full-screen-ish error state per SPEC §45, with an extra top-up path for insufficient credits.
struct CreativeErrorView: View {
    var error: Error
    var retry: () -> Void
    var back: () -> Void
    @EnvironmentObject private var router: Router

    private var isCredits: Bool {
        if case APIError.insufficientCredits = error { return true }
        return false
    }

    var body: some View {
        VStack(spacing: 12) {
            ErrorStateView(message: isCredits ? "Crédits insuffisants." : "Une erreur s'est produite.", retry: retry, back: back)
            Text(error.localizedDescription).msBody(13).multilineTextAlignment(.center).padding(.horizontal, MSSpacing.gutter)
            if isCredits {
                MSButton(title: "Recharger des crédits", icon: "bolt.fill", style: .secondary, size: .compact, fullWidth: false) {
                    router.present(.buyCredits)
                }
            }
        }
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .msCard()
        .padding(.horizontal, MSSpacing.gutter)
    }
}

/// Simple "Add to campaign" chooser used by Save-to-campaign actions.
struct CampaignPickerSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var assetIds: [String]
    var onDone: () -> Void

    var body: some View {
        BottomSheetContainer(title: "Utiliser dans une campagne", subtitle: "Associer \(assetIds.count) ressource\(assetIds.count == 1 ? "" : "s") à une campagne") {
            if store.campaigns.isEmpty {
                EmptyStateView(icon: "flag", title: "Aucune campagne pour l'instant", message: "Créez d'abord une campagne, puis associez-y vos visuels.", ctaTitle: "Créateur de campagne") {
                    onDone()
                    router.push(.campaignBuilder)
                }
            } else {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(store.campaigns) { c in
                            MSCard(padding: 12) {
                                HStack(spacing: 12) {
                                    Image(systemName: c.objective.icon).foregroundStyle(MSColor.highlight).frame(width: 30)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(c.name).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                                        Text("\(c.assetIds.count) ressources · \(c.platforms.map { $0.title }.joined(separator: ", "))").msCaption().lineLimit(1)
                                    }
                                    Spacer()
                                    MSBadge(text: c.status.title, tone: MSBadge.tone(for: c.status))
                                }
                            }
                            .onTapGesture {
                                store.addAssets(assetIds, toCampaign: c.id)
                                MSHaptic.success()
                                router.toast("Ajouté à \(c.name)", style: .success)
                                onDone()
                            }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.bottom, 30)
                }
            }
        }
    }
}
