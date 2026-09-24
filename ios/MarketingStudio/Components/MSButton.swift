import SwiftUI

enum MSButtonStyle { case primary, secondary, ghost, danger }
enum MSButtonSize { case regular, compact }

/// Primary CTA uses the accent gradient; everything else stays neutral.
struct MSButton: View {
    var title: String
    var icon: String? = nil
    var style: MSButtonStyle = .primary
    var size: MSButtonSize = .regular
    var isLoading: Bool = false
    var isDisabled: Bool = false
    var fullWidth: Bool = true
    var action: () -> Void

    var body: some View {
        Button {
            guard !isLoading, !isDisabled else { return }
            MSHaptic.tap()
            action()
        } label: {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView().tint(foreground).scaleEffect(0.85)
                } else if let icon {
                    Image(systemName: icon).font(.system(size: size == .regular ? 15 : 13, weight: .semibold))
                }
                Text(title)
                    .font(.system(size: size == .regular ? 16 : 14, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(foreground)
            .padding(.horizontal, size == .regular ? 20 : 14)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .frame(height: size == .regular ? 50 : 38)
            .background(background)
            .overlay(
                RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous)
                    .strokeBorder(border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
            .opacity(isDisabled ? 0.45 : 1)
        }
        .buttonStyle(MSPressStyle())
        .disabled(isDisabled || isLoading)
    }

    private var foreground: Color {
        switch style {
        case .primary: return .white
        case .secondary: return MSColor.text
        case .ghost: return MSColor.text2
        case .danger: return MSColor.danger
        }
    }

    @ViewBuilder private var background: some View {
        switch style {
        case .primary: MSColor.accentGradient
        case .secondary: MSColor.elevated
        case .ghost: Color.clear
        case .danger: MSColor.danger.opacity(0.12)
        }
    }

    private var border: Color {
        switch style {
        case .primary: return .clear
        case .secondary: return MSColor.borderStrong
        case .ghost: return .clear
        case .danger: return MSColor.danger.opacity(0.35)
        }
    }
}

/// Press feedback used by all tappable surfaces.
struct MSPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

/// Small circular icon button for toolbars and card overlays.
struct MSIconButton: View {
    var icon: String
    var size: CGFloat = 36
    var tint: Color = MSColor.text
    var filled: Bool = true
    var action: () -> Void

    var body: some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            Image(systemName: icon)
                .font(.system(size: size * 0.42, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: size, height: size)
                .background(filled ? MSColor.elevated : .clear, in: Circle())
                .overlay(Circle().strokeBorder(filled ? MSColor.border : .clear, lineWidth: 1))
        }
        .buttonStyle(MSPressStyle())
    }
}
