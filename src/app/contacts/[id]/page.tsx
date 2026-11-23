"use client";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Clock,
  DollarSign,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserCircle2,
  Users,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ContactFormModal } from "@/components/ContactFormModal";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskItem } from "@/components/TaskItem";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  inputClass,
  LinkButton,
  LoadingScreen,
  StageBadge,
} from "@/components/ui";
import { useCRM } from "@/lib/store";
import { LIFECYCLE_STAGES, type LifecycleStage, type Task } from "@/lib/types";
import { cn, formatCurrency, formatDate, formatDateTime, fullName, STAGE_STYLES, timeAgo } from "@/lib/utils";

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 break-words text-sm text-slate-900">{children}</div>
      </div>
    </div>
  );
}

type Tab = "notes" | "tasks" | "activity";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, getContact, tasks, activities, setStage, addNote, deleteNote, deleteContact, deleteTask, logInteraction, notify } =
    useCRM();
  const contact = getContact(id);

  const [tab, setTab] = useState<Tab>("notes");
  const [note, setNote] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const contactTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.contactId === id)
        .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate)),
    [tasks, id],
  );
  const contactActivities = useMemo(() => activities.filter((a) => a.contactId === id), [activities, id]);

  if (!ready) return <LoadingScreen />;

  if (!contact) {
    return (
      <Card>
        <EmptyState
          icon={<UserCircle2 className="h-5 w-5" />}
          title="Contact not found"
          message="This contact may have been deleted, or the link is incorrect."
          action={<LinkButton href="/contacts">Back to contacts</LinkButton>}
        />
      </Card>
    );
  }

  const name = fullName(contact);
  const stageIdx = LIFECYCLE_STAGES.indexOf(contact.stage);
  const dnc = contact.stage === "Do Not Contact";
  const openTasks = contactTasks.filter((t) => !t.completed).length;

  const submitNote = (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    addNote(contact.id, note.trim());
    setNote("");
    notify("Note added");
  };

  const log = (type: "email_sent" | "call_logged" | "meeting_held", label: string) => {
    logInteraction(contact.id, type);
    notify(`${label} logged for ${name}`);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "notes", label: "Notes", count: contact.notes.length },
    { key: "tasks", label: "Tasks", count: openTasks },
    { key: "activity", label: "Activity", count: contactActivities.length },
  ];

  return (
    <>
      <Link href="/contacts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to contacts
      </Link>

      {/* Header card */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar firstName={contact.firstName} lastName={contact.lastName} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {[contact.jobTitle, contact.company].filter(Boolean).join(" at ") || "No company"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StageBadge stage={contact.stage} />
                <span className="text-xs text-slate-400">Updated {timeAgo(contact.updatedAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="secondary" onClick={() => setDeleteOpen(true)} className="text-rose-600 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Quick log actions */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {dnc && (
            <p className="w-full rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              This contact has asked not to be contacted. Outreach logging is disabled.
            </p>
          )}
          <Button variant="secondary" size="sm" disabled={dnc} onClick={() => log("email_sent", "Email")}>
            <Mail className="h-4 w-4" /> Log email
          </Button>
          <Button variant="secondary" size="sm" disabled={dnc} onClick={() => log("call_logged", "Call")}>
            <Phone className="h-4 w-4" /> Log call
          </Button>
          <Button variant="secondary" size="sm" disabled={dnc} onClick={() => log("meeting_held", "Meeting")}>
            <Users className="h-4 w-4" /> Log meeting
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingTask(undefined);
              setTaskOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>
      </Card>

      {/* Lifecycle stepper */}
      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Lifecycle stage</h2>
          <span className="text-xs text-slate-500">Click a stage to update</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {LIFECYCLE_STAGES.map((s: LifecycleStage, i) => {
            const active = s === contact.stage;
            const passed = i < stageIdx && stageIdx <= 4 && i <= 4;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (active) return;
                  setStage(contact.id, s);
                  notify(`${name} moved to ${s}`);
                }}
                className={cn(
                  "relative overflow-hidden rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all",
                  active
                    ? "border-transparent bg-slate-900 text-white shadow-sm"
                    : passed
                      ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
                )}
              >
                <span className={cn("absolute inset-x-0 top-0 h-1", STAGE_STYLES[s].bar, !active && !passed && "opacity-30")} />
                {s}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Details */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">Contact details</h2>
          <div className="mt-2 divide-y divide-slate-100">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
              <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">
                {contact.email}
              </a>
            </InfoRow>
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone">
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline">
                  {contact.phone}
                </a>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company">
              {contact.company || "—"}
            </InfoRow>
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Job title">
              {contact.jobTitle || "—"}
            </InfoRow>
            <InfoRow icon={<UserCircle2 className="h-4 w-4" />} label="Owner">
              {contact.owner}
            </InfoRow>
            <InfoRow icon={<Megaphone className="h-4 w-4" />} label="Lead source">
              {contact.source}
            </InfoRow>
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Deal value">
              {contact.dealValue ? formatCurrency(contact.dealValue) : "—"}
            </InfoRow>
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created">
              {formatDate(contact.createdAt)}
            </InfoRow>
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Last contacted">
              {contact.lastContactedAt ? `${formatDate(contact.lastContactedAt)} (${timeAgo(contact.lastContactedAt)})` : "Never"}
            </InfoRow>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="lg:col-span-2">
          <div className="flex gap-1 border-b border-slate-200 px-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs",
                    tab === t.key ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {tab === "notes" && (
            <div className="p-5">
              <form onSubmit={submitNote}>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`Add a note about ${contact.firstName}…`}
                  className={inputClass}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitNote(e);
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ctrl + Enter to save</span>
                  <Button type="submit" size="sm" disabled={!note.trim()}>
                    Save note
                  </Button>
                </div>
              </form>
              {contact.notes.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareText className="h-5 w-5" />}
                  title="No notes yet"
                  message="Capture context from calls and meetings here."
                />
              ) : (
                <ul className="mt-5 space-y-3">
                  {contact.notes.map((n) => (
                    <li key={n.id} className="group rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            deleteNote(contact.id, n.id);
                            notify("Note deleted", "info");
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "tasks" &&
            (contactTasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="h-5 w-5" />}
                title="No tasks"
                message={`Schedule a follow-up with ${contact.firstName}.`}
                action={
                  <Button onClick={() => setTaskOpen(true)}>
                    <Plus className="h-4 w-4" /> Add task
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {contactTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    showContact={false}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setTaskOpen(true);
                    }}
                    onDelete={setTaskToDelete}
                  />
                ))}
              </div>
            ))}

          {tab === "activity" && <ActivityFeed activities={contactActivities} />}
        </Card>
      </div>

      <ContactFormModal open={editOpen} onClose={() => setEditOpen(false)} contact={contact} />
      <TaskFormModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        task={editingTask}
        defaultContactId={contact.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete contact?"
        message={`${name} and all their notes will be permanently removed. Related tasks will be kept but unlinked.`}
        onConfirm={() => {
          deleteContact(contact.id);
          notify(`${name} deleted`);
          router.push("/contacts");
        }}
      />
      <ConfirmDialog
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete task?"
        message={`"${taskToDelete?.title}" will be permanently removed.`}
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            notify("Task deleted", "info");
          }
        }}
      />
    </>
  );
}
