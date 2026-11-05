import AVKit
import Photos
import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

/// A video picked in Photos, copied to a temporary file so AVFoundation can read it.
struct PickedMovie: Transferable {
    let url: URL
    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .movie) { SentTransferredFile($0.url) } importing: { received in
            let dest = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).\(received.file.pathExtension.isEmpty ? "mov" : received.file.pathExtension)")
            try FileManager.default.copyItem(at: received.file, to: dest)
            return Self(url: dest)
        }
    }
}

// MARK: - Templates list

/// "Modèles vidéo": every edit learned from a shared TikTok/Reels video, plus import from Photos.
struct VideoTemplatesView: View {
    @EnvironmentObject private var router: Router
    @StateObject private var store = TemplateStore.shared
    @State private var importItem: PhotosPickerItem?
    @State private var importing: Double?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                howTo
                PhotosPicker(selection: $importItem, matching: .videos, photoLibrary: .shared()) {
                    Label("Importer une vidéo depuis Photos", systemImage: "square.and.arrow.down")
                        .font(MSFont.control(15)).foregroundStyle(MSColor.onAccent)
                        .frame(maxWidth: .infinity).frame(height: 50)
                        .background(MSColor.accent, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                }
                .disabled(importing != nil)
                if let importing {
                    VStack(alignment: .leading, spacing: 6) {
                        ProgressView(value: importing).tint(MSColor.accent)
                        Text("Analyse des coupes, du rythme et des textes…").msCaption()
                    }
                }
                if let error { Text(L(error)).font(MSFont.body(13)).foregroundStyle(MSColor.danger) }

                if store.templates.isEmpty {
                    EmptyStateView(icon: "film.stack", title: "Aucun modèle pour l'instant", message: "Partagez une vidéo TikTok ou Instagram vers Marketing Studio : elle devient un modèle à remplir avec vos vidéos.", ctaTitle: nil) {}
                } else {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        ForEach(store.templates) { t in
                            Button { router.push(.videoTemplate(id: t.id)) } label: { VideoTemplateCard(template: t, url: store.url(for: t)) }
                                .buttonStyle(MSPressStyle())
                                .contextMenu { Button("Supprimer", role: .destructive) { store.remove(t) } }
                        }
                    }
                }
            }
            .padding(MSSpacing.gutter)
        }
        .msScreen()
        .navigationTitle("Modèles vidéo")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: importItem) { _, item in
            guard let item else { return }
            Task { await importFromPhotos(item) }
        }
        .task { await importInbox() }
    }

    private var howTo: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recréez n'importe quelle vidéo virale").msHeadline(18)
            step("1", "Dans TikTok ou Instagram, enregistrez la vidéo puis partagez-la vers Marketing Studio.")
            step("2", "On détecte chaque coupe, le rythme et les textes.")
            step("3", "Choisissez vos vidéos pour chaque plan : le montage est fait pour vous.")
        }
        .padding(14)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }

    private func step(_ n: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(n).font(.system(size: 12, weight: .bold)).foregroundStyle(MSColor.onAccent)
                .frame(width: 22, height: 22).background(MSColor.accent, in: Circle())
            Text(L(text)).font(MSFont.body(13)).foregroundStyle(MSColor.text2)
        }
    }

    private func importFromPhotos(_ item: PhotosPickerItem) async {
        error = nil
        importing = 0
        defer { importing = nil; importItem = nil }
        do {
            guard let movie = try await item.loadTransferable(type: PickedMovie.self) else { throw TemplateError.noClip }
            let t = try await TemplateAnalyzer.makeTemplate(from: movie.url, store: store) { p in Task { @MainActor in importing = p } }
            try? FileManager.default.removeItem(at: movie.url)
            MSHaptic.success()
            router.push(.videoTemplate(id: t.id))
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Import impossible. Réessayez."
        }
    }

    /// Videos shared from TikTok/Instagram through the share extension.
    private func importInbox() async {
        let files = TemplateStore.inboxVideos()
        guard !files.isEmpty, importing == nil else { return }
        importing = 0
        defer { importing = nil }
        var last: VideoTemplate?
        for file in files {
            if let t = try? await TemplateAnalyzer.makeTemplate(from: file, store: store, progress: { p in Task { @MainActor in importing = p } }) { last = t }
            try? FileManager.default.removeItem(at: file)
        }
        if let last { MSHaptic.success(); router.push(.videoTemplate(id: last.id)) }
    }
}

