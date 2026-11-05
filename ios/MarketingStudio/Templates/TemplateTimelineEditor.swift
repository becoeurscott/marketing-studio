import AVFoundation
import AVKit
import PhotosUI
import SwiftUI

/// Timeline editor shown after a template video is built: pick a shot on the timeline, then change
/// which part of the clip is used, its duration, its on-screen text, or replace the clip.
struct TemplateTimelineEditor: View {
    @ObservedObject var runner: TemplateRunner
    let store: TemplateStore
    @Environment(\.dismiss) private var dismiss
    @State private var selected = 0
    @State private var player: AVPlayer?
    @State private var replaceItem: PhotosPickerItem?
    @State private var clipDurations: [Double] = []
    @State private var thumbs: [Int: UIImage] = [:]

    private let pointsPerSecond: CGFloat = 70

    var body: some View {
        NavigationStack {
            VStack(spacing: 14) {
                VideoPlayer(player: player)
                    .aspectRatio(9.0 / 16.0, contentMode: .fit)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                if let t = runner.edit {
                    timeline(t)
                    inspector(t)
                    globalToggles(t)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 8)
            .background(Color.black.ignoresSafeArea())
            .navigationTitle("Montage")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Exporter") {
                        player?.pause()
                        dismiss()
                        Task { await runner.reassemble(store: store) }
                    }
                    .fontWeight(.bold)
                }
            }
            .task { await load() }
            .task(id: previewKey) { await rebuildPreview() }
            .onChange(of: replaceItem) { _, item in
                guard let item else { return }
                replaceItem = nil
                Task { await replace(with: item) }
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: Timeline

    private func timeline(_ t: VideoTemplate) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Plan \(selected + 1) / \(t.shots.count)").font(MSFont.control(13)).foregroundStyle(MSColor.text)
                Spacer()
                Text(String(format: "%.1f s au total", t.duration)).font(.system(size: 12)).foregroundStyle(MSColor.muted)
            }
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 3) {
                        ForEach(t.shots) { s in
                            Button { select(s.index) } label: { block(s) }
                                .buttonStyle(.plain)
                                .id(s.index)
                        }
                    }
                    .padding(.vertical, 3)
                }
                .onChange(of: selected) { _, i in withAnimation { proxy.scrollTo(i, anchor: .center) } }
            }
        }
    }

    private func block(_ s: TemplateShot) -> some View {
        ZStack(alignment: .bottomLeading) {
            Color.white.opacity(0.06)
            if let img = thumbs[s.index] { Image(uiImage: img).resizable().scaledToFill() }
            LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .center, endPoint: .bottom)
            HStack(spacing: 3) {
                Text("\(s.index + 1)").font(.system(size: 10, weight: .bold))
                if s.overlay != nil { Image(systemName: "textformat").font(.system(size: 9, weight: .bold)) }
            }
            .foregroundStyle(.white).padding(4)
            Text(String(format: "%.1f", s.duration)).font(.system(size: 10, weight: .semibold)).foregroundStyle(.white)
                .padding(4).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
        }
        .frame(width: max(34, CGFloat(s.duration) * pointsPerSecond), height: 58)
        .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 7, style: .continuous).strokeBorder(selected == s.index ? MSColor.accent : .clear, lineWidth: 2.5))
    }

    // MARK: Inspector for the selected shot

    @ViewBuilder
    private func inspector(_ t: VideoTemplate) -> some View {
        if let shot = t.shots[safe: selected] {
            let clipLength = clipDurations[safe: selected] ?? shot.duration
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Début dans votre vidéo : \(String(format: "%.1f", runner.starts[safe: selected] ?? 0)) s").font(.system(size: 12)).foregroundStyle(MSColor.text2)
                    Slider(value: Binding(get: { runner.starts[safe: selected] ?? 0 },
                                          set: { v in if runner.starts.indices.contains(selected) { runner.starts[selected] = v } }),
                           in: 0...max(0.01, clipLength - min(shot.duration, clipLength)))
                        .tint(MSColor.accent)
                        .onChange(of: runner.starts[safe: selected] ?? 0) { _, _ in refreshThumb(selected) }
                }
                HStack(spacing: 10) {
                    Text("Durée").font(.system(size: 12)).foregroundStyle(MSColor.text2)
                    stepButton("minus") { changeDuration(by: -0.1) }
                    Text(String(format: "%.1f s", shot.duration)).font(MSFont.control(14)).monospacedDigit().frame(minWidth: 52)
                    stepButton("plus") { changeDuration(by: 0.1) }
                    Spacer()
                    PhotosPicker(selection: $replaceItem, matching: .videos, photoLibrary: .shared()) {
                        Label("Remplacer", systemImage: "arrow.triangle.2.circlepath")
                            .font(.system(size: 13, weight: .semibold)).foregroundStyle(MSColor.onAccent)
                            .padding(.horizontal, 10).frame(height: 32).background(MSColor.accent, in: Capsule())
                    }
                }
                TextField(L("Texte à l'écran (vide = aucun)"), text: Binding(
                    get: { runner.edit?.shots[safe: selected]?.overlay ?? "" },
                    set: { v in
                        let clean = v.trimmingCharacters(in: .whitespaces)
                        runner.edit?.shots[selected].overlay = clean.isEmpty ? nil : String(v.prefix(120))
                    }))
                    .font(MSFont.body(14))
                    .padding(.horizontal, 12).frame(height: 40)
                    .background(MSColor.card, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .padding(12)
            .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
        }
    }

    private func globalToggles(_ t: VideoTemplate) -> some View {
        HStack(spacing: 16) {
            Toggle(isOn: $runner.keepSound) { Label("Son du modèle", systemImage: "music.note").font(.system(size: 12, weight: .medium)) }
                .disabled(!t.hasAudio)
            Toggle(isOn: $runner.showTexts) { Label("Textes", systemImage: "textformat").font(.system(size: 12, weight: .medium)) }
        }
        .toggleStyle(.button)
        .tint(MSColor.accent)
    }

    private func stepButton(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 13, weight: .bold)).foregroundStyle(MSColor.text)
                .frame(width: 32, height: 32).background(MSColor.card, in: Circle())
        }
    }

    // MARK: Actions

    private func select(_ i: Int) {
        MSHaptic.tap()
        selected = i
        let start = (runner.edit?.shots.prefix(i).reduce(0) { $0 + $1.duration }) ?? 0
        player?.seek(to: CMTime(seconds: start, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
    }

    private func changeDuration(by delta: Double) {
        guard var t = runner.edit, t.shots.indices.contains(selected) else { return }
        let clipLength = clipDurations[safe: selected] ?? 60
        let start = runner.starts[safe: selected] ?? 0
        let next = ((t.shots[selected].duration + delta) * 10).rounded() / 10
        t.shots[selected].duration = min(max(0.3, next), max(0.3, clipLength - start))
        runner.edit = t
    }

    private func replace(with item: PhotosPickerItem) async {
        guard let movie = try? await item.loadTransferable(type: PickedMovie.self) else { return }
        let asset = AVURLAsset(url: movie.url)
        guard runner.clips.indices.contains(selected) else { return }
        runner.clips[selected] = asset
        runner.starts[selected] = 0
        if let d = try? await asset.load(.duration).seconds, clipDurations.indices.contains(selected) { clipDurations[selected] = d }
        refreshThumb(selected)
    }

    /// Changes whenever an edit affects the picture or sound, so the preview is rebuilt.
    private var previewKey: String {
        let shots = runner.edit?.shots.map { "\($0.duration)|\($0.overlay ?? "")" }.joined(separator: ",") ?? ""
        return "\(shots)#\(runner.starts)#\(runner.keepSound)#\(runner.showTexts)#\(runner.clips.map { ObjectIdentifier($0).hashValue })"
    }

    /// Live preview straight from the in-memory composition: nothing is exported until "Exporter".
    private func rebuildPreview() async {
        guard let t = runner.edit, runner.clips.count == t.shots.count else { return }
        try? await Task.sleep(for: .milliseconds(250))
        guard !Task.isCancelled,
              let (composition, video) = try? await VideoAssembler.makeComposition(
                template: t, sourceURL: store.url(for: t), clips: runner.clips, starts: runner.starts,
                options: .init(keepOriginalSound: runner.keepSound, showTexts: runner.showTexts)) else { return }
        let item = AVPlayerItem(asset: composition)
        item.videoComposition = video
        let at = t.shots.prefix(selected).reduce(0) { $0 + $1.duration }
        try? AVAudioSession.sharedInstance().setCategory(.playback)
        if player == nil { player = AVPlayer() }
        player?.replaceCurrentItem(with: item)
        await player?.seek(to: CMTime(seconds: at, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
        player?.play()
    }

    private func load() async {
        var lengths: [Double] = []
        for c in runner.clips { lengths.append((try? await c.load(.duration).seconds) ?? 0) }
        clipDurations = lengths
        for i in runner.clips.indices { refreshThumb(i) }
    }

    private func refreshThumb(_ i: Int) {
        guard runner.clips.indices.contains(i) else { return }
        let gen = AVAssetImageGenerator(asset: runner.clips[i])
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 160, height: 160)
        let at = CMTime(seconds: (runner.starts[safe: i] ?? 0) + 0.05, preferredTimescale: 600)
        Task {
            if let cg = try? await gen.image(at: at).image { thumbs[i] = UIImage(cgImage: cg) }
        }
    }
}
