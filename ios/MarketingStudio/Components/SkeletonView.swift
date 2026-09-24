import SwiftUI

/// Shimmering placeholder block.
struct SkeletonView: View {
    var cornerRadius: CGFloat = MSRadius.md
    @State private var phase: CGFloat = -1

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(MSColor.elevated)
            .overlay {
                GeometryReader { geo in
                    LinearGradient(
                        colors: [.clear, .white.opacity(0.07), .clear],
                        startPoint: .leading, endPoint: .trailing
                    )
                    .frame(width: geo.size.width * 0.8)
                    .offset(x: phase * geo.size.width * 1.4)
                }
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            }
            .onAppear {
                withAnimation(.linear(duration: 1.3).repeatForever(autoreverses: false)) { phase = 1 }
            }
    }
}

/// Grid of skeleton tiles for loading galleries.
struct SkeletonGrid: View {
    var count: Int = 4
    var columns: Int = 2
    var aspect: CGFloat = 0.8

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: columns), spacing: 10) {
            ForEach(0..<count, id: \.self) { _ in
                SkeletonView().aspectRatio(aspect, contentMode: .fit)
            }
        }
    }
}

/// Multi-step progress used by video / export / campaign flows (SPEC §44).
struct ProgressIndicator: View {
    var steps: [String]
    var currentStep: Int
    var title: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let title {
                HStack(spacing: 10) {
                    ProgressView().tint(MSColor.highlight)
                    Text(title).msHeadline(15)
                }
            }
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                    HStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .strokeBorder(i < currentStep ? MSColor.success : (i == currentStep ? MSColor.accent : MSColor.borderStrong), lineWidth: 1.5)
                                .frame(width: 18, height: 18)
                            if i < currentStep {
                                Image(systemName: "checkmark").font(.system(size: 9, weight: .bold)).foregroundStyle(MSColor.success)
                            } else if i == currentStep {
                                Circle().fill(MSColor.accent).frame(width: 7, height: 7)
                            }
                        }
                        Text(step)
                            .font(MSFont.control(14))
                            .foregroundStyle(i <= currentStep ? MSColor.text : MSColor.muted)
                        Spacer()
                    }
                    .animation(MSAnimation.gentle, value: currentStep)
                }
            }
        }
    }
}

/// Thin determinate bar.
struct MSProgressBar: View {
    var progress: Double
    var height: CGFloat = 4

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(MSColor.elevated)
                Capsule().fill(MSColor.accentGradient)
                    .frame(width: max(0, min(1, progress)) * geo.size.width)
                    .animation(MSAnimation.snappy, value: progress)
            }
        }
        .frame(height: height)
    }
}
