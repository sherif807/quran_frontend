import SwiftUI

struct ContentView: View {
    @State private var selectedCorpus: Corpus = .quran
    @State private var showTranslation = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Picker("Scripture", selection: $selectedCorpus) {
                        ForEach(Corpus.allCases) { corpus in
                            Text(corpus.shortName).tag(corpus)
                        }
                    }
                    .pickerStyle(.segmented)
                    .accessibilityLabel("Choose scripture")

                    ScriptureHeader(corpus: selectedCorpus)

                    Toggle("Show translation", isOn: $showTranslation)
                        .font(.subheadline.weight(.medium))
                        .tint(selectedCorpus.tint)

                    ForEach(selectedCorpus.sampleVerses) { verse in
                        VerseCard(verse: verse, showTranslation: showTranslation, tint: selectedCorpus.tint)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("QuranAlive")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Search", systemImage: "magnifyingglass") { }
                        .accessibilityLabel("Search scripture")
                }
            }
        }
    }
}

private struct ScriptureHeader: View {
    let corpus: Corpus

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Label(corpus.displayName, systemImage: corpus.icon)
                .font(.title2.weight(.bold))
                .foregroundStyle(corpus.tint)
            Text(corpus.reference)
                .font(.subheadline.weight(.semibold))
            Text(corpus.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(corpus.tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct VerseCard: View {
    let verse: Verse
    let showTranslation: Bool
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack(alignment: .firstTextBaseline) {
                Text(verse.reference)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(tint)
                Spacer()
                Button("Bookmark", systemImage: "bookmark") { }
                    .labelStyle(.iconOnly)
                    .foregroundStyle(.secondary)
            }

            Text(verse.script)
                .font(.custom(verse.fontName, size: verse.scriptSize))
                .multilineTextAlignment(verse.isRightToLeft ? .trailing : .leading)
                .frame(maxWidth: .infinity, alignment: verse.isRightToLeft ? .trailing : .leading)
                .environment(\.layoutDirection, verse.isRightToLeft ? .rightToLeft : .leftToRight)

            if showTranslation {
                Divider()
                Text(verse.translation)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(18)
        .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(tint.opacity(0.16), lineWidth: 1)
        }
    }
}

private enum Corpus: String, CaseIterable, Identifiable {
    case quran, gospel, tanakh

    var id: String { rawValue }
    var shortName: String { displayName }
    var displayName: String {
        switch self {
        case .quran: "Quran"
        case .gospel: "Gospel"
        case .tanakh: "Tanakh"
        }
    }
    var reference: String {
        switch self {
        case .quran: "Al-Fātiḥah · 1"
        case .gospel: "Matthew · 5"
        case .tanakh: "Genesis · 1"
        }
    }
    var description: String {
        switch self {
        case .quran: "Arabic Quran with a clear English translation"
        case .gospel: "Greek New Testament with English translation"
        case .tanakh: "Hebrew Tanakh with English translation"
        }
    }
    var icon: String {
        switch self {
        case .quran: "book.closed.fill"
        case .gospel: "cross.fill"
        case .tanakh: "menorah.fill"
        }
    }
    var tint: Color {
        switch self {
        case .quran: .green
        case .gospel: .blue
        case .tanakh: .orange
        }
    }
    var sampleVerses: [Verse] {
        switch self {
        case .quran:
            [
                Verse(reference: "1:1", script: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "In the name of Allah—the Most Compassionate, Most Merciful.", fontName: "Geeza Pro", scriptSize: 27, isRightToLeft: true),
                Verse(reference: "1:2", script: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is for Allah—Lord of all worlds.", fontName: "Geeza Pro", scriptSize: 27, isRightToLeft: true),
                Verse(reference: "1:5", script: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "You alone we worship and You alone we ask for help.", fontName: "Geeza Pro", scriptSize: 27, isRightToLeft: true)
            ]
        case .gospel:
            [
                Verse(reference: "Matthew 5:3", script: "Μακάριοι οἱ πτωχοὶ τῷ πνεύματι", translation: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.", fontName: "Times New Roman", scriptSize: 24, isRightToLeft: false),
                Verse(reference: "Matthew 5:9", script: "Μακάριοι οἱ εἰρηνοποιοί", translation: "Blessed are the peacemakers, for they will be called children of God.", fontName: "Times New Roman", scriptSize: 24, isRightToLeft: false)
            ]
        case .tanakh:
            [
                Verse(reference: "Genesis 1:1", script: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", translation: "In the beginning God created the heavens and the earth.", fontName: "Times New Roman", scriptSize: 25, isRightToLeft: true),
                Verse(reference: "Genesis 1:3", script: "וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי אוֹר", translation: "And God said, “Let there be light,” and there was light.", fontName: "Times New Roman", scriptSize: 25, isRightToLeft: true)
            ]
        }
    }
}

private struct Verse: Identifiable {
    let reference: String
    let script: String
    let translation: String
    let fontName: String
    let scriptSize: CGFloat
    let isRightToLeft: Bool
    var id: String { reference }
}

#Preview {
    ContentView()
}