private struct VideoTemplateCard: View {
    let template: VideoTemplate
    let url: URL

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            LoopingVideoView(url: url.absoluteString, poster: nil)
                .aspectRatio(9.0 / 16.0, contentMode: .fit)
                .overlay(alignment: .topLeading) {
                    Text("\(template.shots.count) plans · \(Int(template.duration.rounded())) s")
                        .font(.system(size: 10, weight: .semibold)).foregroundStyle(.white)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(.black.opacity(0.5), in: Capsule()).padding(8)
                }
            Text(L(template.name)).font(MSFont.control(13)).foregroundStyle(MSColor.text).lineLimit(1).padding(10)
        }
        .background(MSColor.card)
        .clipShape(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
    }
}

// MARK: - Fill a template

struct VideoTemplateDetailView: View {
    let templateId: String
    @StateObject private var store = TemplateStore.shared
    @State private var clips: [Int: URL] = [:]
    @State private var picking: [Int: PhotosPickerItem] = [:]
    @State private var keepSound = true
    @State private var showTexts = true
    @State private var building = false
    @State private var startedAt = Date()
    @State private var result: URL?
    @State private var error: String?

    private var template: VideoTemplate? { store.templates.first { $0.id == templateId } }

    var body: some View {
        Group {
            if let t = template {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        header(t)
                        ForEach(t.shots) { shot in slot(shot) }
                        options(t)
                        if let error { Text(L(error)).font(MSFont.body(13)).foregroundStyle(MSColor.danger) }
                        MSButton(title: building ? "Montage en cours…" : "Créer ma vidéo", icon: "wand.and.stars", isDisabled: clips.count < t.shots.count || building) {
                            Task { await build(t) }
                        }
                    }
                    .padding(MSSpacing.gutter)
                }
                .sheet(item: Binding(get: { result.map(ResultFile.init) }, set: { result = $0?.url })) { file in
                    TemplateResultView(url: file.url, template: t, seconds: Date().timeIntervalSince(startedAt))
                }
            } else {
                EmptyStateView(icon: "film.stack", title: "Modèle introuvable", message: "Il a peut-être été supprimé.", ctaTitle: nil) {}
            }
        }
        .msScreen()
        .navigationTitle(L(template?.name ?? "Modèle"))
        .navigationBarTitleDisplayMode(.inline)
    }

    private func header(_ t: VideoTemplate) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(t.shots.count) plans · \(Int(t.duration.rounded())) s").msHeadline(18)
            if !t.style.isEmpty { Text(L(t.style)).msBody(13) }
            Text("Choisissez une vidéo pour chaque plan. Elle sera coupée à la bonne durée.").msCaption()
        }
    }

    private func slot(_ shot: TemplateShot) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous).fill(MSColor.elevated)
                if let url = clips[shot.index] {
                    ClipThumb(url: url)
                } else {
                    Image(systemName: "plus").font(.system(size: 18, weight: .bold)).foregroundStyle(MSColor.highlight)
                }
            }
            .frame(width: 60, height: 90)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                Text("Plan \(shot.index + 1) · \(String(format: "%.1f", shot.duration)) s").font(MSFont.control(13)).foregroundStyle(MSColor.highlight)
                Text(L(shot.description)).font(MSFont.body(14)).foregroundStyle(MSColor.text)
                if let o = shot.overlay { Text("Texte : « \(o) »").msCaption().lineLimit(2) }
            }
            Spacer(minLength: 0)
            PhotosPicker(selection: Binding(get: { picking[shot.index] }, set: { picking[shot.index] = $0 }), matching: .videos, photoLibrary: .shared()) {
                Text(clips[shot.index] == nil ? "Choisir" : "Changer").font(MSFont.control(13)).foregroundStyle(MSColor.onAccent)
                    .padding(.horizontal, 12).frame(height: 34).background(MSColor.accent, in: Capsule())
            }
        }
        .padding(10)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.border, lineWidth: 1))
        .onChange(of: picking[shot.index]) { _, item in
            guard let item else { return }
            Task {
                if let movie = try? await item.loadTransferable(type: PickedMovie.self) { clips[shot.index] = movie.url }
            }
        }
    }

    private func options(_ t: VideoTemplate) -> some View {
        VStack(spacing: 0) {
            if t.hasAudio {
                Toggle(isOn: $keepSound) { Text("Garder le son de la vidéo d'origine").font(MSFont.body(14)) }
                    .padding(12)
            }
            if t.shots.contains(where: { $0.overlay != nil }) {
                Toggle(isOn: $showTexts) { Text("Ajouter les mêmes textes à l'écran").font(MSFont.body(14)) }
                    .padding(12)
            }
        }
        .tint(MSColor.accent)
        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
    }

    private func build(_ t: VideoTemplate) async {
        error = nil
        building = true
        startedAt = Date()
        defer { building = false }
        do {
            let ordered = t.shots.compactMap { clips[$0.index] }
            result = try await VideoAssembler.assemble(template: t, sourceURL: store.url(for: t), clips: ordered,
                                                       options: .init(keepOriginalSound: keepSound, showTexts: showTexts))
            MSHaptic.success()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Le montage a échoué. Réessayez."
        }
    }
}

