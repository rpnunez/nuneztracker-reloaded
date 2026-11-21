import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { nid, nowIso, todayInTz } from "./id";
import { defaultTypes, sampleRecords } from "./seed";
import { BADGES, type AttachmentMeta, type Label, type ObjectField, type ObjectType, type RecordItem, type ScoreEvent, type User } from "./types";

type PushSub = { id: string; userId: string; endpoint: string; p256dh: string; auth: string };
type Attachment = AttachmentMeta & { bytes: Buffer };

type Mem = {
  users: User[];
  types: ObjectType[];
  fields: ObjectField[];
  records: RecordItem[];
  labels: Label[];
  links: { fromId: string; toId: string }[];
  attachments: Attachment[];
  push: PushSub[];
  scores: ScoreEvent[];
  badges: { userId: string; badgeId: string; earnedAt: string }[];
};

const g = globalThis as unknown as { __nt?: Mem; __ntPool?: Pool; __ntMigrated?: boolean };

function mem(): Mem {
  if (!g.__nt) {
    g.__nt = {
      users: [],
      types: [],
      fields: [],
      records: [],
      labels: [],
      links: [],
      attachments: [],
      push: [],
      scores: [],
      badges: [],
    };
  }
  return g.__nt;
}

export function usingSampleDb(): boolean {
  return !process.env.DATABASE_URL;
}

function pool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!g.__ntPool) g.__ntPool = new Pool({ connectionString: url });
  return g.__ntPool;
}

async function migrate(p: Pool) {
  if (g.__ntMigrated) return;
  const sql = readFileSync(join(process.cwd(), "migrations/001_init.sql"), "utf8");
  await p.query(sql);
  g.__ntMigrated = true;
}

function seedUser(email: string, name: string, passwordHash: string | null): User {
  const m = mem();
  const user: User = {
    id: nid(),
    email: email.toLowerCase(),
    name,
    passwordHash,
    timezone: "America/New_York",
    onboarded: false,
    checkInHours: ["09:00", "13:00", "19:00"],
    dueReminders: true,
    lastCheckinAt: null,
    points: 0,
    streak: 0,
    lastStreakDate: null,
    createdAt: nowIso(),
  };
  m.users.push(user);
  const { types, fields } = defaultTypes(user.id);
  m.types.push(...types);
  m.fields.push(...fields);
  if (usingSampleDb()) {
    m.records.push(...sampleRecords(user.id, types));
  }
  return user;
}

export async function upsertIdentityUser(email: string, name: string): Promise<User> {
  const p = pool();
  if (!p) {
    const m = mem();
    let u = m.users.find((x) => x.email === email.toLowerCase());
    if (!u) u = seedUser(email, name, null);
    else if (name && u.name !== name) u.name = name;
    return u;
  }
  await migrate(p);
  const existing = await p.query("select * from users where email=$1", [email.toLowerCase()]);
  if (existing.rows[0]) return mapUser(existing.rows[0]);
  const user = seedUser(email, name, null);
  await persistNewUser(p, user);
  return user;
}

