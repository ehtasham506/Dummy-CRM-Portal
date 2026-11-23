"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildSeedData } from "./seed";
import type {
  Activity,
  ActivityType,
  Contact,
  ContactInput,
  LifecycleStage,
  Task,
  TaskInput,
} from "./types";
import { fullName, uid } from "./utils";

const STORAGE_KEY = "dummy-crm-portal:v1";

interface CRMData {
  contacts: Contact[];
  tasks: Task[];
  activities: Activity[];
}

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

interface CRMContextValue extends CRMData {
  ready: boolean;
  getContact: (id: string) => Contact | undefined;
  addContact: (input: ContactInput) => Contact;
  updateContact: (id: string, input: Partial<ContactInput>) => void;
  deleteContact: (id: string) => void;
  setStage: (id: string, stage: LifecycleStage) => void;
  addNote: (contactId: string, content: string) => void;
  deleteNote: (contactId: string, noteId: string) => void;
  logInteraction: (contactId: string, type: "email_sent" | "call_logged" | "meeting_held") => void;
  addTask: (input: TaskInput) => void;
  updateTask: (id: string, input: Partial<TaskInput>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  resetDemoData: () => void;
  clearAllData: () => void;
  toasts: Toast[];
  notify: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
}

const CRMContext = createContext<CRMContextValue | null>(null);

function loadData(): CRMData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CRMData;
      if (Array.isArray(parsed.contacts) && Array.isArray(parsed.tasks) && Array.isArray(parsed.activities)) {
        return parsed;
      }
    }
  } catch {
    // corrupted or unavailable storage: fall back to seed data
  }
  return buildSeedData();
}

