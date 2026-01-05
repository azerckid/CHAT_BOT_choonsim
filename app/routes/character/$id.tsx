import { useState } from "react";
import { useNavigate, useParams, useLoaderData } from "react-router";
import { cn } from "~/lib/utils";
import { CHARACTERS } from "~/lib/characters";
import { db } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "~/db/schema";
import type { LoaderFunctionArgs } from "react-router";

type Tab = "about" | "voice" | "gallery";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  const characterId = params.id || "chunsim";

  // 1. Character Stats (Global)
  const stats = await db.query.characterStat.findFirst({
    where: eq(schema.characterStat.characterId, characterId),
  });

  // 2. My Contribution (Total Hearts Sent)
  let myContribution = 0;
  if (userId) {
    const result = await db
      .select({ totalAmount: sql<number>`sum(${schema.giftLog.amount})` })
      .from(schema.giftLog)
      .where(and(
        eq(schema.giftLog.fromUserId, userId),
        eq(schema.giftLog.toCharacterId, characterId),
        eq(schema.giftLog.itemId, "heart") // Assuming hearts are the main affinity metric
      ));

    myContribution = result[0]?.totalAmount || 0;
  }

  // 3. Affinity Calculation (Simple Logic for V1)
  // Max affinity 100% reached at 1000 hearts
  const affinityValue = Math.min(100, Math.floor(myContribution / 10));
  const fandomLevelValue = Math.floor(Math.sqrt(myContribution)) + 1; // Lv.1 start, Lv.10 at 81 hearts, Lv.30 at 900 hearts

  return {
    characterId,
    stats: stats || { totalHearts: 0, totalUniqueGivers: 0 },
    myContribution,
    affinityValue,
    fandomLevelValue,
  };
}

export default function CharacterProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stats, myContribution, affinityValue, fandomLevelValue } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [isFavorite, setIsFavorite] = useState(true);

  // CHARACTERS에서 실제 캐릭터 데이터 가져오기
  const characterData = CHARACTERS[id || "chunsim"] || CHARACTERS["chunsim"];

  // 프로필 화면에 필요한 추가 정보 (기본값 또는 characterData에서 가져오기)
  const character = {
    id: characterData.id,
    name: characterData.name,
    role: characterData.role,
    relationship: fandomLevelValue > 10 ? "Close Friend" : "Fan", // Dynamic relation
    affinity: `${affinityValue}%`,
    fandomLevel: `Lv. ${fandomLevelValue}`,
    intro: characterData.bio || `안녕! 나는 ${characterData.name}야. 만나서 반가워!`,
    backstory: characterData.bio || `${characterData.name}에 대한 이야기입니다.`,
    personalityTraits: [
      { icon: "sentiment_satisfied", color: "text-yellow-500", label: "#Cheerful" },
      { icon: "volunteer_activism", color: "text-pink-500", label: "#Empathetic" },
      { icon: "music_note", color: "text-purple-500", label: "#Musical" },
      { icon: "nightlight", color: "text-blue-400", label: "#NightOwl" },
    ],
    interests: [
      { icon: "headphones", label: "Music", sublabel: "Favorite", color: "bg-blue-500/10 text-blue-500" },
      { icon: "favorite", label: "Fans", sublabel: "Loved", color: "bg-pink-500/10 text-pink-500" },
    ],
    heroImage: characterData.avatarUrl, // avatarUrl을 heroImage로 사용
  };

  const handleMessage = () => {
    navigate(`/chat/${character.id}`);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display selection:bg-primary selection:text-white antialiased overflow-x-hidden min-h-screen max-w-md mx-auto relative pb-24">
      {/* Top Navigation (Absolute Overlay) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition hover:bg-black/40 active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-3">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition hover:bg-black/40 active:scale-95">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-primary transition hover:bg-black/40 active:scale-95"
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

      {/* Hero Image Section */}
      <div className="relative w-full h-[55vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${character.heroImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent" />
        </div>
      </div>

      {/* Main Content Sheet (Overlaps Hero) */}
      <div className="relative -mt-16 z-10 w-full bg-background-light dark:bg-background-dark rounded-t-2xl px-5 pt-8 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {/* Drag Handle Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />

        {/* Global Stats Badge (New!) */}
        <div className="absolute top-0 right-5 -translate-y-1/2 bg-surface-dark border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined text-pink-500 text-sm">favorite</span>
          <span className="text-white text-xs font-bold">{stats.totalHearts.toLocaleString()} Hearts</span>
        </div>

        {/* Header Info */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{character.name}</h1>
            <p className="text-primary font-medium text-sm tracking-wide uppercase">{character.role}</p>
          </div>
          {/* Relationship Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <span className="text-xs font-bold text-primary">{character.relationship}</span>
          </div>
        </div>

        {/* Intro Text */}
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 font-body">
          "{character.intro}"
        </p>

        {/* Stats / Quick Info */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5">
            <span className="text-xl font-bold text-gray-900 dark:text-white">{character.affinity}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Affinity</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5">
            <span className="text-xl font-bold text-gray-900 dark:text-white">{character.fandomLevel}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Fandom</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 cursor-pointer hover:border-primary/50 transition bg-gradient-to-br from-primary/5 to-transparent">
            <span className="text-xl font-bold text-primary">{myContribution.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">My Hearts</span>
          </div>
        </div>

        {/* Personality Chips */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Personality Traits</h3>
          <div className="flex flex-wrap gap-2">
            {character.personalityTraits.map((trait, index) => (
              <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm">
                <span className={cn("material-symbols-outlined text-[18px]", trait.color)}>{trait.icon}</span>
                <span className="text-xs font-medium dark:text-gray-200">{trait.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-white/10 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("about")}
              className={cn("pb-3 text-sm transition", activeTab === "about" ? "font-bold text-primary border-b-2 border-primary" : "font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200")}
            >About</button>
            <button
              onClick={() => setActiveTab("voice")}
              className={cn("pb-3 text-sm transition", activeTab === "voice" ? "font-bold text-primary border-b-2 border-primary" : "font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200")}
            >Voice</button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={cn("pb-3 text-sm transition", activeTab === "gallery" ? "font-bold text-primary border-b-2 border-primary" : "font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200")}
            >Gallery</button>
          </div>
        </div>

        {/* Tab Content: About */}
        {activeTab === "about" && (
          <div className="space-y-6">
            {/* Background Story */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Backstory</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-body whitespace-pre-line">
                {character.backstory}
              </p>
            </div>

            {/* Voice Sample Preview */}
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
                  <div className="h-full w-1/3 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Interests Grid */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Interests</h3>
              <div className="grid grid-cols-2 gap-3">
                {character.interests.map((interest, index) => (
                  <div key={index} className="p-3 rounded-lg bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", interest.color.replace(' text-', ' '))}>
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
            <div className="h-12"></div>
          </div>
        )}

        {/* Tab Content: Voice/Gallery Placeholders */}
        {activeTab === "voice" && <div className="text-gray-400 text-sm italic py-10">Voice samples coming soon...</div>}
        {activeTab === "gallery" && <div className="text-gray-400 text-sm italic py-10">Gallery coming soon...</div>}
      </div>

      {/* Sticky Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 z-40 max-w-md mx-auto">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={handleMessage}
            className="flex-1 flex items-center justify-center gap-2 h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/30 animate-glow transition transform active:scale-95"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            Message {character.name}
          </button>
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-400 hover:text-primary transition active:scale-95">
            <span className="material-symbols-outlined">videocam</span>
          </button>
        </div>
      </div>
    </div>
  );
}