async function persistNewUser(p: Pool, user: User) {
  await p.query(
    `insert into users (id,email,name,password_hash,timezone,onboarded,check_in_hours,due_reminders,points,streak,created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      user.id,
      user.email,
      user.name,
      user.passwordHash,
      user.timezone,
      user.onboarded,
      JSON.stringify(user.checkInHours),
      user.dueReminders,
      user.points,
      user.streak,
      user.createdAt,
    ],
  );
  const types = mem().types.filter((t) => t.userId === user.id);
  const fields = mem().fields.filter((f) => types.some((t) => t.id === f.objectTypeId));
  for (const t of types) {
    await p.query(
      `insert into object_types (id,user_id,slug,name,icon,description,builtin,archived,statuses) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [t.id, t.userId, t.slug, t.name, t.icon, t.description, t.builtin, t.archived, JSON.stringify(t.statuses)],
    );
  }
  for (const f of fields) {
    await p.query(
      `insert into object_fields (id,object_type_id,key,label,type,options,required,sort_order,builtin) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [f.id, f.objectTypeId, f.key, f.label, f.type, JSON.stringify(f.options ?? null), f.required, f.sortOrder, f.builtin],
    );
  }
}

function mapUser(r: Record<string, unknown>): User {
  return {
    id: String(r.id),
    email: String(r.email),
    name: String(r.name ?? ""),
    passwordHash: (r.password_hash as string) ?? null,
    timezone: String(r.timezone ?? "America/New_York"),
    onboarded: Boolean(r.onboarded),
    checkInHours: (r.check_in_hours as string[]) ?? ["09:00"],
    dueReminders: r.due_reminders !== false,
    lastCheckinAt: r.last_checkin_at ? new Date(r.last_checkin_at as string).toISOString() : null,
    points: Number(r.points ?? 0),
    streak: Number(r.streak ?? 0),
    lastStreakDate: r.last_streak_date ? String(r.last_streak_date).slice(0, 10) : null,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

export async function getUser(id: string): Promise<User | null> {
  const p = pool();
  if (!p) return mem().users.find((u) => u.id === id) ?? null;
  await migrate(p);
  const r = await p.query("select * from users where id=$1", [id]);
  return r.rows[0] ? mapUser(r.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const p = pool();
  if (!p) return mem().users.find((u) => u.email === email.toLowerCase()) ?? null;
  await migrate(p);
  const r = await p.query("select * from users where email=$1", [email.toLowerCase()]);
  return r.rows[0] ? mapUser(r.rows[0]) : null;
}

export async function createLocalUser(email: string, name: string, passwordHash: string): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Email already registered");
  const user = seedUser(email, name, passwordHash);
  const p = pool();
  if (p) {
    await migrate(p);
    await persistNewUser(p, user);
  }
  return user;
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User> {
  const u = await getUser(id);
  if (!u) throw new Error("User not found");
  Object.assign(u, patch);
  const m = mem();
  const i = m.users.findIndex((x) => x.id === id);
  if (i >= 0) m.users[i] = u;
  const p = pool();
  if (p) {
    await p.query(
      `update users set name=$2, timezone=$3, onboarded=$4, check_in_hours=$5, due_reminders=$6,
       last_checkin_at=$7, points=$8, streak=$9, last_streak_date=$10, password_hash=$11 where id=$1`,
      [
        id,
        u.name,
        u.timezone,
        u.onboarded,
        JSON.stringify(u.checkInHours),
        u.dueReminders,
        u.lastCheckinAt,
        u.points,
        u.streak,
        u.lastStreakDate,
        u.passwordHash,
      ],
    );
  }
  return u;
}

export async function listTypes(userId: string): Promise<ObjectType[]> {
  const p = pool();
  if (!p) return mem().types.filter((t) => t.userId === userId && !t.archived);
  const r = await p.query("select * from object_types where user_id=$1 and archived=false order by builtin desc, name", [userId]);
  return r.rows.map(mapType);
}

export async function listAllTypes(userId: string): Promise<ObjectType[]> {
  const p = pool();
  if (!p) return mem().types.filter((t) => t.userId === userId);
  const r = await p.query("select * from object_types where user_id=$1 order by name", [userId]);
  return r.rows.map(mapType);
}

function mapType(r: Record<string, unknown>): ObjectType {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    slug: String(r.slug),
    name: String(r.name),
    icon: String(r.icon ?? "box"),
    description: String(r.description ?? ""),
    builtin: Boolean(r.builtin),
    archived: Boolean(r.archived),
    statuses: (r.statuses as string[]) ?? ["open", "done"],
  };
}

export async function getTypeBySlug(userId: string, slug: string): Promise<ObjectType | null> {
  return (await listAllTypes(userId)).find((t) => t.slug === slug) ?? null;
}

export async function createType(userId: string, data: { slug: string; name: string; icon?: string; description?: string; statuses?: string[] }): Promise<ObjectType> {
  const t: ObjectType = {
    id: nid(),
    userId,
    slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: data.name,
    icon: data.icon || "box",
    description: data.description || "",
    builtin: false,
    archived: false,
    statuses: data.statuses?.length ? data.statuses : ["open", "done"],
  };
  mem().types.push(t);
  const p = pool();
  if (p) {
    await p.query(
      `insert into object_types (id,user_id,slug,name,icon,description,builtin,archived,statuses) values ($1,$2,$3,$4,$5,$6,false,false,$7)`,
      [t.id, t.userId, t.slug, t.name, t.icon, t.description, JSON.stringify(t.statuses)],
    );
  }
  return t;
}

export async function updateType(userId: string, id: string, patch: Partial<ObjectType>): Promise<ObjectType> {
  const types = await listAllTypes(userId);
  const t = types.find((x) => x.id === id);
  if (!t) throw new Error("Type not found");
  if (t.builtin) {
    delete patch.slug;
    delete patch.builtin;
  }
  Object.assign(t, patch, { id: t.id, userId, builtin: t.builtin });
  const m = mem();
  const i = m.types.findIndex((x) => x.id === id);
  if (i >= 0) m.types[i] = t;
  const p = pool();
  if (p) {
    await p.query(
      `update object_types set name=$2, icon=$3, description=$4, archived=$5, statuses=$6 where id=$1 and user_id=$7`,
      [id, t.name, t.icon, t.description, t.archived, JSON.stringify(t.statuses), userId],
    );
  }
  return t;
}

export async function listFields(objectTypeId: string): Promise<ObjectField[]> {
  const p = pool();
  if (!p) return mem().fields.filter((f) => f.objectTypeId === objectTypeId).sort((a, b) => a.sortOrder - b.sortOrder);
  const r = await p.query("select * from object_fields where object_type_id=$1 order by sort_order", [objectTypeId]);
  return r.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    objectTypeId: String(row.object_type_id),
    key: String(row.key),
    label: String(row.label),
    type: row.type as ObjectField["type"],
    options: (row.options as string[]) ?? undefined,
    required: Boolean(row.required),
    sortOrder: Number(row.sort_order ?? 0),
    builtin: Boolean(row.builtin),
  }));
}

export async function createField(objectTypeId: string, data: Omit<ObjectField, "id" | "objectTypeId" | "builtin">): Promise<ObjectField> {
  const f: ObjectField = { ...data, id: nid(), objectTypeId, builtin: false };
  mem().fields.push(f);
  const p = pool();
  if (p) {
    await p.query(
      `insert into object_fields (id,object_type_id,key,label,type,options,required,sort_order,builtin) values ($1,$2,$3,$4,$5,$6,$7,$8,false)`,
      [f.id, objectTypeId, f.key, f.label, f.type, JSON.stringify(f.options ?? null), f.required, f.sortOrder],
    );
  }
  return f;
}

export async function updateField(id: string, patch: Partial<ObjectField>): Promise<ObjectField> {
  const f = mem().fields.find((x) => x.id === id);
  if (!f) throw new Error("Field not found");
  Object.assign(f, patch, { id: f.id, objectTypeId: f.objectTypeId, builtin: f.builtin });
  const p = pool();
  if (p) {
    await p.query(
      `update object_fields set label=$2, type=$3, options=$4, required=$5, sort_order=$6 where id=$1`,
      [id, f.label, f.type, JSON.stringify(f.options ?? null), f.required, f.sortOrder],
    );
  }
  return f;
}

export async function deleteField(id: string) {
  const f = mem().fields.find((x) => x.id === id);
  if (f?.builtin) throw new Error("Cannot delete built-in field");
  mem().fields = mem().fields.filter((x) => x.id !== id);
  const p = pool();
  if (p) await p.query("delete from object_fields where id=$1 and builtin=false", [id]);
}

export async function listRecords(userId: string, objectTypeId?: string): Promise<RecordItem[]> {
  const p = pool();
  if (!p) {
    return mem()
      .records.filter((r) => r.userId === userId && (!objectTypeId || r.objectTypeId === objectTypeId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const r = objectTypeId
    ? await p.query("select * from records where user_id=$1 and object_type_id=$2 order by updated_at desc", [userId, objectTypeId])
    : await p.query("select * from records where user_id=$1 order by updated_at desc", [userId]);
  const labels = await p.query("select * from record_labels");
  const byRec = new Map<string, string[]>();
  for (const row of labels.rows) {
    const arr = byRec.get(row.record_id) ?? [];
    arr.push(row.label_id);
    byRec.set(row.record_id, arr);
  }
  return r.rows.map((row: Record<string, unknown>) => mapRecord(row, byRec.get(String(row.id)) ?? []));
}

function mapRecord(r: Record<string, unknown>, labelIds: string[]): RecordItem {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    objectTypeId: String(r.object_type_id),
    title: String(r.title),
    description: String(r.description ?? ""),
    status: String(r.status),
    folder: String(r.folder ?? ""),
    dueAt: r.due_at ? new Date(r.due_at as string).toISOString() : null,
    fieldValues: (r.field_values as Record<string, unknown>) ?? {},
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    labelIds,
  };
}

export async function getRecord(userId: string, id: string): Promise<RecordItem | null> {
  const all = await listRecords(userId);
  return all.find((r) => r.id === id) ?? null;
}

export async function createRecord(userId: string, data: Omit<RecordItem, "id" | "userId" | "createdAt" | "updatedAt" | "labelIds"> & { labelIds?: string[] }): Promise<RecordItem> {
  const rec: RecordItem = {
    ...data,
    id: nid(),
    userId,
    labelIds: data.labelIds ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  mem().records.push(rec);
  const p = pool();
  if (p) {
    await p.query(
      `insert into records (id,user_id,object_type_id,title,description,status,folder,due_at,field_values,created_at,updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [rec.id, userId, rec.objectTypeId, rec.title, rec.description, rec.status, rec.folder, rec.dueAt, JSON.stringify(rec.fieldValues), rec.createdAt, rec.updatedAt],
    );
  }
  return rec;
}

