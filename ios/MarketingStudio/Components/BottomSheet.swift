import SwiftUI

/// Dark bottom sheet with a grabber and optional title. Use for pickers, forms and confirmations.
struct BottomSheetContainer<Content: View>: View {
    var title: String? = nil
    var subtitle: String? = nil
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Capsule().fill(MSColor.borderStrong).frame(width: 36, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
                .padding(.bottom, 12)
            if title != nil || subtitle != nil {
                VStack(alignment: .leading, spacing: 4) {
                    if let title { Text(title).msHeadline(20) }
                    if let subtitle { Text(subtitle).msBody(14) }
                }
                .padding(.horizontal, MSSpacing.gutter)
                .padding(.bottom, 16)
            }
            content()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(MSColor.surface.ignoresSafeArea())
        .presentationDragIndicator(.hidden)
        .presentationBackground(MSColor.surface)
        .presentationCornerRadius(24)
    }
}

extension View {
    /// Present a dark bottom sheet with the given detents.
    func msSheet<Item: Identifiable, Content: View>(
        item: Binding<Item?>,
        detents: Set<PresentationDetent> = [.medium, .large],
        @ViewBuilder content: @escaping (Item) -> Content
    ) -> some View {
        sheet(item: item) { value in
            content(value)
                .presentationDetents(detents)
                .preferredColorScheme(.dark)
        }
    }

    func msSheet<Content: View>(
        isPresented: Binding<Bool>,
        detents: Set<PresentationDetent> = [.medium, .large],
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        sheet(isPresented: isPresented) {
            content()
                .presentationDetents(detents)
                .preferredColorScheme(.dark)
        }
    }
}
