/**
 * AppIcon — single source for all icons in HabiTask.
 * Custom icons come from https://github.com/krish-codess/icons
 * Everything else falls back to @heroicons/react/24/outline (marked below).
 * To swap an icon, change only this file.
 */
import {
  UserIcon, FireIcon, TrophyIcon, BoltIcon, PlusIcon, TrashIcon,
  PencilIcon, StarIcon, SparklesIcon, ChartBarIcon, ChartPieIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, InformationCircleIcon,
  UsersIcon, HeartIcon, ScaleIcon, CameraIcon, ChevronDownIcon,
  ChevronRightIcon, ChevronLeftIcon, HomeIcon, BeakerIcon, MoonIcon,
  SunIcon, ChartBarSquareIcon, ArrowUpIcon, ArrowDownIcon,
  CheckCircleIcon, XCircleIcon, XMarkIcon, CheckIcon,
  Bars3Icon, BellIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon,
  ArrowRightIcon, ArrowLeftIcon, EyeIcon, QrCodeIcon, Squares2X2Icon,
  RectangleStackIcon, CubeIcon, TagIcon, DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// ── Custom icons from https://github.com/krish-codess/icons ──────────────────
// These are the SVG inner paths only; the <svg> wrapper is added by renderCustom.
const CUSTOM = {
  calendar: `<rect x="3" y="5" width="18" height="16" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>`,
  clock:    `<circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/>`,
  globe:    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/>`,
  lunchbox: `<rect x="3" y="8" width="18" height="10" rx="3"/><path d="M8 8v-2a2 2 0 0 1 4 0v2"/>`,
  search:   `<circle cx="11" cy="11" r="7"/><line x1="16" y1="16" x2="21" y2="21"/>`,
  tick:     `<polyline points="20 6 9 17 4 12"/>`,
  // 4-grid = analytics / dashboard
  all:      `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
  cancelled:`<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
  money:    `<path d="M12 3v18"/><path d="M17 7a4 4 0 0 0-5-2 4 4 0 0 0 0 8 4 4 0 0 1 0 8 4 4 0 0 1-5-2"/>`,
  pending:  `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  accepted: `<polyline points="20 6 9 17 4 12"/>`,
  location: `<path d="M12 21s-6-5-6-10a6 6 0 0 1 12 0c0 5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>`,
};

// ── Heroicon fallbacks (FALLBACK) ─────────────────────────────────────────────
const HERO = {
  // Navigation
  home:            HomeIcon,
  user:            UserIcon,
  users:           UsersIcon,
  // Actions
  plus:            PlusIcon,
  trash:           TrashIcon,
  edit:            PencilIcon,
  pencil:          PencilIcon,
  close:           XMarkIcon,
  check:           CheckIcon,
  'check-circle':  CheckCircleIcon,
  'x-circle':      XCircleIcon,
  'bars-3':        Bars3Icon,
  eye:             EyeIcon,
  camera:          CameraIcon,
  'qr-code':       QrCodeIcon,
  bell:            BellIcon,
  shield:          ShieldCheckIcon,
  settings:        AdjustmentsHorizontalIcon,
  filter:          AdjustmentsHorizontalIcon,
  tag:             TagIcon,
  doc:             DocumentTextIcon,
  cube:            CubeIcon,
  stack:           RectangleStackIcon,
  // Charts & analytics
  'chart-bar':     ChartBarIcon,
  'chart-pie':     ChartPieIcon,
  'chart-square':  ChartBarSquareIcon,
  grid:            Squares2X2Icon,
  // Trends
  'trend-up':      ArrowTrendingUpIcon,
  'trend-down':    ArrowTrendingDownIcon,
  'arrow-up':      ArrowUpIcon,
  'arrow-down':    ArrowDownIcon,
  'arrow-right':   ArrowRightIcon,
  'arrow-left':    ArrowLeftIcon,
  'chevron-down':  ChevronDownIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left':  ChevronLeftIcon,
  // Health & fitness  (FALLBACK — no custom icon available)
  flame:           FireIcon,
  fire:            FireIcon,
  bolt:            BoltIcon,
  lightning:       BoltIcon,
  trophy:          TrophyIcon,
  star:            StarIcon,
  sparkles:        SparklesIcon,
  heart:           HeartIcon,
  scale:           ScaleIcon,
  droplet:         BeakerIcon,
  water:           BeakerIcon,
  moon:            MoonIcon,
  sun:             SunIcon,
  info:            InformationCircleIcon,
  'magnifying-glass': MagnifyingGlassIcon,
};

export default function AppIcon({ name, size = 20, className = '', strokeWidth = 1.5 }) {
  const inner = CUSTOM[name];
  if (inner) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    );
  }

  const Hero = HERO[name];
  if (Hero) return <Hero className={className} style={{ width: size, height: size }} />;

  // Unknown icon — render a placeholder square so missing icons are visible during dev
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
    </svg>
  );
}
