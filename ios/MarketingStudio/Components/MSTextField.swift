import SwiftUI

struct MSTextField: View {
    var label: String? = nil
    var placeholder: String
    @Binding var text: String
    var icon: String? = nil
    var keyboard: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences

    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let label { Text(label).msCaption(color: MSColor.text2) }
            HStack(spacing: 10) {
                if let icon { Image(systemName: icon).foregroundStyle(MSColor.muted).font(.system(size: 14)) }
                TextField("", text: $text, prompt: Text(placeholder).foregroundStyle(MSColor.muted))
                    .font(MSFont.body())
                    .foregroundStyle(MSColor.text)
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(autocapitalization)
                    .focused($focused)
                if !text.isEmpty {
                    Button { text = "" } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(MSColor.muted)
                    }
                }
            }
            .padding(.horizontal, 14)
            .frame(height: 48)
            .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous)
                    .strokeBorder(focused ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1)
            )
            .animation(MSAnimation.gentle, value: focused)
        }
    }
}

struct MSTextEditor: View {
    var label: String? = nil
    var placeholder: String
    @Binding var text: String
    var minHeight: CGFloat = 110

    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let label { Text(label).msCaption(color: MSColor.text2) }
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text(placeholder)
                        .font(MSFont.body())
                        .foregroundStyle(MSColor.muted)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                }
                TextEditor(text: $text)
                    .font(MSFont.body())
                    .foregroundStyle(MSColor.text)
                    .scrollContentBackground(.hidden)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .focused($focused)
            }
            .frame(minHeight: minHeight)
            .background(MSColor.elevated, in: RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: MSRadius.md, style: .continuous)
                    .strokeBorder(focused ? MSColor.accent.opacity(0.6) : MSColor.border, lineWidth: 1)
            )
            .animation(MSAnimation.gentle, value: focused)
        }
    }
}

struct SearchBar: View {
    var placeholder: String = "Search"
    @Binding var text: String

    var body: some View {
        MSTextField(placeholder: placeholder, text: $text, icon: "magnifyingglass", autocapitalization: .never)
    }
}
