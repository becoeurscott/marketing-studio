import AVFoundation
import UIKit

/// Turns a shared video into a template: cuts on the phone, one keyframe per shot to the server
/// for the "what to film" instructions and on-screen texts.
@MainActor
enum TemplateAnalyzer {
    static func makeTemplate(from source: URL, store: TemplateStore, progress: @escaping (Double) -> Void) async throws -> VideoTemplate {
        let id = UUID().uuidString
        let fileName = "\(id).\(source.pathExtension.isEmpty ? "mp4" : source.pathExtension.lowercased())"
        let local = store.folder.appendingPathComponent(fileName)
        try? FileManager.default.removeItem(at: local)
        try FileManager.default.copyItem(at: source, to: local)

        let cuts = try await CutDetector.detect(local, progress: progress)
        let asset = AVURLAsset(url: local)
        let hasAudio = !((try? await asset.loadTracks(withMediaType: .audio)) ?? []).isEmpty
        let language = Locale.preferredLanguages.first?.hasPrefix("en") == true ? "en" : "fr"

        var described: TemplateDescription?
        let frames = cuts.prefix(30).map { shot -> TemplateDescribeRequest.Shot in
            let data = shot.keyframe.jpegData(compressionQuality: 0.6) ?? Data()
            return .init(duration: shot.duration, frame: data.base64EncodedString())
        }
        described = try? await APIClient.describeTemplate(TemplateDescribeRequest(language: language, shots: Array(frames)))
        progress(1)

        let shots = cuts.enumerated().map { i, c in
            let d = described?.shots[safe: i]
            return TemplateShot(index: i, start: c.start, duration: c.duration,
                                description: d?.description ?? L("Filmez votre produit"),
                                overlay: d?.overlay, framing: d?.framing ?? "medium")
        }
        let template = VideoTemplate(id: id, name: described?.name ?? L("Mon modèle"), style: described?.style ?? "",
                                     createdAt: Date(), shots: shots, sourceFile: fileName, hasAudio: hasAudio)
        store.add(template)
        return template
    }
}

extension Array {
    subscript(safe i: Int) -> Element? { indices.contains(i) ? self[i] : nil }
}
