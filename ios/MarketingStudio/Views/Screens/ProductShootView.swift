import SwiftUI
import PhotosUI

/// AI product shoot: one product photo + a Sokozia style (or a setting) → 2–4 photos that keep
/// the product identical (Marketing Studio edit mode).
struct ProductShootView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    static let environments = ["Luxury bathroom", "Modern kitchen", "Beach", "Office", "Street", "Studio", "Restaurant", "Gym", "Car interior"]
    static let lightings = ["Natural", "Golden hour", "Studio", "Neon", "Softbox", "Dramatic"]
    static let cameras = ["Close-up", "Medium", "Wide", "Macro"]
    static let counts = [2, 3, 4]

    /// French display labels → English values sent to the generation API.
    static let environmentLabels: [(fr: String, en: String)] = [("Studio", "Studio"), ("Étal de marché", "African market stall"), ("Boutique", "Small shop counter"), ("Maquis", "Outdoor maquis restaurant table"), ("Cuisine", "Home kitchen"), ("Salon", "Modern African living room"), ("Rue", "Street"), ("Plage", "Beach")]
    static let lightingLabels: [(fr: String, en: String)] = [("Naturelle", "Natural"), ("Heure dorée", "Golden hour"), ("Studio", "Studio"), ("Néon", "Neon"), ("Softbox", "Softbox"), ("Dramatique", "Dramatic")]
    static let cameraLabels: [(fr: String, en: String)] = [("Gros plan", "Close-up"), ("Plan moyen", "Medium"), ("Plan large", "Wide"), ("Macro", "Macro")]
    private static func english(_ fr: String?, in table: [(fr: String, en: String)], default d: String) -> String {
        guard let fr else { return d }
        return table.first { $0.fr == fr }?.en ?? d
    }

    private enum Phase: Equatable { case idle, generating, done, failed }

    @State private var productId: String?
    @State private var environment: Set<String> = ["Studio"]
    @State private var lighting: Set<String> = ["Naturelle"]
    @State private var camera: Set<String> = ["Plan moyen"]
    @State private var count = 3
    @State private var styleId: String? = "studio-ocre"
    @State private var phase: Phase = .idle
    @State private var results: [GeneratedImage] = []
    @State private var selectedIds: Set<String> = []
    @State private var favoriteIds: Set<String> = []
    @State private var savedIds: [String: String] = [:]   // result id → asset id
    @State private var lastError: Error?
    @State private var uploadSheet = false
    @State private var campaignPicker = false
    @State private var campaignAssetIds: [String] = []

    private var product: Asset? { productId.flatMap { store.asset($0) } }
    private var cost: Int { AIModels.imageModel(nil).credits * count }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                uploadCard
                CreativeSection(title: "Style") { stylePicker }
                if styleId == nil {
                    CreativeSection(title: "Décor") { ChipGroup(options: Self.environmentLabels.map(\.fr), selection: $environment, allowDeselect: false) }
                }
                CreativeSection(title: "Éclairage") { ChipGroup(options: Self.lightingLabels.map(\.fr), selection: $lighting, allowDeselect: false) }
                CreativeSection(title: "Cadrage") { ChipGroup(options: Self.cameraLabels.map(\.fr), selection: $camera, allowDeselect: false) }
                CreativeSection(title: "Photos") {
                    HStack(spacing: 8) {
                        ForEach(Self.counts, id: \.self) { c in
                            MSChip(title: "\(c) photos", selected: count == c) { MSHaptic.tap(); withAnimation(MSAnimation.snappy) { count = c } }
                        }
                    }
                }
                CreditCostRow(cost: cost, label: "\(count) photos produit")
                MSButton(title: results.isEmpty ? "Lancer le shooting produit" : "Générer à nouveau", icon: "camera.aperture", isLoading: phase == .generating, isDisabled: productId == nil) { generate() }
                    .padding(.horizontal, MSSpacing.gutter)
                if productId == nil {
                    Text("Importez ou choisissez une photo produit pour commencer.").msCaption().frame(maxWidth: .infinity).padding(.top, -12)
                }
                resultsSection
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Shooting produit")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(isPresented: $uploadSheet, detents: [.large]) {
            ProductUploadSheet { asset in
                withAnimation(MSAnimation.snappy) { productId = asset.id }
                uploadSheet = false
            }
        }
        .msSheet(isPresented: $campaignPicker) {
            CampaignPickerSheet(assetIds: campaignAssetIds) { campaignPicker = false }
        }
    }

    // MARK: Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Shooting produit IA").msTitle(26)
            Text("Une seule photo suffit pour obtenir une série complète de photos produit en situation.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var uploadCard: some View {
        CreativeSection(title: "Photo produit", subtitle: "Importez une photo nette de votre produit") {
            Button { uploadSheet = true } label: {
                Group {
                    if let product {
                        HStack(spacing: 14) {
                            RemoteImage(url: product.imageURL, cornerRadius: 12).frame(width: 84, height: 84)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(product.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                                Text("\(product.width) × \(product.height) · \(product.tags.joined(separator: ", "))").msCaption().lineLimit(1)
                                Text("Touchez pour modifier").msCaption(color: MSColor.highlight)
                            }
                            Spacer()
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.success)
                        }
                    } else {
                        VStack(spacing: 10) {
                            Image(systemName: "photo.badge.plus").font(.system(size: 30, weight: .medium)).foregroundStyle(MSColor.highlight)
                            Text("Déposez l'image du produit ici").msHeadline(15)
                            Text("PNG ou JPG · idéalement sur fond transparent").msCaption()
                            HStack(spacing: 8) {
                                MSButton(title: "Importer un produit", icon: "square.and.arrow.up", style: .secondary, size: .compact, fullWidth: false) { uploadSheet = true }
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                    }
                }
                .padding(12)
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.borderStrong, style: StrokeStyle(lineWidth: 1, dash: product == nil ? [6, 5] : [])))
            }
            .buttonStyle(MSPressStyle())
        }
    }

    @ViewBuilder
    private var resultsSection: some View {
        switch phase {
        case .idle:
            EmptyView()
        case .generating:
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    ProgressView().tint(MSColor.accent)
                    Text("Création de votre visuel...").msHeadline(15)
                    Spacer()
                    Text("\(environment.first ?? "") · \(lighting.first ?? "")").msCaption()
                }
                SkeletonGrid(count: count, columns: 2, aspect: 0.8)
            }
            .padding(.horizontal, MSSpacing.gutter)
        case .failed:
            if let lastError { CreativeErrorView(error: lastError, retry: generate, back: { router.popToRoot() }) }
        case .done:
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(results.count) photos").msHeadline(16)
                        Text("\(environment.first ?? "") · \(lighting.first ?? "") · \(camera.first ?? "")").msCaption()
                    }
                    Spacer()
                    ResultAction(title: selectedIds.count == results.count ? "Désélectionner" : "Tout sélectionner", icon: "checkmark.circle") {
                        withAnimation(MSAnimation.snappy) { selectedIds = selectedIds.count == results.count ? [] : Set(results.map { $0.id }) }
                    }
                }
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    ForEach(results) { img in
                        ShootResultTile(image: img, selected: selectedIds.contains(img.id), favorite: favoriteIds.contains(img.id), saved: savedIds[img.id] != nil,
                                        onSelect: { toggleSelect(img) }, onFavorite: { toggleFavorite(img) }, onDownload: { download(img) })
                    }
                }
                bulkBar
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
    }

    private var bulkBar: some View {
        let targets = selectedIds.isEmpty ? results : results.filter { selectedIds.contains($0.id) }
        return VStack(alignment: .leading, spacing: 10) {
            Text(selectedIds.isEmpty ? "Les actions s'appliquent aux \(results.count) photos" : "\(selectedIds.count) sélectionnée\(selectedIds.count > 1 ? "s" : "")").msCaption()
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ResultAction(title: "Enregistrer dans le projet", icon: "folder.badge.plus") { save(targets); router.toast("\(targets.count) photo\(targets.count == 1 ? "" : "s") enregistrée\(targets.count == 1 ? "" : "s") dans \(store.currentProject?.name ?? "le projet")", style: .success) }
                    ResultAction(title: "Utiliser dans une campagne", icon: "flag") {
                        campaignAssetIds = save(targets, quiet: true)
                        campaignPicker = true
                    }
                    ResultAction(title: "Télécharger", icon: "arrow.down.circle") { router.toast("Téléchargement de \(targets.count) photo\(targets.count == 1 ? "" : "s")...", style: .info, icon: "arrow.down.circle") }
                    ResultAction(title: "Régénérer", icon: "arrow.clockwise") { generate() }
                }
            }
        }
        .msCard(padding: 12)
    }

    // MARK: Actions

    private func generate() {
        guard phase != .generating, productId != nil else { return }
        MSHaptic.tap()
        lastError = nil
        withAnimation(MSAnimation.gentle) { phase = .generating; results = []; selectedIds = []; favoriteIds = []; savedIds = [:] }
        let p = ProductShootParams(productAssetId: productId, environment: Self.english(environment.first, in: Self.environmentLabels, default: "Studio"), lighting: Self.english(lighting.first, in: Self.lightingLabels, default: "Natural"), camera: Self.english(camera.first, in: Self.cameraLabels, default: "Medium"), styleId: styleId, count: count, projectId: store.currentProjectId)
        Task {
            do {
                let imgs = try await API.generateProductShoot(p, store: store)
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { results = imgs; phase = .done }
                router.toast("\(imgs.count) photos produit prêtes", style: .success, icon: "sparkles")
            } catch {
                MSHaptic.warning()
                lastError = error
                withAnimation(MSAnimation.gentle) { phase = .failed }
            }
        }
    }

    /// Sokozia styles with their reference image (each shown on a different product).
    private var stylePicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                styleTile(id: nil, name: "Décor libre", product: "Choisissez le décor", url: nil)
                ForEach(Catalog.styles) { st in styleTile(id: st.id, name: st.name, product: st.product, url: st.imageURL) }
            }
            .padding(.horizontal, MSSpacing.gutter)
        }
        .padding(.horizontal, -MSSpacing.gutter)
    }

    private func styleTile(id: String?, name: String, product: String, url: String?) -> some View {
        let sel = styleId == id
        return Button {
            MSHaptic.tap()
            withAnimation(MSAnimation.snappy) { styleId = id }
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                Group {
                    if let url { RemoteImage(url: url, cornerRadius: 12) }
                    else { RoundedRectangle(cornerRadius: 12, style: .continuous).fill(MSColor.elevated).overlay(Image(systemName: "slider.horizontal.3").foregroundStyle(MSColor.text2)) }
                }
                .frame(width: 104, height: 128)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(sel ? MSColor.accent : MSColor.border, lineWidth: sel ? 2 : 1))
                Text(name).font(MSFont.caption(12)).foregroundStyle(sel ? MSColor.text : MSColor.text2).lineLimit(1)
                Text(product).msCaption(color: MSColor.muted).lineLimit(1)
            }
            .frame(width: 104, alignment: .leading)
        }
        .buttonStyle(MSPressStyle())
    }

    private func toggleSelect(_ img: GeneratedImage) {
        MSHaptic.tap()
        withAnimation(MSAnimation.snappy) {
            if selectedIds.contains(img.id) { selectedIds.remove(img.id) } else { selectedIds.insert(img.id) }
        }
    }

    private func toggleFavorite(_ img: GeneratedImage) {
        MSHaptic.tap()
        withAnimation(MSAnimation.snappy) {
            if favoriteIds.contains(img.id) { favoriteIds.remove(img.id) } else { favoriteIds.insert(img.id) }
        }
        // Favouriting persists the photo as an asset so it appears under Favorites.
        let ids = save([img], quiet: true)
        if let id = ids.first, store.isFavorite(.asset, id) != favoriteIds.contains(img.id) { store.toggleFavorite(.asset, id) }
    }

    private func download(_ img: GeneratedImage) {
        router.toast("Téléchargement de la photo...", style: .info, icon: "arrow.down.circle")
    }

    @discardableResult
    private func save(_ imgs: [GeneratedImage], quiet: Bool = false) -> [String] {
        var ids: [String] = []
        for (i, img) in imgs.enumerated() {
            if let existing = savedIds[img.id] { ids.append(existing); continue }
            let a = store.addAsset(name: "\(product?.name ?? "Produit") · \(environment.first ?? "") \(i + 1)", kind: .image, imageURL: img.url, projectId: store.currentProjectId, tags: ["shooting produit", (environment.first ?? "").lowercased()])
            savedIds[img.id] = a.id
            ids.append(a.id)
        }
        if !quiet { MSHaptic.success() }
        return ids
    }
}

