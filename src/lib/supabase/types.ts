export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
  scans_used: number;
  scan_credits: number;
};

export type CollectionRow = {
  user_id: string;
  sticker_code: string;
  count: number;
  updated_at: string;
};

export type MarkedFriend = {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type Holding = {
  id: string;
  owner_id: string;
  sticker_code: string;
  marked_friend_id: string | null;
  friend_user_id: string | null;
  count: number;
  created_at: string;
};

export type Scan = {
  id: string;
  user_id: string;
  storage_path: string;
  detected_codes: string[];
  status: "pending" | "processing" | "done" | "error";
  error: string | null;
  applied: boolean;
  created_at: string;
};

export type AlbumPageKind = "team" | "coca_cola" | "fwc" | "intro" | "custom";

export type AlbumPage = {
  id: string;
  uploaded_by: string | null;
  kind: AlbumPageKind;
  team_code: string | null;
  team_sheet: number | null;
  custom_label: string | null;
  storage_path: string;
  sticker_codes: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UserStats = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_public: boolean;
  owned: number;
  duplicates: number;
  total_count: number;
  missing: number;
};

export type TradeOfferRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  sticker_codes: string[];
  note: string | null;
  status: "pending" | "accepted" | "cancelled" | "declined" | "completed";
  from_delivered_at: string | null;
  to_delivered_at: string | null;
  created_at: string;
};

export type StickerReservationRow = {
  user_id: string;
  sticker_code: string;
  from_user_id: string | null;
  offer_id: string | null;
  created_at: string;
};

type TableShape<R, I, U> = {
  Row: R;
  Insert: I;
  Update: U;
  Relationships: never[];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<
        Profile,
        Partial<Profile> & Pick<Profile, "id" | "username" | "display_name">,
        Partial<Profile>
      >;
      collection: TableShape<
        CollectionRow,
        Pick<CollectionRow, "user_id" | "sticker_code" | "count">,
        Partial<CollectionRow>
      >;
      marked_friends: TableShape<
        MarkedFriend,
        Pick<MarkedFriend, "owner_id" | "name"> & Partial<MarkedFriend>,
        Partial<MarkedFriend>
      >;
      holdings: TableShape<
        Holding,
        Partial<Holding> & Pick<Holding, "owner_id" | "sticker_code">,
        Partial<Holding>
      >;
      scans: TableShape<
        Scan,
        Partial<Scan> & Pick<Scan, "user_id" | "storage_path">,
        Partial<Scan>
      >;
      album_pages: TableShape<
        AlbumPage,
        Partial<AlbumPage> &
          Pick<AlbumPage, "kind" | "storage_path" | "sticker_codes">,
        Partial<AlbumPage>
      >;
      trade_offers: TableShape<
        TradeOfferRow,
        Pick<
          TradeOfferRow,
          "from_user_id" | "to_user_id" | "sticker_codes" | "status"
        > &
          Partial<TradeOfferRow>,
        Partial<TradeOfferRow>
      >;
      sticker_reservations: TableShape<
        StickerReservationRow,
        Pick<StickerReservationRow, "user_id" | "sticker_code"> &
          Partial<StickerReservationRow>,
        Partial<StickerReservationRow>
      >;
    };
    Views: {
      user_stats: {
        Row: UserStats;
        Relationships: never[];
      };
    };
    Functions: {
      use_scan: {
        Args: Record<string, never>;
        Returns: number;
      };
      send_trade_offer: {
        Args: {
          p_note?: string | null;
          p_sticker_codes: string[];
          p_to_user_id: string;
        };
        Returns: string;
      };
      accept_trade_offer: {
        Args: { p_offer_id: string };
        Returns: undefined;
      };
      cancel_trade_offer: {
        Args: { p_offer_id: string };
        Returns: undefined;
      };
      decline_trade_offer: {
        Args: { p_offer_id: string };
        Returns: undefined;
      };
      confirm_trade_delivery: {
        Args: { p_offer_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
