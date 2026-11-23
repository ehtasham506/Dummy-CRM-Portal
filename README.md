# Dummy CRM Portal

A demo CRM for learning and demonstrating CRM functionality. Built with Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS 4.

All data is fictional and stored in the browser's `localStorage`. No external CRM, API or database is connected.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## Features

- **Dashboard**: total contacts, new leads, active clients, open tasks, stage breakdown, upcoming follow-ups, recent activities
- **Contacts**: search, filter (stage / owner / source / new leads), sort, pagination, bulk stage change and delete, CSV export
- **Contact details**: info, clickable lifecycle stage, notes, tasks, activity timeline, and buttons to log emails, calls and meetings
- **Pipeline**: kanban grouped by lifecycle stage. Move a contact by dragging its card or with the dropdown on the card
- **Tasks**: open / overdue / today / upcoming / completed views, plus create, edit, complete and delete
- **Settings**: reset sample data, clear all data, and export or import a JSON backup

Lifecycle stages: Subscriber → Engaged → Hot → In Conversation → Client, plus Dormant and Do Not Contact.

## Structure

```
src/app/            pages (dashboard, contacts, contacts/[id], pipeline, tasks, settings)
src/components/     AppShell (sidebar/header/toasts), forms, shared UI
src/lib/store.tsx   CRM state and localStorage persistence
src/lib/seed.ts     fictional demo data
```
