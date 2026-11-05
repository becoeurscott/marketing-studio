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

/// "Modèles vidéo": edits learned from shared TikTok/Reels videos. "Créer un modèle" picks the
/// reference video, analyses it, then goes straight to filling its slots.
struct VideoTemplatesView: View {
    @EnvironmentObject private var router: Router
    @StateObject private var store = TemplateStore.shared
    @StateObject private var runner = TemplateRunner()
    @State private var importItem: PhotosPickerItem?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if store.templates.isEmpty {
                    howTo
                } else {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        ForEach(store.templates) { t in
                            Button { router.push(.videoTemplate(id: t.id)) } label: { VideoTemplateCard(template: t, url: store.url(for: t)) }
                                .buttonStyle(MSPressStyle())
                                .contextMenu { Button("Supprimer", role: .destructive) { store.remove(t) } }
                        }
                    }
                }
                if let e = runner.error { Text(L(e)).font(MSFont.body(13)).foregroundStyle(MSColor.danger) }
            }
            .padding(MSSpacing.gutter)
            .padding(.bottom, 90)
        }
        .msScreen()
        .safeAreaInset(edge: .bottom, spacing: 0) {
            PhotosPicker(selection: $importItem, matching: .videos, photoLibrary: .shared()) {
                Label("Créer un modèle", systemImage: "plus.rectangle.on.rectangle")
                    .font(MSFont.control(16)).foregroundStyle(MSColor.onAccent)
                    .frame(maxWidth: .infinity).frame(height: 54)
                    .background(MSColor.accent, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
            }
            .padding(.horizontal, MSSpacing.gutter).padding(.vertical, 10)
            .background(MSColor.bg)
        }
        .navigationTitle("Modèles vidéo")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: importItem) { _, item in
            guard let item else { return }
            importItem = nil
            Task { await runner.create(from: item, store: store) }
        }
        .task { await runner.importInbox(store: store) }
        .templateRunner(runner, store: store)
    }

    private var howTo: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Recréez n'importe quelle vidéo virale").msHeadline(18)
            step("1", "Dans TikTok ou Instagram, enregistrez la vidéo puis partagez-la vers Marketing Studio, ou touchez « Créer un modèle ».")
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

// MARK: - Template detail

struct VideoTemplateDetailView: View {
    let templateId: String
    @StateObject private var store = TemplateStore.shared
    @StateObject private var runner = TemplateRunner()

    private var template: VideoTemplate? { store.templates.first { $0.id == templateId } }

    var body: some View {
        Group {
            if let t = template {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        LoopingVideoView(url: store.url(for: t).absoluteString, poster: nil, muted: false)
                            .aspectRatio(9.0 / 16.0, contentMode: .fit)
                            .frame(maxHeight: 420)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        Text("\(t.shots.count) plans · \(Int(t.duration.rounded())) s").msHeadline(18)
                        if !t.style.isEmpty { Text(L(t.style)).msBody(13) }
                        ForEach(t.shots) { s in
                            HStack(alignment: .top, spacing: 10) {
                                Text("\(s.index + 1)").font(.system(size: 11, weight: .bold)).foregroundStyle(MSColor.onAccent)
                                    .frame(width: 22, height: 22).background(MSColor.accent, in: Circle())
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(L(s.description)) · \(String(format: "%.1f", s.duration)) s").font(MSFont.body(14)).foregroundStyle(MSColor.text)
                                    if let o = s.overlay { Text("« \(o) »").msCaption() }
                                }
                            }
                        }
                        if let e = runner.error { Text(L(e)).font(MSFont.body(13)).foregroundStyle(MSColor.danger) }
                    }
                    .padding(MSSpacing.gutter)
                    .padding(.bottom, 90)
                }
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    MSButton(title: "Utiliser ce modèle", icon: "wand.and.stars") { runner.fill = t }
                        .padding(.horizontal, MSSpacing.gutter).padding(.vertical, 10).background(MSColor.bg)
                }
            } else {
                EmptyStateView(icon: "film.stack", title: "Modèle introuvable", message: "Il a peut-être été supprimé.")
            }
        }
        .msScreen()
        .navigationTitle(L(template?.name ?? "Modèle"))
        .navigationBarTitleDisplayMode(.inline)
        .templateRunner(runner, store: store)
    }
}

