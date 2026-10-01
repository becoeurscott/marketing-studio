import SwiftUI

/// Generated video result: the real file with playback controls, framed at its ratio, plus share.
struct GeneratedVideoView: View {
    var videoURL: String
    var posterURL: String
    var duration: Int
    var ratio: String = "9:16"

    private var aspect: CGFloat { StudioOptions.aspect(ratio) }

    var body: some View {
        VStack(spacing: 10) {
            ResultVideoPlayer(url: videoURL, poster: posterURL)
                .aspectRatio(aspect, contentMode: .fit)
                .frame(maxWidth: .infinity)
                .frame(maxHeight: 460)
                .clipShape(RoundedRectangle(cornerRadius: MSRadius.lg, style: .continuous))
                .overlay(alignment: .topLeading) {
                    MSBadge(text: "\(duration)s · \(ratio)", tone: .overlay, icon: "video").padding(10).allowsHitTesting(false)
                }
            if !videoURL.isEmpty {
                HStack(spacing: 8) {
                    ShareMediaButton(url: videoURL, title: "Partager")
                    ShareMediaButton(url: videoURL, title: "WhatsApp", icon: "message.fill", style: .primary)
                }
            }
        }
    }
}
