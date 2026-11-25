import { useEffect, useState } from "react";

const photos = [
  "photo-1600210492486-724fe5c67fb0",
  "photo-1600585154340-be6161a56a0c",
  "photo-1600607687920-4e2a09cf159d",
];

export default function HeroBackgroundSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    function updateTimer() {
      window.clearInterval(timer);
      if (!motion.matches && !document.hidden) {
        timer = window.setInterval(() => {
          setActive((index) => (index + 1) % photos.length);
        }, 5000);
      }
    }
    updateTimer();
    motion.addEventListener("change", updateTimer);
    document.addEventListener("visibilitychange", updateTimer);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener("change", updateTimer);
      document.removeEventListener("visibilitychange", updateTimer);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {photos.map((photo, index) => (
        <img
          key={photo}
          src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1920&q=85`}
          alt=""
          fetchPriority={index === 0 ? "high" : "low"}
          className={`absolute inset-0 size-full object-cover motion-safe:transition-opacity motion-safe:duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,23,46,.70),rgba(7,23,46,.60))]" />
    </div>
  );
}
