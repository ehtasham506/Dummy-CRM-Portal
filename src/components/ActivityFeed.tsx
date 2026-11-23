"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  PlusCircle,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
  Activity as ActivityIcon,
} from "lucide-react";
import Link from "next/link";
import type { Activity, ActivityType } from "@/lib/types";
import { useCRM } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";
import { EmptyState } from "./ui";

const META: Record<ActivityType, { icon: typeof Mail; color: string }> = {
  contact_created: { icon: UserPlus, color: "bg-emerald-100 text-emerald-600" },
  contact_updated: { icon: Pencil, color: "bg-slate-100 text-slate-600" },
  contact_deleted: { icon: Trash2, color: "bg-rose-100 text-rose-600" },
  stage_changed: { icon: ArrowRightLeft, color: "bg-violet-100 text-violet-600" },
  note_added: { icon: MessageSquareText, color: "bg-amber-100 text-amber-600" },
  task_created: { icon: PlusCircle, color: "bg-sky-100 text-sky-600" },
  task_completed: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600" },
  task_reopened: { icon: RotateCcw, color: "bg-slate-100 text-slate-600" },
  task_deleted: { icon: Trash2, color: "bg-rose-100 text-rose-600" },
  email_sent: { icon: Mail, color: "bg-blue-100 text-blue-600" },
  call_logged: { icon: Phone, color: "bg-indigo-100 text-indigo-600" },
  meeting_held: { icon: Users, color: "bg-fuchsia-100 text-fuchsia-600" },
};

export function ActivityFeed({ activities, limit }: { activities: Activity[]; limit?: number }) {
  const { getContact } = useCRM();
  const items = limit ? activities.slice(0, limit) : activities;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon className="h-5 w-5" />}
        title="No activity yet"
        message="Actions like adding contacts, notes or completing tasks will show up here."
      />
    );
  }

  return (
    <ul className="px-4 py-2">
      {items.map((a, i) => {
        const { icon: Icon, color } = META[a.type] ?? META.contact_updated;
        const contact = a.contactId ? getContact(a.contactId) : undefined;
        return (
          <li key={a.id} className="relative flex gap-3 py-2.5">
            {i < items.length - 1 && (
              <span className="absolute left-4 top-11 -bottom-1 w-px bg-slate-200" aria-hidden />
            )}
            <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full", color)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm text-slate-700">
                {contact ? (
                  <Link href={`/contacts/${contact.id}`} className="hover:text-indigo-600 hover:underline">
                    {a.description}
                  </Link>
                ) : (
                  a.description
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{timeAgo(a.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