// MARK: - Result tile

struct ShootResultTile: View {
    var image: GeneratedImage
    var selected: Bool
    var favorite: Bool
    var saved: Bool
    var onSelect: () -> Void
    var onFavorite: () -> Void
    var onDownload: () -> Void

    var body: some View {
        RemoteImage(url: image.url, cornerRadius: MSRadius.md)
            .aspectRatio(0.8, contentMode: .fit)
            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(selected ? MSColor.accent : MSColor.border, lineWidth: selected ? 2 : 1))
            .overlay(alignment: .topLeading) {
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(selected ? Color.white : Color.white.opacity(0.8), MSColor.accent)
                    .padding(8)
            }
            .overlay(alignment: .topTrailing) {
                if saved {
                    MSBadge(text: "Enregistrée", tone: .success).padding(8)
                }
            }
            .overlay(alignment: .bottomTrailing) {
                HStack(spacing: 6) {
                    MSIconButton(icon: "arrow.down.circle", size: 30, action: onDownload)
                    MSIconButton(icon: favorite ? "heart.fill" : "heart", size: 30, tint: favorite ? MSColor.highlight : MSColor.text, action: onFavorite)
                }
                .padding(8)
            }
            .contentShape(Rectangle())
            .onTapGesture(perform: onSelect)
    }
}

