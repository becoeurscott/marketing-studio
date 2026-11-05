import AVFoundation
import Foundation
import UIKit

/// One shot of a template: how long it lasts, what to film, and the text shown on top.
struct TemplateShot: Codable, Identifiable, Hashable {
    var id: Int { index }
    var index: Int
    var start: Double
    var duration: Double
    var description: String
    var overlay: String?
    var framing: String
}

/// A video edit learned from a TikTok/Reels video the user shared: same cuts, timing and texts.
struct VideoTemplate: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var style: String
    var createdAt: Date
    var shots: [TemplateShot]
    /// File name of the source video inside the templates folder (kept for its sound and preview).
    var sourceFile: String
    var hasAudio: Bool

    var duration: Double { shots.reduce(0) { $0 + $1.duration } }

    /// Rough time a person would spend editing this by hand (cutting, timing, captions, export).
    var manualMinutes: Int {
        let overlays = shots.filter { $0.overlay != nil }.count
        return 20 + shots.count * 6 + overlays * 4 + (hasAudio ? 8 : 0)
    }
}

/// Templates live in Application Support (they hold video files), plus a JSON index.
@MainActor
final class TemplateStore: ObservableObject {
    static let shared = TemplateStore()
    /// Shared with the share extension, which drops incoming videos into `Inbox`.
    static let appGroup = "group.com.sokozia.app"

    @Published private(set) var templates: [VideoTemplate] = []

    let folder: URL = {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let url = base.appendingPathComponent("Templates", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }()

    private var index: URL { folder.appendingPathComponent("templates.json") }

    init() {
        if let data = try? Data(contentsOf: index), let list = try? JSONDecoder().decode([VideoTemplate].self, from: data) {
            templates = list
        }
    }

    func url(for template: VideoTemplate) -> URL { folder.appendingPathComponent(template.sourceFile) }

    func add(_ t: VideoTemplate) {
        templates.insert(t, at: 0)
        save()
    }

    func remove(_ t: VideoTemplate) {
        try? FileManager.default.removeItem(at: url(for: t))
        templates.removeAll { $0.id == t.id }
        save()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(templates) { try? data.write(to: index, options: .atomic) }
    }

    /// Videos shared from TikTok/Instagram through the share extension, oldest first.
    static func inboxVideos() -> [URL] {
        guard let group = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return [] }
        let inbox = group.appendingPathComponent("Inbox", isDirectory: true)
        let files = (try? FileManager.default.contentsOfDirectory(at: inbox, includingPropertiesForKeys: [.creationDateKey])) ?? []
        return files.filter { ["mp4", "mov", "m4v"].contains($0.pathExtension.lowercased()) }
            .sorted { ($0.creationDate ?? .distantPast) < ($1.creationDate ?? .distantPast) }
    }
}

private extension URL {
    var creationDate: Date? { (try? resourceValues(forKeys: [.creationDateKey]))?.creationDate }
}

// MARK: - Cut detection (on device)

enum CutDetector {
    struct Shot { var start: Double; var duration: Double; var keyframe: UIImage }

    /// Samples ~10 frames per second at low resolution and starts a new shot where the picture
    /// changes sharply (luma histogram distance). Shots shorter than `minShot` are merged.
    static func detect(_ url: URL, minShot: Double = 0.35, progress: @escaping (Double) -> Void = { _ in }) async throws -> [Shot] {
        let asset = AVURLAsset(url: url)
        let duration = try await asset.load(.duration).seconds
        guard duration.isFinite, duration > 0.3 else { throw TemplateError.tooShort }
        guard duration <= 180 else { throw TemplateError.tooLong }

        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 96, height: 96)
        gen.requestedTimeToleranceBefore = CMTime(value: 1, timescale: 30)
        gen.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 30)

        let step = 0.1
        var cuts: [Double] = [0]
        var previous: [Double]?
        var t = 0.0
        while t < duration {
            if let cg = try? await gen.image(at: CMTime(seconds: t, preferredTimescale: 600)).image {
                let h = histogram(cg)
                if let p = previous {
                    let d = zip(h, p).reduce(0) { $0 + abs($1.0 - $1.1) } / 2
                    if d > 0.32, t - (cuts.last ?? 0) >= minShot { cuts.append(t) }
                }
                previous = h
            }
            t += step
            progress(min(t / duration, 1) * 0.8)
        }
        if duration - (cuts.last ?? 0) < minShot, cuts.count > 1 { cuts.removeLast() }

        let big = AVAssetImageGenerator(asset: asset)
        big.appliesPreferredTrackTransform = true
        big.maximumSize = CGSize(width: 320, height: 320)
        var shots: [Shot] = []
        for (i, start) in cuts.enumerated() {
            let end = i + 1 < cuts.count ? cuts[i + 1] : duration
            let mid = CMTime(seconds: start + (end - start) / 2, preferredTimescale: 600)
            let frame = (try? await big.image(at: mid).image).map { UIImage(cgImage: $0) } ?? UIImage()
            shots.append(Shot(start: start, duration: end - start, keyframe: frame))
        }
        progress(0.9)
        return shots
    }

    private static func histogram(_ image: CGImage) -> [Double] {
        let w = 32, h = 32, bins = 32
        var pixels = [UInt8](repeating: 0, count: w * h)
        guard let ctx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                  space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return [] }
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        var hist = [Double](repeating: 0, count: bins)
        for p in pixels { hist[Int(p) * bins / 256] += 1 }
        return hist.map { $0 / Double(w * h) }
    }
}

enum TemplateError: LocalizedError {
    case tooShort, tooLong, noClip, exportFailed

    var errorDescription: String? {
        switch self {
        case .tooShort: return L("Cette vidéo est trop courte pour en faire un modèle.")
        case .tooLong: return L("Choisissez une vidéo de 3 minutes maximum.")
        case .noClip: return L("Ajoutez une vidéo pour chaque plan.")
        case .exportFailed: return L("Le montage a échoué. Réessayez.")
        }
    }
}
