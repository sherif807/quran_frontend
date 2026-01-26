import Header from "../components/Header";
import SpeechSettings from "../components/SpeechSettings";
import Link from "next/link";

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
      <SpeechSettings inline />
    </div>
  );
}
