// Database shapes (snake_case, as returned by Supabase)

export type DbBoardSetting = {
  key: string;
  value: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type DbBoardAnnouncement = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbBoardAdmin = {
  email: string;
  created_at: string;
};

// App shapes (camelCase, used by components)

export type Announcement = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoomEmbed = {
  url: string;
  embedUrl: string; // Normalized iframe src
  title: string | null;
};

export type BoardData = {
  loom: LoomEmbed | null;
  announcements: Announcement[];
  isAdmin: boolean;
};

// Settings keys — centralized so we don't typo them

export const BOARD_KEYS = {
  LOOM_URL: "quarterly_loom_url",
  LOOM_TITLE: "quarterly_loom_title",
} as const;
