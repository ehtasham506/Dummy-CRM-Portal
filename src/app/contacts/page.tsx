"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ContactFormModal } from "@/components/ContactFormModal";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  inputClass,
  LoadingScreen,
  PageHeader,
  StageBadge,
} from "@/components/ui";
import { useCRM } from "@/lib/store";
import { LEAD_SOURCES, LIFECYCLE_STAGES, SALES_REPS, type Contact, type LifecycleStage } from "@/lib/types";
import { cn, downloadCSV, formatCurrency, formatDate, fullName, todayKey } from "@/lib/utils";

type SortKey = "name" | "company" | "stage" | "dealValue" | "createdAt";
const PAGE_SIZE = 10;
const DAY = 86_400_000;

function ContactsView() {
  const { contacts, ready, deleteContact, setStage, notify } = useCRM();
  const params = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [stage, setStageFilter] = useState<string>(params.get("stage") ?? "");
  const [owner, setOwner] = useState("");
  const [source, setSource] = useState("");
  const [newOnly, setNewOnly] = useState(params.get("new") === "1");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | undefined>();
  const [toDelete, setToDelete] = useState<Contact[] | null>(null);

  // Sync when header search / dashboard links change the URL
  useEffect(() => {
    setQuery(params.get("q") ?? "");
    setStageFilter(params.get("stage") ?? "");
    setNewOnly(params.get("new") === "1");
  }, [params]);

  useEffect(() => setPage(1), [query, stage, owner, source, newOnly, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const list = contacts.filter((c) => {
      if (stage && c.stage !== stage) return false;
      if (owner && c.owner !== owner) return false;
      if (source && c.source !== source) return false;
      if (
        newOnly &&
        !(["Subscriber", "Engaged", "Hot"].includes(c.stage) && now - new Date(c.createdAt).getTime() <= 30 * DAY)
      )
        return false;
      if (!q) return true;
      return [fullName(c), c.email, c.company, c.phone, c.jobTitle].some((f) => f.toLowerCase().includes(q));
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      switch (sort.key) {
        case "name":
          return fullName(a).localeCompare(fullName(b)) * dir;
        case "company":
          return a.company.localeCompare(b.company) * dir;
        case "stage":
          return (LIFECYCLE_STAGES.indexOf(a.stage) - LIFECYCLE_STAGES.indexOf(b.stage)) * dir;
        case "dealValue":
          return (a.dealValue - b.dealValue) * dir;
        default:
          return a.createdAt.localeCompare(b.createdAt) * dir;
      }
    });
  }, [contacts, query, stage, owner, source, newOnly, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const activeFilters = [query, stage, owner, source, newOnly ? "new" : ""].filter(Boolean).length;
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((c) => selected.has(c.id));

  if (!ready) return <LoadingScreen />;

  const clearFilters = () => {
    setQuery("");
    setStageFilter("");
    setOwner("");
    setSource("");
    setNewOnly(false);
    router.replace("/contacts");
  };

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPageSelected) pageItems.forEach((c) => n.delete(c.id));
      else pageItems.forEach((c) => n.add(c.id));
      return n;
    });

  const selectedContacts = contacts.filter((c) => selected.has(c.id));

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["First name", "Last name", "Email", "Phone", "Company", "Job title", "Stage", "Source", "Owner", "Deal value", "Created"],
      ...filtered.map((c) => [
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.company,
        c.jobTitle,
        c.stage,
        c.source,
        c.owner,
        c.dealValue,
        c.createdAt.slice(0, 10),
      ]),
    ];
    downloadCSV(`contacts-${todayKey()}.csv`, rows);
    notify(`Exported ${filtered.length} contacts to CSV`);
  };

  const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500", className)}>
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-slate-900">
        {label}
        {sort.key === k &&
          (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} people in your CRM`}
        actions={
          <>
            <Button variant="secondary" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add contact
            </Button>
          </>
        }
      />

      <Card>
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, company or phone…"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <select className={cn(inputClass, "lg:w-40")} value={stage} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className={cn(inputClass, "lg:w-36")} value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">All owners</option>
              {SALES_REPS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className={cn(inputClass, "lg:w-36")} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">All sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg px-2 text-sm text-slate-700 ring-1 ring-inset ring-slate-300 lg:ring-0">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(e) => setNewOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
              />
              <span className="whitespace-nowrap">New leads</span>
            </label>
          </div>
        </div>

        {(activeFilters > 0 || selected.size > 0) && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            {activeFilters > 0 && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Filter className="h-4 w-4" />
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
                <button type="button" onClick={clearFilters} className="ml-1 inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500">
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              </span>
            )}
            {selected.size > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-700">{selected.size} selected</span>
                <select
                  className={cn(inputClass, "w-auto py-1.5")}
                  value=""
                  onChange={(e) => {
                    const s = e.target.value as LifecycleStage;
                    if (!s) return;
                    selectedContacts.forEach((c) => setStage(c.id, s));
                    notify(`Moved ${selected.size} contact${selected.size === 1 ? "" : "s"} to ${s}`);
                    setSelected(new Set());
                  }}
                >
                  <option value="">Change stage…</option>
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <Button variant="danger" size="sm" onClick={() => setToDelete(selectedContacts)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={contacts.length === 0 ? "No contacts yet" : "No matching contacts"}
            message={
              contacts.length === 0
                ? "Add your first contact or reset the demo data in Settings."
                : "Try a different search term or clear the filters."
            }
            action={
              contacts.length === 0 ? (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" /> Add contact
                </Button>
              ) : (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/60">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 accent-indigo-600"
                        aria-label="Select all on page"
                      />
                    </th>
                    <SortHeader k="name" label="Name" />
                    <SortHeader k="company" label="Company" />
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 xl:table-cell">
                      Phone
                    </th>
                    <SortHeader k="stage" label="Stage" />
                    <SortHeader k="dealValue" label="Value" className="hidden lg:table-cell" />
                    <SortHeader k="createdAt" label="Added" className="hidden lg:table-cell" />
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pageItems.map((c) => (
                    <tr
                      key={c.id}
                      className={cn("cursor-pointer hover:bg-slate-50", selected.has(c.id) && "bg-indigo-50/40")}
                      onClick={() => router.push(`/contacts/${c.id}`)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="h-4 w-4 accent-indigo-600"
                          aria-label={`Select ${fullName(c)}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{fullName(c)}</p>
                            <p className="truncate text-xs text-slate-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{c.company || "—"}</p>
                        <p className="text-xs text-slate-500">{c.jobTitle}</p>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-slate-600 xl:table-cell">
                        {c.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={c.stage} />
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm tabular-nums text-slate-700 lg:table-cell">
                        {c.dealValue ? formatCurrency(c.dealValue) : "—"}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-slate-500 lg:table-cell">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/contacts/${c.id}`}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(c);
                              setFormOpen(true);
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete([c])}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {pageItems.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="h-4 w-4 accent-indigo-600"
                    aria-label={`Select ${fullName(c)}`}
                  />
                  <Link href={`/contacts/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{fullName(c)}</p>
                      <p className="truncate text-xs text-slate-500">{c.company}</p>
                      <StageBadge stage={c.stage} className="mt-1" />
                    </div>
                  </Link>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete([c])}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
              <span>
                Showing <span className="font-medium">{(current - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-medium">{Math.min(current * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-medium">{filtered.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="tabular-nums">
                  {current} / {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={current >= pageCount}
                  onClick={() => setPage(current + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <ContactFormModal open={formOpen} onClose={() => setFormOpen(false)} contact={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={toDelete && toDelete.length > 1 ? `Delete ${toDelete.length} contacts?` : "Delete contact?"}
        message={
          toDelete && toDelete.length === 1
            ? `${fullName(toDelete[0])} and their notes will be permanently removed. Related tasks will be kept but unlinked.`
            : "The selected contacts and their notes will be permanently removed. Related tasks will be kept but unlinked."
        }
        onConfirm={() => {
          if (!toDelete) return;
          toDelete.forEach((c) => deleteContact(c.id));
          setSelected((s) => {
            const n = new Set(s);
            toDelete.forEach((c) => n.delete(c.id));
            return n;
          });
          notify(toDelete.length === 1 ? `${fullName(toDelete[0])} deleted` : `${toDelete.length} contacts deleted`);
        }}
      />
    </>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ContactsView />
    </Suspense>
  );
}
