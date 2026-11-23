"use client";

import { GripVertical, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type DragEvent } from "react";
import { ContactFormModal } from "@/components/ContactFormModal";
import { Avatar, Button, Card, inputClass, LoadingScreen, PageHeader } from "@/components/ui";
import { useCRM } from "@/lib/store";
import { LIFECYCLE_STAGES, SALES_REPS, type Contact, type LifecycleStage } from "@/lib/types";
import { cn, formatCurrency, fullName, STAGE_STYLES, timeAgo } from "@/lib/utils";

export default function PipelinePage() {
  const { contacts, ready, setStage, notify } = useCRM();
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LifecycleStage | null>(null);
  const [newStage, setNewStage] = useState<LifecycleStage | null>(null);

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = contacts.filter(
      (c) =>
        (!owner || c.owner === owner) &&
        (!q || fullName(c).toLowerCase().includes(q) || c.company.toLowerCase().includes(q)),
    );
    return LIFECYCLE_STAGES.map((stage) => {
      const items = visible
        .filter((c) => c.stage === stage)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return { stage, items, value: items.reduce((s, c) => s + c.dealValue, 0) };
    });
  }, [contacts, query, owner]);

  if (!ready) return <LoadingScreen />;

  const move = (c: Contact, stage: LifecycleStage) => {
    if (c.stage === stage) return;
    setStage(c.id, stage);
    notify(`${fullName(c)} moved to ${stage}`);
  };

  const onDrop = (e: DragEvent, stage: LifecycleStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    const c = contacts.find((x) => x.id === id);
    if (c) move(c, stage);
    setDragId(null);
    setOverStage(null);
  };

  const totalOpen = columns
    .filter((c) => ["Engaged", "Hot", "In Conversation"].includes(c.stage))
    .reduce((s, c) => s + c.value, 0);

  return (
    <>
      <PageHeader
        title="Pipeline"
        description={`Drag contacts between lifecycle stages · Open pipeline value ${formatCurrency(totalOpen)}`}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter cards…"
                className={cn(inputClass, "w-44 pl-9")}
              />
            </div>
            <select className={cn(inputClass, "w-36")} value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">All owners</option>
              {SALES_REPS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Button onClick={() => setNewStage("Subscriber")}>
              <Plus className="h-4 w-4" /> Add contact
            </Button>
          </>
        }
      />

      <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-max gap-4">
          {columns.map(({ stage, items, value }) => (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
              }}
              onDrop={(e) => onDrop(e, stage)}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-slate-100/80 transition-colors",
                STAGE_STYLES[stage].column,
                overStage === stage && "bg-indigo-50 ring-2 ring-indigo-300",
              )}
            >
              <div className="flex items-center justify-between px-3 pb-2 pt-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{stage}</h2>
                  <p className="text-xs text-slate-500">
                    {items.length} contact{items.length === 1 ? "" : "s"}
                    {value > 0 && ` · ${formatCurrency(value)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewStage(stage)}
                  className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  aria-label={`Add contact to ${stage}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex max-h-[calc(100vh-15rem)] min-h-[8rem] flex-col gap-2 overflow-y-auto px-2 pb-3 scrollbar-thin">
                {items.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                    Drop contacts here
                  </div>
                )}
                {items.map((c) => (
                  <Card
                    key={c.id}
                    className={cn(
                      "group p-3 transition-shadow hover:shadow-md",
                      dragId === c.id && "opacity-40",
                    )}
                  >
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/contacts/${c.id}`}
                            className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-600"
                          >
                            {fullName(c)}
                          </Link>
                          <p className="truncate text-xs text-slate-500">{c.company}</p>
                        </div>
                        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {c.dealValue ? formatCurrency(c.dealValue) : "—"}
                        </span>
                        <span>{timeAgo(c.updatedAt)}</span>
                      </div>
                    </div>
                    <select
                      aria-label={`Move ${fullName(c)} to stage`}
                      value={c.stage}
                      onChange={(e) => move(c, e.target.value as LifecycleStage)}
                      className="mt-2.5 w-full rounded-md border-0 bg-slate-50 px-2 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600"
                    >
                      {LIFECYCLE_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s === c.stage ? `Stage: ${s}` : `Move to ${s}`}
                        </option>
                      ))}
                    </select>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ContactFormModal
        open={newStage !== null}
        onClose={() => setNewStage(null)}
        defaultStage={newStage ?? undefined}
      />
    </>
  );
}
