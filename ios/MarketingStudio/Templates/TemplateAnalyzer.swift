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
        var template = VideoTemplate(id: id, name: described?.name ?? L("Mon modèle"), style: described?.style ?? "",
                                     createdAt: Date(), shots: shots, sourceFile: fileName, hasAudio: hasAudio)
        template.captionStyle = await captionStyle(asset: asset, shots: shots, look: described?.caption)
        store.add(template)
        return template
    }
}

extension TemplateAnalyzer {
    /// Measures the caption on a sharp frame of the first captioned shot (position, size, colours) and
    /// combines it with the AI's font/weight/animation guess.
    static func captionStyle(asset: AVAsset, shots: [TemplateShot], look: TemplateDescription.Caption?) async -> CaptionStyle? {
        let captioned = shots.filter { $0.overlay != nil }
        guard !captioned.isEmpty else { return nil }
        var style = CaptionStyle.default
        if let look {
            style.font = look.font
            style.weight = look.weight
            style.uppercase = look.uppercase
            style.shadow = look.shadow
            style.animation = look.animation
        }
        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 1080, height: 1080)
        // Measure on up to 4 captioned shots (spread out) and keep the clearest one: white text on a
        // bright sky reads badly, the same text on a dark shot gives its true colour.
        let picks = stride(from: 0, to: captioned.count, by: max(1, captioned.count / 4)).prefix(4).map { captioned[$0] }
        var best: (CaptionDetector.Measure, CGImage)?
        for shot in picks {
            // A bit after the cut, when pop-in captions have settled.
            let at = CMTime(seconds: shot.start + min(shot.duration * 0.6, max(0.15, shot.duration - 0.05)), preferredTimescale: 600)
            guard let frame = try? await gen.image(at: at).image,
                  let m = await CaptionDetector.measure(UIImage(cgImage: frame), text: shot.overlay) else { continue }
            if best == nil || m.contrast > best!.0.contrast { best = (m, frame) }
        }
        guard let (m, cg) = best else { return style }
        // Map from the source frame to the vertical canvas: the source is shown full width, so a
        // landscape video only covers the middle band (dh < 1); a 9:16 one covers it all (dh = 1).
        let dh = min(1, (Double(cg.height) / Double(cg.width)) * (9.0 / 16.0))
        style.centerX = m.centerX
        style.centerY = 0.5 + (m.centerY - 0.5) * dh
        style.lineHeight = m.lineHeight * dh
        style.textColor = m.textColor.hex
        if let box = m.boxColor { style.boxColor = box.hex }
        if look?.outline == true {
            // The darker of black/white against the text colour.
            var b: CGFloat = 0
            m.textColor.getWhite(&b, alpha: nil)
            style.outlineColor = b > 0.5 ? "#000000" : "#FFFFFF"
        }
        return style
    }
}

extension Array {
    subscript(safe i: Int) -> Element? { indices.contains(i) ? self[i] : nil }
}