// MARK: - Flow controller: analyse → fill slots → assemble → result

@MainActor
final class TemplateRunner: ObservableObject {
    @Published var analyzing: Double?
    @Published var assembling: Double?
    @Published var fill: VideoTemplate?
    @Published var result: (url: URL, template: VideoTemplate, seconds: Double)?
    @Published var error: String?
    @Published var keepSound = true
    @Published var showTexts = true

    func create(from item: PhotosPickerItem, store: TemplateStore) async {
        error = nil
        analyzing = 0
        defer { analyzing = nil }
        do {
            guard let movie = try await item.loadTransferable(type: PickedMovie.self) else { throw TemplateError.noClip }
            let t = try await analyze(movie.url, store: store)
            try? FileManager.default.removeItem(at: movie.url)
            fill = t
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Import impossible. Réessayez."
        }
    }

    func importInbox(store: TemplateStore) async {
        let files = TemplateStore.inboxVideos()
        guard !files.isEmpty, analyzing == nil else { return }
        analyzing = 0
        defer { analyzing = nil }
        var last: VideoTemplate?
        for file in files {
            if let t = try? await analyze(file, store: store) { last = t }
            try? FileManager.default.removeItem(at: file)
        }
        fill = last
    }

    private func analyze(_ url: URL, store: TemplateStore) async throws -> VideoTemplate {
        let started = Date()
        let t = try await TemplateAnalyzer.makeTemplate(from: url, store: store) { p in Task { @MainActor in self.analyzing = p } }
        // Let the animation finish its steps even on very short videos.
        let left = 1.6 - Date().timeIntervalSince(started)
        if left > 0 { analyzing = 1; try? await Task.sleep(for: .seconds(left)) }
        MSHaptic.success()
        return t
    }

    func assemble(_ t: VideoTemplate, assets: [PHAsset], store: TemplateStore) async {
        error = nil
        assembling = 0.05
        let started = Date()
        defer { assembling = nil }
        do {
            var clips: [AVAsset] = []
            for (i, a) in assets.enumerated() {
                guard let av = await LibraryVideos.avAsset(a) else { throw TemplateError.noClip }
                clips.append(av)
                assembling = 0.05 + 0.45 * Double(i + 1) / Double(assets.count)
            }
            assembling = 0.6
            let url = try await VideoAssembler.assemble(template: t, sourceURL: store.url(for: t), clips: clips,
                                                        options: .init(keepOriginalSound: keepSound, showTexts: showTexts))
            assembling = 1
            MSHaptic.success()
            result = (url, t, Date().timeIntervalSince(started))
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Le montage a échoué. Réessayez."
        }
    }
}

private struct TemplateRunnerModifier: ViewModifier {
    @ObservedObject var runner: TemplateRunner
    let store: TemplateStore

    func body(content: Content) -> some View {
        content
            .overlay {
                if let p = runner.analyzing {
                    TemplateWorkingOverlay(title: "Analyse de la vidéo", steps: ["Détection des coupes…", "Mesure du rythme…", "Lecture des textes…", "Préparation du modèle…"], progress: p)
                        .transition(.opacity)
                } else if let p = runner.assembling {
                    TemplateWorkingOverlay(title: "Montage de votre vidéo", steps: ["Import de vos vidéos…", "Découpe au bon rythme…", "Ajout des textes…", "Export HD…"], progress: p)
                        .transition(.opacity)
                }
            }
            .animation(MSAnimation.gentle, value: runner.analyzing != nil || runner.assembling != nil)
            .fullScreenCover(item: $runner.fill) { t in
                TemplateSlotPicker(template: t) { assets in
                    Task { await runner.assemble(t, assets: assets, store: store) }
                }
            }
            .sheet(isPresented: Binding(get: { runner.result != nil }, set: { if !$0 { runner.result = nil } })) {
                if let r = runner.result { TemplateResultView(url: r.url, template: r.template, seconds: r.seconds) }
            }
    }
}

extension View {
    func templateRunner(_ runner: TemplateRunner, store: TemplateStore) -> some View {
        modifier(TemplateRunnerModifier(runner: runner, store: store))
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
