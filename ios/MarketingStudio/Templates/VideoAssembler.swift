import AVFoundation
import CoreImage
import UIKit

/// Rebuilds a template with the user's clips: same shot durations, same texts at the same time,
/// optional original sound, vertical 1080×1920 MP4.
enum VideoAssembler {
    static let renderSize = CGSize(width: 1080, height: 1920)

    struct Options { var keepOriginalSound = true; var showTexts = true }

    static func assemble(template: VideoTemplate, sourceURL: URL, clips: [AVAsset], options: Options) async throws -> URL {
        guard clips.count == template.shots.count else { throw TemplateError.noClip }
        let composition = AVMutableComposition()
        guard let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else { throw TemplateError.exportFailed }
        let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
        var segments: [(range: CMTimeRange, transform: CGAffineTransform)] = []

        var cursor = CMTime.zero
        let useOriginalSound = options.keepOriginalSound && template.hasAudio
        for (shot, asset) in zip(template.shots, clips) {
            guard let track = try await asset.loadTracks(withMediaType: .video).first else { throw TemplateError.noClip }
            let clipDuration = try await asset.load(.duration)
            let want = CMTime(seconds: shot.duration, preferredTimescale: 600)
            let used = CMTimeMinimum(clipDuration, want)
            let range = CMTimeRange(start: .zero, duration: used)
            try videoTrack.insertTimeRange(range, of: track, at: cursor)
            if !useOriginalSound, let a = try await asset.loadTracks(withMediaType: .audio).first {
                try? audioTrack?.insertTimeRange(range, of: a, at: cursor)
            }
            if used < want {
                let inserted = CMTimeRange(start: cursor, duration: used)
                videoTrack.scaleTimeRange(inserted, toDuration: want)
                if !useOriginalSound { audioTrack?.scaleTimeRange(inserted, toDuration: want) }
            }
            let size = try await track.load(.naturalSize)
            let transform = try await track.load(.preferredTransform)
            segments.append((CMTimeRange(start: cursor, duration: want), fill(size: size, transform: transform)))
            cursor = cursor + want
        }

        if useOriginalSound {
            let source = AVURLAsset(url: sourceURL)
            if let a = try await source.loadTracks(withMediaType: .audio).first {
                let sourceDuration = try await source.load(.duration)
                try? audioTrack?.insertTimeRange(CMTimeRange(start: .zero, duration: CMTimeMinimum(sourceDuration, cursor)), of: a, at: .zero)
            }
        }

        // Frames are framed and captioned with Core Image (the Core Animation tool crashes on some devices).
        let captions = options.showTexts ? captionImages(template) : [:]
        let size = renderSize
        let video = AVMutableVideoComposition(asset: composition) { request in
            let time = request.compositionTime
            let source = request.sourceImage
            let segment = segments.last { CMTimeCompare($0.range.start, time) <= 0 } ?? segments[0]
            let h = source.extent.height
            // Track transforms use top-left origin; Core Image uses bottom-left.
            let flipIn = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: h)
            let flipOut = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: size.height)
            var frame = source.transformed(by: flipIn.concatenating(segment.transform).concatenating(flipOut))
                .cropped(to: CGRect(origin: .zero, size: size))
            frame = frame.composited(over: CIImage(color: .black).cropped(to: CGRect(origin: .zero, size: size)))
            let index = segments.firstIndex { $0.range.containsTime(time) } ?? (segments.count - 1)
            if let caption = captions[index] { frame = caption.composited(over: frame) }
            request.finish(with: frame, context: nil)
        }
        video.renderSize = size
        video.frameDuration = CMTime(value: 1, timescale: 30)

        let out = FileManager.default.temporaryDirectory.appendingPathComponent("template-\(UUID().uuidString).mp4")
        guard let export = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else { throw TemplateError.exportFailed }
        export.outputURL = out
        export.outputFileType = .mp4
        export.videoComposition = video
        export.shouldOptimizeForNetworkUse = true
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            export.exportAsynchronously { cont.resume() }
        }
        guard export.status == .completed else { throw TemplateError.exportFailed }
        return out
    }

    /// Aspect-fill the clip into the vertical frame, whatever its orientation.
    private static func fill(size: CGSize, transform: CGAffineTransform) -> CGAffineTransform {
        let rect = CGRect(origin: .zero, size: size).applying(transform)
        let oriented = CGSize(width: abs(rect.width), height: abs(rect.height))
        let scale = max(renderSize.width / oriented.width, renderSize.height / oriented.height)
        let scaled = transform.concatenating(CGAffineTransform(scaleX: scale, y: scale))
        let box = CGRect(origin: .zero, size: size).applying(scaled)
        let dx = (renderSize.width - box.width) / 2 - box.minX
        let dy = (renderSize.height - box.height) / 2 - box.minY
        return scaled.concatenating(CGAffineTransform(translationX: dx, y: dy))
    }

    /// One full-frame transparent image per captioned shot (text in a dark rounded box, lower third).
    private static func captionImages(_ template: VideoTemplate) -> [Int: CIImage] {
        var out: [Int: CIImage] = [:]
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = false
        let renderer = UIGraphicsImageRenderer(size: renderSize, format: format)
        for (i, shot) in template.shots.enumerated() {
            guard let text = shot.overlay, !text.isEmpty else { continue }
            let image = renderer.image { _ in
                let style = NSMutableParagraphStyle()
                style.alignment = .center
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 64, weight: .heavy),
                    .foregroundColor: UIColor.white,
                    .paragraphStyle: style,
                ]
                let maxWidth = renderSize.width - 200
                let bounds = (text as NSString).boundingRect(with: CGSize(width: maxWidth, height: 600), options: [.usesLineFragmentOrigin], attributes: attrs, context: nil)
                let box = CGRect(x: (renderSize.width - bounds.width) / 2 - 36, y: renderSize.height * 0.68,
                                 width: bounds.width + 72, height: bounds.height + 40)
                UIColor.black.withAlphaComponent(0.45).setFill()
                UIBezierPath(roundedRect: box, cornerRadius: 24).fill()
                (text as NSString).draw(with: box.insetBy(dx: 36, dy: 20), options: [.usesLineFragmentOrigin], attributes: attrs, context: nil)
            }
            if let cg = image.cgImage { out[i] = CIImage(cgImage: cg) }
        }
        return out
    }
}
