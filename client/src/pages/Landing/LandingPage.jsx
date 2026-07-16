import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AppIcon from '../../components/UI/AppIcon.jsx';

// ── Mock app preview components ───────────────────────────────────────────────
function MockHeatmap() {
  const rows = 7;
  const cols = 22;
  const colors = ['#1e293b','#312e81','#3730a3','#4338ca','#6366f1','#818cf8'];
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: cols }).map((_, c) => (
        <div key={c} className="flex flex-col gap-[3px]">
          {Array.from({ length: rows }).map((_, r) => {
            const seed = (c * 7 + r * 3 + c + r) % 6;
            return <div key={r} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: colors[seed] }} />;
          })}
        </div>
      ))}
    </div>
  );
}

function MockStatCard({ label, value, color, icon }) {
  return (
    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 flex flex-col gap-1">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${color}`}>
        <AppIcon name={icon} size={13} strokeWidth={2} />
      </div>
      <p className="text-lg font-bold text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function MockApp() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-4 shadow-2xl space-y-3 select-none pointer-events-none">
      {/* Top bar mock */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-bold text-slate-200">HabiTask</span>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-800 rounded px-2 py-0.5">Wed, 16 Jul</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <MockStatCard label="Streak"    value="14d"       color="text-red-400"    icon="flame"    />
        <MockStatCard label="Score"     value="87/100"    color="text-orange-400" icon="bolt"     />
        <MockStatCard label="Habits"    value="6/7"       color="text-indigo-400" icon="calendar" />
      </div>

      {/* Heatmap */}
      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
        <p className="text-[10px] text-slate-500 mb-2 font-medium uppercase tracking-wider">This Year</p>
        <MockHeatmap />
      </div>

      {/* Calorie bar */}
      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
          <span>Calories Today</span>
          <span className="text-slate-300 font-medium">1,840 / 2,200 kcal</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full w-[84%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
        </div>
        <div className="flex gap-4 mt-2">
          {[['P','124g','text-indigo-400'],['C','210g','text-yellow-400'],['F','58g','text-red-400']].map(([l,v,c]) => (
            <div key={l} className="text-center">
              <p className={`text-xs font-bold ${c}`}>{v}</p>
              <p className="text-[9px] text-slate-600">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav mock */}
      <div className="flex justify-around pt-1 border-t border-slate-800">
        {[['calendar','Habits'],['clock','Workout'],['lunchbox','Calories'],['all','Analytics'],['globe','Social']].map(([icon, label]) => (
          <div key={label} className={`flex flex-col items-center gap-0.5 ${label === 'Habits' ? 'text-indigo-400' : 'text-slate-600'}`}>
            <AppIcon name={icon} size={14} strokeWidth={1.8} />
            <span className="text-[8px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is the app free?',                 a: 'Yes, HabiTask is completely free to use for you and your friends.' },
  { q: 'Does it work on mobile?',          a: 'Yes — it is a fully responsive web app optimised for mobile browsers. No app store download needed.' },
  { q: 'Is my data private?',              a: 'Your data is stored securely in a private database. Only you and friends you explicitly add can see your activity.' },
  { q: 'Can I scan food barcodes?',        a: 'Yes, the Calories tab has a built-in barcode scanner powered by Open Food Facts.' },
  { q: 'Can I track Indian meals?',        a: 'Yes — over 100 Indian foods are built-in, searchable in both English and Hindi (रोटी, दाल, etc.).' },
  { q: 'Can I add friends?',               a: 'Yes. Use the Social tab to add friends by email, vote on each other\'s activity, and compete on the weekly leaderboard.' },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
    >
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <span className="text-sm font-medium text-slate-200">{q}</span>
        <AppIcon name="chevron-down" size={16} className={`flex-shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-400 border-t border-slate-800/60 pt-3">
          {a}
        </div>
      )}
    </button>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'calendar', color: 'text-indigo-400 bg-indigo-500/10', title: 'Habits',    desc: 'Build streaks with 7 default habits. Visual heatmap shows your consistency at a glance.' },
  { icon: 'clock',    color: 'text-emerald-400 bg-emerald-500/10', title: 'Workouts',  desc: 'Log workouts, track duration and calories burned. Monitor weekly volume trends.' },
  { icon: 'lunchbox', color: 'text-amber-400 bg-amber-500/10',   title: 'Calories',  desc: 'Search 100+ Indian foods, scan barcodes, and track macros with precision.' },
  { icon: 'all',      color: 'text-purple-400 bg-purple-500/10', title: 'Analytics', desc: 'GitHub-style heatmaps, trend charts, and auto-generated insights across all metrics.' },
  { icon: 'globe',    color: 'text-blue-400 bg-blue-500/10',     title: 'Social',    desc: 'Add friends, share progress, vote on each other\'s wins, and compete on leaderboards.' },
  { icon: 'user',     color: 'text-rose-400 bg-rose-500/10',     title: 'Profile',   desc: 'Track weight, set calorie goals, view BMI, and see your 14-day calorie trend.' },
];

// ── main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-slate-100 tracking-tight">HabiTask</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/app" className="btn-primary text-sm py-1.5 px-4">
                Open App →
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5 px-4">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {user && (
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400">
                <span>👋</span> Welcome back, {user.name?.split(' ')[0]}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 leading-tight tracking-tight">
              Build Discipline.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                One Day at a Time.
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-md">
              Track habits, log workouts, monitor calories, and stay accountable with friends — all in one focused app.
            </p>
            <div className="flex gap-3 flex-wrap">
              {user ? (
                <Link to="/app" className="btn-primary text-base px-6 py-3">
                  Continue to App →
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-primary text-base px-6 py-3">
                    Get Started — Free
                  </Link>
                  <Link to="/login" className="btn-secondary text-base px-6 py-3">
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-6 pt-2">
              {[['🎯','7 habits'], ['🔥','Streaks'], ['📊','Analytics'], ['👥','Social']].map(([e, l]) => (
                <div key={l} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <span>{e}</span><span>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:block">
            <MockApp />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-800/50">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">Features</p>
          <h2 className="text-3xl font-bold text-slate-100">Everything you need. Nothing you don't.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, color, title, desc }) => (
            <div key={title} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
                <AppIcon name={icon} size={20} strokeWidth={1.8} />
              </div>
              <h3 className="font-semibold text-slate-100 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics showcase */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-800/50">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase">Analytics</p>
            <h2 className="text-3xl font-bold text-slate-100">See your progress at a glance.</h2>
            <p className="text-slate-400 leading-relaxed">
              GitHub-style heatmaps show your consistency. Auto-generated insights surface patterns you'd never notice manually. Radar charts show your balance across habits, workouts, calories, and sleep.
            </p>
            <ul className="space-y-2">
              {['Discipline heatmap (365 days)','Trend charts for every metric','Auto insights from your data','Radar chart across all dimensions','Period summaries (7d / 30d / 90d / 1y)'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                  <AppIcon name="tick" size={14} strokeWidth={2.5} className="text-emerald-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-4 space-y-3 select-none pointer-events-none">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Discipline Heatmap</p>
            <MockHeatmap />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[['87/100','Score','text-orange-400'],['14d','Streak','text-red-400'],['84%','Habits','text-indigo-400'],['1.8L','Water','text-blue-400']].map(([v, l, c]) => (
                <div key={l} className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/30">
                  <p className={`text-base font-bold ${c}`}>{v}</p>
                  <p className="text-[10px] text-slate-500">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social showcase */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-800/50">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">Social</p>
          <h2 className="text-3xl font-bold text-slate-100">Accountability makes it stick.</h2>
          <p className="text-slate-400 mt-3 max-w-md mx-auto">Share your wins with friends, vote on each other's progress, and compete on the weekly leaderboard.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: 'users',  title: 'Friend System',       desc: 'Add friends by email and see their activity in your feed.' },
            { icon: 'star',   title: 'Upvotes / Reactions', desc: 'Celebrate each other\'s wins with upvotes and reactions.' },
            { icon: 'trophy', title: 'Weekly Leaderboard',  desc: 'Compete on discipline score every week. Top performers are ranked.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 text-center hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
                <AppIcon name={icon} size={22} strokeWidth={1.8} />
              </div>
              <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why this app */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-800/50">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">Philosophy</p>
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Consistency over perfection.</h2>
            <div className="space-y-4">
              {[
                { icon: 'bolt',     text: 'Minimal distractions. Maximum focus on what matters.' },
                { icon: 'flame',    text: 'Long-term habit building — not short-term motivation.' },
                { icon: 'chart-bar',text: 'Data-driven self-improvement backed by your own numbers.' },
                { icon: 'shield',   text: 'Private by default. Your data stays yours.' },
                { icon: 'globe',    text: 'Accountability with people you actually know.' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 flex-shrink-0">
                    <AppIcon name={icon} size={15} strokeWidth={2} />
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">What people say</p>
            {[
              { name: 'Arjun S.',  role: 'Software Engineer', quote: 'Finally an app that tracks Indian food properly. The Hindi search is 🔥' },
              { name: 'Priya M.',  role: 'Fitness Enthusiast', quote: 'The heatmap keeps me motivated. Missing a day hurts more than the workout.' },
              { name: 'Rahul K.',  role: 'Student', quote: 'Competing with friends on the leaderboard is weirdly effective.' },
            ].map(({ name, role, quote }) => (
              <div key={name} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4">
                <p className="text-sm text-slate-300 italic mb-3">"{quote}"</p>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{name}</p>
                  <p className="text-xs text-slate-600">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 py-16 border-t border-slate-800/50">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-100">Frequently asked questions</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 border-t border-slate-800/50 text-center">
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to build discipline?</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Join HabiTask and start your first streak today. It takes 30 seconds to sign up.</p>
        {user ? (
          <Link to="/app" className="btn-primary text-base px-8 py-3 inline-block">
            Open App →
          </Link>
        ) : (
          <Link to="/signup" className="btn-primary text-base px-8 py-3 inline-block">
            Get Started — Free
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="font-semibold text-slate-400 text-sm">HabiTask</span>
            <span className="text-slate-700 text-xs ml-2">v1.0</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <Link to="/login"  className="hover:text-slate-400 transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-slate-400 transition-colors">Sign Up</Link>
            <a href="https://github.com/krish-codess" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">GitHub</a>
          </div>
          <p className="text-xs text-slate-700">
            Built with ❤️ for discipline
          </p>
        </div>
      </footer>
    </div>
  );
}
