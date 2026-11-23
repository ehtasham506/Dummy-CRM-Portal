"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCRM } from "@/lib/store";
import {
  LEAD_SOURCES,
  LIFECYCLE_STAGES,
  SALES_REPS,
  type Contact,
  type ContactInput,
  type LifecycleStage,
} from "@/lib/types";
import { fullName } from "@/lib/utils";
import { Button, Field, inputClass, Modal } from "./ui";

const EMPTY: ContactInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  stage: "Subscriber",
  source: "Website",
  owner: SALES_REPS[0],
  dealValue: 0,
  initialNote: "",
};

type Errors = Partial<Record<keyof ContactInput, string>>;

function validate(v: ContactInput, contacts: Contact[], editingId?: string): Errors {
  const e: Errors = {};
  if (!v.firstName.trim()) e.firstName = "First name is required";
  if (!v.lastName.trim()) e.lastName = "Last name is required";
  if (!v.email.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Enter a valid email address";
  else if (
    contacts.some((c) => c.id !== editingId && c.email.toLowerCase() === v.email.trim().toLowerCase())
  )
    e.email = "A contact with this email already exists";
  if (v.phone && !/^[\d\s()+.-]{7,20}$/.test(v.phone.trim())) e.phone = "Enter a valid phone number";
  if (Number.isNaN(v.dealValue) || v.dealValue < 0) e.dealValue = "Must be 0 or more";
  return e;
}

export function ContactFormModal({
  open,
  onClose,
  contact,
  defaultStage,
}: {
  open: boolean;
  onClose: () => void;
  contact?: Contact;
  defaultStage?: LifecycleStage;
}) {
  const { addContact, updateContact, contacts, notify } = useCRM();
  const router = useRouter();
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (contact) {
      setValues({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobTitle: contact.jobTitle,
        stage: contact.stage,
        source: contact.source,
        owner: contact.owner,
        dealValue: contact.dealValue,
      });
    } else {
      setValues({ ...EMPTY, stage: defaultStage ?? EMPTY.stage });
    }
  }, [open, contact, defaultStage]);

  const set = <K extends keyof ContactInput>(key: K, val: ContactInput[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values, contacts, contact?.id);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const clean: ContactInput = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      company: values.company.trim(),
      jobTitle: values.jobTitle.trim(),
    };
    if (contact) {
      updateContact(contact.id, clean);
      notify(`${fullName(clean)} updated`);
      onClose();
    } else {
      const created = addContact(clean);
      notify(`${fullName(created)} added to contacts`);
      onClose();
      router.push(`/contacts/${created.id}`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={contact ? "Edit contact" : "New contact"}
      description={contact ? `Update details for ${fullName(contact)}` : "Add a new person to your CRM"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="contact-form">
            {contact ? "Save changes" : "Create contact"}
          </Button>
        </>
      }
    >
      <form id="contact-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          <input
            className={inputClass}
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Last name" required error={errors.lastName}>
          <input className={inputClass} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input
            type="email"
            className={inputClass}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@company-demo.com"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            type="tel"
            className={inputClass}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </Field>
        <Field label="Company">
          <input className={inputClass} value={values.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field label="Job title">
          <input className={inputClass} value={values.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </Field>
        <Field label="Lifecycle stage">
          <select
            className={inputClass}
            value={values.stage}
            onChange={(e) => set("stage", e.target.value as LifecycleStage)}
          >
            {LIFECYCLE_STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Lead source">
          <select
            className={inputClass}
            value={values.source}
            onChange={(e) => set("source", e.target.value as ContactInput["source"])}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <select className={inputClass} value={values.owner} onChange={(e) => set("owner", e.target.value)}>
            {SALES_REPS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Potential deal value (USD)" error={errors.dealValue}>
          <input
            type="number"
            min={0}
            step={100}
            className={inputClass}
            value={Number.isNaN(values.dealValue) ? "" : values.dealValue}
            onChange={(e) => set("dealValue", e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
        {!contact && (
          <Field label="Initial note" className="sm:col-span-2">
            <textarea
              rows={3}
              className={inputClass}
              value={values.initialNote}
              onChange={(e) => set("initialNote", e.target.value)}
              placeholder="How did you meet? What are they interested in?"
            />
          </Field>
        )}
      </form>
    </Modal>
  );
}
