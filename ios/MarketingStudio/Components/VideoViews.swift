import AVFoundation
import AVKit
import SwiftUI

/// Only one clip plays with sound at a time (same rule as the web app's creator cards).
@MainActor
final class SoundCoordinator: ObservableObject {
    static let shared = SoundCoordinator()
    /// Id of the clip currently allowed to play sound (nil = everything muted).
    @Published var audibleId: String?

    func toggle(_ id: String) {
        audibleId = audibleId == id ? nil : id
        if audibleId != nil { try? AVAudioSession.sharedInstance().setCategory(.playback, options: [.mixWithOthers]) }
    }
}

/// Autoplaying, looping, chrome-less video (fills its frame). Plays only while on screen.
struct LoopingVideoView: View {
    var url: String
    var poster: String? = nil
    var muted: Bool = true
    var gravity: AVLayerVideoGravity = .resizeAspectFill

    @State private var player: AVQueuePlayer?
    @State private var looper: AVPlayerLooper?
    @State private var ready = false

    var body: some View {
        ZStack {
            if let poster, !poster.isEmpty, !ready {
                RemoteImage(url: poster, cornerRadius: 0)
            } else if !ready {
                MSColor.elevated
            }
            if let player {
                PlayerLayerView(player: player, gravity: gravity)
                    .opacity(ready ? 1 : 0)
            }
        }
        .clipped()
        .onAppear(perform: start)
        .onDisappear(perform: stop)
        .onChange(of: muted) { _, m in player?.isMuted = m }
        .onChange(of: url) { _, _ in stop(); start() }
    }

    private func start() {
        guard player == nil, let u = URL(string: url) else { return }
        let item = AVPlayerItem(url: u)
        let p = AVQueuePlayer()
        p.isMuted = muted
        p.preventsDisplaySleepDuringVideoPlayback = false
        looper = AVPlayerLooper(player: p, templateItem: item)
        player = p
        p.play()
        Task {
            // Show the video once the first frame is ready (the poster stays until then).
            for _ in 0..<100 {
                if p.currentItem?.status == .readyToPlay { withAnimation(.easeOut(duration: 0.25)) { ready = true }; return }
                try? await Task.sleep(for: .milliseconds(100))
            }
        }
    }

    private func stop() {
        player?.pause()
        looper = nil
        player = nil
        ready = false
    }
}

private struct PlayerLayerView: UIViewRepresentable {
    let player: AVPlayer
    var gravity: AVLayerVideoGravity

    final class LayerView: UIView {
        override static var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }

    func makeUIView(context: Context) -> LayerView {
        let v = LayerView()
        v.playerLayer.player = player
        v.playerLayer.videoGravity = gravity
        v.backgroundColor = .clear
        return v
    }

    func updateUIView(_ v: LayerView, context: Context) {
        v.playerLayer.player = player
        v.playerLayer.videoGravity = gravity
    }
}

/// A creator's intro clip, muted by default, with a speaker button. Unmuting one mutes the others.
struct CreatorIntroView: View {
    var creator: Creator
    var showSoundButton = true
    @ObservedObject private var sound = SoundCoordinator.shared

    private var muted: Bool { sound.audibleId != creator.id }

    var body: some View {
        LoopingVideoView(url: creator.introURL, poster: creator.avatarURL, muted: muted)
            .overlay(alignment: .bottomTrailing) {
                if showSoundButton {
                    Button {
                        MSHaptic.tap()
                        sound.toggle(creator.id)
                    } label: {
                        Image(systemName: muted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 30, height: 30)
                            .background(.black.opacity(0.55), in: Circle())
                    }
                    .buttonStyle(MSPressStyle())
                    .padding(8)
                    .accessibilityLabel(muted ? "Activer le son" : "Couper le son")
                }
            }
            .onDisappear { if sound.audibleId == creator.id { sound.audibleId = nil } }
    }
}

/// Generated video with playback controls; poster (or a neutral frame) until it plays.
struct ResultVideoPlayer: View {
    var url: String
    var poster: String? = nil
    @State private var player: AVPlayer?

    var body: some View {
        ZStack {
            MSColor.elevated
            if let player {
                VideoPlayer(player: player)
            } else if let poster, !poster.isEmpty {
                RemoteImage(url: poster, cornerRadius: 0)
            }
        }
        .onAppear {
            guard player == nil, let u = URL(string: url), !url.isEmpty else { return }
            try? AVAudioSession.sharedInstance().setCategory(.playback)
            let p = AVPlayer(url: u)
            player = p
            p.play()
        }
        .onDisappear { player?.pause() }
    }
}

/// Share a remote image/video: downloads it to a temporary file so apps like WhatsApp receive the media.
struct ShareMediaButton: View {
    var url: String
    var title: String = "Partager"
    var icon: String = "square.and.arrow.up"
    var style: MSButtonStyle = .secondary
    @State private var file: URL?
    @State private var loading = false
    @EnvironmentObject private var router: Router

    var body: some View {
        MSButton(title: title, icon: icon, style: style, isLoading: loading) { prepare() }
            .sheet(item: Binding(get: { file.map(ShareItem.init) }, set: { if $0 == nil { file = nil } })) { item in
                ActivityView(items: [item.url])
                    .presentationDetents([.medium, .large])
            }
    }

    private struct ShareItem: Identifiable { let url: URL; var id: String { url.absoluteString } }

    private func prepare() {
        guard !loading, let remote = URL(string: url) else { return }
        loading = true
        Task {
            defer { loading = false }
            do {
                let (tmp, _) = try await URLSession.shared.download(from: remote)
                let ext = remote.pathExtension.isEmpty ? (url.contains(".mp4") ? "mp4" : "jpg") : remote.pathExtension
                let dest = FileManager.default.temporaryDirectory.appendingPathComponent("sokozia-\(UUID().uuidString.prefix(6)).\(ext)")
                try? FileManager.default.removeItem(at: dest)
                try FileManager.default.moveItem(at: tmp, to: dest)
                file = dest
            } catch {
                router.toast("Téléchargement impossible. Vérifiez votre connexion.", style: .error)
            }
        }
    }
}

struct ActivityView: UIViewControllerRepresentable {
    var items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
