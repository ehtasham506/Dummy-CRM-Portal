import type { Activity, Contact, LeadSource, LifecycleStage, Task, TaskPriority, TaskType } from "./types";
import { toDateKey } from "./utils";

/**
 * All data below is fictional. Names, companies, emails (example.com-style domains)
 * and 555 phone numbers are invented for demo purposes only.
 */

type SeedContact = [
  first: string,
  last: string,
  company: string,
  domain: string,
  title: string,
  stage: LifecycleStage,
  source: LeadSource,
  owner: string,
  value: number,
  createdDaysAgo: number,
  lastContactDaysAgo: number | null,
  note: string,
];

const SEED_CONTACTS: SeedContact[] = [
  ["Olivia", "Bennett", "Northwind Analytics", "northwind-demo.com", "VP of Operations", "Client", "Referral", "Alex Morgan", 48000, 210, 3, "Renewed annual plan in Q3. Interested in the analytics add-on."],
  ["Marcus", "Chen", "Bluepeak Logistics", "bluepeak-demo.com", "Head of IT", "In Conversation", "LinkedIn", "Jordan Lee", 32000, 45, 2, "Evaluating against two competitors. Decision expected end of month."],
  ["Sofia", "Ramirez", "Lumen Health Partners", "lumenhealth-demo.com", "Practice Manager", "Hot", "Webinar", "Priya Shah", 18500, 12, 1, "Attended the onboarding webinar and requested pricing."],
  ["Ethan", "Walsh", "Copperline Studios", "copperline-demo.com", "Creative Director", "Engaged", "Website", "Sam Carter", 7500, 20, 9, "Downloaded the case study pack twice."],
  ["Hannah", "Okafor", "Greenfield Supply Co.", "greenfield-demo.com", "Procurement Lead", "Subscriber", "Newsletter", "Alex Morgan", 0, 6, null, "Signed up via the monthly newsletter."],
  ["Liam", "Novak", "Summit Ridge Realty", "summitridge-demo.com", "Broker", "Client", "Trade Show", "Jordan Lee", 22000, 340, 14, "Long-term client. Prefers phone calls over email."],
  ["Ava", "Fitzgerald", "Brightwave Media", "brightwave-demo.com", "Marketing Manager", "Hot", "Referral", "Priya Shah", 15000, 9, 2, "Referred by Olivia Bennett. Wants a demo next week."],
  ["Noah", "Patel", "Ironclad Manufacturing", "ironclad-demo.com", "Plant Director", "Dormant", "Cold Outreach", "Sam Carter", 0, 400, 160, "Went quiet after budget freeze. Re-check in Q1."],
  ["Mia", "Kowalski", "Tidewater Finance", "tidewater-demo.com", "CFO", "In Conversation", "LinkedIn", "Alex Morgan", 56000, 60, 4, "Legal review of the contract in progress."],
  ["Lucas", "Moreau", "Orchard Lane Foods", "orchardlane-demo.com", "Owner", "Engaged", "Website", "Jordan Lee", 4200, 15, 7, "Opened last three campaign emails."],
  ["Isabella", "Grant", "Crescent Dental Group", "crescentdental-demo.com", "Office Manager", "Client", "Webinar", "Priya Shah", 12800, 180, 21, "Uses the scheduling module heavily."],
  ["James", "Holloway", "Redstone Consulting", "redstone-demo.com", "Managing Partner", "Do Not Contact", "Cold Outreach", "Sam Carter", 0, 260, 200, "Requested removal from all communications."],
  ["Charlotte", "Nguyen", "Vertex Robotics", "vertexrobotics-demo.com", "Product Lead", "Subscriber", "Website", "Alex Morgan", 0, 3, null, "Subscribed from the product blog."],
  ["Benjamin", "Adeyemi", "Harborview Hotels", "harborview-demo.com", "General Manager", "Hot", "Trade Show", "Jordan Lee", 27500, 18, 3, "Met at the hospitality expo. Strong fit."],
  ["Amelia", "Svensson", "Pinecrest Academy", "pinecrest-demo.edu", "Administrator", "Engaged", "Webinar", "Priya Shah", 6000, 25, 11, "Asked about education discounts."],
  ["Henry", "Castillo", "Silverline Transport", "silverline-demo.com", "Fleet Manager", "Client", "Referral", "Sam Carter", 39000, 290, 8, "Expanding to two new depots next year."],
  ["Grace", "Whitaker", "Meadowbrook Clinics", "meadowbrook-demo.com", "Director of Operations", "In Conversation", "Website", "Alex Morgan", 21000, 33, 5, "Needs HIPAA documentation before signing."],
  ["Daniel", "Kim", "Quantum Leaf Software", "quantumleaf-demo.com", "CTO", "Dormant", "LinkedIn", "Jordan Lee", 0, 380, 120, "Paused evaluation; team restructure."],
  ["Chloe", "Dubois", "Atlas Interiors", "atlasinteriors-demo.com", "Founder", "Subscriber", "Newsletter", "Priya Shah", 0, 2, null, "New newsletter subscriber."],
  ["Samuel", "Reyes", "Keystone Builders", "keystone-demo.com", "Project Manager", "Engaged", "Trade Show", "Sam Carter", 9000, 28, 13, "Collected brochure at the construction fair."],
  ["Zoe", "Hartmann", "Coral Bay Resorts", "coralbay-demo.com", "Head of Guest Experience", "Hot", "Website", "Alex Morgan", 19500, 7, 1, "Booked a discovery call through the website."],
  ["Owen", "Fraser", "Granite State Insurance", "granitestate-demo.com", "Claims Director", "Client", "Cold Outreach", "Jordan Lee", 61000, 450, 30, "Largest account in the region."],
  ["Layla", "Haddad", "Sunflower Organics", "sunflower-demo.com", "E-commerce Lead", "In Conversation", "Referral", "Priya Shah", 14000, 40, 6, "Sent revised proposal with 3-year option."],
  ["Jack", "O'Connell", "Falcon Security", "falconsecurity-demo.com", "Operations Manager", "Subscriber", "Website", "Sam Carter", 0, 10, null, "Signed up for product updates."],
];

