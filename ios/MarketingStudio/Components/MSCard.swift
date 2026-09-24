import SwiftUI

/// Generic card container. Tappable when `action` is provided.
struct MSCard<Content: View>: View {
    var padding: CGFloat = MSSpacing.md
    var elevated: Bool = false
    var action: (() -> Void)? = nil
    @ViewBuilder var content: () -> Content

    var body: some View {
        if let action {
            Button {
                MSHaptic.tap()
                action()
            } label: {
                body(content)
            }
            .buttonStyle(MSPressStyle())
        } else {
            body(content)
        }
    }

    @ViewBuilder
    private func body(_ content: () -> Content) -> some View {
        if elevated {
            content().frame(maxWidth: .infinity, alignment: .leading).msElevated(padding: padding)
        } else {
            content().frame(maxWidth: .infinity, alignment: .leading).msCard(padding: padding)
        }
    }
}

/// Small status pill.
struct MSBadge: View {
    /// `.overlay` is for badges drawn on top of imagery (white on translucent black).
    enum Tone { case neutral, accent, success, warning, danger, info, overlay }
    var text: String
    var tone: Tone = .neutral
    var icon: String? = nil

    var body: some View {
        HStack(spacing: 4) {
            if let icon { Image(systemName: icon).font(.system(size: 9, weight: .bold)) }
            Text(text).font(.system(size: 11, weight: .semibold))
        }
        .foregroundStyle(foreground)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(background, in: Capsule())
    }

    private var foreground: Color {
        switch tone {
        case .neutral: return MSColor.text2
        case .accent: return MSColor.highlight
        case .success: return MSColor.success
        case .warning: return MSColor.warning
        case .danger: return MSColor.danger
        case .info: return Color(hex: 0x60A5FA)
        case .overlay: return .white
        }
    }
    private var background: Color {
        switch tone {
        case .overlay: return .black.opacity(0.55)
        case .neutral: return foreground.opacity(0.12)
        default: return foreground.opacity(0.14)
        }
    }

    static func tone(for status: CampaignStatus) -> Tone {
        switch status {
        case .draft: return .neutral
        case .ready: return .accent
        case .scheduled: return .info
        case .live: return .success
        case .completed: return .neutral
        }
    }
    static func tone(for status: GenerationStatus) -> Tone {
        switch status {
        case .queued: return .neutral
        case .processing: return .warning
        case .completed: return .success
        case .failed: return .danger
        }
    }
    static func tone(for status: CalendarStatus) -> Tone {
        switch status {
        case .draft: return .neutral
        case .scheduled: return .info
        case .published: return .success
        }
    }
}

/// Section title with optional trailing action.
struct SectionHeader: View {
    var title: String
    var subtitle: String? = nil
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).msHeadline(17)
                if let subtitle { Text(subtitle).msCaption() }
            }
            Spacer()
            if let actionTitle, let action {
                Button(action: action) {
                    HStack(spacing: 3) {
                        Text(actionTitle)
                        Image(systemName: "chevron.right").font(.system(size: 10, weight: .bold))
                    }
                    .font(MSFont.control(13))
                    .foregroundStyle(MSColor.text2)
                }
            }
        }
        .padding(.horizontal, MSSpacing.gutter)
    }
}

/// Compact metric tile.
struct StatTile: View {
    var label: String
    var value: String
    var icon: String
    var tint: Color = MSColor.text2
    var action: (() -> Void)? = nil

    var body: some View {
        MSCard(padding: 14, action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(tint)
                    .frame(width: 30, height: 30)
                    .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(value).msHeadline(22)
                    Text(label).msCaption()
                }
            }
        }
    }
}
