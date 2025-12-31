import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

type Tab = "about" | "voice" | "gallery";

export default function CharacterProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [isFavorite, setIsFavorite] = useState(true);

  // TODO: 실제 데이터로 교체
  const character = {
    id: id || "luna",
    name: "Luna",
    role: "Main Vocalist",
    relationship: "Close Friend",
    affinity: "98%",
    fandomLevel: "Lv. 12",
    intro:
      "Hey! Did you see the show last night? I was looking for you in the crowd. Let's practice some songs together later!",
    backstory:
      "Born in Seoul, Luna always dreamed of the stage. Despite her shy nature off-camera, she transforms into a powerhouse vocalist when the spotlight hits. She treasures her fans deeply, often writing songs based on the letters they send her.\n\nRecently, she's been feeling a bit lonely after her concerts end, looking for someone who sees the real girl behind the idol persona.",
    personalityTraits: [
      { icon: "sentiment_satisfied", color: "text-yellow-500", label: "#Cheerful" },
      { icon: "volunteer_activism", color: "text-pink-500", label: "#Empathetic" },
      { icon: "music_note", color: "text-purple-500", label: "#Musical" },
      { icon: "nightlight", color: "text-blue-400", label: "#NightOwl" },
    ],
    interests: [
      { icon: "headphones", label: "Lo-Fi Music", sublabel: "Relaxing", color: "bg-blue-500/10 text-blue-500" },
      { icon: "pets", label: "Cute Cats", sublabel: "Obsessed", color: "bg-pink-500/10 text-pink-500" },
    ],
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8_sPG0MwJEnhahvZyTmY8fTfk1iaTSvzkiIDhQw6QyLjAfSi2zyqPLTc-hgtgIf79D8lgxCLawlgJhKxlB2L3ec3nqZNs373OcWbk5g7lVZPcQO8ef2znQb4DGWCR983dxISIx72Qf6VXNG6WApTSWBhwH7Q4OLxT6KMPTq330RaMTRbh_VOh4SPnAajsZZt6rXYK1Bdhn6oJLBkrfTsYpBtetMvS9QeFZdjywB3XxYwYE3OkjEOLuvUH6PhxP_H2nwcEjd6sMHk",
  };

  const handleMessage = () => {
    navigate(`/chat/${character.id}`);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display selection:bg-primary selection:text-white antialiased overflow-x-hidden pb-24 max-w-md mx-auto md:max-w-lg lg:max-w-xl">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition hover:bg-black/40"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-3">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition hover:bg-black/40">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-primary transition hover:bg-black/40"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        </div>
      </nav>

      <div className="relative w-full h-[55vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${character.heroImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent" />
        </div>
      </div>

      <div className="relative -mt-16 z-10 w-full bg-background-light dark:bg-background-dark rounded-t-2xl px-5 pt-8 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {character.name}
            </h1>
            <p className="text-primary font-medium text-sm tracking-wide uppercase">
              {character.role}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span
              className="material-symbols-outlined text-primary text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="text-xs font-bold text-primary">{character.relationship}</span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 font-body italic">
          "{character.intro}"
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {character.affinity}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
              Affinity
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {character.fandomLevel}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
              Fandom
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 cursor-pointer hover:border-primary/50 transition">
            <span className="material-symbols-outlined text-primary mb-0.5">
              settings_heart
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
              Relation
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Personality Traits
          </h3>
          <div className="flex flex-wrap gap-2">
            {character.personalityTraits.map((trait, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm"
              >
                <span className={cn("material-symbols-outlined text-[18px]", trait.color)}>
                  {trait.icon}
                </span>
                <span className="text-xs font-medium dark:text-gray-200">{trait.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-white/10 mb-6">
          <div className="flex gap-6">
            {(["about", "voice", "gallery"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 text-sm font-medium transition capitalize",
                  activeTab === tab
                    ? "font-bold text-primary border-b-2 border-primary"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {tab === "about" ? "About" : tab === "voice" ? "Voice" : "Gallery"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "about" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Backstory
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-body whitespace-pre-line">
                {character.backstory}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-surface-dark to-background-dark border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition">
                <span className="material-symbols-outlined text-white text-6xl">graphic_eq</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Morning Greeting</h4>
              <p className="text-xs text-gray-400 mb-3">0:12 • Listen to {character.name}'s voice</p>
              <div className="flex items-center gap-3">
                <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:scale-105 transition">
                  <span className="material-symbols-outlined text-[20px] ml-0.5">play_arrow</span>
                </button>
                <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-primary rounded-full" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Interests</h3>
              <div className="grid grid-cols-2 gap-3">
                {character.interests.map((interest, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 flex items-center gap-3"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", interest.color)}>
                      <span className="material-symbols-outlined">{interest.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold dark:text-white">{interest.label}</p>
                      <p className="text-[10px] text-gray-500">{interest.sublabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "voice" && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Voice samples coming soon...</p>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Gallery coming soon...</p>
          </div>
        )}

        <div className="h-12" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 z-40">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={handleMessage}
            className="flex-1 flex items-center justify-center gap-2 h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-primary-glow animate-glow transition transform active:scale-95"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            Message {character.name}
          </button>
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-400 hover:text-primary transition active:scale-95">
            <span className="material-symbols-outlined">videocam</span>
          </button>
        </div>
        <div className="h-2 w-full" />
      </div>
    </div>
  );
}