type SeedTask = [
  title: string,
  type: TaskType,
  priority: TaskPriority,
  dueOffsetDays: number,
  contactIndex: number | null,
  completed: boolean,
  description: string,
];

const SEED_TASKS: SeedTask[] = [
  ["Send pricing proposal", "Email", "High", 0, 2, false, "Include the multi-location discount."],
  ["Discovery call with Zoe", "Call", "High", 1, 20, false, "Walk through guest experience use cases."],
  ["Contract review follow-up", "Follow-up", "High", -1, 8, false, "Check on legal comments from Tidewater."],
  ["Product demo for Brightwave", "Meeting", "Medium", 3, 6, false, "Prepare marketing workflow demo."],
  ["Share HIPAA documentation", "Email", "High", -2, 16, false, "Send compliance pack and security overview."],
  ["Quarterly business review", "Meeting", "Medium", 7, 0, false, "Review usage stats and upsell analytics add-on."],
  ["Check in after expo", "Follow-up", "Medium", 2, 13, false, "Follow up on hotel group requirements."],
  ["Send education discount info", "Email", "Low", 4, 14, false, ""],
  ["Re-engagement email", "Email", "Low", 14, 7, false, "Try again after budget cycle."],
  ["Update CRM pipeline report", "To-do", "Low", 5, null, false, "Prepare weekly summary for the team."],
  ["Renewal call", "Call", "Medium", -5, 5, true, "Confirmed renewal for another year."],
  ["Send welcome pack", "Email", "Low", -3, 15, true, "Onboarding materials sent."],
  ["Proposal revision", "Follow-up", "High", -1, 22, true, "3-year option added."],
];

export function buildSeedData(): { contacts: Contact[]; tasks: Task[]; activities: Activity[] } {
  const now = Date.now();
  const day = 86_400_000;
  const iso = (daysAgo: number, hourOffset = 0) =>
    new Date(now - daysAgo * day - hourOffset * 3_600_000).toISOString();

  const contacts: Contact[] = SEED_CONTACTS.map((s, i) => {
    const [first, last, company, domain, title, stage, source, owner, value, created, lastContact, note] = s;
    const local = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
    return {
      id: `c_seed${String(i + 1).padStart(2, "0")}`,
      firstName: first,
      lastName: last,
      email: `${local}@${domain}`,
      phone: `(555) ${String(200 + i * 17).padStart(3, "0")}-${String(1000 + i * 263).slice(-4)}`,
      company,
      jobTitle: title,
      stage,
      source,
      owner,
      dealValue: value,
      notes: [{ id: `n_seed${i + 1}`, content: note, createdAt: iso(Math.max(created - 1, 0), 2) }],
      createdAt: iso(created),
      updatedAt: iso(lastContact ?? created),
      lastContactedAt: lastContact === null ? null : iso(lastContact, 1),
    };
  });

  const tasks: Task[] = SEED_TASKS.map((t, i) => {
    const [title, type, priority, offset, cIdx, completed, description] = t;
    return {
      id: `t_seed${String(i + 1).padStart(2, "0")}`,
      title,
      description,
      type,
      priority,
      dueDate: toDateKey(new Date(now + offset * day)),
      completed,
      contactId: cIdx === null ? null : contacts[cIdx].id,
      createdAt: iso(Math.abs(offset) + 3),
      completedAt: completed ? iso(Math.abs(offset)) : null,
    };
  });

  const a = (
    type: Activity["type"],
    description: string,
    cIdx: number | null,
    daysAgo: number,
    hrs = 0,
  ): Activity => ({
    id: `a_seed${Math.random().toString(36).slice(2, 9)}`,
    type,
    description,
    contactId: cIdx === null ? null : contacts[cIdx].id,
    timestamp: iso(daysAgo, hrs),
  });

  const activities: Activity[] = [
    a("stage_changed", "Zoe Hartmann moved from Engaged to Hot", 20, 0, 2),
    a("call_logged", "Logged a call with Sofia Ramirez (12 min)", 2, 0, 5),
    a("email_sent", "Sent follow-up email to Marcus Chen", 1, 1, 1),
    a("contact_created", "Chloe Dubois was added as a Subscriber", 18, 2),
    a("meeting_held", "Product walkthrough with Ava Fitzgerald", 6, 2, 4),
    a("task_completed", "Completed task: Proposal revision", 22, 1, 3),
    a("contact_created", "Charlotte Nguyen was added as a Subscriber", 12, 3),
    a("note_added", "Note added to Benjamin Adeyemi", 13, 3, 6),
    a("stage_changed", "Mia Kowalski moved from Hot to In Conversation", 8, 4),
    a("task_completed", "Completed task: Send welcome pack", 15, 3, 2),
    a("email_sent", "Sent renewal reminder to Liam Novak", 5, 5),
    a("task_completed", "Completed task: Renewal call", 5, 5, 3),
  ];

  return { contacts, tasks, activities };
}
