import React from "react";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Nguyen Thi Lan",
    role: "Master's Student",
    university: "Seoul National University",
    country: "🇻🇳 Vietnam",
    text: "ICOM helped me find a part-time job within 2 weeks of arriving in Korea. The D-2 visa filter was exactly what I needed — no more scrolling through listings that didn't apply to me.",
    initials: "NL",
  },
  {
    name: "Bakhodir Toshmatov",
    role: "Exchange Student",
    university: "Yonsei University",
    country: "🇺🇿 Uzbekistan",
    text: "Before ICOM, I had no idea how to open a Korean bank account. The step-by-step guide saved me hours. Now I help other Uzbek students through the same process in our campus group.",
    initials: "BT",
  },
  {
    name: "Chen Wei",
    role: "PhD Candidate",
    university: "KAIST",
    country: "🇨🇳 China",
    text: "The AI assistant answers my Korean government website questions in seconds. It understands the context of being an international student, not just a tourist. Absolutely indispensable.",
    initials: "CW",
  },
  {
    name: "Priya Sharma",
    role: "Undergraduate",
    university: "Hanyang University",
    country: "🇮🇳 India",
    text: "The community feature is what keeps me coming back. I've made real friends through the India-Korea student group, and the ambassador from my department is always posting useful information.",
    initials: "PS",
  },
  {
    name: "Amira El-Rashid",
    role: "Language Student",
    university: "Korea University",
    country: "🇪🇬 Egypt",
    text: "I came to Korea knowing almost no Korean. ICOM's translation feature and language resources helped me navigate everything from hospital visits to lease contracts. Game changer.",
    initials: "AE",
  },
  {
    name: "Takeshi Yamamoto",
    role: "Graduate Student",
    university: "POSTECH",
    country: "🇯🇵 Japan",
    text: "Found a research assistant position through ICOM's jobs platform. The recommendation algorithm actually understood that I wanted research roles, not just any part-time work.",
    initials: "TY",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden" id="testimonials">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-foreground mb-3">
            Loved by students
            <span className="gradient-text"> worldwide</span>
          </h2>
          <p className="text-muted-foreground">Real stories from real international students in Korea</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="break-inside-avoid p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-all duration-300 group"
            >
              <Quote size={24} className="text-indigo-500/40 mb-3" />

              <p className="text-sm text-muted-foreground leading-relaxed mb-5 group-hover:text-foreground/80 transition-colors">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">{t.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.university}
                  </p>
                  <p className="text-xs text-muted-foreground/60">{t.country}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
