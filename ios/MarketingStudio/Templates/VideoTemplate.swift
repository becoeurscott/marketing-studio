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

    /// Samples ~10 frames per second, crops black letterbox bands, and starts a new shot where the
    /// picture changes sharply (pixel and brightness-histogram distances). Shots under `minShot` merge.
    static func detect(_ url: URL, minShot: Double = 0.35, progress: @escaping (Double) -> Void = { _ in }) async throws -> [Shot] {
        let asset = AVURLAsset(url: url)
        let duration = try await asset.load(.duration).seconds
        guard duration.isFinite, duration > 0.3 else { throw TemplateError.tooShort }
        guard duration <= 180 else { throw TemplateError.tooLong }

        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        gen.maximumSize = CGSize(width: 96, height: 160)
        gen.requestedTimeToleranceBefore = CMTime(value: 1, timescale: 30)
        gen.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 30)

        var frames: [(Double, CGImage)] = []
        var t = 0.0
        while t < duration {
            if let cg = try? await gen.image(at: CMTime(seconds: t, preferredTimescale: 600)).image { frames.append((t, cg)) }
            t += 0.1
            progress(min(t / duration, 1) * 0.6)
        }
        let crop = contentRect(stride(from: 0, to: frames.count, by: max(1, frames.count / 12)).map { frames[$0].1 })

        var cuts: [Double] = [0]
        var previous: [Double]?
        for (time, image) in frames {
            let g = gray(image, crop: crop)
            if let p = previous {
                let pixel = zip(g, p).reduce(0) { $0 + abs($1.0 - $1.1) } / Double(g.count)
                let hist = histogramDistance(g, p)
                let isCut = pixel > 0.14 || hist > 0.30 || (pixel > 0.09 && hist > 0.18)
                if isCut, time - (cuts.last ?? 0) >= minShot { cuts.append(time) }
            }
            previous = g
        }
        if duration - (cuts.last ?? 0) < minShot, cuts.count > 1 { cuts.removeLast() }
        progress(0.7)

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
        progress(0.8)
        return shots
    }

    /// 48×48 grayscale of the frame, optionally cropped to the picture area.
    private static func gray(_ image: CGImage, crop: CGRect?) -> [Double] {
        let source = crop.flatMap { image.cropping(to: $0) } ?? image
        let w = 48, h = 48
        var pixels = [UInt8](repeating: 0, count: w * h)
        guard let ctx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                  space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return [] }
        ctx.draw(source, in: CGRect(x: 0, y: 0, width: w, height: h))
        return pixels.map { Double($0) / 255 }
    }

    private static func histogramDistance(_ a: [Double], _ b: [Double]) -> Double {
        var h1 = [Double](repeating: 0, count: 16), h2 = h1
        for v in a { h1[min(15, Int(v * 16))] += 1 }
        for v in b { h2[min(15, Int(v * 16))] += 1 }
        return zip(h1, h2).reduce(0) { $0 + abs($1.0 - $1.1) } / Double(2 * max(a.count, 1))
    }

    /// Rows that are never lit across sample frames are letterbox bands; returns the picture area.
    private static func contentRect(_ frames: [CGImage]) -> CGRect? {
        guard let first = frames.first else { return nil }
        let w = first.width, h = first.height
        var rowMax = [Double](repeating: 0, count: h)
        for image in frames {
            var p = [UInt8](repeating: 0, count: w * h)
            guard let c = CGContext(data: &p, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                    space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { continue }
            c.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
            for y in 0..<h {
                var sum = 0
                for x in 0..<w { sum += Int(p[y * w + x]) }
                rowMax[y] = max(rowMax[y], Double(sum) / Double(w))
            }
        }
        let lit = rowMax.indices.filter { rowMax[$0] > 18 }
        guard let top = lit.first, let bottom = lit.last, bottom - top > h / 5, bottom - top < h - 2 else { return nil }
        return CGRect(x: 0, y: h - 1 - bottom, width: w, height: bottom - top + 1)
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