export async function updateRecord(userId: string, id: string, patch: Partial<RecordItem>): Promise<RecordItem> {
  const rec = await getRecord(userId, id);
  if (!rec) throw new Error("Not found");
  const prevStatus = rec.status;
  Object.assign(rec, patch, { id, userId, createdAt: rec.createdAt, updatedAt: nowIso() });
  const m = mem();
  const i = m.records.findIndex((x) => x.id === id);
  if (i >= 0) m.records[i] = rec;
  const p = pool();
  if (p) {
    await p.query(
      `update records set title=$2, description=$3, status=$4, folder=$5, due_at=$6, field_values=$7, updated_at=$8 where id=$1 and user_id=$9`,
      [id, rec.title, rec.description, rec.status, rec.folder, rec.dueAt, JSON.stringify(rec.fieldValues), rec.updatedAt, userId],
    );
  }
  await maybeScoreCompletion(userId, rec, prevStatus);
  return rec;
}

export async function deleteRecord(userId: string, id: string) {
  mem().records = mem().records.filter((r) => !(r.userId === userId && r.id === id));
  mem().links = mem().links.filter((l) => l.fromId !== id && l.toId !== id);
  mem().attachments = mem().attachments.filter((a) => a.recordId !== id);
  const p = pool();
  if (p) await p.query("delete from records where id=$1 and user_id=$2", [id, userId]);
}

