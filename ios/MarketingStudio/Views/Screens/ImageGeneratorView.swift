import SwiftUI

/// SPEC §11–13. Standalone image generator: full inputs → "Creating your visual..." → 4-result gallery.
/// Shares `ImageGenSession`, `ImageOptionsForm` and `ImageResultsView` with the Studio canvas.
struct ImageGeneratorView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var router: Router
    @StateObject private var session = ImageGenSession()
    @State private var showUpload = false
    @State private var applied = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Image Generator").msTitle(28)
                    Text("Product visuals in any style, four at a time.").msBody(15)
                }
                switch session.phase {
                case .generating:
                    CreatingVisualView(aspect: StudioOptions.aspect(session.ratio))
                    SkeletonGrid(count: 4, columns: 4, aspect: 1)
                case .results:
                    ImageResultsView(session: session, compact: false) { generate() }
                    resultsFooter
                case .failed(let f):
                    GenerationErrorView(failure: f, retry: { generate() }, back: { router.select(.studio) })
                        .msCard()
                case .idle:
                    EmptyView()
                }
                if session.phase != .generating {
                    ImageOptionsForm(session: session, full: true) { showUpload = true }
                        .msCard()
                    MSButton(title: "Generate · \(ImageGenSession.cost) credits", icon: "sparkles", isDisabled: !session.canGenerate) { generate() }
                    Text("Balance: \(store.credits.formatted()) credits · 4 variations per run").msCaption()
                }
            }
            .padding(.horizontal, MSSpacing.gutter)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .msScreen()
        .navigationTitle("Image Generator")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { MSTopBarItems() }
        .onAppear {
            guard !applied else { return }
            applied = true
            session.style = store.preferences.defaultStyle
            session.ratio = store.preferences.defaultRatio
            session.model = store.preferences.defaultModel
        }
        .msSheet(isPresented: $showUpload, detents: [.large]) {
            UploadProductSheet { asset in withAnimation(MSAnimation.snappy) { session.productAsset = asset } }
        }
    }

    private var resultsFooter: some View {
        HStack(spacing: 10) {
            MSButton(title: "Open in Studio", icon: "sparkles", style: .secondary, size: .compact) {
                router.select(.studio)
            }
            MSButton(title: "New generation", icon: "plus", style: .secondary, size: .compact) {
                withAnimation(MSAnimation.gentle) { session.reset() }
            }
        }
    }

    private func generate() {
        Task { await session.generate(store: store, router: router) }
    }
}
