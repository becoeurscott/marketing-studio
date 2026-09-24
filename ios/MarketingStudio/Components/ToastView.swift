import SwiftUI

struct ToastView: View {
    var toast: Toast

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: toast.icon ?? defaultIcon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(tint)
            Text(toast.message)
                .font(MSFont.control(14))
                .foregroundStyle(MSColor.text)
                .lineLimit(2)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(MSColor.elevated, in: Capsule())
        .overlay(Capsule().strokeBorder(MSColor.borderStrong, lineWidth: 1))
        .shadow(color: .black.opacity(0.45), radius: 18, y: 8)
    }

    private var defaultIcon: String {
        switch toast.style {
        case .info: return "info.circle"
        case .success: return "checkmark.circle"
        case .warning: return "exclamationmark.triangle"
        case .error: return "xmark.octagon"
        }
    }
    private var tint: Color {
        switch toast.style {
        case .info: return MSColor.highlight
        case .success: return MSColor.success
        case .warning: return MSColor.warning
        case .error: return MSColor.danger
        }
    }
}

struct ToastOverlay: ViewModifier {
    @EnvironmentObject private var router: Router

    func body(content: Content) -> some View {
        content.overlay(alignment: .top) {
            // The host may extend under the status bar, so anchor to the window's real top inset.
            VStack(spacing: 8) {
                ForEach(router.toasts) { toast in
                    ToastView(toast: toast)
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .onTapGesture { router.remove(toast) }
                }
            }
            .padding(.top, Self.windowTopInset + 8)
            .ignoresSafeArea(edges: .top)
            .animation(MSAnimation.snappy, value: router.toasts)
        }
    }

    private static var windowTopInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .safeAreaInsets.top ?? 0
    }
}

extension View {
    func toastOverlay() -> some View { modifier(ToastOverlay()) }
}
