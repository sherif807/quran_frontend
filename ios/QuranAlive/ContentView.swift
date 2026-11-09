import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "book.closed.fill")
                .font(.system(size: 52))
                .foregroundStyle(.green)

            Text("QuranAlive")
                .font(.largeTitle.weight(.semibold))

            Text("Native iPhone starter build")
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
