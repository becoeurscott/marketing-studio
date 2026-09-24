import SwiftUI

/// Canvas image with pinch/drag zoom plus Zoom / Fit / Fullscreen controls (SPEC §9).
struct StudioZoomableImage: View {
    var url: String
    var aspect: CGFloat = 0.8
    var showControls: Bool = true
    /// Optional label pinned to the top-leading corner of the fitted image (e.g. the source asset name).
    var badge: (text: String, icon: String)? = nil
    var onFullscreen: (() -> Void)? = nil

    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        GeometryReader { geo in
            let fitSize = fittedSize(in: geo.size)
            ZStack(alignment: .bottomTrailing) {
                Color.clear
                RemoteImage(url: url, contentMode: .fill, cornerRadius: MSRadius.lg)
                    .frame(width: fitSize.width, height: fitSize.height)
                    .scaleEffect(scale)
                    .offset(offset)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                    .gesture(dragGesture.simultaneously(with: magnifyGesture))
                    .onTapGesture(count: 2) { toggleZoom() }
                    .animation(MSAnimation.snappy, value: scale)
                if let badge, scale == 1 {
                    Color.clear
                        .frame(width: fitSize.width, height: fitSize.height)
                        .overlay(alignment: .topLeading) {
                            MSBadge(text: badge.text, tone: .overlay, icon: badge.icon).padding(10)
                        }
                        .frame(width: geo.size.width, height: geo.size.height)
                        .allowsHitTesting(false)
                        .transition(.opacity)
                }
                if showControls {
                    controls.padding(10)
                }
            }
        }
    }

    private var controls: some View {
        HStack(spacing: 4) {
            canvasControl(icon: "plus.magnifyingglass", label: "Zoom") { zoom(by: 0.5) }
            canvasControl(icon: "arrow.down.right.and.arrow.up.left", label: "Fit") { fit() }
            if let onFullscreen {
                canvasControl(icon: "arrow.up.left.and.arrow.down.right", label: "Full") { onFullscreen() }
            }
        }
        .padding(4)
        .background(MSColor.elevated.opacity(0.92), in: Capsule())
        .overlay(Capsule().strokeBorder(MSColor.border, lineWidth: 1))
    }

    private func canvasControl(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button {
            MSHaptic.tap()
            action()
        } label: {
            HStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 11, weight: .semibold))
                Text(label).font(MSFont.caption(11))
            }
            .foregroundStyle(MSColor.text)
            .padding(.horizontal, 10)
            .frame(height: 28)
        }
        .buttonStyle(.plain)
    }

    private func fittedSize(in container: CGSize) -> CGSize {
        guard container.width > 0, container.height > 0 else { return .zero }
        let containerAspect = container.width / container.height
        if aspect > containerAspect {
            return CGSize(width: container.width, height: container.width / aspect)
        } else {
            return CGSize(width: container.height * aspect, height: container.height)
        }
    }

    private var magnifyGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in scale = min(max(lastScale * value, 1), 4) }
            .onEnded { _ in
                lastScale = scale
                if scale == 1 { withAnimation(MSAnimation.snappy) { offset = .zero; lastOffset = .zero } }
            }
    }

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                guard scale > 1 else { return }
                offset = CGSize(width: lastOffset.width + value.translation.width, height: lastOffset.height + value.translation.height)
            }
            .onEnded { _ in lastOffset = offset }
    }

    private func zoom(by delta: CGFloat) {
        withAnimation(MSAnimation.snappy) {
            scale = min(scale + delta, 4)
            lastScale = scale
        }
    }

    private func fit() {
        withAnimation(MSAnimation.snappy) {
            scale = 1; lastScale = 1; offset = .zero; lastOffset = .zero
        }
    }

    private func toggleZoom() {
        if scale > 1 { fit() } else { zoom(by: 1) }
    }
}

/// Fullscreen image viewer presented from the canvas.
struct FullscreenImageViewer: View {
    var url: String
    var aspect: CGFloat
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            StudioZoomableImage(url: url, aspect: aspect, showControls: true)
                .padding(.vertical, 40)
            MSIconButton(icon: "xmark", size: 36) { dismiss() }
                .padding(16)
        }
        .preferredColorScheme(.dark)
    }
}

struct FullscreenImageItem: Identifiable {
    let id = UUID()
    let url: String
    let aspect: CGFloat
}
