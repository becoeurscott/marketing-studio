import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// Receives a video shared from TikTok, Instagram or Photos and drops it in the App Group inbox.
/// The app turns it into a template the next time it opens "Modèles vidéo".
final class ShareViewController: UIViewController {
    private let state = ShareState()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        overrideUserInterfaceStyle = .dark
        let host = UIHostingController(rootView: ShareCard(state: state) { [weak self] in self?.finish() })
        host.view.backgroundColor = .black
        addChild(host)
        host.view.frame = view.bounds
        host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(host.view)
        host.didMove(toParent: self)
        Task { await receive() }
    }

    private func finish() { extensionContext?.completeRequest(returningItems: nil) }

    @MainActor private func receive() async {
        let providers = (extensionContext?.inputItems as? [NSExtensionItem])?.flatMap { $0.attachments ?? [] } ?? []
        guard let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.movie.identifier) }),
              let group = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.sokozia.app") else {
            state.status = .failed
            return
        }
        let inbox = group.appendingPathComponent("Inbox", isDirectory: true)
        try? FileManager.default.createDirectory(at: inbox, withIntermediateDirectories: true)
        provider.loadFileRepresentation(forTypeIdentifier: UTType.movie.identifier) { url, _ in
            var ok = false
            if let url {
                let ext = url.pathExtension.isEmpty ? "mp4" : url.pathExtension
                let dest = inbox.appendingPathComponent("\(UUID().uuidString).\(ext)")
                ok = (try? FileManager.default.copyItem(at: url, to: dest)) != nil
            }
            Task { @MainActor in self.state.status = ok ? .done : .failed }
        }
    }
}

@MainActor final class ShareState: ObservableObject {
    enum Status { case working, done, failed }
    @Published var status: Status = .working
}

private struct ShareCard: View {
    @ObservedObject var state: ShareState
    var close: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 14) {
                switch state.status {
                case .working:
                    ProgressView().tint(.green)
                    Text("Ajout de la vidéo…").font(.headline).foregroundStyle(.white)
                case .done:
                    Image(systemName: "checkmark.circle.fill").font(.system(size: 44)).foregroundStyle(Color(red: 0.82, green: 1, blue: 0.09))
                    Text("Modèle ajouté").font(.title3.bold()).foregroundStyle(.white)
                    Text("Ouvrez Marketing Studio › Modèles vidéo pour le remplir avec vos vidéos.")
                        .font(.subheadline).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                case .failed:
                    Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 40)).foregroundStyle(.orange)
                    Text("Vidéo non reçue").font(.title3.bold()).foregroundStyle(.white)
                    Text("Enregistrez d'abord la vidéo sur votre téléphone, puis partagez le fichier.")
                        .font(.subheadline).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                }
                if state.status != .working {
                    Button(action: close) {
                        Text("OK").font(.headline).foregroundStyle(.black)
                            .frame(maxWidth: .infinity).frame(height: 48)
                            .background(Color(red: 0.82, green: 1, blue: 0.09), in: RoundedRectangle(cornerRadius: 14))
                    }
                }
            }
            .padding(24)
            .background(Color(white: 0.1), in: RoundedRectangle(cornerRadius: 24))
            .padding(20)
        }
        .preferredColorScheme(.dark)
    }
}
