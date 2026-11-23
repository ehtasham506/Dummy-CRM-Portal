"use client";

import { ArrowRight, Briefcase, CheckSquare, Plus, TrendingUp, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskItem } from "@/components/TaskItem";
import { Avatar, Button, Card, EmptyState, LinkButton, LoadingScreen, PageHeader, StageBadge } from "@/components/ui";
import { useCRM } from "@/lib/store";
import { LIFECYCLE_STAGES } from "@/lib/types";
import { cn, formatCurrency, fullName, STAGE_STYLES, timeAgo, todayKey } from "@/lib/utils";

const DAY = 86_400_000;
const LEAD_STAGES = ["Subscriber", "Engaged", "Hot"];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof Users;
  accent: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="p-5 transition-shadow group-hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          </div>
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accent)}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-500">{sub}</p>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { contacts, tasks, activities, ready } = useCRM();
  const [taskOpen, setTaskOpen] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const newLeads = contacts.filter(
      (c) => LEAD_STAGES.includes(c.stage) && now - new Date(c.createdAt).getTime() <= 30 * DAY,
    );
    const newThisWeek = contacts.filter((c) => now - new Date(c.createdAt).getTime() <= 7 * DAY).length;
    const clients = contacts.filter((c) => c.stage === "Client");
    const pipeline = contacts
      .filter((c) => ["Engaged", "Hot", "In Conversation"].includes(c.stage))
      .reduce((s, c) => s + c.dealValue, 0);
    const clientRevenue = clients.reduce((s, c) => s + c.dealValue, 0);
    const today = todayKey();
    const open = tasks.filter((t) => !t.completed);
    const overdue = open.filter((t) => t.dueDate < today).length;
    const byStage = LIFECYCLE_STAGES.map((s) => ({
      stage: s,
      count: contacts.filter((c) => c.stage === s).length,
    }));
    return { newLeads, newThisWeek, clients, pipeline, clientRevenue, open, overdue, byStage };
  }, [contacts, tasks]);

  const upcoming = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5),
    [tasks],
  );
  const recentContacts = useMemo(
    () => [...contacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [contacts],
  );

  if (!ready) return <LoadingScreen />;

  const maxStage = Math.max(1, ...stats.byStage.map((s) => s.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your contacts, leads and follow-ups."
        actions={
          <>
            <Button variant="secondary" onClick={() => setTaskOpen(true)}>
              <Plus className="h-4 w-4" /> New task
            </Button>
            <LinkButton href="/pipeline">
              View pipeline <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total contacts"
          value={contacts.length}
          sub={`${stats.newThisWeek} added in the last 7 days`}
          icon={Users}
          accent="bg-indigo-50 text-indigo-600"
          href="/contacts"
        />
        <StatCard
          label="New leads"
          value={stats.newLeads.length}
          sub="Subscriber, Engaged & Hot · last 30 days"
          icon={UserPlus}
          accent="bg-orange-50 text-orange-600"
          href="/contacts?new=1"
        />
        <StatCard
          label="Active clients"
          value={stats.clients.length}
          sub={`${formatCurrency(stats.clientRevenue)} in client value`}
          icon={Briefcase}
          accent="bg-emerald-50 text-emerald-600"
          href="/contacts?stage=Client"
        />
        <StatCard
          label="Open tasks"
          value={stats.open.length}
          sub={stats.overdue > 0 ? `${stats.overdue} overdue — needs attention` : "Nothing overdue 🎉"}
          icon={CheckSquare}
          accent="bg-rose-50 text-rose-600"
          href="/tasks"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Contacts by lifecycle stage</h2>
              <p className="text-xs text-slate-500">Click a stage to see those contacts</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Open pipeline <span className="font-semibold text-slate-900">{formatCurrency(stats.pipeline)}</span>
            </div>
          </div>
          <div className="space-y-3 px-5 py-5">
            {stats.byStage.map(({ stage, count }) => (
              <Link
                key={stage}
                href={`/contacts?stage=${encodeURIComponent(stage)}`}
                className="group grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3"
              >
                <span className="truncate text-sm text-slate-600 group-hover:text-slate-900">{stage}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={cn("block h-full rounded-full transition-all", STAGE_STYLES[stage].bar)}
                    style={{ width: `${(count / maxStage) * 100}%` }}
                  />
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-slate-900">{count}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent activities</h2>
          </div>
          <div className="max-h-[22rem] overflow-y-auto scrollbar-thin">
            <ActivityFeed activities={activities} limit={8} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming follow-ups</h2>
            <Link href="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="h-5 w-5" />}
              title="All caught up"
              message="You have no open tasks. Create one to schedule a follow-up."
              action={<Button onClick={() => setTaskOpen(true)}>New task</Button>}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((t) => (
                <TaskItem key={t.id} task={t} compact />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recently added</h2>
            <Link href="/contacts" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              All contacts
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <EmptyState icon={<Users className="h-5 w-5" />} title="No contacts" message="Add your first contact." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentContacts.map((c) => (
                <li key={c.id}>
                  <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{fullName(c)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.company} · {timeAgo(c.createdAt)}
                      </p>
                    </div>
                    <StageBadge stage={c.stage} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <TaskFormModal open={taskOpen} onClose={() => setTaskOpen(false)} />
    </>
  );
}
