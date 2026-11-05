import AVFoundation
import AVKit
import SwiftUI

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
        guard player == nil, !url.isEmpty, let u = URL(string: url), u.scheme != nil else { return }
        let item = AVPlayerItem(url: u)
        let p = AVQueuePlayer()
        p.isMuted = muted
        // Audible clips (full-screen trending player) must play even with the silent switch on.
        if !muted { try? AVAudioSession.sharedInstance().setCategory(.playback) }
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

/// A creator's intro clip: silent looping preview (no sound in the app).
struct CreatorIntroView: View {
    var creator: Creator

    var body: some View {
        LoopingVideoView(url: creator.introURL, poster: creator.avatarURL, muted: true)
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

/// Silent UGC showcase clips hosted with the website (public/showcase/ugc).
enum Showcase {
    static let allVideos = [
        "temoignage-karite", "atelier-couture", "degustation-maquis",
        "vendeuse-marche-wax", "grwm-perruque", "unboxing-telephone",
        "avant-apres-savon-noir", "livraison-whatsapp", "micro-trottoir-garba", "promo-tabaski"
    ]
    static func video(_ name: String) -> String { "\(SokoziaConfig.siteURL.absoluteString)/showcase/ugc/\(name).mp4" }
    static func poster(_ name: String) -> String { "\(SokoziaConfig.siteURL.absoluteString)/showcase/ugc/\(name).jpg" }
}

/// A swipeable carousel of every showcase video, with a duplicate end card for a seamless loop.
struct ShowcaseCarousel: View {
    var height: CGFloat = 340
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var position: Int? = 0
    @GestureState private var dragging = false

    private var clips: [String] { Showcase.allVideos + [Showcase.allVideos[0]] }

    var body: some View {
        GeometryReader { geometry in
            let cardWidth = height * 9 / 16
            ScrollView(.horizontal) {
                LazyHStack(spacing: 14) {
                    ForEach(Array(clips.enumerated()), id: \.offset) { index, name in
                        LoopingVideoView(url: Showcase.video(name), poster: Showcase.poster(name))
                            .frame(width: cardWidth, height: height)
                            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 22, style: .continuous)
                                    .strokeBorder(Color.white.opacity(0.10), lineWidth: 1)
                            }
                            .id(index)
                            .accessibilityLabel("Vidéo \(index % Showcase.allVideos.count + 1) sur \(Showcase.allVideos.count)")
                    }
                }
                .scrollTargetLayout()
            }
            .contentMargins(.horizontal, max(0, (geometry.size.width - cardWidth) / 2), for: .scrollContent)
            .scrollIndicators(.hidden)
            .scrollTargetBehavior(.viewAligned)
            .scrollPosition(id: $position, anchor: .center)
            .simultaneousGesture(DragGesture().updating($dragging) { _, state, _ in state = true })
        }
        .frame(height: height)
        .task(id: scenePhase) {
            guard scenePhase == .active, !reduceMotion else { return }
            while !Task.isCancelled {
                do { try await Task.sleep(for: .seconds(4)) } catch { return }
                guard !dragging else { continue }
                let next = min((position ?? 0) + 1, Showcase.allVideos.count)
                withAnimation(.easeInOut(duration: 0.65)) { position = next }
                if next == Showcase.allVideos.count {
                    do { try await Task.sleep(for: .milliseconds(750)) } catch { return }
                    guard !dragging, position == next else { continue }
                    var reset = Transaction()
                    reset.disablesAnimations = true
                    withTransaction(reset) { position = 0 }
                }
            }
        }
    }
}

/// Higgsfield-style wall of looping, muted showcase videos in staggered columns that drift slowly.
struct ShowcaseWall: View {
    var names: [String] = ["vendeuse-marche-wax", "grwm-perruque", "unboxing-telephone"]
    var height: CGFloat = 380
    @State private var drift = false

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            ForEach(Array(names.enumerated()), id: \.offset) { i, n in
                LoopingVideoView(url: Showcase.video(n), poster: Showcase.poster(n))
                    .aspectRatio(9.0 / 16.0, contentMode: .fit)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
                    .offset(y: (i == 1 ? 34 : 0) + (drift ? (i == 1 ? -14 : 10) : 0))
            }
        }
        .frame(height: height, alignment: .top)
        .clipped()
        .mask(LinearGradient(stops: [.init(color: .black, location: 0), .init(color: .black, location: 0.7), .init(color: .clear, location: 1)], startPoint: .top, endPoint: .bottom))
        .onAppear {
            guard !MSAnimation.reduced else { return }
            withAnimation(.easeInOut(duration: 6).repeatForever(autoreverses: true)) { drift = true }
        }
        .accessibilityHidden(true)
    }
}

