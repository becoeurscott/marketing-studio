import AVFoundation
import AVKit
import PhotosUI
import SwiftUI

/// CapCut-style editor: fixed playhead in the middle, drag the timeline to scrub, pinch to zoom,
/// video / text / sound tracks, select a shot to trim it (right handle), split, replace, adjust,
/// edit its text or delete it. Nothing is exported until "Exporter".
struct TemplateTimelineEditor: View {
    @ObservedObject var runner: TemplateRunner
    let store: TemplateStore
    @Environment(\.dismiss) private var dismiss

    @State private var player = AVPlayer()
    @State private var playing = false
    @State private var time: Double = 0
    @State private var selected: Int?
    @State private var pps: CGFloat = 60
    @State private var dragStartTime: Double?
    @State private var pinchStart: CGFloat?
    @State private var trimStart: Double?
    @State private var clipDurations: [Double] = []
    @State private var strips: [String: [UIImage]] = [:]
    @State private var replaceItem: PhotosPickerItem?
    @State private var sheet: Sheet?
    @State private var observer: Any?

    enum Sheet: String, Identifiable { case adjust, text; var id: String { rawValue } }

    private var shots: [TemplateShot] { runner.edit?.shots ?? [] }
    private var total: Double { shots.reduce(0) { $0 + $1.duration } }
    private func startOf(_ i: Int) -> Double { shots.prefix(i).reduce(0) { $0 + $1.duration } }
    private func shotAt(_ t: Double) -> Int {
        var acc = 0.0
        for (i, s) in shots.enumerated() { acc += s.duration; if t < acc - 0.0001 { return i } }
        return max(0, shots.count - 1)
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            VideoPlayer(player: player)
                .disabled(true)
                .aspectRatio(9.0 / 16.0, contentMode: .fit)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 30)
            transport
            timeline
                .frame(height: 176)
            toolbar
        }
        .background(Color.black.ignoresSafeArea())
        .preferredColorScheme(.dark)
        .task { await load() }
        .task(id: previewKey) { await rebuildPreview() }
        .onChange(of: replaceItem) { _, item in
            guard let item else { return }
            replaceItem = nil
            Task { await replace(with: item) }
        }
        .sheet(item: $sheet) { s in
            Group {
                switch s {
                case .adjust: adjustSheet
                case .text: textSheet
                }
            }
            .presentationDetents([.height(230)])
            .preferredColorScheme(.dark)
        }
        .onDisappear {
            player.pause()
            if let observer { player.removeTimeObserver(observer) }
        }
    }

    // MARK: Top bar & transport

    private var topBar: some View {
        HStack {
            Button { player.pause(); dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 17, weight: .semibold)).foregroundStyle(.white)
                    .frame(width: 38, height: 38)
            }
            Spacer()
            Text("Montage").font(MSFont.control(16)).foregroundStyle(.white)
            Spacer()
            Button {
                player.pause()
                dismiss()
                Task { await runner.reassemble(store: store) }
            } label: {
                Text("Exporter").font(.system(size: 14, weight: .bold)).foregroundStyle(MSColor.onAccent)
                    .padding(.horizontal, 14).frame(height: 34)
                    .background(MSColor.accent, in: Capsule())
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }

    private var transport: some View {
        HStack {
            Text("\(clock(time)) / \(clock(total))").font(.system(size: 12, weight: .medium).monospacedDigit()).foregroundStyle(.white.opacity(0.8))
            Spacer()
            Button { togglePlay() } label: {
                Image(systemName: playing ? "pause.fill" : "play.fill").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 44, height: 36)
            }
            Spacer()
            Text("\(shots.count) plans").font(.system(size: 12)).foregroundStyle(.white.opacity(0.5))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }

    // MARK: Timeline

    private var timeline: some View {
        GeometryReader { geo in
            let mid = geo.size.width / 2
            ZStack(alignment: .topLeading) {
                Color(white: 0.06)
                VStack(alignment: .leading, spacing: 6) {
                    ruler.frame(height: 18)
                    videoTrack.frame(height: 62)
                    textTrack.frame(height: 26)
                    soundTrack.frame(height: 26)
                }
                .padding(.top, 8)
                .offset(x: mid - CGFloat(time) * pps)

                Rectangle().fill(.white).frame(width: 2, height: geo.size.height - 6)
                    .shadow(color: .black.opacity(0.6), radius: 2)
                    .offset(x: mid - 1, y: 3)
                    .allowsHitTesting(false)
            }
            .clipped()
            .contentShape(Rectangle())
            .gesture(scrub)
            .simultaneousGesture(zoom)
        }
    }

    private var scrub: some Gesture {
        DragGesture(minimumDistance: 4)
            .onChanged { v in
                if dragStartTime == nil { dragStartTime = time; player.pause(); playing = false }
                let t = (dragStartTime ?? 0) - Double(v.translation.width / pps)
                seek(min(max(0, t), max(0, total - 0.01)))
            }
            .onEnded { _ in dragStartTime = nil }
    }

    private var zoom: some Gesture {
        MagnifyGesture()
            .onChanged { v in
                if pinchStart == nil { pinchStart = pps }
                pps = min(220, max(24, (pinchStart ?? 60) * v.magnification))
            }
            .onEnded { _ in pinchStart = nil }
    }

    private var ruler: some View {
        let step: Double = pps < 40 ? 2 : 1
        return ZStack(alignment: .topLeading) {
            ForEach(Array(stride(from: 0.0, through: total, by: step)), id: \.self) { s in
                VStack(alignment: .leading, spacing: 2) {
                    Text(clock(s)).font(.system(size: 9).monospacedDigit()).foregroundStyle(.white.opacity(0.45))
                    Rectangle().fill(.white.opacity(0.3)).frame(width: 1, height: 4)
                }
                .offset(x: CGFloat(s) * pps)
            }
        }
    }

    private var videoTrack: some View {
        HStack(spacing: 2) {
            ForEach(shots) { s in clipBlock(s) }
        }
    }

    private func clipBlock(_ s: TemplateShot) -> some View {
        let w = max(18, CGFloat(s.duration) * pps - 2)
        let isSel = selected == s.index
        let frames = strips[stripKey(s.index)] ?? []
        return ZStack(alignment: .leading) {
            Color(white: 0.16)
            HStack(spacing: 0) {
                ForEach(Array(frames.enumerated()), id: \.offset) { _, img in
                    Image(uiImage: img).resizable().scaledToFill().frame(width: 40, height: 62).clipped()
                }
            }
            .frame(width: w, alignment: .leading)
            .clipped()
            if w >= 40 {
                Text(String(format: "%.1fs", s.duration)).font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                    .lineLimit(1).fixedSize()
                    .padding(.horizontal, 4).padding(.vertical, 2)
                    .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 3))
                    .padding(4)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            }
        }
        .frame(width: w, height: 62)
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(isSel ? MSColor.accent : .clear, lineWidth: 2.5))
        .overlay(alignment: .trailing) {
            if isSel {
                RoundedRectangle(cornerRadius: 3).fill(MSColor.accent).frame(width: 14, height: 62)
                    .overlay(Capsule().fill(MSColor.onAccent).frame(width: 2.5, height: 18))
                    .offset(x: 7)
                    .gesture(trimGesture(s.index))
            }
        }
        .onTapGesture { select(s.index) }
    }

    private func trimGesture(_ i: Int) -> some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { v in
                if trimStart == nil { trimStart = shots[safe: i]?.duration }
                let maxLen = max(0.3, (clipDurations[safe: i] ?? 60) - (runner.starts[safe: i] ?? 0))
                let d = ((trimStart ?? 1) + Double(v.translation.width / pps))
                setDuration(i, min(max(0.3, (d * 10).rounded() / 10), maxLen))
            }
            .onEnded { _ in trimStart = nil }
    }

    private var textTrack: some View {
        HStack(spacing: 2) {
            ForEach(shots) { s in
                let w = max(18, CGFloat(s.duration) * pps - 2)
                Group {
                    if let o = s.overlay, runner.showTexts {
                        HStack(spacing: 3) {
                            Image(systemName: "textformat").font(.system(size: 9, weight: .bold))
                            Text(o).font(.system(size: 10, weight: .medium)).lineLimit(1)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5)
                        .frame(width: w, height: 24, alignment: .leading)
                        .background(Color(red: 0.55, green: 0.36, blue: 0.96).opacity(0.85), in: RoundedRectangle(cornerRadius: 5))
                        .onTapGesture { select(s.index); sheet = .text }
                    } else {
                        Color.clear.frame(width: w, height: 24)
                    }
                }
            }
        }
    }

    private var soundTrack: some View {
        Group {
            if runner.keepSound, runner.edit?.hasAudio == true {
                HStack(spacing: 4) {
                    Image(systemName: "music.note").font(.system(size: 10, weight: .bold))
                    Text("Son du modèle").font(.system(size: 10, weight: .medium))
                    Spacer(minLength: 0)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 6)
                .frame(width: max(30, CGFloat(total) * pps), height: 24)
                .background(Color(red: 0.13, green: 0.6, blue: 0.4).opacity(0.85), in: RoundedRectangle(cornerRadius: 5))
            } else {
                Color.clear.frame(width: 10, height: 24)
            }
        }
    }

    // MARK: Toolbar

    private var toolbar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                if let i = selected {
                    tool("scissors", "Diviser") { split(i) }
                    PhotosPicker(selection: $replaceItem, matching: .videos, photoLibrary: .shared()) { toolLabel("arrow.triangle.2.circlepath", "Remplacer") }
                    tool("slider.horizontal.3", "Ajuster") { sheet = .adjust }
                    tool("textformat", "Texte") { sheet = .text }
                    tool("trash", "Supprimer", disabled: shots.count <= 1) { delete(i) }
                    tool("checkmark", "OK") { selected = nil }
                } else {
                    tool(runner.keepSound ? "speaker.wave.2.fill" : "speaker.slash.fill", "Son", active: runner.keepSound, disabled: runner.edit?.hasAudio != true) { runner.keepSound.toggle() }
                    tool("textformat", "Textes", active: runner.showTexts) { runner.showTexts.toggle() }
                    tool("hand.tap", "Choisir un plan") { select(shotAt(time)) }
                }
            }
            .padding(.horizontal, 10)
        }
        .frame(height: 70)
        .background(Color(white: 0.09))
    }

    private func tool(_ icon: String, _ label: String, active: Bool = false, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: { MSHaptic.tap(); action() }) { toolLabel(icon, label, active: active) }
            .disabled(disabled)
            .opacity(disabled ? 0.35 : 1)
    }

    private func toolLabel(_ icon: String, _ label: String, active: Bool = false) -> some View {
        VStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 18, weight: .medium))
            Text(L(label)).font(.system(size: 10, weight: .medium))
        }
        .foregroundStyle(active ? MSColor.highlight : .white)
        .frame(width: 64, height: 56)
    }

    // MARK: Sheets

    private var adjustSheet: some View {
        let i = selected ?? 0
        let clipLength = clipDurations[safe: i] ?? 1
        let dur = shots[safe: i]?.duration ?? 1
        return VStack(alignment: .leading, spacing: 14) {
            Text("Partie de votre vidéo utilisée").font(MSFont.control(15))
            Text("Début : \(String(format: "%.1f", runner.starts[safe: i] ?? 0)) s · durée \(String(format: "%.1f", dur)) s").font(.system(size: 12)).foregroundStyle(MSColor.text2)
            Slider(value: Binding(get: { runner.starts[safe: i] ?? 0 },
                                  set: { v in if runner.starts.indices.contains(i) { runner.starts[i] = v; refreshStrip(i) } }),
                   in: 0...max(0.01, clipLength - min(dur, clipLength)))
                .tint(MSColor.accent)
            Button("OK") { sheet = nil }.font(MSFont.control(15)).frame(maxWidth: .infinity)
        }
        .padding(20)
    }

    private var textSheet: some View {
        let i = selected ?? 0
        return VStack(alignment: .leading, spacing: 14) {
            Text("Texte du plan \(i + 1)").font(MSFont.control(15))
            TextField(L("Texte à l'écran (vide = aucun)"), text: Binding(
                get: { runner.edit?.shots[safe: i]?.overlay ?? "" },
                set: { v in
                    guard runner.edit?.shots.indices.contains(i) == true else { return }
                    let clean = v.trimmingCharacters(in: .whitespaces)
                    runner.edit?.shots[i].overlay = clean.isEmpty ? nil : String(v.prefix(120))
                }))
                .font(MSFont.body(15))
                .padding(.horizontal, 12).frame(height: 44)
                .background(MSColor.card, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            Button("OK") { sheet = nil }.font(MSFont.control(15)).frame(maxWidth: .infinity)
        }
        .padding(20)
    }

    // MARK: Editing actions

    private func select(_ i: Int) {
        MSHaptic.tap()
        selected = i
        seek(startOf(i) + 0.01)
    }

    private func setDuration(_ i: Int, _ d: Double) {
        guard var t = runner.edit, t.shots.indices.contains(i) else { return }
        t.shots[i].duration = d
        runner.edit = t
    }

    /// Splits the selected shot at the playhead into two shots using the same clip.
    private func split(_ i: Int) {
        guard var t = runner.edit, t.shots.indices.contains(i) else { return }
        let local = time - startOf(i)
        guard local > 0.25, local < t.shots[i].duration - 0.25 else { return }
        var second = t.shots[i]
        second.duration = (t.shots[i].duration - local)
        t.shots[i].duration = local
        t.shots.insert(second, at: i + 1)
        for k in t.shots.indices { t.shots[k].index = k }
        runner.clips.insert(runner.clips[i], at: i + 1)
        runner.starts.insert((runner.starts[safe: i] ?? 0) + local, at: i + 1)
        clipDurations.insert(clipDurations[safe: i] ?? 0, at: i + 1)
        runner.edit = t
        rebuildStrips()
        selected = i + 1
    }

    private func delete(_ i: Int) {
        guard var t = runner.edit, t.shots.count > 1, t.shots.indices.contains(i) else { return }
        t.shots.remove(at: i)
        for k in t.shots.indices { t.shots[k].index = k }
        runner.clips.remove(at: i)
        if runner.starts.indices.contains(i) { runner.starts.remove(at: i) }
        if clipDurations.indices.contains(i) { clipDurations.remove(at: i) }
        runner.edit = t
        selected = nil
        rebuildStrips()
        seek(min(time, max(0, total - 0.05)))
    }

    private func replace(with item: PhotosPickerItem) async {
        guard let i = selected, let movie = try? await item.loadTransferable(type: PickedMovie.self),
              runner.clips.indices.contains(i) else { return }
        let asset = AVURLAsset(url: movie.url)
        runner.clips[i] = asset
        runner.starts[i] = 0
        if let d = try? await asset.load(.duration).seconds, clipDurations.indices.contains(i) { clipDurations[i] = d }
        refreshStrip(i)
    }

    // MARK: Playback

    private func togglePlay() {
        if playing { player.pause() } else {
            if time >= total - 0.05 { seek(0) }
            player.play()
        }
        playing.toggle()
    }

    private func seek(_ t: Double) {
        time = t
        player.seek(to: CMTime(seconds: t, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
    }

    /// Changes whenever an edit affects the picture or sound, so the preview is rebuilt.
    private var previewKey: String {
        let s = shots.map { "\($0.duration)|\($0.overlay ?? "")" }.joined(separator: ",")
        return "\(s)#\(runner.starts)#\(runner.keepSound)#\(runner.showTexts)#\(runner.clips.map { ObjectIdentifier($0).hashValue })"
    }

    private func rebuildPreview() async {
        guard let t = runner.edit, runner.clips.count == t.shots.count else { return }
        try? await Task.sleep(for: .milliseconds(200))
        guard !Task.isCancelled,
              let (composition, video) = try? await VideoAssembler.makeComposition(
                template: t, sourceURL: store.url(for: t), clips: runner.clips, starts: runner.starts,
                options: .init(keepOriginalSound: runner.keepSound, showTexts: runner.showTexts)) else { return }
        let item = AVPlayerItem(asset: composition)
        item.videoComposition = video
        player.replaceCurrentItem(with: item)
        await player.seek(to: CMTime(seconds: min(time, max(0, total - 0.05)), preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
        if playing { player.play() }
    }

    private func load() async {
        try? AVAudioSession.sharedInstance().setCategory(.playback)
        observer = player.addPeriodicTimeObserver(forInterval: CMTime(value: 1, timescale: 30), queue: .main) { t in
            MainActor.assumeIsolated {
                guard playing, dragStartTime == nil else { return }
                time = t.seconds
                if t.seconds >= total - 0.03 { player.pause(); playing = false }
            }
        }
        var lengths: [Double] = []
        for c in runner.clips { lengths.append((try? await c.load(.duration).seconds) ?? 0) }
        clipDurations = lengths
        rebuildStrips()
    }

    // MARK: Thumbnails

    private func stripKey(_ i: Int) -> String {
        guard runner.clips.indices.contains(i) else { return "\(i)" }
        return "\(ObjectIdentifier(runner.clips[i]).hashValue)-\(runner.starts[safe: i] ?? 0)-\(i)"
    }

    private func rebuildStrips() { for i in runner.clips.indices { refreshStrip(i) } }

    /// A row of frames across the part of the clip the shot uses (one every ~0.6 s, at least one).
    private func refreshStrip(_ i: Int) {
        guard runner.clips.indices.contains(i), let shot = shots[safe: i] else { return }
        let key = stripKey(i)
        if strips[key] != nil { return }
        let gen = AVAssetImageGenerator(asset: runner.clips[i])
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 90, height: 90)
        let start = runner.starts[safe: i] ?? 0
        let count = max(1, min(8, Int(shot.duration / 0.6) + 1))
        Task {
            var imgs: [UIImage] = []
            for k in 0..<count {
                let t = start + shot.duration * (Double(k) + 0.5) / Double(count)
                if let cg = try? await gen.image(at: CMTime(seconds: t, preferredTimescale: 600)).image { imgs.append(UIImage(cgImage: cg)) }
            }
            strips[key] = imgs
        }
    }

    private func clock(_ t: Double) -> String { String(format: "%02d:%02d", Int(t) / 60, Int(t) % 60) }
}
