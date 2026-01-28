import Header from "../components/Header";
import SpeechSettings from "../components/SpeechSettings";
import QuranTranslationSettings from "../components/QuranTranslationSettings";
import BackButton from "../components/BackButton";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="container py-3">
      <Header />
      <div className="settings-header mb-3">
        <h3 className="mb-0">Settings</h3>
      </div>
      <div className="mb-4">
        <SpeechSettings
          inline
          storageKey="hebrew_tts_settings"
          title="Hebrew speech"
          defaultLanguage="he-IL"
          defaultPreviewText="בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ"
        />
      </div>
      <SpeechSettings
        inline
        storageKey="greek_tts_settings"
        title="Greek speech"
        defaultLanguage="el-GR"
        defaultPreviewText="Ἐν ἀρχῇ ἦν ὁ λόγος"
      />

      <QuranTranslationSettings />

      <div className="mt-4">
        <BackButton fallbackHref="/1" />
      </div>
    </div>
  );
}
