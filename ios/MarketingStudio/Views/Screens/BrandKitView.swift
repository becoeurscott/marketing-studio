import SwiftUI

/// SPEC §29 — Brand Kit: brand card, palette, fonts, assets, per-field edit, multiple brands.
struct BrandKitView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    @State private var editingField: BrandField?
    @State private var showPalette = false
    @State private var confirmDelete = false

    private var brand: Brand { store.brand }
    private var brandAssets: [Asset] { brand.assetIds.compactMap { store.asset($0) } }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Kit de marque").msTitle(30)
                    Text("Tout ce dont l'IA a besoin pour respecter votre marque.").msBody(14)
                }
                .padding(.horizontal, MSSpacing.gutter)

                if store.allBrands.count > 1 { brandSwitcher }

                brandCard.padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Couleurs", actionTitle: "Modifier") { showPalette = true }
                paletteRow

                SectionHeader(title: "Polices", actionTitle: "Modifier") { editingField = .fonts }
                fontsRow.padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Détails")
                detailsList.padding(.horizontal, MSSpacing.gutter)

                SectionHeader(title: "Ressources de marque", subtitle: "Logo principal, icône et images produit", actionTitle: "Bibliothèque") { router.push(.assets) }
                assetsRow

                SectionHeader(title: "Ton", actionTitle: "Modifier") { router.push(.brandVoice) }
                MSCard(action: { router.push(.brandVoice) }) {
                    HStack(spacing: 12) {
                        Image(systemName: "waveform.and.mic").font(.system(size: 16, weight: .semibold)).foregroundStyle(MSColor.highlight)
                            .frame(width: 36, height: 36).background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Ton \(brand.voice.tone)").msHeadline(15)
                            Text(brand.voice.writingStyle).msCaption().lineLimit(2)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)

                VStack(spacing: 10) {
                    MSButton(title: "Ajouter une autre marque", icon: "plus", style: .secondary) { router.present(.newBrand) }
                    MSButton(title: "Supprimer \(brand.name)", icon: "trash", style: .danger, isDisabled: store.allBrands.count == 1) { confirmDelete = true }
                    if store.allBrands.count == 1 {
                        Text("Vous devez avoir au moins un kit de marque.").msCaption()
                    }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.top, 8)
            }
            .padding(.top, 4)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Kit de marque")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(item: $editingField, detents: [.medium]) { field in BrandFieldEditSheet(field: field) }
        .msSheet(isPresented: $showPalette, detents: [.medium, .large]) { BrandPaletteSheet() }
        .confirmationDialog("Supprimer \(brand.name) ?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Supprimer la marque", role: .destructive) {
                let name = brand.name
                store.deleteBrand(brand.id)
                router.toast("\(name) supprimée", style: .warning)
            }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("Sa palette, ses polices et son ton seront supprimés. Les ressources restent dans votre bibliothèque.")
        }
    }

    // MARK: Pieces

    private var brandSwitcher: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(store.allBrands) { b in
                    MSChip(title: b.name, icon: b.id == brand.id ? "checkmark" : nil, selected: b.id == brand.id) {
                        withAnimation(MSAnimation.snappy) { store.setActiveBrand(b.id) }
                        if b.id != brand.id { router.toast("\(b.name) est maintenant active", style: .success) }
                    }
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var brandCard: some View {
        MSCard(padding: 0) {
            VStack(alignment: .leading, spacing: 0) {
                ZStack(alignment: .bottomLeading) {
                    LinearGradient(colors: brand.colors.prefix(3).map { Color(hexString: $0) } + [MSColor.elevated], startPoint: .topLeading, endPoint: .bottomTrailing)
                        .frame(height: 96)
                        .overlay(MSColor.bg.opacity(0.35))
                    HStack(alignment: .bottom, spacing: 12) {
                        RemoteImage(url: brand.logoURL, cornerRadius: 14)
                            .frame(width: 64, height: 64)
                            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(MSColor.borderStrong, lineWidth: 1))
                        MSBadge(text: "Active", tone: .success, icon: "checkmark")
                    }
                    .padding(14)
                    .offset(y: 26)
                }
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: MSRadius.lg, topTrailingRadius: MSRadius.lg))
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline) {
                        Button { editingField = .name } label: {
                            HStack(spacing: 6) {
                                Text(brand.name).msHeadline(22)
                                Image(systemName: "pencil").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted)
                            }
                        }
                        .buttonStyle(MSPressStyle())
                        Spacer()
                        MSBadge(text: brand.industry, tone: .accent)
                    }
                    Text(brand.description).msBody(14).lineSpacing(2)
                    if !brand.website.isEmpty {
                        HStack(spacing: 6) {
                            Image(systemName: "globe").font(.system(size: 12)).foregroundStyle(MSColor.muted)
                            Text(brand.website.replacingOccurrences(of: "https://", with: "")).msCaption(color: MSColor.text2)
                        }
                    }
                }
                .padding(16)
                .padding(.top, 22)
            }
        }
    }

    private var paletteRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(brand.colors, id: \.self) { hex in ColorSwatch(hex: hex, size: 56) }
                Button { showPalette = true } label: {
                    VStack(spacing: 6) {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [4]))
                            .frame(width: 56, height: 56)
                            .overlay(Image(systemName: "plus").foregroundStyle(MSColor.text2))
                        Text("Ajouter").msCaption()
                    }
                }
                .buttonStyle(MSPressStyle())
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var fontsRow: some View {
        HStack(spacing: 10) {
            ForEach(Array(brand.fonts.enumerated()), id: \.offset) { i, font in
                MSCard(padding: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Aa").font(.system(size: 26, weight: i == 0 ? .bold : .regular, design: i == 0 ? .default : .serif)).foregroundStyle(MSColor.text)
                        Text(font).font(MSFont.control(13)).foregroundStyle(MSColor.text).lineLimit(1)
                        Text(i == 0 ? "Titres" : "Texte").msCaption()
                    }
                }
            }
            if brand.fonts.isEmpty {
                MSCard(action: { editingField = .fonts }) { Text("Ajouter des polices").msBody(14) }
            }
        }
    }

    private var detailsList: some View {
        VStack(spacing: 0) {
            detailRow(.website, brand.website.isEmpty ? "Ajouter un site web" : brand.website, icon: "globe")
            divider
            detailRow(.industry, brand.industry, icon: "tag")
            divider
            detailRow(.audience, brand.audience, icon: "person.2")
            divider
            detailRow(.description, brand.description, icon: "text.alignleft")
        }
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }

    private var divider: some View { Rectangle().fill(MSColor.border).frame(height: 1).padding(.leading, 52) }

    private func detailRow(_ field: BrandField, _ value: String, icon: String) -> some View {
        Button { editingField = field } label: {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.text2)
                    .frame(width: 28, height: 28).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(field.title).msCaption()
                    Text(value).font(MSFont.body(14)).foregroundStyle(MSColor.text).lineLimit(2).multilineTextAlignment(.leading)
                }
                Spacer()
                Image(systemName: "pencil").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.muted)
            }
            .padding(.horizontal, 12).padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(MSPressStyle())
    }

    private var assetsRow: some View {
        Group {
            if brandAssets.isEmpty {
                EmptyStateView(icon: "seal", title: "Aucune ressource de marque", message: "Importez un logo, une icône et des images produit pour que les générations correspondent à votre marque.", ctaTitle: "Importer", ctaIcon: "square.and.arrow.up") {
                    router.present(.uploadProduct)
                }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(Array(brandAssets.enumerated()), id: \.element.id) { i, a in
                            Button { router.push(.assetDetail(id: a.id)) } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    RemoteImage(url: a.imageURL, cornerRadius: 12).frame(width: 120, height: 120)
                                    Text(i == 0 ? "Logo principal" : (i == 1 ? "Icône" : "Image produit")).font(MSFont.control(12)).foregroundStyle(MSColor.text)
                                    Text(a.name).msCaption().lineLimit(1)
                                }
                                .frame(width: 120, alignment: .leading)
                            }
                            .buttonStyle(MSPressStyle())
                        }
                        Button { router.present(.uploadProduct) } label: {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [4]))
                                .frame(width: 120, height: 120)
                                .overlay(VStack(spacing: 6) {
                                    Image(systemName: "plus").font(.system(size: 18, weight: .semibold))
                                    Text("Importer").font(MSFont.control(12))
                                }.foregroundStyle(MSColor.text2))
                        }
                        .buttonStyle(MSPressStyle())
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                }
            }
        }
    }
}
