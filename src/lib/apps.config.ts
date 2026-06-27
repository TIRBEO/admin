export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  slug: string;
  description: string;
  version: string;
  isActive: boolean;
  routes: {
    overview: string;
    settings: string;
    users: string;
    analytics: string;
    content: string;
    integrations: string;
  };
  settingsSchema: Record<string, {
    label: string;
    fields: AppSettingField[];
  }>;
}

export interface AppSettingField {
  key: string;
  type: "text" | "textarea" | "number" | "toggle" | "select" | "multiselect" | "email" | "url" | "object";
  label: string;
  required?: boolean;
  default?: any;
  placeholder?: string;
  options?: string[];
  rows?: number;
  min?: number;
  max?: number;
  fields?: AppSettingField[];
}

export const APPS: Record<string, AppConfig> = {
  chat: {
    id: "chat",
    name: "Tirbeo Chat",
    icon: "💬",
    slug: "chat",
    description: "Real-time messaging with channels, threads, and voice calls",
    version: "1.0.0",
    isActive: true,
    routes: {
      overview: "/apps/chat",
      settings: "/apps/chat/settings",
      users: "/apps/chat/users",
      analytics: "/apps/chat/analytics",
      content: "/apps/chat/content",
      integrations: "/apps/chat/integrations",
    },
    settingsSchema: {
      general: {
        label: "General Settings",
        fields: [
          { key: "community_name", type: "text", label: "Community Name", required: true },
          { key: "community_description", type: "textarea", label: "Description" },
          { key: "default_channel", type: "text", label: "Default Channel" },
          { key: "message_limit", type: "number", label: "Max Message History (days)", default: 30 },
          { key: "file_size_limit", type: "number", label: "Max File Size (MB)", default: 25 },
          { key: "enable_voice", type: "toggle", label: "Enable Voice Calls", default: true },
          { key: "enable_video", type: "toggle", label: "Enable Video Calls", default: true },
        ],
      },
      moderation: {
        label: "Moderation Settings",
        fields: [
          { key: "profanity_filter", type: "toggle", label: "Enable Profanity Filter", default: true },
          { key: "auto_moderation", type: "toggle", label: "Auto-Moderate Messages", default: false },
          { key: "max_mentions_per_message", type: "number", label: "Max @Mentions per Message", default: 5 },
          { key: "rate_limit_messages", type: "number", label: "Messages per Minute Limit", default: 30 },
          { key: "moderation_queue", type: "select", label: "Moderation Queue", options: ["None", "Manual Review", "AI-Assisted"], default: "Manual Review" },
        ],
      },
      channels: {
        label: "Channel Settings",
        fields: [
          { key: "allow_public_channels", type: "toggle", label: "Allow Public Channels", default: true },
          { key: "allow_private_channels", type: "toggle", label: "Allow Private Channels", default: true },
          { key: "max_channels_per_community", type: "number", label: "Max Channels per Community", default: 50 },
          { key: "allow_voice_channels", type: "toggle", label: "Allow Voice Channels", default: true },
        ],
      },
    },
  },
  company: {
    id: "company",
    name: "Company Content",
    icon: "🏢",
    slug: "company",
    description: "Manage company pages, team, careers, and content",
    version: "1.0.0",
    isActive: true,
    routes: {
      overview: "/apps/company",
      settings: "/apps/company/settings",
      users: "/apps/company/users",
      analytics: "/apps/company/analytics",
      content: "/apps/company/content",
      integrations: "/apps/company/integrations",
    },
    settingsSchema: {
      general: {
        label: "Company Settings",
        fields: [
          { key: "company_name", type: "text", label: "Company Name", default: "Tirbeo" },
          { key: "tagline", type: "text", label: "Tagline", default: "Connect. Create. Collaborate." },
          { key: "description", type: "textarea", label: "Company Description" },
          { key: "mission", type: "textarea", label: "Mission Statement" },
          { key: "vision", type: "textarea", label: "Vision Statement" },
        ],
      },
      contact: {
        label: "Contact Information",
        fields: [
          { key: "support_email", type: "email", label: "Support Email", default: "support@tirbeo.com" },
          { key: "careers_email", type: "email", label: "Careers Email", default: "careers@tirbeo.com" },
        ],
      },
    },
  },
  discuss: {
    id: "discuss",
    name: "Tirbeo Discuss",
    icon: "📝",
    slug: "discuss",
    description: "Structured discussions with voting, Q&A, and tagging",
    version: "1.0.0",
    isActive: false,
    routes: {
      overview: "/apps/discuss",
      settings: "/apps/discuss/settings",
      users: "/apps/discuss/users",
      analytics: "/apps/discuss/analytics",
      content: "/apps/discuss/content",
      integrations: "/apps/discuss/integrations",
    },
    settingsSchema: {},
  },
  resources: {
    id: "resources",
    name: "Tirbeo Resources",
    icon: "📚",
    slug: "resources",
    description: "Community-curated library of files, links, and media",
    version: "1.0.0",
    isActive: false,
    routes: {
      overview: "/apps/resources",
      settings: "/apps/resources/settings",
      users: "/apps/resources/users",
      analytics: "/apps/resources/analytics",
      content: "/apps/resources/content",
      integrations: "/apps/resources/integrations",
    },
    settingsSchema: {},
  },
  projects: {
    id: "projects",
    name: "Tirbeo Projects",
    icon: "📋",
    slug: "projects",
    description: "Project management with Kanban boards and task tracking",
    version: "1.0.0",
    isActive: false,
    routes: {
      overview: "/apps/projects",
      settings: "/apps/projects/settings",
      users: "/apps/projects/users",
      analytics: "/apps/projects/analytics",
      content: "/apps/projects/content",
      integrations: "/apps/projects/integrations",
    },
    settingsSchema: {},
  },
  events: {
    id: "events",
    name: "Tirbeo Events",
    icon: "📅",
    slug: "events",
    description: "Event creation, calendar, and RSVP management",
    version: "1.0.0",
    isActive: false,
    routes: {
      overview: "/apps/events",
      settings: "/apps/events/settings",
      users: "/apps/events/users",
      analytics: "/apps/events/analytics",
      content: "/apps/events/content",
      integrations: "/apps/events/integrations",
    },
    settingsSchema: {},
  },
  wiki: {
    id: "wiki",
    name: "Tirbeo Wiki",
    icon: "📖",
    slug: "wiki",
    description: "Collaborative documentation with version history",
    version: "1.0.0",
    isActive: false,
    routes: {
      overview: "/apps/wiki",
      settings: "/apps/wiki/settings",
      users: "/apps/wiki/users",
      analytics: "/apps/wiki/analytics",
      content: "/apps/wiki/content",
      integrations: "/apps/wiki/integrations",
    },
    settingsSchema: {},
  },
  identity: {
    id: "identity",
    name: "Tirbeo Identity",
    icon: "🔐",
    slug: "identity",
    description: "Central authentication and identity management",
    version: "1.0.0",
    isActive: false,
    routes: {
      overview: "/apps/identity",
      settings: "/apps/identity/settings",
      users: "/apps/identity/users",
      analytics: "/apps/identity/analytics",
      content: "/apps/identity/content",
      integrations: "/apps/identity/integrations",
    },
    settingsSchema: {},
  },
};

export const ACTIVE_APPS = Object.values(APPS).filter(app => app.isActive);
export const APP_OPTIONS = Object.values(APPS).map(app => ({
  label: `${app.icon} ${app.name}`,
  value: app.id,
}));
