import { useState } from "react";
import { GameController, House, PencilSimpleLine, UserCircle } from "@phosphor-icons/react";
import HomeTab from "./components/HomeTab";
import PlaygroundTab from "./components/PlaygroundTab";
import ProfileTab from "./components/ProfileTab";
import GamesHubTab from "./components/GamesHubTab";

type TabKey = "home" | "playground" | "games" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [playgroundCode, setPlaygroundCode] = useState<string>();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-[#1f2937] bg-[#0a0a0f]/80 backdrop-blur px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Python 3 Hub
        </h1>
        <nav className="flex gap-1">
          {([
            { key: "home", icon: House, label: "Home" },
            { key: "playground", icon: PencilSimpleLine, label: "Playground" },
            { key: "games", icon: GameController, label: "Games" },
            { key: "profile", icon: UserCircle, label: "Profile" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === key
                  ? "bg-[#1f2937] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#1f2937]/50"
              }`}
            >
              <Icon weight="fill" size={20} />
              <span className="hidden sm:inline text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {activeTab === "home" && (
          <HomeTab
            onOpenPlayground={(code) => {
              setPlaygroundCode(code);
              setActiveTab("playground");
            }}
            onGoGames={() => setActiveTab("games")}
          />
        )}
        {activeTab === "playground" && (
          <PlaygroundTab
            initialCode={playgroundCode}
            onClear={() => setPlaygroundCode(undefined)}
          />
        )}
        {activeTab === "games" && <GamesHubTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>
    </div>
  );
}
