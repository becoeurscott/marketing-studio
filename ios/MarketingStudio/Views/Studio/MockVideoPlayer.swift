import SwiftUI
import AVKit
import Combine

/// Video result player. Tries a free remote sample MP4 through AVKit; falls back to a poster + simulated scrubber.
struct MockVideoPlayer: View {
    var posterURL: String
    var duration: Int
    var ratio: String = "9:16"

    @StateObject private var engine = MockPlayerEngine()

    private var aspect: CGFloat { StudioOptions.aspect(ratio) }

    var body: some View {
        VStack(spacing: 10) {
            ZStack {
                RemoteImage(url: posterURL, contentMode: .fill, cornerRadius: MSRadius.lg)
                if engine.remoteReady, let player = engine.player {
                    VideoPlayer(player: player)
                        .disabled(true)
                        .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                        .opacity(engine.playing || engine.time > 0 ? 1 : 0)
                }
                if !engine.playing {
                    Button {
                        MSHaptic.tap()
                        engine.play(duration: duration)
                    } label: {
                        ZStack {
                            Circle().fill(.black.opacity(0.55)).frame(width: 64, height: 64)
                            Circle().strokeBorder(.white.opacity(0.35), lineWidth: 1).frame(width: 64, height: 64)
                            Image(systemName: "play.fill").font(.system(size: 24, weight: .bold)).foregroundStyle(.white).offset(x: 2)
                        }
                    }
                    .buttonStyle(MSPressStyle())
                }
                VStack {
                    HStack {
                        MSBadge(text: engine.remoteReady ? "Aperçu" : "Rendu simulé", tone: .neutral, icon: "video")
                        Spacer()
                        MSBadge(text: "\(duration)s · \(ratio)", tone: .neutral)
                    }
                    Spacer()
                }
                .padding(10)
            }
            .aspectRatio(aspect, contentMode: .fit)
            .frame(maxWidth: .infinity)
            .frame(maxHeight: 440)
            .contentShape(Rectangle())
            .onTapGesture { if engine.playing { engine.pause() } }

            scrubber
        }
        .onDisappear { engine.stop() }
    }

    private var scrubber: some View {
        HStack(spacing: 10) {
            Button {
                MSHaptic.tap()
                if engine.playing { engine.pause() } else { engine.play(duration: duration) }
            } label: {
                Image(systemName: engine.playing ? "pause.fill" : "play.fill")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(MSColor.text)
                    .frame(width: 32, height: 32)
                    .background(MSColor.card, in: Circle())
            }
            .buttonStyle(.plain)
            Text(timeString(engine.time)).font(MSFont.mono(12)).foregroundStyle(MSColor.text2)
            Slider(value: Binding(get: { engine.time }, set: { engine.seek(to: $0) }), in: 0...Double(max(duration, 1)))
                .tint(MSColor.accent)
            Text(timeString(Double(duration))).font(MSFont.mono(12)).foregroundStyle(MSColor.text2)
        }
    }

    private func timeString(_ t: Double) -> String {
        let s = Int(t.rounded())
        return String(format: "%d:%02d", s / 60, s % 60)
    }
}

/// Owns an AVPlayer for the sample clip and a timer-driven fallback clock.
@MainActor
final class MockPlayerEngine: ObservableObject {
    @Published var playing = false
    @Published var time: Double = 0
    @Published var remoteReady = false

    private(set) var player: AVPlayer?
    private var timer: AnyCancellable?
    private var statusObserver: AnyCancellable?
    private var duration = 10.0

    private static let sampleURL = URL(string: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4")!

    init() {
        let item = AVPlayerItem(url: Self.sampleURL)
        let p = AVPlayer(playerItem: item)
        p.isMuted = true
        player = p
        statusObserver = item.publisher(for: \.status)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                self?.remoteReady = (status == .readyToPlay)
            }
    }

    func play(duration: Int) {
        self.duration = Double(duration)
        if time >= self.duration { time = 0; player?.seek(to: .zero) }
        playing = true
        if remoteReady { player?.play() }
        timer = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect().sink { [weak self] _ in
            guard let self, self.playing else { return }
            self.time = min(self.time + 0.1, self.duration)
            if self.time >= self.duration { self.pause() }
        }
    }

    func pause() {
        playing = false
        player?.pause()
        timer?.cancel()
    }

    func seek(to t: Double) {
        time = t
        player?.seek(to: CMTime(seconds: t, preferredTimescale: 600))
    }

    func stop() {
        pause()
        time = 0
        player?.seek(to: .zero)
    }
}
