import { supabase } from "./supabase";
import { getSession } from "./session";

// -- Generic CRUD helpers --
export async function list<T>(table: string, order = "sort_order"): Promise<T[]> {
  const { data } = await supabase.from(table).select("*").order(order, { ascending: true });
  return (data as T[]) || [];
}

export async function get<T>(table: string, id: string | number): Promise<T | null> {
  const { data } = await supabase.from(table).select("*").eq("id", id).single();
  return data as T | null;
}

export async function upsert(table: string, record: Record<string, unknown>, idField = "id") {
  const id = record[idField];
  let result;
  if (id) {
    result = await supabase.from(table).update(record).eq(idField, id);
  } else {
    result = await supabase.from(table).insert(record).select().single();
  }
  await logAudit(id ? "update" : "create", table, id as string || record.id as string, record);
  return result;
}

export async function remove(table: string, id: string | number, idField = "id") {
  await logAudit("delete", table, String(id));
  return supabase.from(table).delete().eq(idField, id);
}

// -- Audit logging --
export async function logAudit(action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
  const session = getSession();
  if (!session) return;

  // Try to insert, ignore errors (e.g. RLS or table not ready)
  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.admin.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || {},
  }).maybeSingle();
}

// -- Typed interfaces --
export interface SiteConfig {
  id: number;
  site_name: string;
  tagline: string | null;
  logo_url: string;
  favicon_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string | null;
  social_links: Record<string, string>;
  updated_at: string;
}

export interface NavLink {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
}

export interface FooterSection {
  id: string;
  title: string;
  sort_order: number;
  links?: FooterLink[];
}

export interface FooterLink {
  id: string;
  section_id: string;
  label: string;
  href: string;
  sort_order: number;
  is_active: boolean;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  sections?: Section[];
}

export interface Section {
  id: string;
  page_slug: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

export interface Feature {
  id: string;
  section_id: string;
  icon: string | null;
  title: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  color: string | null;
  social_links: Record<string, string>;
  sort_order: number;
  is_active: boolean;
}

export interface TimelineEvent {
  id: string;
  year: string;
  event: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  avatar_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  features: string[];
  cta_label: string;
  cta_href: string | null;
  is_popular: boolean;
  sort_order: number;
  is_active: boolean;
}

// -- Specific fetchers --
export async function getSiteConfig(): Promise<SiteConfig | null> {
  return get<SiteConfig>("site_config", 1);
}

export async function getFooterTree(): Promise<FooterSection[]> {
  const sections = await list<FooterSection>("footer_sections");
  const links = await list<FooterLink>("footer_links");
  return sections.map((s) => ({ ...s, links: links.filter((l) => l.section_id === s.id) }));
}

export async function getPageWithSections(slug: string): Promise<Page | null> {
  const page = await get<Page>("pages", slug);
  if (!page) return null;
  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("page_slug", slug)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return { ...page, sections: (sections as Section[]) || [] };
}
