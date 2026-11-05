import AVFoundation
import AVKit
import SwiftUI

/// Trim the reference video before it becomes a template: drag the two handles over the
/// thumbnail strip, preview the selection, then cut (pass-through export, no re-encode).
struct VideoTrimmer: View {
    let url: URL
    var onSave: (URL) -> Void
    var onCancel: () -> Void

    @State private var duration: Double = 0
    @State private var start: Double = 0
    @State private var end: Double = 0
    @State private var thumbs: [UIImage] = []
    @State private var player = AVPlayer()
    @State private var cutting = false
    @State private var observer: Any?

    private let minLength = 1.0

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                VideoPlayer(player: player)
                    .aspectRatio(9.0 / 16.0, contentMode: .fit)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                HStack {
                    Text(String(format: "%.1f s", start)).font(.system(size: 12)).foregroundStyle(MSColor.muted)
                    Spacer()
                    Text(String(format: L("Sélection : %.1f s"), end - start)).font(MSFont.control(14)).foregroundStyle(MSColor.text)
                    Spacer()
                    Text(String(format: "%.1f s", end)).font(.system(size: 12)).foregroundStyle(MSColor.muted)
                }
                strip
                HStack(spacing: 10) {
                    Button { onSave(url) } label: {
                        Text("Utiliser la vidéo entière").font(MSFont.control(14)).foregroundStyle(MSColor.text)
                            .frame(maxWidth: .infinity).frame(height: 48)
                            .background(MSColor.card, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    }
                    Button { Task { await cut() } } label: {
                        Text(cutting ? "Découpe…" : "Couper et continuer").font(MSFont.control(14)).foregroundStyle(MSColor.onAccent)
                            .frame(maxWidth: .infinity).frame(height: 48)
                            .background(MSColor.accent, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
                    }
                    .disabled(cutting || duration == 0)
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.bottom, 8)
            .background(Color.black.ignoresSafeArea())
            .navigationTitle("Couper la vidéo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Annuler") { player.pause(); onCancel() } } }
            .task { await load() }
            .onDisappear {
                player.pause()
                if let observer { player.removeTimeObserver(observer) }
            }
        }
        .preferredColorScheme(.dark)
    }

    private var strip: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let x0 = duration > 0 ? CGFloat(start / duration) * w : 0
            let x1 = duration > 0 ? CGFloat(end / duration) * w : w
            ZStack(alignment: .leading) {
                HStack(spacing: 0) {
                    ForEach(Array(thumbs.enumerated()), id: \.offset) { _, img in
                        Image(uiImage: img).resizable().scaledToFill()
                            .frame(width: w / CGFloat(max(thumbs.count, 1)), height: 56).clipped()
                    }
                }
                .frame(width: w, height: 56, alignment: .leading)
                .background(Color.white.opacity(0.06))
                Rectangle().fill(.black.opacity(0.6)).frame(width: x0, height: 56)
                Rectangle().fill(.black.opacity(0.6)).frame(width: max(0, w - x1), height: 56).offset(x: x1)
                RoundedRectangle(cornerRadius: 6).strokeBorder(MSColor.accent, lineWidth: 3)
                    .frame(width: max(12, x1 - x0), height: 56).offset(x: x0)
                handle.offset(x: x0 - 8)
                    .gesture(DragGesture().onChanged { v in
                        let t = Double(min(max(0, v.location.x), w) / w) * duration
                        start = min(t, end - minLength)
                        seek(start)
                    })
                handle.offset(x: x1 - 8)
                    .gesture(DragGesture().onChanged { v in
                        let t = Double(min(max(0, v.location.x), w) / w) * duration
                        end = max(t, start + minLength)
                        seek(max(start, end - 1))
                    })
            }
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        .frame(height: 56)
    }

    private var handle: some View {
        RoundedRectangle(cornerRadius: 4).fill(MSColor.accent).frame(width: 16, height: 56)
            .overlay(Capsule().fill(MSColor.onAccent).frame(width: 3, height: 18))
            .contentShape(Rectangle().inset(by: -12))
    }

    private func load() async {
        let asset = AVURLAsset(url: url)
        duration = (try? await asset.load(.duration).seconds) ?? 0
        end = duration
        try? AVAudioSession.sharedInstance().setCategory(.playback)
        player.replaceCurrentItem(with: AVPlayerItem(asset: asset))
        // Loop inside the selection while previewing.
        observer = player.addPeriodicTimeObserver(forInterval: CMTime(value: 1, timescale: 10), queue: .main) { time in
            MainActor.assumeIsolated { if time.seconds >= end { seek(start) } }
        }
        player.play()
        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 120, height: 120)
        let count = 10
        var images: [UIImage] = []
        for i in 0..<count {
            let t = CMTime(seconds: duration * (Double(i) + 0.5) / Double(count), preferredTimescale: 600)
            if let cg = try? await gen.image(at: t).image { images.append(UIImage(cgImage: cg)) }
        }
        thumbs = images
    }

    private func seek(_ t: Double) {
        player.seek(to: CMTime(seconds: t, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
    }

    private func cut() async {
        guard end - start < duration - 0.05 else { onSave(url); return }
        cutting = true
        defer { cutting = false }
        let asset = AVURLAsset(url: url)
        let out = FileManager.default.temporaryDirectory.appendingPathComponent("trim-\(UUID().uuidString).mp4")
        guard let export = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetPassthrough) else { onSave(url); return }
        export.outputURL = out
        export.outputFileType = .mp4
        export.timeRange = CMTimeRange(start: CMTime(seconds: start, preferredTimescale: 600), end: CMTime(seconds: end, preferredTimescale: 600))
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in export.exportAsynchronously { cont.resume() } }
        player.pause()
        onSave(export.status == .completed ? out : url)
    }
}
