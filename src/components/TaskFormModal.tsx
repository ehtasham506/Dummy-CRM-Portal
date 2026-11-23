"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useCRM } from "@/lib/store";
import { TASK_PRIORITIES, TASK_TYPES, type Task, type TaskInput } from "@/lib/types";
import { fullName, todayKey } from "@/lib/utils";
import { Button, Field, inputClass, Modal } from "./ui";

export function TaskFormModal({
  open,
  onClose,
  task,
  defaultContactId,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultContactId?: string;
}) {
  const { contacts, addTask, updateTask, notify } = useCRM();
  const [values, setValues] = useState<TaskInput>({
    title: "",
    description: "",
    type: "Follow-up",
    priority: "Medium",
    dueDate: todayKey(),
    contactId: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setValues(
      task
        ? {
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            dueDate: task.dueDate,
            contactId: task.contactId,
          }
        : {
            title: "",
            description: "",
            type: "Follow-up",
            priority: "Medium",
            dueDate: todayKey(),
            contactId: defaultContactId ?? null,
          },
    );
  }, [open, task, defaultContactId]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [contacts],
  );

  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) => setValues((s) => ({ ...s, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      setError("Title is required");
      return;
    }
    const clean = { ...values, title: values.title.trim(), description: values.description.trim() };
    if (task) {
      updateTask(task.id, clean);
      notify("Task updated");
    } else {
      addTask(clean);
      notify("Task created");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      description="Schedule a follow-up activity"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form">
            {task ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" required error={error} className="sm:col-span-2">
          <input
            className={inputClass}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Follow up on proposal"
            autoFocus
          />
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={values.type}
            onChange={(e) => set("type", e.target.value as TaskInput["type"])}
          >
            {TASK_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select
            className={inputClass}
            value={values.priority}
            onChange={(e) => set("priority", e.target.value as TaskInput["priority"])}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            className={inputClass}
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value || todayKey())}
          />
        </Field>
        <Field label="Related contact">
          <select
            className={inputClass}
            value={values.contactId ?? ""}
            onChange={(e) => set("contactId", e.target.value || null)}
          >
            <option value="">— None —</option>
            {sortedContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {fullName(c)} · {c.company}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            rows={3}
            className={inputClass}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
