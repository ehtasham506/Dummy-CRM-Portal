"use client";

import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, CheckSquare, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskItem } from "@/components/TaskItem";
import { Button, Card, ConfirmDialog, EmptyState, inputClass, LoadingScreen, PageHeader } from "@/components/ui";
import { useCRM } from "@/lib/store";
import { TASK_PRIORITIES, TASK_TYPES, type Task } from "@/lib/types";
import { cn, dueStatus, fullName } from "@/lib/utils";

type View = "open" | "overdue" | "today" | "upcoming" | "completed" | "all";

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 } as const;

export default function TasksPage() {
  const { tasks, ready, deleteTask, getContact, notify } = useCRM();
  const [view, setView] = useState<View>("open");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => !t.completed);
    return {
      open: open.length,
      overdue: open.filter((t) => dueStatus(t.dueDate) === "overdue").length,
      today: open.filter((t) => dueStatus(t.dueDate) === "today").length,
      upcoming: open.filter((t) => dueStatus(t.dueDate) === "upcoming").length,
      completed: tasks.length - open.length,
      all: tasks.length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => {
        switch (view) {
          case "open":
            if (t.completed) return false;
            break;
          case "completed":
            if (!t.completed) return false;
            break;
          case "all":
            break;
          default:
            if (t.completed || dueStatus(t.dueDate) !== view) return false;
        }
        if (type && t.type !== type) return false;
        if (priority && t.priority !== priority) return false;
        if (q) {
          const c = t.contactId ? getContact(t.contactId) : undefined;
          const hay = `${t.title} ${t.description} ${c ? fullName(c) + " " + c.company : ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (view === "completed") return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
        return (
          Number(a.completed) - Number(b.completed) ||
          a.dueDate.localeCompare(b.dueDate) ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        );
      });
  }, [tasks, view, query, type, priority, getContact]);

  if (!ready) return <LoadingScreen />;

  const groups: { label: string; items: Task[]; tone: string }[] =
    view === "open" || view === "all"
      ? [
          { label: "Overdue", items: filtered.filter((t) => !t.completed && dueStatus(t.dueDate) === "overdue"), tone: "text-rose-600" },
          { label: "Due today", items: filtered.filter((t) => !t.completed && dueStatus(t.dueDate) === "today"), tone: "text-amber-600" },
          { label: "Upcoming", items: filtered.filter((t) => !t.completed && dueStatus(t.dueDate) === "upcoming"), tone: "text-slate-700" },
          { label: "Completed", items: filtered.filter((t) => t.completed), tone: "text-emerald-600" },
        ].filter((g) => g.items.length > 0)
      : [{ label: "", items: filtered, tone: "" }];

  const tabs: { key: View; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  const summary = [
    { label: "Overdue", value: counts.overdue, icon: AlertTriangle, cls: "bg-rose-50 text-rose-600", v: "overdue" as View },
    { label: "Due today", value: counts.today, icon: CalendarClock, cls: "bg-amber-50 text-amber-600", v: "today" as View },
    { label: "Upcoming", value: counts.upcoming, icon: CalendarDays, cls: "bg-indigo-50 text-indigo-600", v: "upcoming" as View },
    { label: "Completed", value: counts.completed, icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600", v: "completed" as View },
  ];

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Tasks & follow-ups"
        description="Stay on top of calls, emails and meetings with your contacts."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, cls, v }) => (
          <button key={label} type="button" onClick={() => setView(v)} className="text-left">
            <Card className={cn("flex items-center gap-3 p-4 transition-shadow hover:shadow-md", view === v && "ring-2 ring-indigo-500")}>
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", cls)}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Card>
        <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-slate-200 px-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium",
                view === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-xs", view === t.key ? "bg-indigo-50" : "bg-slate-100")}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks or contacts…"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select className={cn(inputClass, "sm:w-36")} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {TASK_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select className={cn(inputClass, "sm:w-36")} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-5 w-5" />}
            title="No tasks here"
            message={tasks.length === 0 ? "Create your first follow-up task." : "Nothing matches this view or filter."}
            action={
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" /> New task
              </Button>
            }
          />
        ) : (
          groups.map((g) => (
            <div key={g.label || "list"}>
              {g.label && (
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                  <h3 className={cn("text-xs font-semibold uppercase tracking-wide", g.tone)}>{g.label}</h3>
                  <span className="text-xs text-slate-400">{g.items.length}</span>
                </div>
              )}
              <div className="divide-y divide-slate-100">
                {g.items.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onEdit={(task) => {
                      setEditing(task);
                      setFormOpen(true);
                    }}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </Card>

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} task={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete task?"
        message={`"${toDelete?.title}" will be permanently removed.`}
        onConfirm={() => {
          if (toDelete) {
            deleteTask(toDelete.id);
            notify("Task deleted", "info");
          }
        }}
      />
    </>
  );
}
