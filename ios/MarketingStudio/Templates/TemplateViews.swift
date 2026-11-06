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
                                .contextMenu { Button(role: .destructive) { store.remove(t) } label: { Label("Supprimer", systemImage: "trash") } }
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
    @State private var previewSound = true
    @State private var confirmDelete = false
    @Environment(\.dismiss) private var dismiss

    private var template: VideoTemplate? { store.templates.first { $0.id == templateId } }

    var body: some View {
        Group {
            if let t = template {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        LoopingVideoView(url: store.url(for: t).absoluteString, poster: nil, muted: !previewSound)
                            .aspectRatio(9.0 / 16.0, contentMode: .fit)
                            .frame(maxHeight: 420)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                            .overlay(alignment: .bottomTrailing) {
                                if t.hasAudio {
                                    Button { previewSound.toggle() } label: {
                                        Image(systemName: previewSound ? "speaker.wave.2.fill" : "speaker.slash.fill")
                                            .font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                                            .frame(width: 40, height: 40).background(.black.opacity(0.55), in: Circle())
                                    }
                                    .padding(12)
                                    .accessibilityLabel(previewSound ? "Couper le son" : "Activer le son")
                                }
                            }
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
                        VStack(spacing: 0) {
                            Toggle(isOn: $runner.keepSound) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Utiliser le son du modèle").font(MSFont.body(14))
                                    Text(t.hasAudio ? "Musique et voix de la vidéo d'origine" : "Cette vidéo n'a pas de son").msCaption()
                                }
                            }
                            .disabled(!t.hasAudio)
                            .padding(12)
                            if t.shots.contains(where: { $0.overlay != nil }) {
                                Divider().overlay(MSColor.border)
                                Toggle(isOn: $runner.showTexts) { Text("Ajouter les mêmes textes à l'écran").font(MSFont.body(14)) }
                                    .padding(12)
                            }
                        }
                        .tint(MSColor.accent)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
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
        .toolbar {
            if template != nil {
                ToolbarItem(placement: .primaryAction) {
                    Button(role: .destructive) { confirmDelete = true } label: { Image(systemName: "trash") }
                        .accessibilityLabel(L("Supprimer le modèle"))
                }
            }
        }
        .alert(L("Supprimer ce modèle ?"), isPresented: $confirmDelete) {
            Button(L("Supprimer"), role: .destructive) {
                if let t = template { store.remove(t) }
                MSHaptic.success()
                dismiss()
            }
            Button(L("Annuler"), role: .cancel) {}
        } message: {
            Text("Le modèle et sa vidéo de référence seront supprimés de ce téléphone. Vos vidéos déjà exportées restent dans Photos.")
        }
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
    /// Editing state kept after an export so the timeline editor can rebuild the video.
    @Published var editing = false
    /// Reference video waiting to be trimmed before it becomes a template.
    @Published var trimSource: URL?
    @Published var edit: VideoTemplate?
    @Published var clips: [AVAsset] = []
    @Published var starts: [Double] = []
    var editStarted = Date()

    func create(from item: PhotosPickerItem, store: TemplateStore) async {
        error = nil
        analyzing = 0
        defer { analyzing = nil }
        do {
            guard let movie = try await item.loadTransferable(type: PickedMovie.self) else { throw TemplateError.noClip }
            analyzing = nil
            trimSource = movie.url
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Import impossible. Réessayez."
        }
    }

    /// Videos shared from TikTok/Instagram: the first one opens in the trimmer, the others wait.
    func importInbox(store: TemplateStore) async {
        guard trimSource == nil, analyzing == nil, let file = TemplateStore.inboxVideos().first else { return }
        let copy = FileManager.default.temporaryDirectory.appendingPathComponent("shared-\(UUID().uuidString).\(file.pathExtension)")
        guard (try? FileManager.default.copyItem(at: file, to: copy)) != nil else { return }
        try? FileManager.default.removeItem(at: file)
        trimSource = copy
    }

    /// Called with the trimmed reference (or the original when the user keeps it whole).
    func analyzeTrimmed(_ url: URL, store: TemplateStore) async {
        error = nil
        analyzing = 0
        defer { analyzing = nil }
        do {
            fill = try await analyze(url, store: store)
            try? FileManager.default.removeItem(at: url)
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Import impossible. Réessayez."
        }
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
            // A clip reused in several slots continues where the previous slot stopped, so shots differ.
            var used: [String: Double] = [:]
            var offsets: [Double] = []
            for (shot, a) in zip(t.shots, assets) {
                let at = used[a.localIdentifier] ?? 0
                offsets.append(at + shot.duration <= a.duration ? at : 0)
                used[a.localIdentifier] = at + shot.duration
            }
            self.clips = clips
            self.starts = offsets
            self.edit = t
            self.editStarted = started
            assembling = nil
            MSHaptic.success()
            editing = true
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "Le montage a échoué. Réessayez."
        }
    }

    /// Rebuilds the video after timeline edits (durations, starts, texts, replaced clips).
    func reassemble(store: TemplateStore) async {
        guard let t = edit, clips.count == t.shots.count else { return }
        error = nil
        assembling = 0.3
        let started = editStarted
        defer { assembling = nil }
        do {
            let url = try await VideoAssembler.assemble(template: t, sourceURL: store.url(for: t), clips: clips, starts: starts,
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
            .fullScreenCover(isPresented: $runner.editing) { TemplateTimelineEditor(runner: runner, store: store) }
            .fullScreenCover(item: Binding(get: { runner.trimSource.map(TrimFile.init) }, set: { runner.trimSource = $0?.url })) { file in
                VideoTrimmer(url: file.url) { trimmed in
                    runner.trimSource = nil
                    Task { await runner.analyzeTrimmed(trimmed, store: store) }
                } onCancel: {
                    runner.trimSource = nil
                }
                .ignoresSafeArea()
            }
            .fullScreenCover(item: $runner.fill) { t in
                TemplateSlotPicker(template: t) { assets in
                    Task { await runner.assemble(t, assets: assets, store: store) }
                }
            }
            .sheet(isPresented: Binding(get: { runner.result != nil }, set: { if !$0 { runner.result = nil } })) {
                if let r = runner.result {
                    TemplateResultView(url: r.url, template: r.template, seconds: r.seconds) {
                        runner.result = nil
                        Task { try? await Task.sleep(for: .milliseconds(450)); runner.editing = true }
                    }
                        .overlay {
                            if let p = runner.assembling {
                                TemplateWorkingOverlay(title: "Montage de votre vidéo", steps: ["Application de vos modifications…", "Découpe au bon rythme…", "Ajout des textes…", "Export HD…"], progress: p)
                            }
                        }
                }
            }
    }
}

private struct TrimFile: Identifiable { let url: URL; var id: String { url.path } }

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
    var onEdit: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @State private var saved = false
    @State private var savedId: String?
    @State private var posting = false
    @State private var note: String?
    @State private var showShare = false
    @State private var player: AVPlayer?

    private var manual: String {
        let m = template.manualMinutes
        return m >= 60 ? "\(m / 60) h \(String(format: "%02d", m % 60))" : "\(m) min"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                VideoPlayer(player: player)
                    .aspectRatio(9.0 / 16.0, contentMode: .fit)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))

                HStack(spacing: 10) {
                    Image(systemName: "bolt.fill").font(.system(size: 14, weight: .bold)).foregroundStyle(MSColor.onAccent)
                        .frame(width: 30, height: 30).background(MSColor.accent, in: Circle())
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Monté en \(max(1, Int(seconds.rounded()))) s").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        Text("À la main, il vous aurait fallu environ \(manual).").font(.system(size: 12)).foregroundStyle(MSColor.text2)
                    }
                    Spacer(minLength: 0)
                }
                .padding(10)
                .background(MSColor.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))

                HStack(spacing: 0) {
                    ForEach(SocialTarget.allCases) { target in
                        Button { Task { await post(to: target) } } label: {
                            VStack(spacing: 4) {
                                SocialIcon(target: target).frame(width: 40, height: 40)
                                Text(target.label).font(.system(size: 10, weight: .medium)).foregroundStyle(MSColor.text2)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(MSPressStyle())
                        .disabled(posting)
                    }
                    ShareLink(item: url) {
                        VStack(spacing: 4) {
                            Image(systemName: "ellipsis").font(.system(size: 16, weight: .bold)).foregroundStyle(MSColor.text)
                                .frame(width: 40, height: 40).background(MSColor.elevated, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                            Text("Autres").font(.system(size: 10, weight: .medium)).foregroundStyle(MSColor.text2)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                if let note { Text(L(note)).font(.system(size: 11)).foregroundStyle(MSColor.muted).lineLimit(2) }

                Button { Task { await saveToPhotos() } } label: {
                    Label(saved ? "Enregistrée dans Photos" : "Enregistrer dans Photos", systemImage: saved ? "checkmark.circle.fill" : "arrow.down.to.line")
                        .font(MSFont.control(14)).foregroundStyle(MSColor.text)
                        .frame(maxWidth: .infinity).frame(height: 42)
                        .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                }
                .disabled(saved)
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 8)
            .background(MSColor.bg.ignoresSafeArea())
            .navigationTitle("Votre vidéo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Fermer") { dismiss() } }
                if let onEdit {
                    ToolbarItem(placement: .primaryAction) {
                        Button { player?.pause(); onEdit() } label: { Label("Modifier", systemImage: "slider.horizontal.below.rectangle") }
                    }
                }
            }
            .sheet(isPresented: $showShare) { ActivitySheet(items: [url]) }
            .onAppear {
                try? AVAudioSession.sharedInstance().setCategory(.playback)
                try? AVAudioSession.sharedInstance().setActive(true)
                player = AVPlayer(url: url)
                player?.play()
            }
            .onDisappear { player?.pause() }
            .onChange(of: url) { _, u in player?.pause(); player = AVPlayer(url: u); player?.play(); saved = false; savedId = nil }
        }
        .preferredColorScheme(.dark)
    }

    @discardableResult
    private func saveToPhotos() async -> String? {
        if let savedId { return savedId }
        guard await PHPhotoLibrary.requestAuthorization(for: .addOnly) == .authorized else {
            note = "Autorisez l'ajout à Photos dans Réglages pour publier."
            return nil
        }
        var id: String?
        do {
            try await PHPhotoLibrary.shared().performChanges {
                id = PHAssetCreationRequest.creationRequestForAssetFromVideo(atFileURL: url)?.placeholderForCreatedAsset?.localIdentifier
            }
            saved = true
            savedId = id
            MSHaptic.success()
        } catch {}
        return id
    }

    /// Saves the video, then opens the network on its posting screen (Instagram receives the video
    /// directly; TikTok and Facebook show it first in their gallery). Falls back to the share sheet.
    private func post(to target: SocialTarget) async {
        posting = true
        defer { posting = false }
        if target == .whatsapp { showShare = true; return }
        guard let id = await saveToPhotos() else { return }
        if let link = target.url(localIdentifier: id), UIApplication.shared.canOpenURL(link) {
            note = target == .instagram ? nil : "Vidéo enregistrée : choisissez-la en premier dans la galerie."
            await UIApplication.shared.open(link)
        } else {
            note = "\(target.label) n'est pas installé : choisissez une autre application."
            showShare = true
        }
    }
}

