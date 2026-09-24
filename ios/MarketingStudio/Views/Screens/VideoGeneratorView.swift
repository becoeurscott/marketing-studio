import SwiftUI

/// SPEC §14. Source image → concept → duration / ratio / camera / style → staged progress → mock player.
struct VideoGeneratorView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @StateObject private var session = VideoGenSession()
    @State private var showUpload = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Video Generator").msTitle(28)
                    Text("Turn a still into a 5–15 second motion clip.").msBody(15)
                }
                switch session.phase {
                case .generating(let step):
                    VStack(spacing: 20) {
                        if let s = session.sourceAsset {
                            RemoteImage(url: s.imageURL, cornerRadius: MSRadius.md).frame(width: 100, height: 130)
                                .overlay(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous).strokeBorder(MSColor.accent.opacity(0.5), lineWidth: 1))
                        }
                        ProgressIndicator(steps: MockAPI.videoSteps, currentStep: step, title: "Generating \(session.duration)s \(session.style.lowercased()) video")
                    }
                    .frame(maxWidth: .infinity)
                    .msCard(padding: 20)
                case .result:
                    if let r = session.result {
                        VStack(spacing: 12) {
                            MockVideoPlayer(posterURL: r.posterURL, duration: r.duration, ratio: r.ratio)
                            resultActions(r)
                        }
                    }
                case .failed(let f):
                    GenerationErrorView(failure: f, retry: { generate() }, back: { router.select(.studio) })
                        .msCard()
                case .idle:
                    EmptyView()
                }
                if !session.isGenerating {
                    VideoOptionsForm(session: session, full: true) { showUpload = true }
                        .msCard()
                    MSButton(title: "Generate Video · \(VideoGenSession.cost) credits", icon: "video.fill", isDisabled: !session.canGenerate) { generate() }
                    Text("Balance: \(store.credits.formatted()) credits · \(session.duration)s at \(session.ratio)").msCaption()
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Video Generator")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .msSheet(isPresented: $showUpload, detents: [.large]) {
            UploadProductSheet { asset in withAnimation(MSAnimation.snappy) { session.sourceAsset = asset } }
        }
    }

    private func resultActions(_ r: VideoResult) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                pill("Download", "arrow.down.to.line") { router.toast("Saved to Photos", style: .success, icon: "checkmark.circle.fill") }
                let fav = store.isFavorite(.asset, r.assetId)
                pill(fav ? "Favorited" : "Favorite", fav ? "heart.fill" : "heart", tint: fav ? MSColor.danger : nil) {
                    store.toggleFavorite(.asset, r.assetId)
                }
                pill("Regenerate", "arrow.clockwise") { generate() }
                pill("Export", "square.and.arrow.down") { router.present(.exportAssets(ids: [r.assetId])) }
                pill("New", "plus") { withAnimation(MSAnimation.gentle) { session.reset() } }
            }
        }
    }

    private func pill(_ title: String, _ icon: String, tint: Color? = nil, run: @escaping () -> Void) -> some View {
        Button {
            MSHaptic.tap()
            run()
        } label: {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 12, weight: .semibold))
                Text(title).font(MSFont.control(12))
            }
            .foregroundStyle(tint ?? MSColor.text)
            .padding(.horizontal, 11)
            .frame(height: 32)
            .background(MSColor.card, in: Capsule())
            .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }

    private func generate() {
        Task { await session.generate(store: store, router: router) }
    }
}