/// Full-screen background: muted showcase clips that cross-fade to the next one every few seconds.
struct BackgroundVideoCycler: View {
    var names: [String] = ["vendeuse-marche-wax", "grwm-perruque", "unboxing-telephone", "temoignage-karite", "atelier-couture", "degustation-maquis", "livraison-whatsapp"]
    var interval: Double = 5
    @State private var index = 0

    var body: some View {
        ZStack {
            Color.black
            LoopingVideoView(url: Showcase.video(names[index]), poster: Showcase.poster(names[index]))
                .id(index)
                .transition(.opacity)
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(interval))
                withAnimation(.easeInOut(duration: 1.0)) { index = (index + 1) % names.count }
            }
        }
        .accessibilityHidden(true)
    }
}

/// Endless horizontal strip of showcase videos (same idea as the website's "Créations" marquee):
/// cards drift left at a constant speed and loop seamlessly.
struct VideoMarquee: View {
    struct Card: Hashable { var video: String; var title: String; var tag: String; var platform: String; var price: String? }

    static let cards: [Card] = [
        .init(video: "vendeuse-marche-wax", title: "Nouvel arrivage wax", tag: "Vidéo UGC", platform: "Statut WhatsApp", price: "15 000 FCFA"),
        .init(video: "grwm-perruque", title: "Perruque lisse 22\"", tag: "Get ready with me", platform: "Instagram", price: "45 000 FCFA"),
        .init(video: "unboxing-telephone", title: "Boutique de téléphones", tag: "Déballage", platform: "Facebook", price: "95 000 FCFA"),
        .init(video: "temoignage-karite", title: "Beurre de karité pur", tag: "Témoignage", platform: "TikTok", price: "7 500 FCFA"),
        .init(video: "degustation-maquis", title: "Garba du quartier", tag: "Dégustation", platform: "TikTok", price: nil),
        .init(video: "atelier-couture", title: "Atelier couture", tag: "Démo produit", platform: "Instagram", price: "25 000 FCFA"),
    ]

    var cardWidth: CGFloat = 150
    var spacing: CGFloat = 10
    /// Points per second.
    var speed: Double = 28

    private var rowWidth: CGFloat { CGFloat(Self.cards.count) * (cardWidth + spacing) }

    var body: some View {
        GeometryReader { geo in
            TimelineView(.animation(paused: MSAnimation.reduced)) { ctx in
                let x = CGFloat((ctx.date.timeIntervalSinceReferenceDate * speed).truncatingRemainder(dividingBy: Double(rowWidth)))
                let mid = geo.size.width / 2
                HStack(spacing: spacing) {
                    ForEach(Array((Self.cards + Self.cards).enumerated()), id: \.offset) { i, c in
                        let center = CGFloat(i) * (cardWidth + spacing) + cardWidth / 2 - x
                        let signed = max(-1, min(1, (center - mid) / max(mid, 1)))
                        let d = abs(signed)
                        let eased = d * d * (3 - 2 * d)
                        card(c)
                            .scaleEffect(0.72 + 0.28 * eased)
                            .rotation3DEffect(.degrees(Double(-signed) * 28), axis: (x: 0, y: 1, z: 0), perspective: 0.6)
                            .zIndex(Double(d))
                    }
                }
                .fixedSize()
                .offset(x: -x)
                .frame(width: geo.size.width, height: geo.size.height, alignment: .leading)
            }
        }
        .frame(height: cardWidth * 16 / 9)
        .clipped()
        .mask(LinearGradient(stops: [.init(color: .clear, location: 0), .init(color: .black, location: 0.08), .init(color: .black, location: 0.92), .init(color: .clear, location: 1)], startPoint: .leading, endPoint: .trailing))
        .accessibilityHidden(true)
    }

    private func card(_ c: Card) -> some View {
        LoopingVideoView(url: Showcase.video(c.video), poster: Showcase.poster(c.video))
            .frame(width: cardWidth, height: cardWidth * 16 / 9)
            .overlay(LinearGradient(colors: [.clear, .black.opacity(0.75)], startPoint: .center, endPoint: .bottom))
            .overlay(alignment: .topLeading) {
                Text(L(c.tag))
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(.black.opacity(0.45), in: Capsule())
                    .padding(8)
            }
            .overlay(alignment: .bottomLeading) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(L(c.title)).font(.system(size: 13, weight: .bold)).foregroundStyle(.white).lineLimit(1)
                    HStack(spacing: 4) {
                        Text(L(c.platform)).font(.system(size: 10)).foregroundStyle(.white.opacity(0.7))
                        if let p = c.price {
                            Text("· \(p)").font(.system(size: 10, weight: .semibold)).foregroundStyle(MSColor.highlight)
                        }
                    }
                }
                .padding(10)
            }
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
    }
}