enum SocialTarget: String, CaseIterable, Identifiable {
    case tiktok, instagram, whatsapp, facebook
    var id: String { rawValue }
    var label: String {
        switch self {
        case .tiktok: return "TikTok"
        case .instagram: return "Instagram"
        case .whatsapp: return "WhatsApp"
        case .facebook: return "Facebook"
        }
    }

    func url(localIdentifier: String) -> URL? {
        switch self {
        case .instagram:
            let id = localIdentifier.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? localIdentifier
            return URL(string: "instagram://library?LocalIdentifier=\(id)")
        case .tiktok: return URL(string: "snssdk1233://")
        case .facebook: return URL(string: "fb://")
        case .whatsapp: return nil
        }
    }
}

/// Simple brand-coloured badges (no third-party logo files bundled).
private struct SocialIcon: View {
    let target: SocialTarget
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 11, style: .continuous).fill(background)
            if target == .tiktok {
                RoundedRectangle(cornerRadius: 11, style: .continuous).strokeBorder(Color.white.opacity(0.18), lineWidth: 1)
            }
            switch target {
            case .tiktok:
                Image(systemName: "music.note").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    .shadow(color: Color(red: 0.15, green: 0.95, blue: 0.94), radius: 0, x: -1.5, y: -1.5)
                    .shadow(color: Color(red: 1, green: 0.17, blue: 0.33), radius: 0, x: 1.5, y: 1.5)
            case .instagram:
                RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(.white, lineWidth: 2.2).frame(width: 21, height: 21)
                Circle().strokeBorder(.white, lineWidth: 2.2).frame(width: 9.5, height: 9.5)
                Circle().fill(.white).frame(width: 2.8, height: 2.8).offset(x: 6, y: -6)
            case .whatsapp:
                Image(systemName: "phone.fill").font(.system(size: 14, weight: .bold)).foregroundStyle(.white)
                    .padding(6).overlay(Circle().strokeBorder(.white, lineWidth: 2))
            case .facebook:
                Text("f").font(.system(size: 25, weight: .heavy, design: .rounded)).foregroundStyle(.white).offset(x: 1.5, y: 2)
            }
        }
    }

    private var background: AnyShapeStyle {
        switch target {
        case .tiktok: return AnyShapeStyle(Color.black)
        case .instagram: return AnyShapeStyle(LinearGradient(colors: [Color(red: 0.98, green: 0.76, blue: 0.24), Color(red: 0.95, green: 0.2, blue: 0.4), Color(red: 0.6, green: 0.2, blue: 0.85)], startPoint: .bottomLeading, endPoint: .topTrailing))
        case .whatsapp: return AnyShapeStyle(Color(red: 0.15, green: 0.83, blue: 0.4))
        case .facebook: return AnyShapeStyle(Color(red: 0.09, green: 0.47, blue: 0.95))
        }
    }
}

private struct ActivitySheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: items, applicationActivities: nil) }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
