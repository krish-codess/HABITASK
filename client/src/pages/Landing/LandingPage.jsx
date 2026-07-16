import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AppIcon from '../../components/UI/AppIcon.jsx';

/* ── Mock app preview ──────────────────────────────────────── */
function MockHeatmap() {
  const colors = ['#1a1a2e','#2a1f50','#46358a','#6050c8','#7c6af7','#a294fc'];
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 22 }).map((_, c) => (
        <div key={c} className="flex flex-col gap-[3px]">
          {Array.from({ length: 7 }).map((_, r) => (
            <div
              key={r}
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ background: colors[(c * 7 + r * 3 + c + r) % 6] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function MockApp() {
  return (
    <div className="bg-ht-surface rounded-2xl border border-ht-border p-4 shadow-2xl shadow-black/40 space-y-3 select-none pointer-events-none">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ht-text-1">Habits</span>
        <span className="text-[10px] text-ht-text-3 bg-ht-elevated border border-ht-border px-2 py-0.5 rounded">Wed, 16 Jul</span>
      </div>

      {/* Progress ring + stats */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r="18" fill="none" strokeWidth="4" stroke="#1a1a2e" />
            <circle cx="24" cy="24" r="18" fill="none" strokeWidth="4"
              stroke="#7c6af7" strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*18*0.86} ${2*Math.PI*18}`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ht-text-1">86%</span>
        </div>
        <div className="flex gap-3">
          {[['14d','Streak','text-orange-400'],['87','Score','text-ht-accent-2'],['6/7','Habits','text-ht-text-1']].map(([v, l, c]) => (
            <div key={l}>
              <p className={`text-base font-bold ${c}`}>{v}</p>
              <p className="text-[9px] text-ht-text-3">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap preview */}
      <div className="bg-ht-elevated rounded-xl p-3 border border-ht-border">
        <p className="text-[9px] text-ht-text-3 mb-2 uppercase tracking-wider font-medium">Year overview</p>
        <MockHeatmap />
      </div>

      {/* Calorie bar */}
      <div className="bg-ht-elevated rounded-xl p-3 border border-ht-border">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-ht-text-3">Calories today</span>
          <span className="text-[10px] text-ht-text-1 font-medium">1,840 / 2,200</span>
        </div>
        <div className="h-1.5 bg-ht-border rounded-full overflow-hidden">
          <div className="h-full w-[84%] bg-ht-accent rounded-full" />
        </div>
        <div className="flex gap-4 mt-2">
          {[['P','124g','text-ht-accent-2'],['C','210g','text-ht-warning'],['F','58g','text-ht-danger']].map(([l,v,c]) => (
            <div key={l}>
              <p className={`text-xs font-bold ${c}`}>{v}</p>
              <p className="text-[9px] text-ht-text-3">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-around pt-1 border-t border-ht-border">
        {[['calendar','Habits',true],['clock','Workout'],['lunchbox','Calories'],['all','Analytics'],['globe','Social']].map(([icon, label, active]) => (
          <div key={label} className={`flex flex-col items-center gap-0.5 ${active ? 'text-ht-accent' : 'text-ht-text-3'}`}>
            <AppIcon name={icon} size={14} strokeWidth={active ? 2 : 1.6} />
            <span className="text-[8px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FAQ ───────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Is the app free?',           a: 'Yes, HabiTask is completely free to use for you and your friends.' },
  { q: 'Does it work on mobile?',    a: 'Yes — it\'s a fully responsive web app optimised for mobile browsers. No app store download needed.' },
  { q: 'Is my data private?',        a: 'Your data is stored securely. Only you and friends you explicitly add can see your activity.' },
  { q: 'Can I scan food barcodes?',  a: 'Yes, the Calories tab has a built-in barcode scanner powered by Open Food Facts.' },
  { q: 'Can I track Indian meals?',  a: 'Yes — 100+ Indian foods are built-in, searchable in English and Hindi (रोटी, दाल, etc.).' },
  { q: 'Can I add friends?',         a: 'Yes. Add friends by email, vote on each other\'s activity, and compete on the weekly leaderboard.' },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left border border-ht-border rounded-xl overflow-hidden hover:border-ht-border-2 transition-colors"
    >
      <div className="flex items-center justify-between px-4 py-3.5 gap-4">
        <span className="text-sm font-medium text-ht-text-1">{q}</span>
        <AppIcon
          name="chevron-down"
          size={15}
          className={`flex-shrink-0 text-ht-text-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <div className="px-4 pb-4 pt-0 text-sm text-ht-text-2 border-t border-ht-border animate-fade-in">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </button>
  );
}

/* ── Features ──────────────────────────────────────────────── */
const FEATURES = [
  { icon: 'calendar', color: 'text-ht-accent bg-ht-accent/10',     title: 'Habits',    desc: 'Build streaks with daily habits. A year-long heatmap shows your consistency at a glance.' },
  { icon: 'clock',    color: 'text-ht-success bg-ht-success/10',   title: 'Workouts',  desc: 'Log sessions, track duration and calories burned. Monitor weekly volume trends.' },
  { icon: 'lunchbox', color: 'text-ht-warning bg-ht-warning/10',   title: 'Calories',  desc: 'Search 100+ Indian foods, scan barcodes, and track macros with precision.' },
  { icon: 'all',      color: 'text-purple-400 bg-purple-400/10',   title: 'Analytics', desc: 'GitHub-style heatmaps, trend charts, and auto-generated insights across all metrics.' },
  { icon: 'globe',    color: 'text-blue-400 bg-blue-400/10',       title: 'Social',    desc: 'Add friends, share progress, vote on each other\'s wins, and compete on leaderboards.' },
  { icon: 'user',     color: 'text-rose-400 bg-rose-400/10',       title: 'Profile',   desc: 'Track weight, set calorie goals, view BMI, and monitor your 14-day calorie trend.' },
];

/* ── Main ──────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ht-bg text-ht-text-1">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-ht-border bg-ht-bg/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-ht-text-1 tracking-tight">HabiTask</span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/app" className="btn-primary h-8 px-4 text-sm">
                Open App →
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-ht-text-2 hover:text-ht-text-1 transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary h-8 px-4 text-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {user && (
              <span className="inline-flex items-center gap-2 bg-ht-accent/10 border border-ht-accent/20 rounded-full px-4 py-1.5 text-sm text-ht-accent-2">
                👋 Welcome back, {user.name?.split(' ')[0]}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-ht-text-1 leading-tight tracking-tight">
              Build Discipline.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ht-accent to-ht-accent-2">
                One Day at a Time.
              </span>
            </h1>
            <p className="text-lg text-ht-text-2 leading-relaxed max-w-md">
              Track habits, log workouts, monitor calories, and stay accountable with friends — all in one focused app.
            </p>
            <div className="flex gap-3 flex-wrap">
              {user ? (
                <Link to="/app"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-ht-accent hover:bg-ht-accent/90 text-white font-semibold transition-all active:scale-95">
                  Continue to App →
                </Link>
              ) : (
                <>
                  <Link to="/signup"
                    className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-ht-accent hover:bg-ht-accent/90 text-white font-semibold transition-all active:scale-95">
                    Get Started — Free
                  </Link>
                  <Link to="/login"
                    className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-transparent border border-ht-border hover:border-ht-border-2 hover:bg-ht-elevated text-ht-text-2 hover:text-ht-text-1 font-medium transition-all">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mock app preview */}
          <div className="max-w-[320px] mx-auto w-full">
            <MockApp />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-ht-border">
        <p className="section-label text-center mb-2">Everything you need</p>
        <h2 className="text-2xl font-bold text-ht-text-1 text-center mb-10 tracking-tight">
          One app for your whole health
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, color, title, desc }) => (
            <div key={title} className="bg-ht-surface border border-ht-border rounded-xl p-5 space-y-3 hover:border-ht-border-2 transition-colors">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                <AppIcon name={icon} size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ht-text-1">{title}</h3>
                <p className="text-sm text-ht-text-3 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 py-16 border-t border-ht-border">
        <p className="section-label text-center mb-2">FAQ</p>
        <h2 className="text-2xl font-bold text-ht-text-1 text-center mb-8 tracking-tight">
          Common questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq) => (
            <FAQ key={faq.q} {...faq} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-ht-border text-center">
        <h2 className="text-2xl font-bold text-ht-text-1 tracking-tight mb-3">
          Ready to start?
        </h2>
        <p className="text-ht-text-2 mb-6">Free. No ads. No noise.</p>
        {user ? (
          <Link to="/app"
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-ht-accent hover:bg-ht-accent/90 text-white font-semibold transition-all active:scale-95">
            Open App →
          </Link>
        ) : (
          <Link to="/signup"
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-ht-accent hover:bg-ht-accent/90 text-white font-semibold transition-all active:scale-95">
            Get Started — Free
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-ht-border">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-ht-text-1">HabiTask</span>
          <p className="text-xs text-ht-text-3">© {new Date().getFullYear()} — Built with focus.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/krish-codess" target="_blank" rel="noopener noreferrer"
              className="text-xs text-ht-text-3 hover:text-ht-text-1 transition-colors">
              GitHub
            </a>
            <Link to="/login" className="text-xs text-ht-text-3 hover:text-ht-text-1 transition-colors">Sign in</Link>
            <Link to="/signup" className="text-xs text-ht-accent hover:text-ht-accent-2 transition-colors font-medium">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
