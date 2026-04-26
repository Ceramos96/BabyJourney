// src/config/navigation.js
// ─────────────────────────────────────────────────────────────────
// Navigation structure — single source of truth for routes,
// tab bar items, sidebar items, and screen metadata.
// Claude Code reads this when building AppShell, BottomTabBar,
// and Sidebar — do not hardcode nav items in those components.
// ─────────────────────────────────────────────────────────────────

// ── Route definitions ────────────────────────────────────────────
export const ROUTES = {
  HOME:       '/',
  GROWTH:     '/growth',
  JOURNAL:    '/journal',
  JOURNAL_PHOTOS:     '/journal/photos',
  JOURNAL_MILESTONES: '/journal/milestones',
  HEALTH:     '/health',
  HEALTH_NOTES:        '/health/notes',
  HEALTH_ALLERGIES:    '/health/allergies',
  HEALTH_VACCINATIONS: '/health/vaccinations',
  FAMILY:     '/family',
  AUTH:       '/auth',
  AUTH_INVITE: '/auth/invite',
};

// ── Mobile bottom tab bar ─────────────────────────────────────────
// 5 slots: Home | Growth | [FAB center] | Journal | Health
// Family is accessed via avatar icon in Home header — not a tab.
export const MOBILE_TABS = [
  {
    id:        'home',
    route:     ROUTES.HOME,
    labelKey:  'nav.home',
    icon:      'Home',        // Lucide icon name
    iconFill:  'HomeFill',    // filled variant for active state
  },
  {
    id:        'growth',
    route:     ROUTES.GROWTH,
    labelKey:  'nav.growth',
    icon:      'TrendingUp',
    iconFill:  'TrendingUp',
  },
  {
    id:        'fab',
    route:     null,          // no route — opens Quick Log sheet
    labelKey:  'nav.log',
    icon:      'Plus',
    isFAB:     true,          // renders as center FAB, not a tab item
  },
  {
    id:        'journal',
    route:     ROUTES.JOURNAL,
    labelKey:  'nav.journal',
    icon:      'BookOpen',
    iconFill:  'BookOpen',
  },
  {
    id:        'health',
    route:     ROUTES.HEALTH,
    labelKey:  'nav.health',
    icon:      'Heart',
    iconFill:  'HeartFill',
  },
];

// ── Web sidebar nav ───────────────────────────────────────────────
// Family shown at bottom of sidebar (below divider).
// Quick Log is a floating button — not in sidebar.
export const SIDEBAR_NAV = [
  {
    id:       'home',
    route:    ROUTES.HOME,
    labelKey: 'nav.home',
    icon:     'Home',
  },
  {
    id:       'growth',
    route:    ROUTES.GROWTH,
    labelKey: 'nav.growth',
    icon:     'TrendingUp',
  },
  {
    id:       'journal',
    route:    ROUTES.JOURNAL,
    labelKey: 'nav.journal',
    icon:     'BookOpen',
  },
  {
    id:       'health',
    route:    ROUTES.HEALTH,
    labelKey: 'nav.health',
    icon:     'Heart',
  },
];

export const SIDEBAR_BOTTOM_NAV = [
  {
    id:       'family',
    route:    ROUTES.FAMILY,
    labelKey: 'nav.family',
    icon:     'Users',
  },
];

// ── Sub-tabs ──────────────────────────────────────────────────────
export const JOURNAL_SUB_TABS = [
  { id: 'photos',     route: ROUTES.JOURNAL_PHOTOS,     labelKey: 'journal.tabs.photos' },
  { id: 'milestones', route: ROUTES.JOURNAL_MILESTONES, labelKey: 'journal.tabs.milestones' },
];

export const HEALTH_SUB_TABS = [
  { id: 'notes',          route: ROUTES.HEALTH_NOTES,        labelKey: 'health.tabs.notes' },
  { id: 'allergies_food', route: ROUTES.HEALTH_ALLERGIES,    labelKey: 'health.tabs.allergies_food' },
  { id: 'vaccinations',   route: ROUTES.HEALTH_VACCINATIONS, labelKey: 'health.tabs.vaccinations' },
];

// ── Quick Log entry types ─────────────────────────────────────────
// Used by both mobile bottom sheet and web modal.
export const QUICK_LOG_TYPES = [
  { id: 'feed',   labelKey: 'quicklog.log_types.feed',   icon: 'Milk',     color: '--sage-700' },
  { id: 'nap',    labelKey: 'quicklog.log_types.nap',    icon: 'Moon',     color: '--butter' },
  { id: 'diaper', labelKey: 'quicklog.log_types.diaper', icon: 'Droplets', color: '--dusk' },
  { id: 'note',   labelKey: 'quicklog.log_types.note',   icon: 'PenLine',  color: '--ink-600' },
];

// ── Milestone types ───────────────────────────────────────────────
export const MILESTONE_TYPES = [
  { id: 'first_smile',     labelKey: 'journal.milestones.list.first_smile',     icon: '😊', typicalMonths: 2 },
  { id: 'rolled_over',     labelKey: 'journal.milestones.list.rolled_over',     icon: '🔄', typicalMonths: 4 },
  { id: 'first_laugh',     labelKey: 'journal.milestones.list.first_laugh',     icon: '😄', typicalMonths: 4 },
  { id: 'sat_unaided',     labelKey: 'journal.milestones.list.sat_unaided',     icon: '🧘', typicalMonths: 6 },
  { id: 'first_solid',     labelKey: 'journal.milestones.list.first_solid',     icon: '🥣', typicalMonths: 6 },
  { id: 'first_word',      labelKey: 'journal.milestones.list.first_word',      icon: '💬', typicalMonths: 12 },
  { id: 'crawled',         labelKey: 'journal.milestones.list.crawled',         icon: '🐣', typicalMonths: 9 },
  { id: 'pulled_to_stand', labelKey: 'journal.milestones.list.pulled_to_stand', icon: '🧍', typicalMonths: 10 },
  { id: 'first_steps',     labelKey: 'journal.milestones.list.first_steps',     icon: '👣', typicalMonths: 12 },
];

// ── User roles ────────────────────────────────────────────────────
export const ROLES = {
  OWNER:  'owner',
  FAMILY: 'family',
  VIEWER: 'viewer',
};

export const ROLE_PERMISSIONS = {
  owner:  { canRead: true, canCreate: true, canDelete: true, canManageUsers: true },
  family: { canRead: true, canCreate: true, canDelete: false, canManageUsers: false },
  viewer: { canRead: true, canCreate: false, canDelete: false, canManageUsers: false },
};
