import SwiftUI

/// AsyncImage wrapper with shimmer placeholder and a quiet failure state.
struct RemoteImage: View {
    var url: String?
    var contentMode: ContentMode = .fill
    var cornerRadius: CGFloat = 0

    var body: some View {
        Group {
            if let url, let u = URL(string: url) {
                AsyncImage(url: u, transaction: Transaction(animation: .easeOut(duration: 0.25))) { phase in
                    switch phase {
                    case .empty:
                        SkeletonView(cornerRadius: cornerRadius)
                    case .success(let image):
                        Color.clear.overlay(
                            image.resizable().aspectRatio(contentMode: contentMode)
                        )
                        .transition(.opacity)
                    case .failure:
                        fallback
                    @unknown default:
                        fallback
                    }
                }
            } else {
                fallback
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .clipped()
    }

    private var fallback: some View {
        ZStack {
            MSColor.elevated
            Image(systemName: "photo")
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(MSColor.muted)
        }
    }
}

/// Circular avatar with initials fallback.
struct AvatarView: View {
    var url: String?
    var name: String
    var size: CGFloat = 40

    var body: some View {
        ZStack {
            Circle().fill(MSColor.elevated)
            Text(initials)
                .font(.system(size: size * 0.36, weight: .semibold, design: .rounded))
                .foregroundStyle(MSColor.text2)
            if let url, let u = URL(string: url) {
                AsyncImage(url: u) { phase in
                    if case .success(let img) = phase {
                        img.resizable().scaledToFill()
                    }
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().strokeBorder(MSColor.border, lineWidth: 1))
    }

    private var initials: String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.map { String($0.prefix(1)) }.joined().uppercased()
    }
}
