"use client";

import { Database, Download, RotateCcw, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button, Card, ConfirmDialog, LoadingScreen, PageHeader, StageBadge } from "@/components/ui";
import { useCRM } from "@/lib/store";
import { LIFECYCLE_STAGES } from "@/lib/types";
import { todayKey } from "@/lib/utils";

const STAGE_DESCRIPTIONS: Record<(typeof LIFECYCLE_STAGES)[number], string> = {
  Subscriber: "Opted in to content (e.g. newsletter) but hasn't shown buying intent yet.",
  Engaged: "Interacting with content: opening emails, downloading resources, attending webinars.",
  Hot: "Showing strong buying signals such as pricing requests or demo bookings.",
  "In Conversation": "Actively talking with sales — proposals, negotiations or evaluations in progress.",
  Client: "Paying customer with an active relationship.",
  Dormant: "Previously active but has gone quiet. Candidate for re-engagement.",
  "Do Not Contact": "Has asked not to be contacted. Outreach must stop.",
};

export default function SettingsPage() {
  const { ready, contacts, tasks, activities, resetDemoData, clearAllData, notify } = useCRM();
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!ready) return <LoadingScreen />;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ contacts, tasks, activities }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dummy-crm-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Backup downloaded");
  };

  const importJSON = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.contacts) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.activities)) {
        throw new Error("Invalid file");
      }
      localStorage.setItem("dummy-crm-portal:v1", JSON.stringify(parsed));
      window.location.reload();
    } catch {
      notify("That file is not a valid CRM backup", "error");
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage the demo data stored in this browser." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Demo data</h2>
              <p className="text-xs text-slate-500">Saved in your browser&apos;s local storage only</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["Contacts", contacts.length],
              ["Tasks", tasks.length],
              ["Activities", activities.length],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportJSON}>
              <Download className="h-4 w-4" /> Export backup
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import backup
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJSON} />
            <Button variant="secondary" onClick={() => setConfirm("reset")}>
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </Button>
            <Button variant="danger" onClick={() => setConfirm("clear")}>
              <Trash2 className="h-4 w-4" /> Clear all data
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">About this portal</h2>
              <p className="text-xs text-slate-500">For learning and demonstration</p>
            </div>
          </div>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>All people, companies, emails and phone numbers are fictional.</li>
            <li>No external CRM, API or database is connected.</li>
            <li>Data persists in this browser until you clear it or reset it here.</li>
            <li>Changes sync across open tabs of this portal automatically.</li>
          </ul>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Lifecycle stages</h2>
          <p className="text-xs text-slate-500">How contacts progress through the CRM</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {LIFECYCLE_STAGES.map((s, i) => (
              <li key={s} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-6 text-xs font-semibold text-slate-400">{i + 1}</span>
                <span className="sm:w-40">
                  <StageBadge stage={s} />
                </span>
                <span className="flex-1 text-sm text-slate-600">{STAGE_DESCRIPTIONS[s]}</span>
                <span className="text-xs text-slate-400">
                  {contacts.filter((c) => c.stage === s).length} contacts
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        title="Reset demo data?"
        message="This replaces all current contacts, tasks and activities with the original sample data."
        confirmLabel="Reset data"
        onConfirm={() => {
          resetDemoData();
          notify("Demo data restored");
        }}
      />
      <ConfirmDialog
        open={confirm === "clear"}
        onClose={() => setConfirm(null)}
        title="Clear all data?"
        message="This permanently removes every contact, task and activity from this browser. You can restore the sample data later with Reset."
        confirmLabel="Clear everything"
        onConfirm={() => {
          clearAllData();
          notify("All data cleared", "info");
        }}
      />
    </>
  );
}
