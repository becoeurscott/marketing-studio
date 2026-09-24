import SwiftUI
import PhotosUI

/// SPEC §16 — AI Product Shoot: one product photo + environment/lighting/camera → 4–6 photos.
struct ProductShootView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router

    static let environments = ["Luxury bathroom", "Modern kitchen", "Beach", "Office", "Street", "Studio", "Restaurant", "Gym", "Car interior"]
    static let lightings = ["Natural", "Golden hour", "Studio", "Neon", "Softbox", "Dramatic"]
    static let cameras = ["Close-up", "Medium", "Wide", "Macro"]
    static let counts = [4, 6]

    private enum Phase: Equatable { case idle, generating, done, failed }

    @State private var productId: String?
    @State private var environment: Set<String> = ["Studio"]
    @State private var lighting: Set<String> = ["Natural"]
    @State private var camera: Set<String> = ["Medium"]
    @State private var count = 4
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
    private var cost: Int { GenerationKind.image.creditCost * count }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                header
                uploadCard
                CreativeSection(title: "Environment") { ChipGroup(options: Self.environments, selection: $environment, allowDeselect: false) }
                CreativeSection(title: "Lighting") { ChipGroup(options: Self.lightings, selection: $lighting, allowDeselect: false) }
                CreativeSection(title: "Camera") { ChipGroup(options: Self.cameras, selection: $camera, allowDeselect: false) }
                CreativeSection(title: "Photos") {
                    HStack(spacing: 8) {
                        ForEach(Self.counts, id: \.self) { c in
                            MSChip(title: "\(c) photos", selected: count == c) { MSHaptic.tap(); withAnimation(MSAnimation.snappy) { count = c } }
                        }
                    }
                }
                CreditCostRow(cost: cost, label: "\(count) product photos")
                MSButton(title: results.isEmpty ? "Generate Product Shoot" : "Generate Again", icon: "camera.aperture", isLoading: phase == .generating, isDisabled: productId == nil) { generate() }
                    .padding(.horizontal, MSSpacing.gutter)
                if productId == nil {
                    Text("Upload or pick a product photo to start.").msCaption().frame(maxWidth: .infinity).padding(.top, -12)
                }
                resultsSection
            }
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Product Shoot")
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
            Text("AI Product Shoot").msTitle(26)
            Text("One photo in, a full set of on-location product shots out.").msBody(14)
        }
        .padding(.horizontal, MSSpacing.gutter)
    }

    private var uploadCard: some View {
        CreativeSection(title: "Product photo", subtitle: "Upload one clean photo of your product") {
            Button { uploadSheet = true } label: {
                Group {
                    if let product {
                        HStack(spacing: 14) {
                            RemoteImage(url: product.imageURL, cornerRadius: 12).frame(width: 84, height: 84)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(product.name).font(MSFont.control(14)).foregroundStyle(MSColor.text).lineLimit(1)
                                Text("\(product.width) × \(product.height) · \(product.tags.joined(separator: ", "))").msCaption().lineLimit(1)
                                Text("Tap to change").msCaption(color: MSColor.highlight)
                            }
                            Spacer()
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(MSColor.success)
                        }
                    } else {
                        VStack(spacing: 10) {
                            Image(systemName: "photo.badge.plus").font(.system(size: 30, weight: .medium)).foregroundStyle(MSColor.highlight)
                            Text("Drop product image here").msHeadline(15)
                            Text("PNG or JPG · transparent background works best").msCaption()
                            HStack(spacing: 8) {
                                MSButton(title: "Upload Product", icon: "square.and.arrow.up", style: .secondary, size: .compact, fullWidth: false) { uploadSheet = true }
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
                    Text("Creating your visual...").msHeadline(15)
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
                    ResultAction(title: selectedIds.count == results.count ? "Clear" : "Select all", icon: "checkmark.circle") {
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
            Text(selectedIds.isEmpty ? "Actions apply to all \(results.count) photos" : "\(selectedIds.count) selected").msCaption()
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ResultAction(title: "Save to project", icon: "folder.badge.plus") { save(targets); router.toast("Saved \(targets.count) photo\(targets.count == 1 ? "" : "s") to \(store.currentProject?.name ?? "project")", style: .success) }
                    ResultAction(title: "Use in Campaign", icon: "flag") {
                        campaignAssetIds = save(targets, quiet: true)
                        campaignPicker = true
                    }
                    ResultAction(title: "Download", icon: "arrow.down.circle") { router.toast("Downloading \(targets.count) photo\(targets.count == 1 ? "" : "s")...", style: .info, icon: "arrow.down.circle") }
                    ResultAction(title: "Regenerate", icon: "arrow.clockwise") { generate() }
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
        let p = ProductShootParams(productAssetId: productId, environment: environment.first ?? "Studio", lighting: lighting.first ?? "Natural", camera: camera.first ?? "Medium", count: count, projectId: store.currentProjectId)
        Task {
            do {
                let imgs = try await MockAPI.generateProductShoot(p, store: store)
                MSHaptic.success()
                withAnimation(MSAnimation.snappy) { results = imgs; phase = .done }
                router.toast("\(imgs.count) product photos ready", style: .success, icon: "sparkles")
            } catch {
                MSHaptic.warning()
                lastError = error
                withAnimation(MSAnimation.gentle) { phase = .failed }
            }
        }
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
        router.toast("Downloading photo...", style: .info, icon: "arrow.down.circle")
    }

    @discardableResult
    private func save(_ imgs: [GeneratedImage], quiet: Bool = false) -> [String] {
        var ids: [String] = []
        for (i, img) in imgs.enumerated() {
            if let existing = savedIds[img.id] { ids.append(existing); continue }
            let a = store.addAsset(name: "\(product?.name ?? "Product") · \(environment.first ?? "") \(i + 1)", kind: .image, imageURL: img.url, projectId: store.currentProjectId, tags: ["product shoot", (environment.first ?? "").lowercased()])
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
                    MSBadge(text: "Saved", tone: .success).padding(8)
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

/// Mock upload: pick a sample product image or a photo from the library, then simulate an upload with progress.
struct ProductUploadSheet: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    var onUploaded: (Asset) -> Void

    @State private var name = ""
    @State private var pickedURL: String?
    @State private var photoItem: PhotosPickerItem?
    @State private var progress: Double = 0
    @State private var uploading = false

    private static let samples: [(String, String)] = [
        ("Luma Glow Serum", "luma-packshot"), ("Aurora Watch", "watch-hero"), ("Nimbus Sneakers", "sneaker-1"),
        ("Cold Brew Can", "coffee-can"), ("Velvet Lipstick", "lipstick"), ("Halo Headphones", "headphones"),
    ]

    private var existing: [Asset] { store.recentAssets.filter { $0.kind == .image || $0.kind == .brand }.prefix(6).map { $0 } }

    var body: some View {
        BottomSheetContainer(title: "Upload product", subtitle: "Pick a sample, an existing asset or a photo from your library") {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    if uploading {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Uploading \(name)...").msHeadline(15)
                            MSProgressBar(progress: progress)
                            Text("\(Int(progress * 100))%").msCaption()
                        }
                        .msCard()
                        .padding(.horizontal, MSSpacing.gutter)
                    }
                    CreativeSection(title: "From your library") {
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
                    CreativeSection(title: "Sample products") {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                            ForEach(Self.samples, id: \.1) { s in
                                let url = MockData.image(s.1)
                                Button {
                                    MSHaptic.tap()
                                    withAnimation(MSAnimation.snappy) { pickedURL = url; name = s.0 }
                                } label: {
                                    VStack(alignment: .leading, spacing: 6) {
                                        RemoteImage(url: url, cornerRadius: 10)
                                            .aspectRatio(1, contentMode: .fit)
                                            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(pickedURL == url ? MSColor.accent : .clear, lineWidth: 2))
                                        Text(s.0).msCaption(color: pickedURL == url ? MSColor.text : MSColor.muted).lineLimit(1)
                                    }
                                }
                                .buttonStyle(MSPressStyle())
                            }
                        }
                    }
                    CreativeSection(title: "Or choose a photo") {
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            HStack(spacing: 10) {
                                Image(systemName: "photo.on.rectangle").foregroundStyle(MSColor.highlight)
                                Text("Choose from Photos").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(MSColor.muted)
                            }
                            .padding(14)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                        }
                        .onChange(of: photoItem) { _, item in
                            guard item != nil else { return }
                            pickedURL = MockData.image("photo-\(Int.random(in: 100...999))")
                            if name.isEmpty { name = "My product photo" }
                        }
                    }
                    CreativeSection(title: "Name") {
                        MSTextField(placeholder: "Product name", text: $name, icon: "tag")
                    }
                    MSButton(title: "Upload", icon: "square.and.arrow.up", isLoading: uploading, isDisabled: pickedURL == nil || name.trimmingCharacters(in: .whitespaces).isEmpty) { upload() }
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
                var a = try await MockAPI.uploadProduct(name: name, store: store) { p in withAnimation(MSAnimation.gentle) { progress = p } }
                if let pickedURL { a.imageURL = pickedURL; store.updateAsset(a) }
                MSHaptic.success()
                router.toast("\(name) uploaded", style: .success)
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
