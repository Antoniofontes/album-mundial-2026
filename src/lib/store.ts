"use client";

import { create } from "zustand";
import { createClient } from "./supabase/client";

type CollectionMap = Record<string, number>;
/** Etiqueta corta por código (ej. @usuario) para figuritas reservadas por intercambio */
type ReservationsMap = Record<string, string>;

type Store = {
  loaded: boolean;
  userId: string | null;
  collection: CollectionMap;
  reservations: ReservationsMap;
  setUser: (userId: string | null) => void;
  load: () => Promise<void>;
  reloadReservations: () => Promise<void>;
  setCount: (code: string, count: number) => Promise<void>;
  bulkAdd: (codes: string[]) => Promise<void>;
};

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const pendingUpdates = new Map<string, number>();

async function loadReservationLabels(userId: string): Promise<ReservationsMap> {
  const supabase = createClient();
  const { data: resRows, error } = await supabase
    .from("sticker_reservations")
    .select("sticker_code, from_user_id")
    .eq("user_id", userId);
  if (error) {
    console.error("sticker_reservations", error);
    return {};
  }
  const ids = [
    ...new Set(
      (resRows ?? []).map((r) => r.from_user_id).filter(Boolean),
    ),
  ] as string[];
  let profileMap: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ids);
    profileMap = Object.fromEntries(
      (profs ?? []).map((p) => [p.id, `@${p.username}`]),
    );
  }
  const reservations: ReservationsMap = {};
  for (const r of resRows ?? []) {
    reservations[r.sticker_code] = r.from_user_id
      ? (profileMap[r.from_user_id] ?? "Intercambio")
      : "Reservado";
  }
  return reservations;
}

export const useCollection = create<Store>((set, get) => ({
  loaded: false,
  userId: null,
  collection: {},
  reservations: {},

  setUser(userId) {
    set({ userId });
  },

  async load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({
        loaded: true,
        userId: null,
        collection: {},
        reservations: {},
      });
      return;
    }

    const [collRes, resMap] = await Promise.all([
      supabase
        .from("collection")
        .select("sticker_code, count")
        .eq("user_id", user.id)
        .then(async (r) => r),
      loadReservationLabels(user.id),
    ]);

    const { data, error } = collRes;

    if (error) {
      console.error(error);
      set({
        loaded: true,
        userId: user.id,
        collection: {},
        reservations: resMap,
      });
      return;
    }

    const map: CollectionMap = {};
    for (const row of data ?? []) map[row.sticker_code] = row.count;
    set({
      loaded: true,
      userId: user.id,
      collection: map,
      reservations: resMap,
    });
  },

  async reloadReservations() {
    const userId = get().userId;
    if (!userId) {
      set({ reservations: {} });
      return;
    }
    const reservations = await loadReservationLabels(userId);
    set({ reservations });
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
