import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function Footer() {
  return (
    <footer className="border-t border-outline-variant/10 bg-surface-dim" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo-icon.png"
                alt="Fitness Freek emblem"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-[Epilogue] font-black italic text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container uppercase tracking-tighter">
                Fitness Freek
              </span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              India&apos;s AI-powered fitness platform. Transform your body with personalized plans, gamification, and expert coaching.
            </p>
            <div className="flex gap-3">
              {["instagram", "youtube", "phone_iphone"].map((icon) => (
                <button
                  key={icon}
                  className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-all"
                  aria-label={icon}
                >
                  <Icon name={icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-[Epilogue] font-black italic uppercase text-sm mb-5">Platform</h3>
            <ul className="space-y-3">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Workout Plans", href: "/workout" },
                { label: "Diet Plans", href: "/diet" },
                { label: "Progress Tracking", href: "/progress" },
                { label: "AI Coach", href: "/ai-coach" },
                { label: "BMI Calculator", href: "/#bmi" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-on-surface-variant hover:text-on-surface text-sm transition-colors font-[Inter]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Goals */}
          <div>
            <h3 className="font-[Epilogue] font-black italic uppercase text-sm mb-5">Goals</h3>
            <ul className="space-y-3">
              {[
                "Weight Loss",
                "Muscle Gain",
                "Maintenance",
                "HIIT Training",
                "Yoga & Recovery",
                "Beginner Programs",
              ].map((item) => (
                <li key={item}>
                  <a href="/workout" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors font-[Inter]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-[Epilogue] font-black italic uppercase text-sm mb-5">Company</h3>
            <ul className="space-y-3">
              {[
                { label: "About Coach", href: "/#coach" },
                { label: "Pricing", href: "/#pricing" },
                { label: "Testimonials", href: "/#reviews" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-on-surface-variant hover:text-on-surface text-sm transition-colors font-[Inter]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-xs font-[Space_Grotesk]">
            © 2025 Fitness Freek. All rights reserved. Made with 💪 in India.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant/10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-on-surface-variant text-xs font-[Space_Grotesk] uppercase tracking-widest">AI Coach Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