private struct ResultFile: Identifiable { let url: URL; var id: String { url.path } }

private struct ClipThumb: View {
    let url: URL
    @State private var image: UIImage?
    var body: some View {
        Group { if let image { Image(uiImage: image).resizable().scaledToFill() } else { Color.clear } }
            .task {
                let gen = AVAssetImageGenerator(asset: AVURLAsset(url: url))
                gen.appliesPreferredTrackTransform = true
                gen.maximumSize = CGSize(width: 200, height: 200)
                if let cg = try? await gen.image(at: .zero).image { image = UIImage(cgImage: cg) }
            }
    }
}

// MARK: - Result

struct TemplateResultView: View {
    let url: URL
    let template: VideoTemplate
    let seconds: Double
    @Environment(\.dismiss) private var dismiss
    @State private var saved = false
    @State private var player: AVPlayer?

    private var manual: String {
        let m = template.manualMinutes
        return m >= 60 ? "\(m / 60) h \(String(format: "%02d", m % 60))" : "\(m) min"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    VideoPlayer(player: player)
                        .aspectRatio(9.0 / 16.0, contentMode: .fit)
                        .frame(maxHeight: 460)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                    HStack(spacing: 12) {
                        Image(systemName: "bolt.fill").font(.system(size: 20, weight: .bold)).foregroundStyle(MSColor.onAccent)
                            .frame(width: 44, height: 44).background(MSColor.accent, in: Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Monté en \(max(1, Int(seconds.rounded()))) s").msHeadline(17)
                            Text("À la main, il vous aurait fallu environ \(manual).").msBody(13)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(14)
                    .background(MSColor.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))

                    ShareLink(item: url) {
                        Label("Publier sur TikTok, Instagram, WhatsApp…", systemImage: "square.and.arrow.up")
                            .font(MSFont.control(15)).foregroundStyle(MSColor.onAccent)
                            .frame(maxWidth: .infinity).frame(height: 50)
                            .background(MSColor.accent, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    }
                    Button { Task { await saveToPhotos() } } label: {
                        Label(saved ? "Enregistrée dans Photos" : "Enregistrer dans Photos", systemImage: saved ? "checkmark.circle.fill" : "arrow.down.to.line")
                            .font(MSFont.control(15)).foregroundStyle(MSColor.text)
                            .frame(maxWidth: .infinity).frame(height: 50)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    }
                    .disabled(saved)
                }
                .padding(MSSpacing.gutter)
            }
            .background(MSColor.bg.ignoresSafeArea())
            .navigationTitle("Votre vidéo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fermer") { dismiss() } } }
            .onAppear { player = AVPlayer(url: url); player?.play() }
            .onDisappear { player?.pause() }
        }
        .preferredColorScheme(.dark)
    }

    private func saveToPhotos() async {
        guard await PHPhotoLibrary.requestAuthorization(for: .addOnly) == .authorized else { return }
        do {
            try await PHPhotoLibrary.shared().performChanges {
                PHAssetCreationRequest.creationRequestForAssetFromVideo(atFileURL: url)
            }
            saved = true
            MSHaptic.success()
        } catch {}
    }
}
