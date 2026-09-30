"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useSyncExternalStore } from "react";
import type {
  Asset, AspectRatio, Brand, BrandVoice, CalendarItem, Campaign, CopyResult, CreditAction, CreditTransaction,
  FavoriteKind, Favorites, Generation, ID, ImageStyle, Notification, OnboardingAnswers, PlanId,
  Preferences, Project, SavedHook, User, WorkspaceMember, WorkspaceRole,
} from "./types";
import * as seed from "@/data";
import { avatar, img, uid } from "./utils";
import { DEFAULT_COUNTRY, type CountryCode } from "./market";

/* ---------- State shape ---------- */
export interface StoreState {
  version: number;
  user: User;
  onboardingDone: boolean;
  onboarding: OnboardingAnswers;
  projects: Project[];
  assets: Asset[];
  campaigns: Campaign[];
  generations: Generation[];
  favorites: Favorites;
  brands: Brand[];
  currentBrandId: ID;
  credits: number;
  transactions: CreditTransaction[];
  notifications: Notification[];
  members: WorkspaceMember[];
  workspaceName: string;
  preferences: Preferences;
  currentProjectId: ID | null;
  plan: PlanId;
  /** Market the user sells in: drives currency, Mobile Money options and languages. */
  country: CountryCode;
  /** Template chosen via "Use Template"; consumed (cleared) by /studio on mount. Not persisted. */
  pendingTemplateId: ID | null;
  /** Copy and hooks the user bookmarked in /studio/copy. Persisted. */
  savedCopy: CopyResult[];
  savedHooks: SavedHook[];
}

export interface StoreActions {
  /* user / onboarding */
  updateUser: (patch: Partial<User>) => void;
  setOnboardingAnswers: (patch: Partial<OnboardingAnswers>) => void;
  completeOnboarding: () => void;
  /* projects */
  addProject: (input: { name: string; description?: string; brandId?: ID }) => Project;
  renameProject: (id: ID, name: string) => void;
  updateProject: (id: ID, patch: Partial<Project>) => void;
  duplicateProject: (id: ID) => Project | undefined;
  archiveProject: (id: ID, archived?: boolean) => void;
  deleteProject: (id: ID) => void;
  setCurrentProject: (id: ID | null) => void;
  /* favorites */
  toggleFavorite: (kind: FavoriteKind, id: ID) => void;
  isFavorite: (kind: FavoriteKind, id: ID) => boolean;
  /* assets */
  addAsset: (asset: Omit<Asset, "id" | "createdAt"> & Partial<Pick<Asset, "id" | "createdAt">>) => Asset;
  updateAsset: (id: ID, patch: Partial<Asset>) => void;
  deleteAsset: (id: ID) => void;
  /* generations */
  addGeneration: (gen: Omit<Generation, "id" | "createdAt"> & Partial<Pick<Generation, "id" | "createdAt">>) => Generation;
  updateGeneration: (id: ID, patch: Partial<Generation>) => void;
  /* campaigns */
  createCampaign: (input: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "variations" | "calendar" | "copy" | "assetIds" | "status"> & Partial<Campaign>) => Campaign;
  updateCampaign: (id: ID, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: ID) => void;
  addCalendarItem: (campaignId: ID, item: Omit<CalendarItem, "id" | "campaignId">) => CalendarItem;
  updateCalendarItem: (campaignId: ID, itemId: ID, patch: Partial<CalendarItem>) => void;
  removeCalendarItem: (campaignId: ID, itemId: ID) => void;
  /* brand */
  updateBrand: (id: ID, patch: Partial<Brand>) => void;
  addBrand: (input: Partial<Brand> & { name: string }) => Brand;
  deleteBrand: (id: ID) => void;
  setCurrentBrand: (id: ID) => void;
  updateBrandVoice: (id: ID, patch: Partial<BrandVoice>) => void;
  /* credits */
  spendCredits: (action: CreditAction, amount: number, description: string) => boolean;
  buyCredits: (amount: number, description?: string) => void;
  /* notifications */
  markNotificationRead: (id: ID, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  /* workspace */
  inviteMember: (input: { name: string; email: string; role: WorkspaceRole }) => WorkspaceMember;
  removeMember: (id: ID) => void;
  changeMemberRole: (id: ID, role: WorkspaceRole) => void;
  setWorkspaceName: (name: string) => void;
  /* prefs / plan */
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setPlan: (plan: PlanId) => void;
  setCountry: (country: CountryCode) => void;
  /* templates → studio handoff */
  setPendingTemplate: (id: ID | null) => void;
  /* saved copy & hooks */
  saveCopy: (copy: CopyResult) => void;
  removeSavedCopy: (id: ID) => void;
  saveHook: (text: string, product: string) => SavedHook;
  removeSavedHook: (id: ID) => void;
  /* reset */
  reset: () => void;
}

export type Store = StoreState & StoreActions;

// Bumped to 3: demo data removed, accounts start empty (re-seeds local data once).
const SEED_VERSION = 3;

function initialState(): StoreState {
  return {
    version: SEED_VERSION,
    user: seed.currentUser,
    onboardingDone: false,
    onboarding: { creating: null, role: null, wants: [], platforms: [], goal: null, style: null, boldness: null, brandKit: false, product: null },
    projects: seed.projects,
    assets: seed.assets,
    campaigns: seed.campaigns,
    generations: seed.generations,
    favorites: {
      asset: seed.assets.filter((a) => a.favorite).map((a) => a.id),
      template: [],
      prompt: [],
      creator: [],
    },
    brands: seed.brands,
    currentBrandId: seed.brand.id,
    credits: seed.STARTING_CREDITS,
    transactions: seed.creditTransactions,
    notifications: seed.notifications,
    members: seed.workspace.members,
    workspaceName: seed.workspace.name,
    preferences: {
      defaultRatio: "4:5" as AspectRatio,
      defaultStyle: "Product Photography" as ImageStyle,
      reducedMotion: false,
      emailNotifications: true,
      pushNotifications: true,
      compactSidebar: false,
      phonePhotoMode: true,
      lightVideos: true,
    },
    currentProjectId: seed.projects[0]?.id ?? null,
    plan: "creator",
    country: DEFAULT_COUNTRY,
    pendingTemplateId: null,
    savedCopy: [],
    savedHooks: [],
  };
}

const now = () => new Date().toISOString();

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      setOnboardingAnswers: (patch) => set((s) => ({ onboarding: { ...s.onboarding, ...patch } })),
      completeOnboarding: () => set({ onboardingDone: true }),