async function maybeScoreCompletion(userId: string, rec: RecordItem, prevStatus: string) {
  const types = await listAllTypes(userId);
  const t = types.find((x) => x.id === rec.objectTypeId);
  if (!t) return;
  if (prevStatus === rec.status) return;
  if (t.slug === "tasks" && rec.status === "done") {
    const onTime = !rec.dueAt || new Date(rec.dueAt).getTime() >= Date.now() - 86400000;
    await addPoints(userId, onTime ? 10 : 5, "task-complete", rec.title);
    await bumpStreak(userId);
  }
  if (t.slug === "events" && rec.status === "done") {
    await addPoints(userId, 8, "event-complete", rec.title);
  }
}

export async function addPoints(userId: string, points: number, kind: string, note: string) {
  const ev: ScoreEvent = { id: nid(), userId, kind, points, note, createdAt: nowIso() };
  mem().scores.push(ev);
  const u = await getUser(userId);
  if (u) {
    u.points += points;
    await updateUser(userId, { points: u.points });
  }
  const p = pool();
  if (p) {
    await p.query(`insert into score_events (id,user_id,kind,points,note,created_at) values ($1,$2,$3,$4,$5,$6)`, [
      ev.id,
      userId,
      kind,
      points,
      note,
      ev.createdAt,
    ]);
  }
  await evaluateBadges(userId);
}

