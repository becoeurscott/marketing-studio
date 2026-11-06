import CoreText
import UIKit
import Vision

/// How the template's captions look: picked up from the shared video (position, size, colours
/// measured on the phone; font family, weight and animation suggested by the AI).
struct CaptionStyle: Codable, Hashable {
    var font: String = "tiktok-sans"
    var weight: Int = 800
    var uppercase = false
    var textColor = "#FFFFFF"
    var outlineColor: String?
    var shadow = true
    /// Background box behind the text, nil when the text sits directly on the picture.
    var boxColor: String?
    var boxOpacity: Double = 0.45
    var animation = "none"
    /// Centre of the caption in the vertical frame (0…1, top-left origin) and line height / frame height.
    var centerX: Double = 0.5
    var centerY: Double = 0.7
    var lineHeight: Double = 0.035

    static let `default` = CaptionStyle()
}

enum CaptionFonts {
    /// Bundled families (SIL OFL / Apache): file name and whether the weight can vary.
    private static let files: [String: (file: String, variable: Bool)] = [
        "tiktok-sans": ("TikTokSans", true),
        "montserrat": ("Montserrat", true),
        "playfair": ("PlayfairDisplay", true),
        "bebas-neue": ("BebasNeue-Regular", false),
        "anton": ("Anton-Regular", false),
        "poppins": ("Poppins-Bold", false),
        "poppins-black": ("Poppins-Black", false),
        "permanent-marker": ("PermanentMarker-Regular", false),
    ]
    static let families = Array(files.keys).sorted()

    private static var descriptors: [String: CTFontDescriptor] = [:]

    static func font(_ family: String, weight: Int, size: CGFloat) -> UIFont {
        var key = family
        if family == "poppins", weight >= 850 { key = "poppins-black" }
        guard let entry = files[key] ?? files["tiktok-sans"],
              let desc = descriptor(entry.file) else { return .systemFont(ofSize: size, weight: .heavy) }
        var attrs: [CFString: Any] = [:]
        if entry.variable {
            // 'wght' axis tag.
            attrs[kCTFontVariationAttribute] = [0x77676874: min(max(weight, 100), 900)]
        }
        let final = CTFontDescriptorCreateCopyWithAttributes(desc, attrs as CFDictionary)
        return CTFontCreateWithFontDescriptor(final, size, nil) as UIFont
    }

    private static func descriptor(_ file: String) -> CTFontDescriptor? {
        if let d = descriptors[file] { return d }
        guard let url = Bundle.main.url(forResource: file, withExtension: "ttf"),
              let list = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
              let d = list.first else { return nil }
        descriptors[file] = d
        return d
    }
}

// MARK: - Measuring the caption on a frame

enum CaptionDetector {
    struct Measure { var centerX: Double; var centerY: Double; var lineHeight: Double; var textColor: UIColor; var boxColor: UIColor?; var contrast: Double }

    /// Finds the caption on a keyframe with Vision and samples its colours. `text` (the caption the AI
    /// read) helps choose the right line when several texts are visible.
    static func measure(_ image: UIImage, text: String?) async -> Measure? {
        guard let cg = image.cgImage else { return nil }
        let observations: [VNRecognizedTextObservation] = await withCheckedContinuation { cont in
            let request = VNRecognizeTextRequest { req, _ in
                cont.resume(returning: (req.results as? [VNRecognizedTextObservation]) ?? [])
            }
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = false
            do { try VNImageRequestHandler(cgImage: cg).perform([request]) } catch { cont.resume(returning: []) }
        }
        guard !observations.isEmpty else { return nil }
        func words(_ s: String) -> Set<String> {
            Set(s.lowercased().split { !$0.isLetter && !$0.isNumber }.map(String.init).filter { $0.count > 1 })
        }
        let wanted = words(text ?? "")
        // Share of the caption's words found in this line (whole words, so "@finnpeljo" never matches).
        func match(_ o: VNRecognizedTextObservation) -> Double {
            guard !wanted.isEmpty else { return 0 }
            let got = words(o.topCandidates(1).first?.string ?? "")
            return Double(got.intersection(wanted).count) / Double(wanted.count)
        }
        let matching = observations.filter { match($0) >= 0.5 }
        let lines: [VNRecognizedTextObservation]
        if !matching.isEmpty {
            lines = matching
        } else if wanted.isEmpty, let biggest = observations.max(by: { $0.boundingBox.height < $1.boundingBox.height }) {
            lines = [biggest]
        } else {
            return nil
        }
        var box = lines[0].boundingBox
        for l in lines.dropFirst() { box = box.union(l.boundingBox) }
        let lineH = lines.map(\.boundingBox.height).reduce(0, +) / Double(lines.count)

        let colours = sample(cg, rect: VNImageRectForNormalizedRect(box, cg.width, cg.height), flippedHeight: cg.height)
        return Measure(centerX: Double(box.midX), centerY: Double(1 - box.midY), lineHeight: Double(lineH),
                       textColor: colours.text, boxColor: colours.box, contrast: colours.contrast)
    }

