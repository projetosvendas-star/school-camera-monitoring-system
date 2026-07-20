import {
  pgTable,
  varchar,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "tecnico_monitoramento",
  "tatico",
  "administrativo",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "aberto",
  "em_analise",
  "fechado",
  "aguardando",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "baixa",
  "media",
  "alta",
  "critica",
]);

export const cameraStatusEnum = pgEnum("camera_status", [
  "online",
  "offline",
  "manutencao",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Schools ──────────────────────────────────────────────────────────────────
export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // CEI, CEM, EM, ERM, etc.
  address: text("address"),
  contact: varchar("contact", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Cameras ──────────────────────────────────────────────────────────────────
export const cameras = pgTable("cameras", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  ip: varchar("ip", { length: 50 }),
  status: cameraStatusEnum("status").default("online").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  cameraId: uuid("camera_id").references(() => cameras.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default("aberto").notNull(),
  priority: ticketPriorityEnum("priority").default("media").notNull(),
  openedBy: uuid("opened_by")
    .references(() => users.id)
    .notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  closedBy: uuid("closed_by").references(() => users.id),
  taticoParecer: text("tatico_parecer"),
  adminParecer: text("admin_parecer"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Daily Reports ────────────────────────────────────────────────────────────
export const dailyReports = pgTable("daily_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  technicianId: uuid("technician_id")
    .references(() => users.id)
    .notNull(),
  reportDate: timestamp("report_date").notNull(),
  isNormal: boolean("is_normal").default(true).notNull(),
  observations: text("observations"),
  camerasOnline: integer("cameras_online").default(0).notNull(),
  camerasOffline: integer("cameras_offline").default(0).notNull(),
  camerasMaintenance: integer("cameras_maintenance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Ticket History ───────────────────────────────────────────────────────────
export const ticketHistory = pgTable("ticket_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id")
    .references(() => tickets.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  comment: text("comment"),
  previousStatus: ticketStatusEnum("previous_status"),
  newStatus: ticketStatusEnum("new_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