      addProject: ({ name, description = "", brandId }) => {
        const project: Project = {
          id: uid("proj"),
          name,
          description,
          brandId: brandId ?? get().currentBrandId,
          thumbnail: img(name, 800, 600, name),
          status: "active",
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [project, ...s.projects], currentProjectId: project.id }));
        return project;
      },
      renameProject: (id, name) => get().updateProject(id, { name }),
      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)) })),
      duplicateProject: (id) => {
        const src = get().projects.find((p) => p.id === id);
        if (!src) return undefined;
        const copy: Project = { ...src, id: uid("proj"), name: `${src.name} (copie)`, status: "active", createdAt: now(), updatedAt: now() };
        const srcAssets = get().assets.filter((a) => a.projectId === id).map((a) => ({ ...a, id: uid("asset"), projectId: copy.id, createdAt: now() }));
        set((s) => ({ projects: [copy, ...s.projects], assets: [...srcAssets, ...s.assets] }));
        return copy;
      },
      archiveProject: (id, archived = true) => get().updateProject(id, { status: archived ? "archived" : "active" }),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          assets: s.assets.filter((a) => a.projectId !== id),
          campaigns: s.campaigns.filter((c) => c.projectId !== id),
          generations: s.generations.filter((g) => g.projectId !== id),
          currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
        })),
      setCurrentProject: (id) => set({ currentProjectId: id }),

      toggleFavorite: (kind, id) =>
        set((s) => {
          const list = s.favorites[kind];
          const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
          const assets = kind === "asset" ? s.assets.map((a) => (a.id === id ? { ...a, favorite: !list.includes(id) } : a)) : s.assets;
          return { favorites: { ...s.favorites, [kind]: next }, assets };
        }),
      isFavorite: (kind, id) => get().favorites[kind].includes(id),

      addAsset: (input) => {
        const asset: Asset = { id: uid("asset"), createdAt: now(), ...input };
        set((s) => ({ assets: [asset, ...s.assets] }));
        return asset;
      },
      updateAsset: (id, patch) => set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id), favorites: { ...s.favorites, asset: s.favorites.asset.filter((x) => x !== id) } })),

      addGeneration: (input) => {
        const gen: Generation = { id: uid("gen"), createdAt: now(), ...input };
        set((s) => ({ generations: [gen, ...s.generations] }));
        return gen;
      },
      updateGeneration: (id, patch) => set((s) => ({ generations: s.generations.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      createCampaign: (input) => {
        const campaign: Campaign = {
          id: uid("camp"),
          status: "draft",
          assetIds: [],
          variations: [],
          calendar: [],
          copy: [],
          createdAt: now(),
          updatedAt: now(),
          ...input,
        };
        set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
        return campaign;
      },
      updateCampaign: (id, patch) =>
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)) })),
      deleteCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),
      addCalendarItem: (campaignId, item) => {
        const ci: CalendarItem = { id: uid("cal"), campaignId, ...item };
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === campaignId ? { ...c, calendar: [...c.calendar, ci], updatedAt: now() } : c)) }));
        return ci;
      },
      updateCalendarItem: (campaignId, itemId, patch) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId ? { ...c, calendar: c.calendar.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : c,
          ),
        })),
      removeCalendarItem: (campaignId, itemId) =>
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === campaignId ? { ...c, calendar: c.calendar.filter((i) => i.id !== itemId) } : c)) })),

      updateBrand: (id, patch) => set((s) => ({ brands: s.brands.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      addBrand: (input) => {
        const b: Brand = {
          id: uid("brand"),
          logoUrl: "",
          colors: ["#FFFFFF", "#1C1C1C", "#F97316"],
          fonts: { heading: "Inter", body: "Inter" },
          website: "",
          description: "",
          industry: "",
          audience: "",
          styleTags: [],
          assets: [],
          voice: { tone: "Professional", writingStyle: "", keywords: [], avoid: [] },
          createdAt: now(),
          ...input,
        };
        set((s) => ({ brands: [...s.brands, b], currentBrandId: b.id }));
        return b;
      },
      deleteBrand: (id) =>
        set((s) => {
          const brands = s.brands.filter((b) => b.id !== id);
          return { brands, currentBrandId: s.currentBrandId === id ? (brands[0]?.id ?? "") : s.currentBrandId };
        }),
      setCurrentBrand: (id) => set({ currentBrandId: id }),
      updateBrandVoice: (id, patch) =>
        set((s) => ({ brands: s.brands.map((b) => (b.id === id ? { ...b, voice: { ...b.voice, ...patch } } : b)) })),

      spendCredits: (action, amount, description) => {
        if (get().credits < amount) return false;
        set((s) => ({
          credits: s.credits - amount,
          transactions: [{ id: uid("tx"), action, amount: -amount, description, createdAt: now() }, ...s.transactions],
        }));
        return true;
      },
      buyCredits: (amount, description) =>
        set((s) => ({
          credits: s.credits + amount,
          transactions: [{ id: uid("tx"), action: "purchase", amount, description: description ?? `Achat de ${amount} crédits`, createdAt: now() }, ...s.transactions],
        })),

      markNotificationRead: (id, read = true) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      pushNotification: (n) =>
        set((s) => ({ notifications: [{ id: uid("notif"), createdAt: now(), read: false, ...n }, ...s.notifications] })),

      inviteMember: ({ name, email, role }) => {
        const m: WorkspaceMember = {
          id: uid("user"),
          name,
          email,
          role,
          avatarUrl: avatar(name),
          status: "invited",
          joinedAt: now(),
        };
        set((s) => ({ members: [...s.members, m] }));
        return m;
      },
      removeMember: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
      changeMemberRole: (id, role) => set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, role } : m)) })),
      setWorkspaceName: (name) => set({ workspaceName: name }),

      setPreference: (key, value) => set((s) => ({ preferences: { ...s.preferences, [key]: value } })),
      setPlan: (plan) => set({ plan }),
      setCountry: (country) => set({ country }),
      setPendingTemplate: (id) => set({ pendingTemplateId: id }),

      saveCopy: (copy) => set((s) => ({ savedCopy: s.savedCopy.some((c) => c.id === copy.id) ? s.savedCopy : [copy, ...s.savedCopy] })),
      removeSavedCopy: (id) => set((s) => ({ savedCopy: s.savedCopy.filter((c) => c.id !== id) })),
      saveHook: (text, product) => {
        const existing = get().savedHooks.find((h) => h.text === text);
        if (existing) return existing;
        const h: SavedHook = { id: uid("hook"), text, product, createdAt: now() };
        set((s) => ({ savedHooks: [h, ...s.savedHooks] }));
        return h;
      },
      removeSavedHook: (id) => set((s) => ({ savedHooks: s.savedHooks.filter((h) => h.id !== id) })),

      reset: () => set(initialState()),
    }),
    {
      name: "ms-store",
      version: SEED_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        // Persist state only; functions are re-attached by create().
        const {
          version, user, onboardingDone, onboarding, projects, assets, campaigns, generations, favorites,
          brands, currentBrandId, credits, transactions, notifications, members, workspaceName, preferences,
          currentProjectId, plan, country, savedCopy, savedHooks,
        } = s;
        return {
          version, user, onboardingDone, onboarding, projects, assets, campaigns, generations, favorites,
          brands, currentBrandId, credits, transactions, notifications, members, workspaceName, preferences,
          currentProjectId, plan, country, savedCopy, savedHooks,
        } as Store;
      },
      migrate: (persisted, fromVersion) => {
        // On seed-version bump, drop stale data and re-seed (prototype data only).
        if (fromVersion !== SEED_VERSION) return initialState() as Store;
        return persisted as Store;
      },
    },
  ),
);

/**
 * Hydration guard. The persisted store uses `skipHydration`, so the server render
 * and first client render both use seed data; call this in the shell/root and only
 * render store-dependent UI once it returns true to avoid mismatches.
 */
export function useHydrated(): boolean {
  const hydrated = useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useStore.persist.hasHydrated()) void useStore.persist.rehydrate();
  }, []);
  return hydrated;
}

/* ---------- Convenience selectors ---------- */
export const selectUnreadCount = (s: Store) => s.notifications.filter((n) => !n.read).length;
export const selectCountry = (s: Store) => s.country ?? DEFAULT_COUNTRY;
export const selectCurrentBrand = (s: Store) => s.brands.find((b) => b.id === s.currentBrandId) ?? s.brands[0];
export const selectProject = (id: ID) => (s: Store) => s.projects.find((p) => p.id === id);
export const selectProjectAssets = (id: ID) => (s: Store) => s.assets.filter((a) => a.projectId === id);
