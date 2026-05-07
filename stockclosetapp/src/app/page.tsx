"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { InventoryInsert, InventoryItem } from "@/types/database";

const ANALYSIS_POINTS = [
  "Primary users are retail shop employees and store staff.",
  "Main task is searching items to view stock information quickly.",
  "Desired outcomes are instant price lookup and quantity lookup.",
  "Tasks are learned by simple in-app guidance and repeated daily use.",
  "Managers input data, and employees consume that data at the register.",
  "Search is the key supporting tool for speed and convenience.",
  "This is not a social app; it focuses only on inventory operations.",
  "There are no strict time constraints, but speed is essential during customer service.",
  "When issues happen, users need clear bug reporting and support contact options.",
];

const TASK_SCENARIOS = [
  {
    title: "Task 1: Check quantity",
    summary:
      "A cashier needs to answer if bread is available, so they open Stock Closet and confirm quantity before leaving the register.",
    output: "Shows exact quantity for each item.",
  },
  {
    title: "Task 2: Check price",
    summary:
      "A new manager is asked for banana pricing and uses the app instead of memorizing every product.",
    output: "Shows current item price in USD.",
  },
  {
    title: "Task 3: Search for an item",
    summary:
      "A worker hears an unfamiliar product name and uses search to confirm whether the store carries it.",
    output: "Search finds matching products by name, SKU, or category.",
  },
  {
    title: "Task 4: Add a new item",
    summary:
      "A manager receives new stock and adds it with name, quantity, price, notes, and optional image URL.",
    output: "New inventory item appears immediately in the list.",
  },
  {
    title: "Task 5: Remove an item",
    summary:
      "A manager removes discontinued products so employees do not reference old stock.",
    output: "Item is deleted after confirmation.",
  },
  {
    title: "Task 6: Edit item details",
    summary:
      "A manager updates price or quantity when costs change and saves the new values.",
    output: "Edited item reflects new details in real time.",
  },
];