export function CRMProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CRMData>({ contacts: [], tasks: [], activities: [] });
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setData(loadData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable; data stays in memory for this session
    }
  }, [data, ready]);

  // Keep multiple tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue) as CRMData);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: Toast["tone"] = "success") => {
      const id = uid("toast");
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => dismissToast(id), 3200);
    },
    [dismissToast],
  );

  const activity = (type: ActivityType, description: string, contactId: string | null): Activity => ({
    id: uid("a"),
    type,
    description,
    contactId,
    timestamp: new Date().toISOString(),
  });

  const getContact = useCallback(
    (id: string) => data.contacts.find((c) => c.id === id),
    [data.contacts],
  );

  const addContact = useCallback((input: ContactInput): Contact => {
    const now = new Date().toISOString();
    const { initialNote, ...rest } = input;
    const contact: Contact = {
      ...rest,
      id: uid("c"),
      notes: initialNote?.trim()
        ? [{ id: uid("n"), content: initialNote.trim(), createdAt: now }]
        : [],
      createdAt: now,
      updatedAt: now,
      lastContactedAt: null,
    };
    setData((d) => ({
      ...d,
      contacts: [contact, ...d.contacts],
      activities: [
        activity("contact_created", `${fullName(contact)} was added as ${contact.stage === "Engaged" ? "an" : "a"} ${contact.stage}`, contact.id),
        ...d.activities,
      ],
    }));
    return contact;
  }, []);

  const updateContact = useCallback((id: string, input: Partial<ContactInput>) => {
    setData((d) => {
      const existing = d.contacts.find((c) => c.id === id);
      if (!existing) return d;
      const { initialNote, ...rest } = input;
      const updated: Contact = { ...existing, ...rest, updatedAt: new Date().toISOString() };
      const newActivities: Activity[] = [];
      if (rest.stage && rest.stage !== existing.stage) {
        newActivities.push(
          activity("stage_changed", `${fullName(updated)} moved from ${existing.stage} to ${rest.stage}`, id),
        );
      }
      newActivities.push(activity("contact_updated", `Contact details updated for ${fullName(updated)}`, id));
      return {
        ...d,
        contacts: d.contacts.map((c) => (c.id === id ? updated : c)),
        activities: [...newActivities, ...d.activities],
      };
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setData((d) => {
      const existing = d.contacts.find((c) => c.id === id);
      if (!existing) return d;
      return {
        contacts: d.contacts.filter((c) => c.id !== id),
        tasks: d.tasks.map((t) => (t.contactId === id ? { ...t, contactId: null } : t)),
        activities: [
          activity("contact_deleted", `${fullName(existing)} was deleted`, null),
          ...d.activities.map((a) => (a.contactId === id ? { ...a, contactId: null } : a)),
        ],
      };
    });
  }, []);

  const setStage = useCallback((id: string, stage: LifecycleStage) => {
    setData((d) => {
      const existing = d.contacts.find((c) => c.id === id);
      if (!existing || existing.stage === stage) return d;
      return {
        ...d,
        contacts: d.contacts.map((c) =>
          c.id === id ? { ...c, stage, updatedAt: new Date().toISOString() } : c,
        ),
        activities: [
          activity("stage_changed", `${fullName(existing)} moved from ${existing.stage} to ${stage}`, id),
          ...d.activities,
        ],
      };
    });
  }, []);

  const addNote = useCallback((contactId: string, content: string) => {
    setData((d) => {
      const existing = d.contacts.find((c) => c.id === contactId);
      if (!existing) return d;
      const now = new Date().toISOString();
      return {
        ...d,
        contacts: d.contacts.map((c) =>
          c.id === contactId
            ? { ...c, notes: [{ id: uid("n"), content, createdAt: now }, ...c.notes], updatedAt: now }
            : c,
        ),
        activities: [activity("note_added", `Note added to ${fullName(existing)}`, contactId), ...d.activities],
      };
    });
  }, []);

  const deleteNote = useCallback((contactId: string, noteId: string) => {
    setData((d) => ({
      ...d,
      contacts: d.contacts.map((c) =>
        c.id === contactId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c,
      ),
    }));
  }, []);

  const logInteraction = useCallback(
    (contactId: string, type: "email_sent" | "call_logged" | "meeting_held") => {
      setData((d) => {
        const existing = d.contacts.find((c) => c.id === contactId);
        if (!existing) return d;
        const now = new Date().toISOString();
        const name = fullName(existing);
        const desc =
          type === "email_sent"
            ? `Logged an email to ${name}`
            : type === "call_logged"
              ? `Logged a call with ${name}`
              : `Logged a meeting with ${name}`;
        return {
          ...d,
          contacts: d.contacts.map((c) =>
            c.id === contactId ? { ...c, lastContactedAt: now, updatedAt: now } : c,
          ),
          activities: [activity(type, desc, contactId), ...d.activities],
        };
      });
    },
    [],
  );

  const addTask = useCallback((input: TaskInput) => {
    const task: Task = {
      ...input,
      id: uid("t"),
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setData((d) => ({
      ...d,
      tasks: [task, ...d.tasks],
      activities: [activity("task_created", `Task created: ${task.title}`, task.contactId), ...d.activities],
    }));
  }, []);

  const updateTask = useCallback((id: string, input: Partial<TaskInput>) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...input } : t)),
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (!t) return d;
      const completed = !t.completed;
      return {
        ...d,
        tasks: d.tasks.map((x) =>
          x.id === id
            ? { ...x, completed, completedAt: completed ? new Date().toISOString() : null }
            : x,
        ),
        activities: [
          activity(
            completed ? "task_completed" : "task_reopened",
            `${completed ? "Completed" : "Reopened"} task: ${t.title}`,
            t.contactId,
          ),
          ...d.activities,
        ],
      };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => {
      const t = d.tasks.find((x) => x.id === id);
      if (!t) return d;
      return {
        ...d,
        tasks: d.tasks.filter((x) => x.id !== id),
        activities: [activity("task_deleted", `Deleted task: ${t.title}`, t.contactId), ...d.activities],
      };
    });
  }, []);

  const resetDemoData = useCallback(() => setData(buildSeedData()), []);
  const clearAllData = useCallback(() => setData({ contacts: [], tasks: [], activities: [] }), []);

  const value = useMemo<CRMContextValue>(
    () => ({
      ...data,
      activities: data.activities.slice(0, 200),
      ready,
      getContact,
      addContact,
      updateContact,
      deleteContact,
      setStage,
      addNote,
      deleteNote,
      logInteraction,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      resetDemoData,
      clearAllData,
      toasts,
      notify,
      dismissToast,
    }),
    [
      data,
      ready,
      getContact,
      addContact,
      updateContact,
      deleteContact,
      setStage,
      addNote,
      deleteNote,
      logInteraction,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      resetDemoData,
      clearAllData,
      toasts,
      notify,
      dismissToast,
    ],
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM(): CRMContextValue {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error("useCRM must be used within CRMProvider");
  return ctx;
}
