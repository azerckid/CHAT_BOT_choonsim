import { useState } from "react";
import { BottomNavigation } from "~/components/layout/BottomNavigation";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { CHARACTERS } from "~/lib/characters";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(null, { status: 302, headers: { Location: "/login" } });
  }

  // TODO: 실제 데이터 가져오기
  // 현재는 임시 데이터
  const selectedCharacterId = "yuna";
  const selectedCharacter = CHARACTERS[selectedCharacterId] || CHARACTERS["chunsim"];

  return Response.json({
    selectedCharacter,
    missions: [
      { id: 1, title: "Cheer Yuna 3 times", xp: 50, progress: 66, completed: false },
      { id: 2, title: "Share a fan post", xp: 30, progress: 0, completed: false },
    ],
    news: [
      { id: 1, type: "Event", title: "Summer Fan Meeting: Date Announcement!", time: "2 hours ago", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn299V6Y9ExjF7uP_prFCSAHAOIKuxQOwWizs6fjsgwk-o1X8monvsvjpwRZZWWjx_vL26FrSyUt6a4RmUqDLCyqCw6PS1iZ2cXj217ujdHqOwry7Qms8-SusWij1I3Hcq9qNQWQEX7vXWUNw1yaxvV3MZMjGV91UJkkVEEAp_Yb9UJp-pImib87v5_YIpx8vQVaABghglBilISWgN9RZ_k6OV-EZu3e1l2DO1c9NN6sqnEm0W1QgJ-mlSL6qUBqxS731OjPVy4OI" },
      { id: 2, type: "Shop", title: 'New Outfit "Neon Dreams" Available Now', time: "1 day ago", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDL-kBz0lyDRMr3OGRB8JQljGuKjUNwwYSyh9NsZ9QM6-qwwh8MiyWwe5x3jr_3LNQzdp7GO4ZIEhNODOxTpBt3-Xif_6-Yl7DYy0263dp5K2qrnRLzZCXV22Nm-NdlRaLeRUFa1p0U4PxW4VWt4dgmbJqnSagAKjPYJeDT3hgvDmQy3F6hQvphKzbxCzVExrwjqhHZx-8G3JUvtOTI9HO_y3iNoOR8tJvcmHbuaAgHi7MZyrartur3WC6Ucs_8MdTnBJttJM-lhuQ" },
    ],
    leaderboard: [
      { rank: 1, name: "K-PopLvr", points: 5800, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFWgvqzIRh9iu9JB5zlXWhnjdpvyp8zvCwNd7B9Z74r4JWtIR5tkNNPf9HBpmNCVYq0uRccUFLQdU6JAMhoVlhokxB3x7g07x_u8j0_jacSYMQFQA-btNo-ShVm8eJLhf554vT5Fzcd8sWFqrvzIpyFa7nTIT3CmDie1B8aaNkue01ETNKxWnUYsRV07np0_T5UIexExUu12GtQBGzedEbx_4Sa5LlW3j_KNkNc2nqV8nMswSZI2nIpSVsmaC44udAZAD2h4IFFmo" },
      { rank: 2, name: "SunnyDay", points: 4200, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6JFbJqcqzjabVAkBMCZHt9b3pNGwUZBzlAX2F896w1jGs2ckMtGBwR7dtXQepodLu1aLIURb-koLxM-VTqlLN6tPH42w4BjXsXRm0EPInBMhiHfZ_8vVc0muFLlxwCQK1rZ9EPVH3sb7mzABkGxqaHeD00OnVTb257m48JPVxa2Yi2dZnDIUas6k6DuSwGLuKu2fkfcmIlhhx6f2c7uoqr8LxAH08FjpJXjwoyeokjL21zfgF8WENEDhUJ7I32n1vPmY6DJ8Cro4" },
      { rank: 3, name: "Mochi", points: 3900, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-4DmZj7XqvzUaZu8nceR5X0p9HFB6Jo_iPuvs4v_8ZuGZb3pSjaIo1x4ENFpCckov9V51r9iliOAQzPnEtUMp7eOyN91qxLIl5Vhi_V2zBY-aaTaEfLYMkg9FyXYq1syhPtmDydCD_omgJyw_aK8WSLUyWlLrl0PYxMkGSJx6_vQmKN0nKFPn_VxH6hwy4eMW-u9FiqTq_1E1mc6F7Jt9hBPwnPh8nPiun2GLRUlMmVFNyDh-lrgxa2ZZRxCH2pX8qyqd8mHV2zg" },
      { rank: 4, name: "Starlight99", points: 2100, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5C-Ic1S2eX0pvI_VYMtiq3BDJsXsuYS4hZs7EiOxCek0oX1hVxbO0E-6f_ADrNie1_DaBaAZyXBu93ejzz1CqPzUDVSr6vjWL4udDMN2wnc4p7fGt81pVFnKzdqvwqQALPbZLOb1Jo4luii8E0156rAFOkwqKw2iKRjoV6SDX73-N7U3kf268yIrZDCl8t4uMiazL726QKAyGH_YDFSjTFTqmh4fPPjIXfkDlpffmxHIkbEkemlT-JYOl681oXrPUsAymvUkUibI" },
      { rank: 5, name: "PixelHeart", points: 1800, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaj3cHuTxVhxYml7rnom27dGcijWU3-KLSBTB2MR1RjjyCqA0uy47a-m6l9mp5Agw0SvUjOF35eMHdAkNV5-ndWQzjpv7GM2TI-0XDuQAo7hpI9_VWVs4PNIIeE8RISPpwBfD5DPJH8owiBZDZuZSSRIJi8-FZ6w6TvCqd6SpYZ3lPSPu_jDyhbUYSINWvV9MIPn7YvknuVEGlmTaQOQduyM4i2WChRF9oiI0Fe_qIdbRiqCUnW2C1BqSp6VXCO3-dZnSTJbZ-Y-Q" },
    ],
    feedPosts: [
      {
        id: 1,
        author: "Jessica_Stan",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjHusStF9Ki8ivdvGna1INEAsuVqxzyAWDJ2HdHAvtj2TuCbBDkYVq7psrKSL5rymgGbE4KJ1Q8d6H1c5J97U92OnuAa1Zt5eMvr06olx_txMkZlrVzsjDyf9sanAI6LODb18OYdNrswcAmEv5yVspRovEQZvlIpBUI_gTdKOZNv7iYjmPQfGppnrqc6hOTlBWhi6gBSEmKQk1Z9KJ1Na7ACFL2UZywZQqIcRaOaBCoBuyeep0IU_X39T0ui1mc1j5_2Q4NIO134Y",
        time: "20 mins ago",
        content: "Just unlocked the \"Close Friend\" status with Yuna! OMG her reaction was so cute 🥰 Can't wait for the new song! #Yuna #Fandom",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZIgwO7x4kLDDfLSjp7Sih4MeQ16haBHLRtEDLorzs4SimGdd5ar5gtvN8DpHG1Oi8tIyuEUZaoMltQFtb8bQ03-r4I6T2RCxoZgQwzDUmdeKRALI9S0dJAms13ZuLKXSpeBDK_bbjIKfBt4KfWzFOJQW6kz9O9UM7q9zA5jPJbZ2KvU4myOZ-pkS4Xk7DmSU03vzxs9vuNwrdCknWtZCDcKnSek3axZnw5FOUEeEb6W0e5ukV5aLqgBbh24VVkn1FiQHMW7cu1dU",
        likes: 124,
        comments: 18,
      },
      {
        id: 2,
        author: "MikeDev",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQLICXqljEVeJuiqzmNdq7k3DqzXrsH1S8QNwPT41GsuYM2N_2Dv6IqHEa7AbQzPLbl7ZH2Lqm7DpWzP4pEcAEH1jT8aQMieRJumxBy4B72njUumhIFmXMFyQGLU9WMKwTtQTyE0KvutDWwOIliHKOTaPxnyyAWccpDqUHaCGYfvd2mvrAF1SBldPL6arCkLM1aQq7PMf72j4pCPEw9bz93D3r-6MnuGPiuEzdCnHLaNc5QH2vVbGnIA7BNUoSUtfeguRQsSS0LGE",
        time: "1 hour ago",
        content: 'Does anyone know how to complete the "Share a fan post" mission? I keep clicking share but it doesn\'t register 🤔',
        likes: 12,
        comments: 5,
      },
    ],
  });
}

export default function FandomScreen() {
  const { selectedCharacter, missions, news, leaderboard, feedPosts } = useLoaderData<typeof loader>() as any;
  const navigate = useNavigate();
  const [selectedCharacterId, setSelectedCharacterId] = useState(selectedCharacter.id);
  const [feedFilter, setFeedFilter] = useState("All");

  const characters = Object.values(CHARACTERS).slice(0, 4); // Yuna, Mina, Sora, Rina 등

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen relative pb-24">
      {/* Top App Bar */}
      <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Fandom Lounge</h2>
          <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <div className="relative">
              <span className="material-symbols-outlined text-slate-800 dark:text-white">notifications</span>
              <span className="absolute top-0 right-0 size-2.5 bg-primary rounded-full border-2 border-background-light dark:border-background-dark" />
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col gap-6 pt-4">
        {/* Character Selector */}
        <div className="w-full overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-4 min-w-max">
            {characters.map((char: any) => {
              const isActive = char.id === selectedCharacterId;
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacterId(char.id)}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={cn(
                    "p-[3px] rounded-full transition-all",
                    isActive ? "bg-gradient-to-tr from-primary to-purple-400" : "bg-transparent"
                  )}>
                    <div className={cn(
                      "size-16 rounded-full border-4 overflow-hidden",
                      isActive
                        ? "border-background-light dark:border-background-dark bg-surface-dark"
                        : "border-transparent bg-surface-dark/50 opacity-70 group-hover:opacity-100"
                    )}>
                      <img
                        className="w-full h-full object-cover"
                        src={char.avatarUrl}
                        alt={char.name}
                      />
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs",
                    isActive ? "font-bold text-primary" : "font-medium"
                  )}>
                    {char.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bias Spotlight Card */}
        <div className="px-4">
          <div className="relative overflow-hidden rounded-2xl bg-surface-dark dark:bg-surface-dark shadow-lg dark:shadow-none group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506979287313-09437452d37c?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90" />
            <div className="relative p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-2 border border-primary/30">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    My Bias
                  </span>
                  <h2 className="text-2xl font-bold text-white leading-tight">{selectedCharacter.name}'s Official Space</h2>
                  <p className="text-white/60 text-sm">{selectedCharacter.role} • AI Generation 3</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="size-12 rounded-full border-2 border-primary p-1 bg-surface-dark">
                    <span className="flex items-center justify-center h-full w-full text-xs font-bold text-primary">LV.12</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-white/80">
                  <span>Affection Level</span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%] rounded-full shadow-[0_0_10px_rgba(238,43,140,0.5)]" />
                </div>
                <p className="text-xs text-white/50 text-right">150 XP to Close Friend</p>
              </div>
              <button
                onClick={() => navigate(`/character/${selectedCharacter.id}`)}
                className="mt-2 w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">forum</span>
                Enter Lounge
              </button>
            </div>
          </div>
        </div>

        {/* Daily Missions */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold dark:text-white text-slate-900">Daily Missions</h3>
            <a className="text-sm font-medium text-primary hover:text-primary/80" href="#">View All</a>
          </div>
          <div className="flex flex-col gap-3">
            {missions.map((mission: any) => (
              <div
                key={mission.id}
                className={cn(
                  "p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4",
                  mission.completed && "opacity-60"
                )}
              >
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-blue-500">campaign</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-bold dark:text-white truncate">{mission.title}</p>
                    <span className="text-xs font-bold text-primary">+{mission.xp} XP</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>
                {mission.completed ? (
                  <button className="shrink-0 size-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                ) : (
                  <button className="shrink-0 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-500 dark:text-white/50">
                    Go
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Official News */}
        <div className="pl-4">
          <div className="flex items-center gap-2 mb-3 pr-4">
            <span className="material-symbols-outlined text-primary">new_releases</span>
            <h3 className="text-xl font-bold dark:text-white text-slate-900">Official Updates</h3>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 pr-4 scrollbar-hide">
            {news.map((item: any) => (
              <div
                key={item.id}
                className="min-w-[260px] rounded-xl overflow-hidden bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-sm group cursor-pointer"
              >
                <div className="aspect-[16/9] w-full bg-slate-200 relative">
                  <img
                    className="w-full h-full object-cover"
                    src={item.image}
                    alt={item.title}
                  />
                  <div className={cn(
                    "absolute top-2 left-2 px-2 py-0.5 rounded backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider",
                    item.type === "Event" ? "bg-black/60" : "bg-primary"
                  )}>
                    {item.type}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-white/40 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="px-4">
          <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-4">Top Stans</h3>
          <div className="bg-surface-dark/50 dark:bg-surface-dark rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            {/* Podium */}
            <div className="flex items-end justify-center gap-4 mb-6 pt-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center gap-1 w-1/3">
                <div className="relative">
                  <div className="size-12 rounded-full border-2 border-slate-400 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={leaderboard[1].avatar}
                      alt={leaderboard[1].name}
                    />
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-slate-400 text-[10px] font-bold px-1.5 rounded text-white">2</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white mt-1 truncate w-full text-center">{leaderboard[1].name}</p>
                <p className="text-[10px] text-white/50">{(leaderboard[1].points / 1000).toFixed(1)}k pts</p>
              </div>
              {/* 1st Place */}
              <div className="flex flex-col items-center gap-1 w-1/3 -mt-6">
                <span className="material-symbols-outlined text-yellow-500 text-lg animate-bounce">crown</span>
                <div className="relative">
                  <div className="size-16 rounded-full border-4 border-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                    <img
                      className="w-full h-full object-cover"
                      src={leaderboard[0].avatar}
                      alt={leaderboard[0].name}
                    />
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-yellow-500 text-xs font-bold px-2 py-0.5 rounded text-black">1</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary mt-1 truncate w-full text-center">{leaderboard[0].name}</p>
                <p className="text-xs text-white/50">{(leaderboard[0].points / 1000).toFixed(1)}k pts</p>
              </div>
              {/* 3rd Place */}
              <div className="flex flex-col items-center gap-1 w-1/3">
                <div className="relative">
                  <div className="size-12 rounded-full border-2 border-orange-700 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={leaderboard[2].avatar}
                      alt={leaderboard[2].name}
                    />
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-orange-700 text-[10px] font-bold px-1.5 rounded text-white">3</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white mt-1 truncate w-full text-center">{leaderboard[2].name}</p>
                <p className="text-[10px] text-white/50">{(leaderboard[2].points / 1000).toFixed(1)}k pts</p>
              </div>
            </div>
            {/* List Items (4 and 5) */}
            <div className="flex flex-col gap-2">
              {leaderboard.slice(3).map((user: any) => (
                <div key={user.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-sm font-bold text-white/40 w-4 text-center">{user.rank}</span>
                  <div className="size-8 rounded-full bg-slate-700 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={user.avatar}
                      alt={user.name}
                    />
                  </div>
                  <p className="text-sm font-medium text-white flex-1">{user.name}</p>
                  <p className="text-xs text-primary font-bold">{(user.points / 1000).toFixed(1)}k</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shop Banner */}
        <div className="px-4">
          <div className="relative rounded-2xl overflow-hidden h-32 flex items-center shadow-lg group cursor-pointer">
            <img
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs__jgwFohzsVOb4AbK4GIShS5w5r8A2oZIbE9bD3Uclc3uqEpFFLsqzH4e8wKalOl5155wm5BC9BT1aimVq2fH3Jma7uLRvzWDjIPrvD0HGC60a6a8cyaFfQyXNb0MRx2FEht_4Wg220r5YfwewQM7oE3dQM6dblEO4hYP2sA8T8V0oawqzRwiSei1giZx6IAbQsjrYoVXTe-cnphdGVsHtigNP_lMUMKuKsQ2pK7XTC7YacLXSGf_WlgQVGZ_-QWxFd4Y_KkSQ8"
              alt="Shop banner"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="relative z-10 p-6 flex flex-col items-start gap-2">
              <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded">Limited Drop</span>
              <h3 className="text-xl font-bold text-white">{selectedCharacter.name}'s Concert<br />Merch Store</h3>
              <div className="flex items-center gap-1 text-xs font-bold text-primary mt-1">
                Shop Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>

        {/* Community Feed */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold dark:text-white text-slate-900">Fan Feed</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFeedFilter("All")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  feedFilter === "All"
                    ? "bg-primary text-white"
                    : "bg-slate-200 dark:bg-white/10 dark:text-white/60 text-slate-600"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFeedFilter("Art")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  feedFilter === "Art"
                    ? "bg-primary text-white"
                    : "bg-slate-200 dark:bg-white/10 dark:text-white/60 text-slate-600"
                )}
              >
                Art
              </button>
            </div>
          </div>
          {feedPosts.map((post: any) => (
            <div
              key={post.id}
              className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-white/5 p-4 mb-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-slate-200 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src={post.avatar}
                    alt={post.author}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white text-slate-900">{post.author}</p>
                  <p className="text-xs text-slate-500 dark:text-white/40">{post.time}</p>
                </div>
                <button className="ml-auto text-slate-400">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-white/90 mb-3 leading-relaxed">{post.content}</p>
              {post.image && (
                <div className="rounded-lg overflow-hidden mb-3">
                  <img
                    className="w-full h-auto object-cover"
                    src={post.image}
                    alt="Post image"
                  />
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                <button className="flex items-center gap-1.5 text-slate-500 dark:text-white/60 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                  <span className="text-xs font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-slate-500 dark:text-white/60 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                  <span className="text-xs font-medium">{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-slate-500 dark:text-white/60 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-4 z-40 size-14 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(238,43,140,0.5)] flex items-center justify-center hover:scale-110 transition-transform active:scale-90">
        <span className="material-symbols-outlined text-3xl">edit</span>
      </button>

      <BottomNavigation />
    </div>
  );
}