const EMPTY_FORM: InventoryInsert = {
  name: "",
  sku: "",
  category: "",
  quantity: 0,
  price: 0,
  image_url: "",
  notes: "",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function Home() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [form, setForm] = useState<InventoryInsert>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportEmail, setSupportEmail] = useState("support@stockcloset.app");
  const [supportSent, setSupportSent] = useState(false);

  const inputClassName =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  const isBrowser = typeof window !== "undefined";

  const supabase = useMemo(() => {
    if (!isBrowser) {
      return null;
    }

    try {
      return getSupabaseClient();
    } catch {
      return null;
    }
  }, [isBrowser]);

  async function loadItems() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("inventory_items")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setItems(data ?? []);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    // Initial fetch for client-rendered inventory table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalized) ||
        (item.sku ?? "").toLowerCase().includes(normalized) ||
        (item.category ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [items, query]);

  const inventoryStats = useMemo(() => {
    const totalItems = items.length;
    const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
    const estimatedValue = items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );

    return { totalItems, totalUnits, estimatedValue };
  }, [items]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function onEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      sku: item.sku ?? "",
      category: item.category ?? "",
      quantity: item.quantity,
      price: item.price,
      image_url: item.image_url ?? "",
      notes: item.notes ?? "",
    });
    setEditingId(item.id);
  }

  async function onDelete(id: string) {
    if (!supabase) {
      setError("Supabase is not configured. Add env vars in .env.local.");
      return;
    }

    const shouldDelete = window.confirm(
      "Remove this product from inventory? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setLoading(true);
    await loadItems();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured. Add env vars in .env.local.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: InventoryInsert = {
      name: form.name.trim(),
      sku: form.sku?.trim() || null,
      category: form.category?.trim() || null,
      quantity: Number(form.quantity),
      price: Number(form.price),
      image_url: form.image_url?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    const queryBuilder = editingId
      ? supabase.from("inventory_items").update(payload).eq("id", editingId)
      : supabase.from("inventory_items").insert(payload);

    const { error: saveError } = await queryBuilder;

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    resetForm();
    setLoading(true);
    await loadItems();
    setSaving(false);
  }

  function onSubmitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = supportMessage.trim();

    if (!message) {
      return;
    }

    const mailTo = `mailto:${encodeURIComponent(
      supportEmail,
    )}?subject=${encodeURIComponent(
      "Stock Closet Support Request",
    )}&body=${encodeURIComponent(message)}`;

    window.location.href = mailTo;
    setSupportSent(true);
    setSupportMessage("");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Stock Closet
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Inventory built for quick retail answers.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            This dashboard is designed around your Assignment 2 goals: make price and
            quantity lookups fast, reduce stress at the register, and keep product data
            accurate without notebook edits.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Products
            </p>
          <strong>{inventoryStats.totalItems}</strong>
        </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Units in stock
            </p>
          <strong>{inventoryStats.totalUnits}</strong>
        </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estimated inventory value
            </p>
          <strong>{formatCurrency(inventoryStats.estimatedValue)}</strong>
        </article>
        </section>

        <main className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Inventory List</h2>
              <div className="w-full md:w-[22rem]">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Search
                </label>
                <input
                  aria-label="Search inventory"
                  placeholder="Search by name, SKU, or category"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            {loading ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                Loading inventory...
              </p>
            ) : filteredItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                No products found.
              </p>
            ) : (
              <ul className="grid gap-3">
                {filteredItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-base font-semibold text-teal-700">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-800">Quantity:</span>{" "}
                        {item.quantity}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">SKU:</span>{" "}
                        {item.sku || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">Category:</span>{" "}
                        {item.category || "Uncategorized"}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Item" : "Add New Item"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-600 hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form className="grid gap-3" onSubmit={onSubmit}>
              <label className="text-sm text-slate-700">
                Product name
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className={inputClassName}
                />
              </label>

              <label className="text-sm text-slate-700">
                SKU
                <input
                  value={form.sku ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sku: event.target.value }))
                  }
                  className={inputClassName}
                />
              </label>

              <label className="text-sm text-slate-700">
                Category
                <input
                  value={form.category ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className={inputClassName}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: Number(event.target.value),
                      }))
                    }
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm text-slate-700">
                  Price
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={form.price}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        price: Number(event.target.value),
                      }))
                    }
                    className={inputClassName}
                  />
                </label>
              </div>

              <label className="text-sm text-slate-700">
                Image URL
                <input
                  value={form.image_url ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, image_url: event.target.value }))
                  }
                  className={inputClassName}
                />
              </label>

              <label className="text-sm text-slate-700">
                Notes
                <textarea
                  rows={3}
                  value={form.notes ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  className={inputClassName}
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="mt-1 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-800">How to use this app</h3>
              <p className="mt-1 text-sm text-slate-600">
                Search to find products instantly. Add, edit, and remove items as stock
                changes. Employees can read accurate prices and quantities from manager
                updates.
              </p>
            </div>
          </section>
        </main>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Task Analysis Questions
          </h2>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700">
            {ANALYSIS_POINTS.map((point) => (
              <li key={point} className="rounded-lg bg-slate-50 px-3 py-2">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Assignment Task Scenarios</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {TASK_SCENARIOS.map((task) => (
              <article
                key={task.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{task.summary}</p>
                <p className="mt-2 text-xs font-medium text-teal-700">{task.output}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Error Handling and Support</h2>
          <p className="mt-2 text-sm text-slate-600">
            If users experience issues, they can report bugs in-app and contact technical
            support by email.
          </p>

          <form className="mt-4 grid gap-3 md:max-w-2xl" onSubmit={onSubmitSupport}>
            <label className="text-sm text-slate-700">
              Support email
              <input
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                className={inputClassName}
                type="email"
                required
              />
            </label>

            <label className="text-sm text-slate-700">
              Describe the issue
              <textarea
                rows={4}
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                className={inputClassName}
                placeholder="Example: Product updates are not saving for new items."
                required
              />
            </label>

            <button
              type="submit"
              className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Report issue by email
            </button>
          </form>

          {supportSent ? (
            <p className="mt-3 text-sm text-teal-700">
              Support email draft opened. Your team can now send the issue details.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
