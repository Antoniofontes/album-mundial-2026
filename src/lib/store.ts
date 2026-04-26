"use client";

import { create } from "zustand";
import { createClient } from "./supabase/client";

type CollectionMap = Record<number, number>;

type Store = {
  loaded: boolean;
  userId: string | null;
  collection: CollectionMap;
  setUser: (userId: string | null) => void;
  load: () => Promise<void>;
  setCount: (n: number, count: number) => Promise<void>;
  bulkAdd: (numbers: number[]) => Promise<void>;
};

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const pendingUpdates = new Map<number, number>();

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
      .select("sticker_number, count")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      set({ loaded: true, userId: user.id, collection: {} });
      return;
    }

    const map: CollectionMap = {};
    for (const row of data ?? []) map[row.sticker_number] = row.count;
    set({ loaded: true, userId: user.id, collection: map });
  },

  async setCount(n, count) {
    const userId = get().userId;
    if (!userId) return;

    set((state) => {
      const next = { ...state.collection };
      if (count <= 0) delete next[n];
      else next[n] = count;
      return { collection: next };
    });

    pendingUpdates.set(n, count);
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(async () => {
      const updates = Array.from(pendingUpdates.entries()).map(([num, c]) => ({
        user_id: userId,
        sticker_number: num,
        count: c,
      }));
      pendingUpdates.clear();
      const supabase = createClient();
      const { error } = await supabase
        .from("collection")
        .upsert(updates, { onConflict: "user_id,sticker_number" });
      if (error) console.error("upsert collection error", error);
    }, 400);
  },

  async bulkAdd(numbers) {
    const userId = get().userId;
    if (!userId) return;
    const current = { ...get().collection };
    const updates: { user_id: string; sticker_number: number; count: number }[] = [];
    for (const n of numbers) {
      const newCount = (current[n] ?? 0) === 0 ? 1 : (current[n] ?? 0);
      current[n] = newCount;
      updates.push({ user_id: userId, sticker_number: n, count: newCount });
    }
    set({ collection: current });
    const supabase = createClient();
    const { error } = await supabase
      .from("collection")
      .upsert(updates, { onConflict: "user_id,sticker_number" });
    if (error) console.error("bulkAdd error", error);
  },
}));