// MARK: - Upload sheet

/// Pick a library image, a Sokozia sample product, or a photo from Photos (uploaded to the account).
struct ProductUploadSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var onUploaded: (Asset) -> Void

    @State private var name = ""
    @State private var pickedURL: String?
    @State private var pickedImage: UIImage?
    @State private var photoItem: PhotosPickerItem?
    @State private var progress: Double = 0
    @State private var uploading = false


    private var existing: [Asset] { store.recentAssets.filter { $0.kind == .image || $0.kind == .brand }.prefix(6).map { $0 } }

    var body: some View {
        BottomSheetContainer(title: "Importer un produit", subtitle: "Choisissez un exemple, un visuel existant ou une photo de votre photothèque") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    if uploading {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Importation de \(name)...").msHeadline(15)
                            MSProgressBar(progress: progress)
                            Text("\(Int(progress * 100))%").msCaption()
                        }
                        .msCard()
                        .padding(.horizontal, MSSpacing.gutter)
                    }
                    CreativeSection(title: "Depuis votre bibliothèque") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(existing) { a in
                                    Button { finish(a) } label: {
                                        VStack(alignment: .leading, spacing: 6) {
                                            RemoteImage(url: a.imageURL, cornerRadius: 10).frame(width: 84, height: 84)
                                            Text(a.name).msCaption(color: MSColor.text2).lineLimit(1).frame(width: 84, alignment: .leading)
                                        }
                                    }
                                    .buttonStyle(MSPressStyle())
                                }
                            }
                            .padding(.horizontal, MSSpacing.gutter)
                        }
                        .padding(.horizontal, -MSSpacing.gutter)
                    }
                    CreativeSection(title: "Produits d'exemple") {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                            ForEach(Catalog.sampleProducts, id: \.url) { s in
                                let url = s.url
                                Button {
                                    MSHaptic.tap()
                                    withAnimation(MSAnimation.snappy) { pickedURL = url; pickedImage = nil; name = s.name }
                                } label: {
                                    VStack(alignment: .leading, spacing: 6) {
                                        RemoteImage(url: url, cornerRadius: 10)
                                            .aspectRatio(1, contentMode: .fit)
                                            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(pickedURL == url ? MSColor.accent : .clear, lineWidth: 2))
                                        Text(s.name).msCaption(color: pickedURL == url ? MSColor.text : MSColor.muted).lineLimit(1)
                                    }
                                }
                                .buttonStyle(MSPressStyle())
                            }
                        }
                    }
                    CreativeSection(title: "Ou choisissez une photo") {
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            HStack(spacing: 10) {
                                Image(systemName: "photo.on.rectangle").foregroundStyle(MSColor.highlight)
                                Text("Choisir dans Photos").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted)
                            }
                            .padding(14)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                        }
                        .onChange(of: photoItem) { _, item in
                            guard let item else { return }
                            Task {
                                if let data = try? await item.loadTransferable(type: Data.self), let img = UIImage(data: data) {
                                    pickedImage = img
                                    pickedURL = nil
                                    if name.isEmpty { name = "Ma photo produit" }
                                } else {
                                    router.toast("Impossible de lire cette photo.", style: .error)
                                }
                            }
                        }
                        if let pickedImage {
                            Image(uiImage: pickedImage).resizable().scaledToFill().frame(width: 84, height: 84)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(MSColor.accent, lineWidth: 2))
                        }
                    }
                    CreativeSection(title: "Nom") {
                        MSTextField(placeholder: "Nom du produit", text: $name, icon: "tag")
                    }
                    MSButton(title: "Importer", icon: "square.and.arrow.up", isLoading: uploading, isDisabled: (pickedURL == nil && pickedImage == nil) || name.trimmingCharacters(in: .whitespaces).isEmpty) { upload() }
                        .padding(.horizontal, MSSpacing.gutter)
                }
                .padding(.bottom, 30)
            }
        }
    }

    private func upload() {
        guard !uploading else { return }
        uploading = true
        Task {
            do {
                let a: Asset
                if let pickedImage {
                    a = try await API.uploadProduct(image: pickedImage, name: name, store: store) { p in withAnimation(MSAnimation.gentle) { progress = p } }
                } else {
                    // Sample product: already a public image, no upload needed.
                    a = store.addAsset(name: name, kind: .image, imageURL: pickedURL ?? "", projectId: store.currentProjectId, tags: ["product", "sample"])
                }
                MSHaptic.success()
                router.toast("\(name) importé", style: .success)
                onUploaded(a)
            } catch {
                router.toast(error.localizedDescription, style: .error)
            }
            uploading = false
        }
    }

    private func finish(_ a: Asset) {
        MSHaptic.tap()
        onUploaded(a)
    }
}