    /// Splits the caption area into its two main colours: the minority is the text; the majority is
    /// a background box when it is flat and differs from the picture just outside the area.
    /// Text colour = the caption pixels that differ most from the picture just around the caption;
    /// a box is reported when the caption area's background is flat and unlike its surroundings.
    private static func sample(_ image: CGImage, rect: CGRect, flippedHeight h: Int) -> (text: UIColor, box: UIColor?, contrast: Double) {
        let r = CGRect(x: rect.minX, y: CGFloat(h) - rect.maxY, width: rect.width, height: rect.height).integral
        let pad = max(6, r.height * 0.8)
        guard let inside = pixels(image, r) else { return (.white, nil, 0) }
        let above = pixels(image, CGRect(x: r.minX, y: r.minY - pad, width: r.width, height: pad * 0.7)) ?? []
        let below = pixels(image, CGRect(x: r.minX, y: r.maxY + pad * 0.3, width: r.width, height: pad * 0.7)) ?? []
        let around = average(above + below)
        let ranked = inside.sorted { colourDistance(px($0), around) > colourDistance(px($1), around) }
        let core = Array(ranked.prefix(max(1, ranked.count * 15 / 100)))
        let fgColour = snap(average(core))
        // Inside pixels least like the text: the caption's own background (box or picture).
        let backdrop = Array(inside.sorted { colourDistance(px($0), fgColour) > colourDistance(px($1), fgColour) }.prefix(inside.count / 2))
        let backdropColour = average(backdrop)
        let lum: ([UInt8]) -> Double = { p in 0.299 * Double(p[0]) + 0.587 * Double(p[1]) + 0.114 * Double(p[2]) }
        let isBox = colourDistance(backdropColour, around) > 60 && variance(backdrop.map(lum)) < 250
        return (uiColor(fgColour), isBox ? uiColor(backdropColour) : nil, colourDistance(fgColour, isBox ? backdropColour : around))
    }

    private static func pixels(_ image: CGImage, _ rect: CGRect) -> [[UInt8]]? {
        let clamped = rect.intersection(CGRect(x: 0, y: 0, width: image.width, height: image.height))
        guard clamped.width >= 2, clamped.height >= 2, let crop = image.cropping(to: clamped) else { return nil }
        let w = 40, h = max(4, Int(40 * clamped.height / clamped.width))
        var data = [UInt8](repeating: 0, count: w * h * 4)
        guard let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.draw(crop, in: CGRect(x: 0, y: 0, width: w, height: h))
        return stride(from: 0, to: data.count, by: 4).map { [data[$0], data[$0 + 1], data[$0 + 2]] }
    }

    private static func px(_ p: [UInt8]) -> [Double] { p.map(Double.init) }

    /// Near-white and near-black captions are almost always pure white/black in the original.
    private static func snap(_ c: [Double]) -> [Double] {
        let maxC = c.max() ?? 0, minC = c.min() ?? 0
        let lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
        if lum > 185 && maxC - minC < 45 { return [255, 255, 255] }
        if maxC < 45 { return [0, 0, 0] }
        return c
    }

    private static func average(_ p: [[UInt8]]) -> [Double] {
        guard !p.isEmpty else { return [255, 255, 255] }
        return (0..<3).map { c in p.reduce(0) { $0 + Double($1[c]) } / Double(p.count) }
    }
    private static func variance(_ v: [Double]) -> Double {
        guard !v.isEmpty else { return 0 }
        let m = v.reduce(0, +) / Double(v.count)
        return v.reduce(0) { $0 + ($1 - m) * ($1 - m) } / Double(v.count)
    }
    private static func colourDistance(_ a: [Double], _ b: [Double]) -> Double {
        sqrt(zip(a, b).reduce(0) { $0 + ($1.0 - $1.1) * ($1.0 - $1.1) })
    }
    private static func uiColor(_ c: [Double]) -> UIColor { UIColor(red: c[0] / 255, green: c[1] / 255, blue: c[2] / 255, alpha: 1) }
}

extension UIColor {
    var hex: String {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255))
    }

    convenience init?(hexString: String?) {
        guard let s = hexString?.trimmingCharacters(in: CharacterSet(charactersIn: "#")), s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}
