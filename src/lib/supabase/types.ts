export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
};

export type CollectionRow = {
  user_id: string;
  sticker_number: number;
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
  sticker_number: number;
  marked_friend_id: string | null;
  friend_user_id: string | null;
  count: number;
  created_at: string;
};

export type Scan = {
  id: string;
  user_id: string;
  storage_path: string;
  detected_numbers: number[];
  status: "pending" | "processing" | "done" | "error";
  error: string | null;
  applied: boolean;
  created_at: string;
};

export type AlbumPageKind =
  | "team"
  | "intro"
  | "stadium"
  | "coca_cola"
  | "legend"
  | "special";

export type AlbumPage = {
  id: string;
  uploaded_by: string | null;
  kind: AlbumPageKind;
  team_code: string | null;
  team_sheet: number | null; // 1 o 2 cuando es equipo
  storage_path: string;
  sticker_numbers: number[];
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
        Pick<CollectionRow, "user_id" | "sticker_number" | "count">,
        Partial<CollectionRow>
      >;
      marked_friends: TableShape<
        MarkedFriend,
        Pick<MarkedFriend, "owner_id" | "name"> & Partial<MarkedFriend>,
        Partial<MarkedFriend>
      >;
      holdings: TableShape<
        Holding,
        Partial<Holding> & Pick<Holding, "owner_id" | "sticker_number">,
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
          Pick<AlbumPage, "kind" | "storage_path" | "sticker_numbers">,
        Partial<AlbumPage>
      >;
    };
    Views: {
      user_stats: {
        Row: UserStats;
        Relationships: never[];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