async function bumpStreak(userId: string) {
  const u = await getUser(userId);
  if (!u) return;
  const today = todayInTz(u.timezone);
  if (u.lastStreakDate === today) return;
  const y = new Date(today + "T12:00:00");
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  const streak = u.lastStreakDate === yesterday ? u.streak + 1 : 1;
  await updateUser(userId, { streak, lastStreakDate: today });
}

async function evaluateBadges(userId: string) {
  const u = await getUser(userId);
  if (!u) return;
  const scores = mem().scores.filter((s) => s.userId === userId);
  const taskCompletes = scores.filter((s) => s.kind === "task-complete").length;
  const onTime = scores.filter((s) => s.kind === "task-complete" && s.points >= 10).length;
  const earned = new Set(mem().badges.filter((b) => b.userId === userId).map((b) => b.badgeId));
  const grant = async (badgeId: string) => {
    if (earned.has(badgeId)) return;
    const row = { userId, badgeId, earnedAt: nowIso() };
    mem().badges.push(row);
    const p = pool();
    if (p) await p.query("insert into user_badges (user_id,badge_id,earned_at) values ($1,$2,$3) on conflict do nothing", [userId, badgeId, row.earnedAt]);
  };
  if (taskCompletes >= 1) await grant("first-task");
  if (u.streak >= 7) await grant("streak-7");
  if (taskCompletes >= 25) await grant("tasks-25");
  if (u.points >= 100) await grant("points-100");
  if (onTime >= 5) await grant("on-time-week");
}

export async function listScore(userId: string) {
  const u = await getUser(userId);
  const events = mem().scores.filter((s) => s.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const earned = mem().badges.filter((b) => b.userId === userId);
  return {
    points: u?.points ?? 0,
    streak: u?.streak ?? 0,
    events: events.slice(0, 40),
    badges: BADGES.map((b) => ({ ...b, earnedAt: earned.find((e) => e.badgeId === b.id)?.earnedAt ?? null })),
  };
}

export async function listLabels(userId: string): Promise<Label[]> {
  const p = pool();
  if (!p) return mem().labels.filter((l) => l.userId === userId);
  const r = await p.query("select * from labels where user_id=$1", [userId]);
  return r.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    color: String(row.color),
  }));
}

export async function createLabel(userId: string, name: string, color: string): Promise<Label> {
  const l: Label = { id: nid(), userId, name, color };
  mem().labels.push(l);
  const p = pool();
  if (p) await p.query("insert into labels (id,user_id,name,color) values ($1,$2,$3,$4)", [l.id, userId, name, color]);
  return l;
}

export async function listLinks(recordId: string) {
  return mem().links.filter((l) => l.fromId === recordId || l.toId === recordId);
}

export async function addLink(userId: string, fromId: string, toId: string) {
  const a = await getRecord(userId, fromId);
  const b = await getRecord(userId, toId);
  if (!a || !b) throw new Error("Record not found");
  if (fromId === toId) throw new Error("Cannot link to self");
  if (!mem().links.some((l) => (l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId))) {
    mem().links.push({ fromId, toId });
  }
  const p = pool();
  if (p) await p.query("insert into record_links (from_id,to_id) values ($1,$2) on conflict do nothing", [fromId, toId]);
}

