import AVFoundation
import CoreImage
import UIKit

/// Rebuilds a template with the user's clips: same shot durations, same texts at the same time,
/// optional original sound, vertical 1080×1920 MP4.
enum VideoAssembler {
    static let renderSize = CGSize(width: 1080, height: 1920)

    struct Options { var keepOriginalSound = true; var showTexts = true }

    static func assemble(template: VideoTemplate, sourceURL: URL, clips: [AVAsset], starts: [Double] = [], options: Options) async throws -> URL {
        let (composition, video) = try await makeComposition(template: template, sourceURL: sourceURL, clips: clips, starts: starts, options: options)
        return try await export(composition, video: video)
    }

    /// Builds the edit in memory: playable right away in the editor (`AVPlayerItem`), exported later.
    static func makeComposition(template: VideoTemplate, sourceURL: URL, clips: [AVAsset], starts: [Double] = [], options: Options) async throws -> (AVComposition, AVVideoComposition) {
        guard clips.count == template.shots.count else { throw TemplateError.noClip }
        let composition = AVMutableComposition()
        guard let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else { throw TemplateError.exportFailed }
        let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
        var segments: [(range: CMTimeRange, transform: CGAffineTransform)] = []

        var cursor = CMTime.zero
        let useOriginalSound = options.keepOriginalSound && template.hasAudio
        for (i, (shot, asset)) in zip(template.shots, clips).enumerated() {
            guard let track = try await asset.loadTracks(withMediaType: .video).first else { throw TemplateError.noClip }
            let clipDuration = try await asset.load(.duration)
            let want = CMTime(seconds: shot.duration, preferredTimescale: 600)
            // Start inside the clip (from the timeline editor); keep at least 0.2 s of footage.
            let maxStart = max(0, clipDuration.seconds - 0.2)
            let start = CMTime(seconds: min(max(0, starts.indices.contains(i) ? starts[i] : 0), maxStart), preferredTimescale: 600)
            let used = CMTimeMinimum(clipDuration - start, want)
            let range = CMTimeRange(start: start, duration: used)
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
        let pop = template.captionStyle?.animation == "pop"
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
            if let caption = captions[index] {
                var image = caption.image
                let local = (time - segments[index].range.start).seconds
                if pop, local < 0.2 {
                    // Pop-in: grow from 60 % to full size over the first 0.2 s of the shot.
                    let p = local / 0.2
                    let scale = 0.6 + 0.4 * (1 - (1 - p) * (1 - p))
                    let c = caption.center
                    image = image.transformed(by: CGAffineTransform(translationX: -c.x, y: -c.y)
                        .concatenating(CGAffineTransform(scaleX: scale, y: scale))
                        .concatenating(CGAffineTransform(translationX: c.x, y: c.y)))
                }
                frame = image.composited(over: frame)
            }
            request.finish(with: frame, context: nil)
        }
        video.renderSize = size
        video.frameDuration = CMTime(value: 1, timescale: 30)
        return (composition, video)
    }

    static func export(_ composition: AVComposition, video: AVVideoComposition) async throws -> URL {

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
    /// One full-frame transparent image per captioned shot, drawn in the template's caption style,
    /// plus the caption's centre (Core Image coordinates) for the pop-in animation.
    private static func captionImages(_ template: VideoTemplate) -> [Int: (image: CIImage, center: CGPoint)] {
        var out: [Int: (CIImage, CGPoint)] = [:]
        let look = template.captionStyle ?? .default
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = false
        let renderer = UIGraphicsImageRenderer(size: renderSize, format: format)
        let fontSize = min(150, max(34, CGFloat(look.lineHeight) * renderSize.height * 1.15))
        let font = CaptionFonts.font(look.font, weight: look.weight, size: fontSize)
        let textColor = UIColor(hexString: look.textColor) ?? .white
        for (i, shot) in template.shots.enumerated() {
            guard var text = shot.overlay, !text.isEmpty else { continue }
            if look.uppercase { text = text.uppercased() }
            var center = CGPoint.zero
            let image = renderer.image { _ in
                let paragraph = NSMutableParagraphStyle()
                paragraph.alignment = .center
                var attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: textColor, .paragraphStyle: paragraph]
                if let outline = UIColor(hexString: look.outlineColor) {
                    attrs[.strokeColor] = outline
                    attrs[.strokeWidth] = -6
                }
                if look.shadow && look.boxColor == nil {
                    let shadow = NSShadow()
                    shadow.shadowColor = UIColor.black.withAlphaComponent(0.55)
                    shadow.shadowBlurRadius = fontSize * 0.12
                    shadow.shadowOffset = CGSize(width: 0, height: fontSize * 0.05)
                    attrs[.shadow] = shadow
                }
                let maxWidth = renderSize.width * 0.86
                let bounds = (text as NSString).boundingRect(with: CGSize(width: maxWidth, height: renderSize.height), options: [.usesLineFragmentOrigin], attributes: attrs, context: nil)
                let padX = look.boxColor == nil ? 0 : fontSize * 0.45, padY = look.boxColor == nil ? 0 : fontSize * 0.22
                let cx = CGFloat(look.centerX) * renderSize.width
                let cy = CGFloat(look.centerY) * renderSize.height
                var box = CGRect(x: cx - bounds.width / 2 - padX, y: cy - bounds.height / 2 - padY,
                                 width: bounds.width + padX * 2, height: bounds.height + padY * 2)
                // Keep the caption inside the frame.
                box.origin.x = min(max(box.minX, 24), renderSize.width - box.width - 24)
                box.origin.y = min(max(box.minY, 80), renderSize.height - box.height - 80)
                if let fill = UIColor(hexString: look.boxColor) {
                    fill.withAlphaComponent(look.boxOpacity).setFill()
                    UIBezierPath(roundedRect: box, cornerRadius: fontSize * 0.28).fill()
                }
                (text as NSString).draw(with: box.insetBy(dx: padX, dy: padY), options: [.usesLineFragmentOrigin], attributes: attrs, context: nil)
                center = CGPoint(x: box.midX, y: renderSize.height - box.midY)
            }
            if let cg = image.cgImage { out[i] = (CIImage(cgImage: cg), center) }
        }
        return out
    }
}
