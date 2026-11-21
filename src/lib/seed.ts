import { nid, nowIso } from "./id";
import type { ObjectField, ObjectType, RecordItem } from "./types";

export function defaultTypes(userId: string): {
  types: ObjectType[];
  fields: ObjectField[];
} {
  const notes: ObjectType = {
    id: nid(),
    userId,
    slug: "notes",
    name: "Notes",
    icon: "sticky-note",
    description: "Ideas, references, and writing linked to work.",
    builtin: true,
    archived: false,
    statuses: ["inbox", "active", "archived"],
  };
  const tasks: ObjectType = {
    id: nid(),
    userId,
    slug: "tasks",
    name: "Tasks",
    icon: "check-square",
    description: "Work you intend to finish.",
    builtin: true,
    archived: false,
    statuses: ["todo", "doing", "done", "blocked"],
  };
  const events: ObjectType = {
    id: nid(),
    userId,
    slug: "events",
    name: "Events",
    icon: "calendar",
    description: "Calendar commitments.",
    builtin: true,
    archived: false,
    statuses: ["upcoming", "done", "skipped"],
  };

  const fields: ObjectField[] = [
    {
      id: nid(),
      objectTypeId: tasks.id,
      key: "priority",
      label: "Priority",
      type: "select",
      options: ["low", "medium", "high"],
      required: false,
      sortOrder: 0,
      builtin: true,
    },
    {
      id: nid(),
      objectTypeId: events.id,
      key: "starts_at",
      label: "Starts",
      type: "datetime",
      required: false,
      sortOrder: 0,
      builtin: true,
    },
    {
      id: nid(),
      objectTypeId: events.id,
      key: "ends_at",
      label: "Ends",
      type: "datetime",
      required: false,
      sortOrder: 1,
      builtin: true,
    },
    {
      id: nid(),
      objectTypeId: events.id,
      key: "location",
      label: "Location",
      type: "text",
      required: false,
      sortOrder: 2,
      builtin: true,
    },
  ];

  return { types: [notes, tasks, events], fields };
}

export function sampleRecords(
  userId: string,
  types: ObjectType[],
): RecordItem[] {
  const t = (slug: string) => types.find((x) => x.slug === slug)!;
  const n = nowIso();
  const today = new Date();
  const later = new Date(today.getTime() + 4 * 3600_000).toISOString();
  const tomorrow = new Date(today.getTime() + 26 * 3600_000).toISOString();
  return [
    {
      id: nid(),
      userId,
      objectTypeId: t("tasks").id,
      title: "Review today's plan",
      description: "Sample data — pick three things that actually matter today.",
      status: "todo",
      folder: "Daily",
      dueAt: today.toISOString(),
      fieldValues: { priority: "high" },
      createdAt: n,
      updatedAt: n,
      labelIds: [],
    },
    {
      id: nid(),
      userId,
      objectTypeId: t("tasks").id,
      title: "Inbox zero for notes",
      description: "File or link anything sitting in Notes inbox.",
      status: "todo",
      folder: "Weekly",
      dueAt: tomorrow,
      fieldValues: { priority: "medium" },
      createdAt: n,
      updatedAt: n,
      labelIds: [],
    },
    {
      id: nid(),
      userId,
      objectTypeId: t("notes").id,
      title: "Why this week matters",
      description:
        "Write the outcome you want by Friday. Link it to the tasks that get you there.",
      status: "inbox",
      folder: "Planning",
      dueAt: null,
      fieldValues: {},
      createdAt: n,
      updatedAt: n,
      labelIds: [],
    },
    {
      id: nid(),
      userId,
      objectTypeId: t("events").id,
      title: "Focus block",
      description: "Protected time. Treat it like a meeting with yourself.",
      status: "upcoming",
      folder: "Calendar",
      dueAt: later,
      fieldValues: { starts_at: later, location: "Desk" },
      createdAt: n,
      updatedAt: n,
      labelIds: [],
    },
  ];
}