export async function removeLink(fromId: string, toId: string) {
  mem().links = mem().links.filter(
    (l) => !((l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId)),
  );
  const p = pool();
  if (p) await p.query("delete from record_links where (from_id=$1 and to_id=$2) or (from_id=$2 and to_id=$1)", [fromId, toId]);
}

export async function addAttachment(recordId: string, filename: string, mime: string, bytes: Buffer): Promise<AttachmentMeta> {
  if (bytes.length > 2_000_000) throw new Error("File too large (2MB max)");
  const a: Attachment = { id: nid(), recordId, filename, mime, bytes, createdAt: nowIso() };
  mem().attachments.push(a);
  const p = pool();
  if (p) await p.query("insert into attachments (id,record_id,filename,mime,bytes,created_at) values ($1,$2,$3,$4,$5,$6)", [a.id, recordId, filename, mime, bytes, a.createdAt]);
  return { id: a.id, recordId, filename, mime, createdAt: a.createdAt };
}

export async function listAttachments(recordId: string): Promise<AttachmentMeta[]> {
  const p = pool();
  if (!p) return mem().attachments.filter((a) => a.recordId === recordId).map(({ bytes: _b, ...rest }) => rest);
  const r = await p.query("select id, record_id, filename, mime, created_at from attachments where record_id=$1", [recordId]);
  return r.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    recordId: String(row.record_id),
    filename: String(row.filename),
    mime: String(row.mime),
    createdAt: new Date(row.created_at as string).toISOString(),
  }));
}

export async function getAttachmentBytes(id: string): Promise<Attachment | null> {
  const p = pool();
  if (!p) return mem().attachments.find((a) => a.id === id) ?? null;
  const r = await p.query("select * from attachments where id=$1", [id]);
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: row.id,
    recordId: row.record_id,
    filename: row.filename,
    mime: row.mime,
    bytes: row.bytes as Buffer,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function savePush(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const row: PushSub = { id: nid(), userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
  mem().push = mem().push.filter((p) => !(p.userId === userId && p.endpoint === row.endpoint));
  mem().push.push(row);
  const p = pool();
  if (p) {
    await p.query(
      `insert into push_subscriptions (id,user_id,endpoint,p256dh,auth) values ($1,$2,$3,$4,$5)
       on conflict (user_id, endpoint) do update set p256dh=$4, auth=$5`,
      [row.id, userId, row.endpoint, row.p256dh, row.auth],
    );
  }
}

export async function listPush(userId: string): Promise<PushSub[]> {
  const p = pool();
  if (!p) return mem().push.filter((x) => x.userId === userId);
  const r = await p.query("select * from push_subscriptions where user_id=$1", [userId]);
  return r.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    userId: String(row.user_id),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
  }));
}

export async function todayBundle(userId: string) {
  const u = await getUser(userId);
  if (!u) throw new Error("no user");
  const types = await listAllTypes(userId);
  const records = await listRecords(userId);
  const today = todayInTz(u.timezone);
  const isToday = (iso: string | null) => iso && iso.slice(0, 10) === today;
  const tasks = types.find((t) => t.slug === "tasks");
  const events = types.find((t) => t.slug === "events");
  const dueTasks = records.filter((r) => r.objectTypeId === tasks?.id && r.status !== "done" && isToday(r.dueAt));
  const overdue = records.filter((r) => r.objectTypeId === tasks?.id && r.status !== "done" && r.dueAt && r.dueAt.slice(0, 10) < today);
  const todayEvents = records.filter((r) => r.objectTypeId === events?.id && r.status === "upcoming" && (isToday(r.dueAt) || isToday(String(r.fieldValues.starts_at ?? ""))));
  const score = await listScore(userId);
  const { passwordHash: _ph, ...safe } = u;
  return { user: safe, types, dueTasks, overdue, todayEvents, score, sample: usingSampleDb() };
}
