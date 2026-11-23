"use client";

import { Calendar, Check, Mail, Pencil, Phone, Trash2, Users, Repeat, ListTodo } from "lucide-react";
import Link from "next/link";
import type { Task, TaskType } from "@/lib/types";
import { useCRM } from "@/lib/store";
import { cn, dueStatus, formatDate, fullName } from "@/lib/utils";
import { PriorityBadge } from "./ui";

export const TASK_TYPE_ICONS: Record<TaskType, typeof Phone> = {
  Call: Phone,
  Email: Mail,
  Meeting: Users,
  "Follow-up": Repeat,
  "To-do": ListTodo,
};

export function TaskItem({
  task,
  onEdit,
  onDelete,
  showContact = true,
  compact = false,
}: {
  task: Task;
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
  showContact?: boolean;
  compact?: boolean;
}) {
  const { toggleTask, getContact, notify } = useCRM();
  const contact = task.contactId ? getContact(task.contactId) : undefined;
  const status = dueStatus(task.dueDate);
  const Icon = TASK_TYPE_ICONS[task.type];

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
        task.completed && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => {
          toggleTask(task.id);
          notify(task.completed ? "Task reopened" : "Task completed", task.completed ? "info" : "success");
        }}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 hover:border-emerald-500",
        )}
        aria-label={task.completed ? "Mark as not done" : "Mark as done"}
      >
        {task.completed && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm font-medium text-slate-900", task.completed && "line-through")}>{task.title}</p>
          {!compact && <PriorityBadge priority={task.priority} />}
        </div>
        {!compact && task.description && <p className="mt-0.5 text-sm text-slate-500">{task.description}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Icon className="h-3.5 w-3.5" />
            {task.type}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              !task.completed && status === "overdue" && "font-medium text-rose-600",
              !task.completed && status === "today" && "font-medium text-amber-600",
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {!task.completed && status === "overdue"
              ? `Overdue · ${formatDate(task.dueDate)}`
              : !task.completed && status === "today"
                ? "Due today"
                : formatDate(task.dueDate)}
          </span>
          {showContact && contact && (
            <Link href={`/contacts/${contact.id}`} className="font-medium text-indigo-600 hover:underline">
              {fullName(contact)}
            </Link>
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Edit task"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
