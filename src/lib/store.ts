"use client";

import { create } from "zustand";
import { createClient } from "./supabase/client";

type CollectionMap = Record<string, number>;

type Store = {
  loaded: boolean;
  userId: string | null;
  collection: CollectionMap;
  setUser: (userId: string | null) => void;
  load: () => Promise<void>;
  setCount: (code: string, count: number) => Promise<void>;
  bulkAdd: (codes: string[]) => Promise<void>;
};

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const pendingUpdates = new Map<string, number>();

export const useCollection = create<Store>((set, get) => ({
  loaded: false,
  userId: null,
  collection: {},

  setUser(userId) {
    set({ userId });
  },

  async load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ loaded: true, userId: null, collection: {} });
      return;
    }

    const { data, error } = await supabase
      .from("collection")
      .select("sticker_code, count")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      set({ loaded: true, userId: user.id, collection: {} });
      return;
    }

    const map: CollectionMap = {};
    for (const row of data ?? []) map[row.sticker_code] = row.count;
    set({ loaded: true, userId: user.id, collection: map });
  },

  async setCount(code, count) {
    const userId = get().userId;
    if (!userId) return;

    set((state) => {
      const next = { ...state.collection };
      if (count <= 0) delete next[code];
      else next[code] = count;
      return { collection: next };
    });

    pendingUpdates.set(code, count);
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(async () => {
      const updates = Array.from(pendingUpdates.entries()).map(([c, ct]) => ({
        user_id: userId,
        sticker_code: c,
        count: ct,
      }));
      pendingUpdates.clear();
      const supabase = createClient();
      const { error } = await supabase
        .from("collection")
        .upsert(updates, { onConflict: "user_id,sticker_code" });
      if (error) console.error("upsert collection error", error);
    }, 400);
  },

  async bulkAdd(codes) {
    const userId = get().userId;
    if (!userId) return;
    const current = { ...get().collection };
    const updates: { user_id: string; sticker_code: string; count: number }[] = [];
    for (const c of codes) {
      const newCount = (current[c] ?? 0) === 0 ? 1 : (current[c] ?? 0);
      current[c] = newCount;
      updates.push({ user_id: userId, sticker_code: c, count: newCount });
    }
    set({ collection: current });
    const supabase = createClient();
    const { error } = await supabase
      .from("collection")
      .upsert(updates, { onConflict: "user_id,sticker_code" });
    if (error) console.error("bulkAdd error", error);
  },
}));
