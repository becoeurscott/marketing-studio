import SwiftUI

// MARK: - Colors

extension Color {
    init(hex: UInt, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

/// Marketing Studio color system: Higgsfield green (#D1FE17) on near-black.
/// Accent is reserved for primary actions and selection; text on accent fills is `onAccent`.
enum MSColor {
    static let bg = Color(hex: 0x030304)
    static let surface = Color(hex: 0x101010)
    static let card = Color(hex: 0x151515)
    static let elevated = Color(hex: 0x1C1C1C)
    static let border = Color.white.opacity(0.08)
    static let borderStrong = Color.white.opacity(0.14)

    static let accent = Color(hex: 0xD1FE17)
    static let accent2 = Color(hex: 0xA6CF0C)
    static let highlight = Color(hex: 0xD1FE17)
    static let green = Color(hex: 0xA6CF0C)
    static let onAccent = Color(hex: 0x0A0A0A)

    static let success = Color(hex: 0x22C55E)
    static let warning = Color(hex: 0xF59E0B)
    static let danger = Color(hex: 0xEF4444)

    static let text = Color.white
    static let text2 = Color(hex: 0xA1A1AA)
    static let muted = Color(hex: 0x71717A)

    static let accentGradient = LinearGradient(
        colors: [accent, accent2],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Spacing / Radius

enum MSSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 20
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    /// Horizontal screen gutter.
    static let gutter: CGFloat = 20
}

enum MSRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 22
    static let pill: CGFloat = 999
}

// MARK: - Typography

enum MSFont {
    static func title(_ size: CGFloat = 30) -> Font { .system(size: size, weight: .bold, design: .rounded) }
    static func headline(_ size: CGFloat = 18) -> Font { .system(size: size, weight: .semibold, design: .rounded) }
    static func body(_ size: CGFloat = 15) -> Font { .system(size: size, weight: .regular) }
    static func caption(_ size: CGFloat = 12) -> Font { .system(size: size, weight: .medium) }
    static func control(_ size: CGFloat = 14) -> Font { .system(size: size, weight: .medium) }
    static func mono(_ size: CGFloat = 13) -> Font { .system(size: size, weight: .medium, design: .monospaced) }
}

struct MSTitleModifier: ViewModifier {
    var size: CGFloat
    func body(content: Content) -> some View {
        content
            .font(MSFont.title(size))
            .tracking(-0.6)
            .foregroundStyle(MSColor.text)
    }
}

struct MSHeadlineModifier: ViewModifier {
    var size: CGFloat
    func body(content: Content) -> some View {
        content
            .font(MSFont.headline(size))
            .tracking(-0.2)
            .foregroundStyle(MSColor.text)
    }
}

struct MSBodyModifier: ViewModifier {
    var size: CGFloat
    var color: Color
    func body(content: Content) -> some View {
        content
            .font(MSFont.body(size))
            .foregroundStyle(color)
    }
}

struct MSCaptionModifier: ViewModifier {
    var color: Color
    func body(content: Content) -> some View {
        content
            .font(MSFont.caption())
            .foregroundStyle(color)
    }
}

struct MSCardModifier: ViewModifier {
    var padding: CGFloat
    var radius: CGFloat
    var background: Color
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(background, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(MSColor.border, lineWidth: 1)
            )
    }
}

extension View {
    func msTitle(_ size: CGFloat = 30) -> some View { modifier(MSTitleModifier(size: size)) }
    func msHeadline(_ size: CGFloat = 18) -> some View { modifier(MSHeadlineModifier(size: size)) }
    func msBody(_ size: CGFloat = 15, color: Color = MSColor.text2) -> some View { modifier(MSBodyModifier(size: size, color: color)) }
    func msCaption(color: Color = MSColor.muted) -> some View { modifier(MSCaptionModifier(color: color)) }

    /// Standard card surface (#151515, 1px border, 16pt radius).
    func msCard(padding: CGFloat = MSSpacing.md, radius: CGFloat = MSRadius.lg) -> some View {
        modifier(MSCardModifier(padding: padding, radius: radius, background: MSColor.card))
    }

    /// Elevated surface (#1C1C1C) for sheets, popovers and floating bars.
    func msElevated(padding: CGFloat = MSSpacing.md, radius: CGFloat = MSRadius.lg) -> some View {
        modifier(MSCardModifier(padding: padding, radius: radius, background: MSColor.elevated))
    }

    /// Full-bleed dark screen background.
    func msScreen() -> some View {
        self
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(MSColor.bg.ignoresSafeArea())
    }

    /// Standard horizontal gutter.
    func msGutter() -> some View { padding(.horizontal, MSSpacing.gutter) }
}

// MARK: - Animation

/// App animations. "Réduire les animations" (Réglages) turns them into instant changes.
enum MSAnimation {
    nonisolated(unsafe) static var reduced = false
    static var snappy: Animation { reduced ? .linear(duration: 0) : .spring(response: 0.32, dampingFraction: 0.86) }
    static var gentle: Animation { reduced ? .linear(duration: 0) : .easeInOut(duration: 0.25) }
    static var slow: Animation { reduced ? .linear(duration: 0) : .easeInOut(duration: 0.45) }
}

// MARK: - Haptics

/// Haptics, off when "Retour haptique" is disabled in Réglages.
enum MSHaptic {
    nonisolated(unsafe) static var enabled = true
    static func tap() { if enabled { UIImpactFeedbackGenerator(style: .light).impactOccurred() } }
    static func success() { if enabled { UINotificationFeedbackGenerator().notificationOccurred(.success) } }
    static func warning() { if enabled { UINotificationFeedbackGenerator().notificationOccurred(.warning) } }
}
