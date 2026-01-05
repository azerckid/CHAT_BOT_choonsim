import { useEffect, useState } from "react";

interface HeartBurstProps {
    active: boolean;
    count?: number;
    onComplete?: () => void;
}

export function HeartBurst({ active, count = 25, onComplete }: HeartBurstProps) {
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number; scale: number; rotation: number; delay: number; color: string }[]>([]);

    useEffect(() => {
        if (active) {
            const colors = ["text-pink-500", "text-red-500", "text-purple-500", "text-rose-400"];
            const newHearts = Array.from({ length: count }).map((_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * window.innerWidth * 0.8, // Spread horizontally
                y: -Math.random() * window.innerHeight * 0.5 - 100, // Move upwards
                scale: Math.random() * 1.5 + 0.5,
                rotation: Math.random() * 90 - 45,
                delay: Math.random() * 0.3,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
            setHearts(newHearts);

            const timer = setTimeout(() => {
                setHearts([]);
                onComplete?.();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [active, count, onComplete]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-end justify-center pb-20">
            {hearts.map((heart) => (
                <span
                    key={heart.id}
                    className={`material-symbols-outlined absolute ${heart.color} animate-float-up text-[24px]`}
                    style={{
                        // @ts-ignore
                        "--tx": `${heart.x}px`,
                        "--ty": `${heart.y}px`,
                        "--r": `${heart.rotation}deg`,
                        "--s": `${heart.scale}`,
                        animationDelay: `${heart.delay}s`,
                        bottom: "80px", // Start from near the input bar
                        left: "50%",
                        opacity: 0,
                    }}
                >
                    favorite
                </span>
            ))}
            <style>{`
        @keyframes float-up {
          0% {
            transform: translate(-50%, 0) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -20px) rotate(0deg) scale(1);
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), var(--ty)) rotate(var(--r)) scale(var(--s));
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
        </div>
    );
}
