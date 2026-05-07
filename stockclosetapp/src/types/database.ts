export type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  price: number;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryInsert = {
  id?: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  quantity: number;
  price: number;
  image_url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InventoryUpdate = Partial<InventoryInsert>;

export type InventoryTable = {
  Row: InventoryItem;
  Insert: InventoryInsert;
  Update: InventoryUpdate;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      inventory_items: InventoryTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
