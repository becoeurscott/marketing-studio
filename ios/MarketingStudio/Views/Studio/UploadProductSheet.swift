import SwiftUI
import PhotosUI

/// Pick an existing product image, or import one from Photos: it is uploaded to the account's space
/// (a public URL the generation models can read).
struct UploadProductSheet: View {
    var onUploaded: (Asset) -> Void
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @Environment(\.dismiss) private var dismiss

    @State private var pickerItem: PhotosPickerItem?
    @State private var uploading = false
    @State private var progress = 0.0
    @State private var uploadName = ""

    private var candidates: [Asset] {
        let tagged = store.assets.filter { $0.kind == .image && ($0.tags.contains("product") || $0.tags.contains("upload")) }
        if tagged.count >= 4 { return Array(tagged.prefix(12)) }
        return Array(store.assets.filter { $0.kind == .image }.prefix(12))
    }

    var body: some View {
        BottomSheetContainer(title: "Importer un produit", subtitle: "Choisissez une photo produit pour créer vos visuels.") {
            if uploading {
                VStack(spacing: 16) {
                    Image(systemName: "icloud.and.arrow.up").font(.system(size: 30, weight: .medium)).foregroundStyle(MSColor.highlight)
                    Text("Import de \(uploadName)...").msHeadline(15)
                    MSProgressBar(progress: progress).padding(.horizontal, 40)
                    Text("\(Int(progress * 100))%").font(MSFont.mono(12)).foregroundStyle(MSColor.text2)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        PhotosPicker(selection: $pickerItem, matching: .images) {
                            HStack(spacing: 12) {
                                Image(systemName: "photo.on.rectangle.angled").font(.system(size: 18, weight: .semibold)).foregroundStyle(MSColor.highlight)
                                    .frame(width: 42, height: 42)
                                    .background(MSColor.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Choisir dans Photos").msHeadline(15)
                                    Text("Une photo nette du produit, même prise au téléphone").msCaption()
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(MSColor.muted)
                            }
                            .msCard(padding: 12)
                        }
                        .buttonStyle(MSPressStyle())
                        .onChange(of: pickerItem) { _, item in
                            guard let item else { return }
                            upload(name: "Photo produit", item: item)
                        }

                        if !candidates.isEmpty { SectionHeader(title: "Vos images produit") }
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                            ForEach(candidates) { a in
                                Button {
                                    MSHaptic.tap()
                                    upload(name: a.name, existing: a)
                                } label: {
                                    RemoteImage(url: a.imageURL, cornerRadius: MSRadius.md)
                                        .aspectRatio(0.85, contentMode: .fill)
                                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                                        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
                                        .overlay(alignment: .bottomLeading) {
                                            Text(a.name).font(MSFont.caption(10)).foregroundStyle(.white).lineLimit(1)
                                                .padding(.horizontal, 6).padding(.vertical, 3)
                                                .background(.black.opacity(0.55), in: Capsule()).padding(5)
                                        }
                                }
                                .buttonStyle(MSPressStyle())
                            }
                        }
                    }
                    .padding(.horizontal, MSSpacing.gutter)
                    .padding(.bottom, 24)
                }
            }
        }
    }

    private func upload(name: String, existing: Asset? = nil, item: PhotosPickerItem? = nil) {
        uploadName = name
        uploading = true
        progress = 0
        Task {
            do {
                if let existing {
                    for i in 1...5 {
                        try? await Task.sleep(for: .milliseconds(120))
                        withAnimation(MSAnimation.gentle) { progress = Double(i) / 5 }
                    }
                    finish(existing)
                } else {
                    guard let data = try await item?.loadTransferable(type: Data.self), let image = UIImage(data: data) else {
                        throw APIError.failed("Impossible de lire cette photo.")
                    }
                    let a = try await API.uploadProduct(image: image, name: name, store: store) { p in
                        withAnimation(MSAnimation.gentle) { progress = p }
                    }
                    finish(a)
                }
            } catch {
                uploading = false
                pickerItem = nil
                router.toast(error.localizedDescription, style: .error)
            }
        }
    }

    private func finish(_ asset: Asset) {
        MSHaptic.success()
        router.toast("\(asset.name) est prêt", style: .success, icon: "checkmark.circle.fill")
        onUploaded(asset)
        dismiss()
    }
}
