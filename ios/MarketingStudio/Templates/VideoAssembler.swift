import AVFoundation
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
        let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)

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
            layer.setTransform(fill(size: size, transform: transform), at: cursor)
            cursor = cursor + want
        }

        if useOriginalSound {
            let source = AVURLAsset(url: sourceURL)
            if let a = try await source.loadTracks(withMediaType: .audio).first {
                let sourceDuration = try await source.load(.duration)
                try? audioTrack?.insertTimeRange(CMTimeRange(start: .zero, duration: CMTimeMinimum(sourceDuration, cursor)), of: a, at: .zero)
            }
        }

        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = CMTimeRange(start: .zero, duration: cursor)
        instruction.layerInstructions = [layer]
        let video = AVMutableVideoComposition()
        video.renderSize = renderSize
        video.frameDuration = CMTime(value: 1, timescale: 30)
        video.instructions = [instruction]
        if options.showTexts, template.shots.contains(where: { $0.overlay != nil }) {
            video.animationTool = textOverlay(template)
        }

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

    /// Captions burned in with Core Animation, each visible only during its shot.
    private static func textOverlay(_ template: VideoTemplate) -> AVVideoCompositionCoreAnimationTool {
        let parent = CALayer()
        parent.frame = CGRect(origin: .zero, size: renderSize)
        let videoLayer = CALayer()
        videoLayer.frame = parent.frame
        parent.addSublayer(videoLayer)

        for shot in template.shots {
            guard let text = shot.overlay, !text.isEmpty else { continue }
            let label = CATextLayer()
            let font = UIFont.systemFont(ofSize: 64, weight: .heavy)
            label.string = NSAttributedString(string: text, attributes: [.font: font, .foregroundColor: UIColor.white])
            label.alignmentMode = .center
            label.isWrapped = true
            label.contentsScale = 2
            let width = renderSize.width - 160
            let height = min(420, CGFloat(text.count / 18 + 1) * 84 + 40)
            label.frame = CGRect(x: 80, y: renderSize.height * 0.22, width: width, height: height)
            label.backgroundColor = UIColor.black.withAlphaComponent(0.45).cgColor
            label.cornerRadius = 24
            label.opacity = 0

            let show = CABasicAnimation(keyPath: "opacity")
            show.fromValue = 1
            show.toValue = 1
            show.beginTime = AVCoreAnimationBeginTimeAtZero + shot.start(in: template)
            show.duration = shot.duration
            show.isRemovedOnCompletion = true
            label.add(show, forKey: "show")
            parent.addSublayer(label)
        }
        return AVVideoCompositionCoreAnimationTool(postProcessingAsVideoLayer: videoLayer, in: parent)
    }
}

private extension TemplateShot {
    /// Start time in the rebuilt video (sum of the previous shots).
    func start(in template: VideoTemplate) -> Double {
        template.shots.prefix(index).reduce(0) { $0 + $1.duration }
    }
}
