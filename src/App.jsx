import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BUILD_MARKER = "SHHP_SIGNUP_SAVE_CERTIFICATES_V29";
const ADMIN_USERNAME = "shhp.admin";
const ADMIN_PASSWORD = "$winis1971!";

const VALID_PAGES = ["home", "apply", "student", "parent", "admin", "about", "why", "tier", "contact"];
const PAGE_TO_PATH = {
  home: "/",
  apply: "/apply",
  student: "/student",
  parent: "/parent",
  admin: "/admin",
  about: "/about",
  why: "/why-join",
  tier: "/tier-system",
  contact: "/contact",
};
const PATH_TO_PAGE = {
  "/": "home",
  "/index.html": "home",
  "/apply": "apply",
  "/student": "student",
  "/parent": "parent",
  "/admin": "admin",
  "/about": "about",
  "/why-join": "why",
  "/tier-system": "tier",
  "/contact": "contact",
};

function cleanPathname(pathname) {
  if (!pathname) return "/";
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
}

function pageFromUrl() {
  if (typeof window === "undefined") return "home";
  return PATH_TO_PAGE[cleanPathname(window.location.pathname)] || "home";
}

function pathForPage(page) {
  return PAGE_TO_PATH[VALID_PAGES.includes(page) ? page : "home"] || "/";
}

function updateBrowserUrl(page, replace = false) {
  if (typeof window === "undefined") return;
  const safePage = VALID_PAGES.includes(page) ? page : "home";
  const nextPath = pathForPage(safePage);
  const currentPath = cleanPathname(window.location.pathname);
  if (currentPath === nextPath) return;
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ page: safePage }, "", nextPath);
}

const SUPABASE_URL = "https://irnzwpwbodsoahqgicrd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlybnp3cHdib2Rzb2FocWdpY3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzIyOTYsImV4cCI6MjA5NTQwODI5Nn0.qM2uPq01uXnqY3JNSpkC86n8vlXK2MIEcekvbXkHih0";
const SUPABASE_ENABLED = true;

async function sbRequest(table, { method = "GET", query = "", body, prefer = "return=representation" } = {}) {
  if (!SUPABASE_ENABLED) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} ${method} failed: ${text}`);
  }

  if (response.status === 204) return [];
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

async function sbSelect(table, query = "?select=*") {
  return sbRequest(table, { query });
}

async function sbUpsert(table, rows, conflict = "id") {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return sbRequest(table, {
    method: "POST",
    query: `?on_conflict=${conflict}`,
    body: rows,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function sbDeleteById(table, id) {
  if (!id) return [];
  return sbRequest(table, {
    method: "DELETE",
    query: `?id=eq.${encodeURIComponent(id)}`,
    prefer: "return=minimal",
  });
}

async function sbDeleteWhere(table, column, value) {
  if (!column || value === undefined || value === null) return [];
  return sbRequest(table, {
    method: "DELETE",
    query: `?${column}=eq.${encodeURIComponent(value)}`,
    prefer: "return=minimal",
  });
}

function toIso(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function studentFromDb(row) {
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    age: row.age || "",
    grade: row.grade || "",
    city: row.city || "",
    parentName: row.parent_name || "",
    parentEmail: row.parent_email || "",
    parentPhone: row.parent_phone || "",
    studentEmail: row.student_email || "",
    interests: Array.isArray(row.interests) ? row.interests : [],
    createdAt: row.created_at || "",
  };
}

function studentToDb(student) {
  return {
    id: student.id,
    first_name: student.firstName || "",
    last_name: student.lastName || "",
    age: student.age || "",
    grade: student.grade || "",
    city: student.city || "",
    parent_name: student.parentName || "",
    parent_email: student.parentEmail || "",
    parent_phone: student.parentPhone || "",
    student_email: student.studentEmail || "",
    interests: student.interests || [],
  };
}

function slotFromDb(row) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    category: row.category || "",
    description: row.description || "",
    active: row.active !== false,
    maxVolunteers: row.max_volunteers || 5,
  };
}

function slotToDb(slot) {
  return {
    id: slot.id,
    date: slot.date,
    title: slot.title,
    start_time: slot.start,
    end_time: slot.end,
    category: slot.category || "",
    description: slot.description || "",
    active: slot.active !== false,
    max_volunteers: slot.maxVolunteers || 5,
  };
}

function signupFromDb(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || "",
    slotId: row.slot_id,
    date: row.date,
    title: row.title,
    time: row.time,
    category: row.category || "",
    createdAt: row.created_at || "",
  };
}

function signupToDb(signup) {
  return {
    id: signup.id,
    student_id: signup.studentId,
    student_name: signup.studentName || "",
    slot_id: signup.slotId,
    date: signup.date,
    title: signup.title,
    time: signup.time,
    category: signup.category || "",
  };
}

function signinFromDb(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || "",
    date: row.date,
    session: row.session,
    code: row.code,
    time: row.time || "",
    createdAt: row.created_at || "",
  };
}

function signinToDb(item) {
  return {
    id: item.id,
    student_id: item.studentId,
    student_name: item.studentName || "",
    date: item.date,
    session: item.session,
    code: item.code,
    time: item.time || "",
  };
}

function hourFromDb(row) {
  return {
    id: row.id,
    signupId: row.signup_id || "",
    studentId: row.student_id,
    studentName: row.student_name || "",
    eventName: row.event_name || row.category || "",
    date: row.date,
    hours: Number(row.hours || 0),
    category: row.category || "",
    description: row.description || "",
    notes: row.notes || row.description || "",
    status: row.status || "Pending",
    createdAt: row.created_at || "",
  };
}

function hourToDb(hour) {
  return {
    id: hour.id,
    signup_id: hour.signupId || null,
    student_id: hour.studentId,
    student_name: hour.studentName || "",
    date: hour.date,
    hours: Number(hour.hours || 0),
    event_name: hour.eventName || hour.category || "",
    category: hour.category || hour.eventName || "",
    description: hour.description || hour.notes || "",
    notes: hour.notes || "",
    status: hour.status || "Pending",
  };
}

function certificateFromDb(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name || "",
    parentEmail: row.parent_email || "",
    status: row.status || "Pending",
    createdAt: row.created_at || "",
  };
}

function certificateToDb(request) {
  return {
    id: request.id,
    student_id: request.studentId,
    student_name: request.studentName || "",
    parent_email: request.parentEmail || "",
    status: request.status || "Pending",
  };
}

function messageFromDb(row) {
  return {
    id: row.id,
    audience: row.audience || "",
    studentId: row.student_id || "",
    parentEmail: row.parent_email || "",
    title: row.title || "",
    body: row.body || "",
    createdAt: row.created_at || "",
  };
}

function messageToDb(message) {
  return {
    id: message.id,
    audience: message.audience || "",
    student_id: message.studentId || "",
    parent_email: message.parentEmail || "",
    title: message.title || "",
    body: message.body || "",
  };
}

function emergencyMapFromDb(rows) {
  return (rows || []).reduce((acc, row) => {
    acc[row.student_id] = {
      emergencyName: row.emergency_name || "",
      emergencyPhone: row.emergency_phone || "",
      relationship: row.relationship || "",
      pickupNotes: row.pickup_notes || "",
      specialNotes: row.special_notes || row.notes || "",
      updatedAt: row.updated_at || "",
    };
    return acc;
  }, {});
}

function emergencyMapToDbRows(map, students = []) {
  return Object.entries(map || {}).map(([studentId, info]) => {
    const student = students.find((s) => s.id === studentId);
    return {
      student_id: studentId,
      parent_email: student?.parentEmail || "",
      emergency_name: info.emergencyName || "",
      emergency_phone: info.emergencyPhone || "",
      relationship: info.relationship || "",
      pickup_notes: info.pickupNotes || "",
      special_notes: info.specialNotes || "",
      notes: info.specialNotes || "",
      updated_at: new Date().toISOString(),
    };
  });
}

function saveLocal(key, value) {
  save(key, value);
}

const templeInfo = {
  name: "Sri HariHara Peetham",
  address: "773 S. MacArthur Blvd, Suite 225, Coppell, TX-75019",
  phone: "214-257-8500",
  email: "info@srihariharapeetham.org",
};

const interestOptions = [
  "Kids Activities",
  "Food Service",
  "Event Setup",
  "Cleanup",
  "Cultural Programs",
  "Front Desk Help",
  "Other",
];

const months2026 = [
  ["2026-01", "January 2026"],
  ["2026-02", "February 2026"],
  ["2026-03", "March 2026"],
  ["2026-04", "April 2026"],
  ["2026-05", "May 2026"],
  ["2026-06", "June 2026"],
  ["2026-07", "July 2026"],
  ["2026-08", "August 2026"],
  ["2026-09", "September 2026"],
  ["2026-10", "October 2026"],
  ["2026-11", "November 2026"],
  ["2026-12", "December 2026"],
];

const demoStudents = [
  {
    id: "1002123456",
    firstName: "Aarav",
    lastName: "Rana",
    age: "14",
    grade: "9",
    city: "Coppell",
    parentName: "Parent Rana",
    parentEmail: "parent@example.com",
    parentPhone: "214-555-0100",
    studentEmail: "",
    interests: ["Kids Activities", "Cleanup"],
      },
];

const demoHours = [
  {
    id: "HR-1",
    studentId: "1002123456",
    eventName: "Temple Cleanup Seva",
    date: "2026-05-18",
    hours: 3,
    notes: "Helped clean hall.",
    status: "Approved",
  },
];

const tierLevels = [
  { name: "Bal Sevak", min: 0, next: 10 },
  { name: "Yuva Sevak", min: 10, next: 25 },
  { name: "Dharma Sevak", min: 25, next: 50 },
  { name: "Seva Pramukh", min: 50, next: 100 },
  { name: "Seva Ratna", min: 100, next: null },
];

const specialPoojas2026 = [
  ["2026-01-14", "Makara Sankranti", "09:30", "12:30", "Pooja", "Special Sankranti seva and temple support."],
  ["2026-01-23", "Vasanth Panchami", "18:00", "20:00", "Pooja", "Assist with setup, crowd flow, and cleanup."],
  ["2026-01-25", "Ratha Saptami", "09:30", "12:30", "Pooja", "Morning pooja support."],
  ["2026-01-28", "Bhishma Ekadashi", "18:00", "20:00", "Pooja", "Evening pooja support."],
  ["2026-02-01", "Thaipoosam", "09:30", "12:30", "Pooja", "Festival seva support."],
  ["2026-02-15", "Maha Shivaratri", "18:00", "23:59", "Festival", "Major temple event. Help with setup, food, front desk, crowd flow, and cleanup."],
  ["2026-02-15", "Sahasra Lingarchana", "18:00", "21:00", "Pooja", "Support pooja arrangement and devotee flow."],
  ["2026-03-19", "Ugadi / Gudi Padwa", "18:00", "20:30", "Festival", "New year celebration seva."],
  ["2026-03-26", "Sri Ramanavami", "18:00", "20:30", "Festival", "Assist with pooja, prasadam, and cleanup."],
  ["2026-04-14", "Tamil New Year", "18:00", "20:30", "Festival", "Temple event support."],
  ["2026-04-21", "Shankara Jayanthi", "18:00", "20:00", "Pooja", "Evening pooja support."],
  ["2026-04-26", "Sri Vasavi Jayanthi", "18:00", "20:00", "Pooja", "Evening pooja support."],
  ["2026-05-04", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-05-11", "Hanuman Jayanthi", "18:00", "20:30", "Festival", "Assist with devotee flow and prasadam."],
  ["2026-05-14", "Pradosham", "18:00", "20:00", "Pooja", "Pradosham pooja support."],
  ["2026-05-30", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-06-03", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-06-12", "Pradosham", "18:00", "20:00", "Pooja", "Pradosham pooja support."],
  ["2026-06-27", "Shani Trayodashi", "18:00", "20:00", "Pooja", "Evening pooja support."],
  ["2026-06-28", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-07-03", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-07-04", "US Independence Day", "09:30", "12:30", "Event", "General temple seva support."],
  ["2026-07-16", "Dakshinayana Begins", "18:00", "20:00", "Pooja", "Pooja support."],
  ["2026-07-28", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-07-29", "Guru Poornima", "18:00", "20:30", "Festival", "Guru Poornima seva support."],
  ["2026-08-01", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-08-06", "Aadi Krittikai", "18:00", "20:00", "Pooja", "Pooja support."],
  ["2026-08-14", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-08-16", "Naga Panchami", "09:30", "12:30", "Pooja", "Morning pooja support."],
  ["2026-08-28", "Lunar Eclipse / Special Pooja", "18:00", "20:00", "Pooja", "Assist with temple support as directed."],
  ["2026-09-08", "Pradosham", "18:00", "20:00", "Pooja", "Pradosham pooja support."],
  ["2026-09-14", "Ganesh Chaturthi", "18:00", "20:30", "Festival", "Ganesh Chaturthi seva support."],
  ["2026-09-25", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-09-29", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-10-11", "Dasara Navaratri Begins", "18:00", "20:30", "Festival", "Navaratri seva support."],
  ["2026-10-20", "Vijaya Dashami / Dasara", "18:00", "20:30", "Festival", "Festival seva support."],
  ["2026-10-25", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-10-28", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-11-08", "Diwali", "18:00", "21:00", "Festival", "Major festival seva support."],
  ["2026-11-12", "Nagula Chavithi / Naga Chaturthi", "18:00", "20:00", "Pooja", "Pooja support."],
  ["2026-11-16", "Sahasra Lingarchana", "18:00", "20:30", "Pooja", "Pooja support."],
  ["2026-11-23", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-11-27", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
  ["2026-12-15", "Subramanya Shashthi", "18:00", "20:30", "Festival", "Subramanya Shashthi seva support."],
  ["2026-12-20", "Vaikunta Ekadashi", "06:00", "12:30", "Festival", "Major temple event. Help with crowd flow, food service, and front desk."],
  ["2026-12-23", "Satyanarayana Vratam", "18:00", "20:30", "Pooja", "Help with setup and cleanup."],
  ["2026-12-26", "Sankathara Chaturthi", "18:00", "20:00", "Pooja", "Monthly Sankathara Chaturthi pooja support."],
];

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clean(email = "") {
  return email.trim().toLowerCase();
}

function normalizeName(value = "") {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function todayMonth() {
  const current = today().slice(0, 7);
  return current.startsWith("2026") ? current : "2026-05";
}

function makeId(students) {
  let id = "";
  do {
    id = "1002" + Math.floor(100000 + Math.random() * 900000);
  } while (students.some((s) => s.id === id));
  return id;
}

function makePassword(id) {
  return "SHHP@" + id.slice(-4);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function to12Hour(time = "") {
  const [hourText, minute = "00"] = String(time).split(":");
  let hour = Number(hourText);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

function formatTimeRange(slot) {
  return `${to12Hour(slot.start)} - ${to12Hour(slot.end)}`;
}

function codeFor(date, session) {
  const digits = date.replaceAll("-", "");
  const seed = digits.split("").reduce((sum, n) => sum + Number(n), 0);
  const base = session === "Morning" ? 173 : 619;
  return String((seed * base + Number(digits.slice(-4))) % 10000).padStart(4, "0");
}

function slotLimit(slot) {
  return Math.min(Number(slot.maxVolunteers || 5), 5);
}

function sessionFromTime(start = "") {
  return start < "13:00" ? "Morning" : "Evening";
}

function dateLabel(dateValue) {
  const date = new Date(dateValue + "T00:00:00");
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function weekdayLabel(dateValue) {
  const date = new Date(dateValue + "T00:00:00");
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function slotSessionLabel(slot) {
  const text = `${slot.title} ${slot.category}`.toLowerCase();
  if (text.includes("morning")) return "Morning";
  if (text.includes("evening")) return "Evening";
  return "Special Event";
}

function makeMonthDays(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const total = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const blanks = Array.from({ length: firstDay }, () => null);
  const days = Array.from({ length: total }, (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
  return [...blanks, ...days];
}

function parseGradeNumber(gradeValue = "") {
  const match = String(gradeValue).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function canVolunteerByAgeOrGrade(ageValue, gradeValue) {
  const age = Number(ageValue);
  const grade = parseGradeNumber(gradeValue);
  const gradeText = String(gradeValue || "").toLowerCase();
  const isMiddleSchoolOrHigher = grade >= 6 || gradeText.includes("middle") || gradeText.includes("high");
  return age >= 12 || isMiddleSchoolOrHigher;
}

function statsFor(studentId, hours) {
  const list = hours.filter((h) => h.studentId === studentId);
  const approved = list.filter((h) => h.status === "Approved").reduce((s, h) => s + Number(h.hours || 0), 0);
  const pending = list.filter((h) => h.status === "Pending").reduce((s, h) => s + Number(h.hours || 0), 0);
  const current = [...tierLevels].reverse().find((tier) => approved >= tier.min) || tierLevels[0];
  const hoursToNext = current.next === null ? 0 : Math.max(current.next - approved, 0);
  const progressMax = current.next === null ? approved || 100 : current.next - current.min;
  const progressValue = current.next === null ? progressMax : approved - current.min;
  return { approved, pending, tier: current.name, nextTierHours: current.next, hoursToNext, progressMax, progressValue, list };
}

function generateDefaultSchedule() {
  const slots = [];
  const add = (date, title, start, end, category, description = "", maxVolunteers = 5) => {
    slots.push({
      id: `SLOT-${date}-${slug(title)}-${start.replace(":", "")}-${end.replace(":", "")}`,
      date,
      title,
      start,
      end,
      category,
      maxVolunteers,
      description,
      active: true,
    });
  };

  for (const [month] of months2026) {
    for (const date of makeMonthDays(month).filter(Boolean)) {
      add(date, "Regular Morning Volunteer Hours", "09:30", "10:30", "Regular Morning", "General morning seva slot.", 5);
      add(date, "Regular Morning Volunteer Hours", "10:30", "11:30", "Regular Morning", "General morning seva slot.", 5);
      add(date, "Regular Morning Volunteer Hours", "11:30", "12:30", "Regular Morning", "General morning seva slot.", 5);
      add(date, "Regular Evening Volunteer Hours", "17:30", "18:30", "Regular Evening", "General evening seva slot.", 5);
      add(date, "Regular Evening Volunteer Hours", "18:30", "19:30", "Regular Evening", "General evening seva slot.", 5);
      add(date, "Regular Evening Volunteer Hours", "19:30", "20:30", "Regular Evening", "General evening seva slot.", 5);
      add(date, "Regular Evening Volunteer Hours", "20:30", "21:30", "Regular Evening", "General evening seva slot.", 5);

      const day = new Date(date + "T00:00:00").getDay();
      if (day === 1) add(date, "Lord Siva Abhishekam", "19:00", "20:00", "Weekly Pooja", "Every Monday 7 PM.", 5);
      if (day === 2) add(date, "Subramanya Swamy Archana", "19:00", "20:00", "Weekly Pooja", "Every Tuesday 7 PM.", 5);
      if (day === 4) add(date, "Sadguru Saibaba Abhishekam", "10:30", "11:30", "Weekly Pooja", "Every Thursday 10:30 AM.", 5);
      if (day === 5) add(date, "Lalitha Sahasranamam Parayanam", "19:00", "20:00", "Weekly Pooja", "Every Friday 7 PM.", 5);
      if (day === 6) add(date, "Vishnu Sahasranama Parayanam", "09:00", "10:00", "Weekly Pooja", "Every Saturday 9 AM.", 5);
      if (day === 0) add(date, "Rahukala Deepam", "18:00", "19:00", "Weekly Pooja", "Every Sunday 6 PM.", 5);
    }
  }

  specialPoojas2026.forEach(([date, title, start, end, category, description]) => add(date, title, start, end, category, description, 5));
  return slots;
}

function slotMergeKey(slot) {
  return `${slot.date}|${slot.start}|${slot.end}|${slot.title}`;
}

function mergeScheduleSlots(defaultSlots, databaseSlots) {
  const merged = new Map();
  defaultSlots.forEach((slot) => merged.set(slotMergeKey(slot), slot));
  databaseSlots.forEach((slot) => merged.set(slotMergeKey(slot), slot));
  return Array.from(merged.values()).sort((a, b) => `${a.date}-${a.start}`.localeCompare(`${b.date}-${b.start}`));
}

function printReport(parentEmail, students, hours) {
  const linked = students.filter((s) => clean(s.parentEmail) === clean(parentEmail));
  const rows = linked.flatMap((student) =>
    hours
      .filter((h) => h.studentId === student.id && h.status === "Approved")
      .map((h) => {
        const stats = statsFor(student.id, hours);
        return `<tr><td>${student.firstName} ${student.lastName}</td><td>${student.id}</td><td>${h.eventName}</td><td>${dateLabel(h.date)}</td><td>${h.hours}</td><td>${stats.tier}</td></tr>`;
      })
  ).join("");

  const total = linked.reduce((sum, s) => sum + statsFor(s.id, hours).approved, 0);
  const generated = new Date().toLocaleString();

  const html = `
  <html>
    <head>
      <title>Sri HariHara Peetham Parent Reference Seva Report</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial, sans-serif;padding:38px;color:#24130f;position:relative;background:#fff}
        .watermark{position:fixed;top:42%;left:6%;font-size:92px;font-weight:900;color:rgba(160,0,0,.10);transform:rotate(-32deg);z-index:0;pointer-events:none;white-space:nowrap}
        .content{position:relative;z-index:1}
        .header{border-bottom:4px solid #8a0b18;padding-bottom:18px;margin-bottom:24px}
        h1{color:#8a0b18;margin:0;font-size:30px}
        h2{margin:8px 0 0;color:#24130f;font-size:20px}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}
        .box{border:1px solid #efb46a;border-radius:12px;padding:14px;background:#fff8ed}
        .notice{border:2px solid #b0001b;background:#fff0f2;padding:14px;border-radius:12px;margin:18px 0;font-weight:700;line-height:1.45}
        table{width:100%;border-collapse:collapse;margin-top:18px;font-size:14px}
        td,th{border:1px solid #999;padding:10px;text-align:left}
        th{background:#fff2df;color:#8a0b18}
        .total{font-size:20px;font-weight:900;margin-top:18px}
        .footer{margin-top:28px;font-size:12px;color:#555;border-top:1px solid #ddd;padding-top:12px}
      </style>
    </head>
    <body>
      <div class="watermark">NOT OFFICIAL</div>
      <div class="content">
        <div class="header">
          <h1>${templeInfo.name}</h1>
          <h2>Parent Reference Seva Hours Report</h2>
        </div>
        <div class="meta">
          <div class="box"><b>Parent Email</b><br>${parentEmail}</div>
          <div class="box"><b>Generated</b><br>${generated}</div>
          <div class="box"><b>Temple</b><br>${templeInfo.address}<br>${templeInfo.phone}</div>
          <div class="box"><b>Total Approved Hours</b><br>${total}</div>
        </div>
        <div class="notice">
          NOT OFFICIAL: This printable parent report is for family reference only and is not an official volunteer record.
          For an official seva record or certificate, the student must submit a request from Student Portal → Request Certificate.
        </div>
        <table>
          <thead>
            <tr><th>Student</th><th>Student ID</th><th>Seva / Event</th><th>Date</th><th>Approved Hours</th><th>Current Tier</th></tr>
          </thead>
          <tbody>${rows || "<tr><td colspan='6'>No approved hours yet.</td></tr>"}</tbody>
        </table>
        <div class="total">Total Approved Hours: ${total}</div>
        <div class="footer">
          This report is generated from the local volunteer portal data. Official records must be reviewed by Sri HariHara Peetham volunteer coordinators.
        </div>
      </div>
    </body>
  </html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

function todayLongLabel() {
  return new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function certificateIssueDate(request) {
  return request?.createdAt ? new Date(request.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : todayLongLabel();
}

function certificateHtml({ student, stats, request, mode = "preview" }) {
  const studentName = `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || request?.studentName || "Student Name";
  const studentId = student?.id || request?.studentId || "Student ID";
  const approvedHours = Number(stats?.approved || 0);
  const tier = stats?.tier || "Bal Sevak";
  const issueDate = certificateIssueDate(request);
  const watermark = mode === "preview" ? "<div class='previewWatermark'>PREVIEW</div>" : "";

  return `<!doctype html>
<html>
<head>
  <title>Volunteer Certificate - ${studentName}</title>
  <style>
    @page { size: landscape; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #efe2c9;
      color: #4d1218;
      font-family: Georgia, "Times New Roman", serif;
    }
    .certificatePage {
      width: 11in;
      height: 8.5in;
      margin: 0 auto;
      padding: .36in;
      background:
        radial-gradient(circle at center, rgba(255,255,255,.82), rgba(255,246,220,.94) 55%, rgba(246,222,176,.98)),
        #fff5dc;
      position: relative;
      overflow: hidden;
    }
    .outerBorder {
      width: 100%;
      height: 100%;
      border: 16px solid #5a1117;
      outline: 3px solid #d5913b;
      outline-offset: -22px;
      padding: .34in .48in;
      position: relative;
      background:
        linear-gradient(90deg, rgba(255,255,255,.65), rgba(255,248,224,.85), rgba(255,255,255,.65));
    }
    .innerBorder {
      position: absolute;
      inset: .28in;
      border: 2px dotted #d5913b;
      pointer-events: none;
    }
    .corner {
      position: absolute;
      font-size: 58px;
      color: #cc7d28;
      opacity: .78;
      line-height: 1;
    }
    .c1 { top: .18in; left: .26in; }
    .c2 { top: .18in; right: .26in; transform: scaleX(-1); }
    .c3 { bottom: .18in; left: .26in; transform: scaleY(-1); }
    .c4 { bottom: .18in; right: .26in; transform: scale(-1); }
    .topIcon {
      text-align: center;
      font-size: 40px;
      margin-top: -2px;
      color: #7a1219;
    }
    h1 {
      text-align: center;
      font-size: 42px;
      line-height: 1;
      margin: 0;
      letter-spacing: 2px;
      color: #5a1117;
      font-weight: 700;
    }
    .program {
      text-align: center;
      font-size: 21px;
      color: #d55b1f;
      font-weight: 700;
      letter-spacing: 2px;
      margin: 8px 0 18px;
    }
    .title {
      text-align: center;
      font-size: 36px;
      color: #5a1117;
      margin: 0 0 20px;
      font-weight: 700;
      letter-spacing: 2px;
    }
    .name {
      text-align: center;
      font-size: 56px;
      color: #6a151b;
      margin: 8px auto 10px;
      letter-spacing: 7px;
      border-bottom: 2px solid #d9a15d;
      width: 68%;
      padding-bottom: 10px;
    }
    .bodyText {
      width: 70%;
      margin: 0 auto;
      text-align: center;
      color: #4a1b1c;
      font-size: 18px;
      line-height: 1.38;
    }
    .awardLine {
      text-align: center;
      margin: 18px auto;
      font-size: 17px;
      color: #b34a16;
      font-style: italic;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .facts {
      width: 74%;
      margin: 18px auto 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      text-align: center;
      color: #3e1819;
    }
    .fact {
      border-right: 1px solid #c6904d;
      padding: 0 12px;
      min-height: 58px;
    }
    .fact:last-child { border-right: 0; }
    .factIcon {
      color: #d45d20;
      font-size: 25px;
      margin-bottom: 4px;
    }
    .fact b {
      display: block;
      font-size: 11px;
      letter-spacing: 1px;
      color: #4f1719;
    }
    .fact span {
      display: block;
      margin-top: 7px;
      font-size: 17px;
      color: #2f1717;
    }
    .signatureRow {
      position: absolute;
      left: .9in;
      right: .9in;
      bottom: .54in;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.4in;
      text-align: center;
    }
    .sigLine {
      border-top: 2px solid #b67831;
      padding-top: 10px;
      color: #301819;
      font-size: 17px;
    }
    .seal {
      position: absolute;
      left: 50%;
      bottom: .34in;
      transform: translateX(-50%);
      width: 1.05in;
      height: 1.05in;
      border-radius: 50%;
      border: 8px solid #7a1219;
      background: radial-gradient(circle, #fff2c7, #f0bd64);
      display: grid;
      place-items: center;
      text-align: center;
      color: #7a1219;
      font-weight: 700;
      font-size: 34px;
      box-shadow: 0 2px 10px rgba(60,0,0,.18);
    }
    .seal small {
      display: block;
      font-size: 7px;
      letter-spacing: 1px;
      line-height: 1;
      margin-top: 2px;
    }
    .previewWatermark {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-family: Arial, sans-serif;
      font-size: 92px;
      letter-spacing: 8px;
      color: rgba(122, 18, 25, .10);
      transform: rotate(-18deg);
      font-weight: 900;
      z-index: 3;
      pointer-events: none;
    }
    .actions {
      position: fixed;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      font-family: Arial, sans-serif;
      z-index: 9;
    }
    .actions button {
      border: 0;
      background: #7a1219;
      color: white;
      border-radius: 8px;
      padding: 10px 14px;
      font-weight: 800;
      cursor: pointer;
    }
    @media print {
      .actions, .previewWatermark { display: none; }
      body { background: white; }
      .certificatePage { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Print</button>
    <button onclick="window.close()">Close</button>
  </div>
  <div class="certificatePage">
    ${watermark}
    <div class="outerBorder">
      <div class="innerBorder"></div>
      <div class="corner c1">❦</div><div class="corner c2">❦</div><div class="corner c3">❦</div><div class="corner c4">❦</div>
      <div class="topIcon">ॐ</div>
      <h1>Sri HariHara Peetham</h1>
      <div class="program">Volunteer Program</div>
      <div class="title">Certificate of Volunteer Service</div>
      <div class="name">${studentName}</div>
      <div class="bodyText">
        This certificate is proudly presented to <b>${studentName}</b> in recognition of dedicated seva,
        responsible participation, and successful completion of volunteer service hours through the
        Sri HariHara Peetham Volunteer Program.
      </div>
      <div class="awardLine">Awarded for sincere service, leadership, and community involvement.</div>
      <div class="facts">
        <div class="fact"><div class="factIcon">▣</div><b>VOLUNTEER ID</b><span>${studentId}</span></div>
        <div class="fact"><div class="factIcon">♟</div><b>TIER</b><span>${tier}</span></div>
        <div class="fact"><div class="factIcon">◷</div><b>HOURS COMPLETED</b><span>${approvedHours} Hours</span></div>
        <div class="fact"><div class="factIcon">▣</div><b>ISSUE DATE</b><span>${issueDate}</span></div>
      </div>
      <div class="seal">ॐ<small>SRI HARIHARA<br/>PEETHAM</small></div>
      <div class="signatureRow">
        <div class="sigLine">Program Coordinator</div>
        <div class="sigLine">Temple Representative</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function openCertificatePreview({ student, stats, request, print = false }) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow popups to preview or print the certificate.");
    return;
  }
  win.document.write(certificateHtml({ student, stats, request, mode: print ? "print" : "preview" }));
  win.document.close();
  if (print) {
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

export default function App() {
  const [page, setPage] = useState(() => pageFromUrl());
  const [students, setStudents] = useState(() => load("shhp_students", demoStudents));
  const [hours, setHours] = useState(() => load("shhp_hours", demoHours));
  const [scheduleSlots, setScheduleSlots] = useState(() => load("shhp_schedule_slots_v11", generateDefaultSchedule()));
  const [signups, setSignups] = useState(() => load("shhp_signups_v11", []));
  const [signIns, setSignIns] = useState(() => load("shhp_signins_v11", []));
  const [messages, setMessages] = useState(() => load("shhp_messages", []));
  const [certificateRequests, setCertificateRequests] = useState(() => load("shhp_certificate_requests", []));
  const [emergencyContacts, setEmergencyContacts] = useState(() => load("shhp_emergency_contacts_v12", {}));
  const [activeStudentId, setActiveStudentId] = useState(() => load("shhp_active_student_id_v20", ""));
  const [parentLogin, setParentLogin] = useState(() => load("shhp_parent_login_v20", null));
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => load("shhp_admin_logged_in_v20", false));
  const [dbStatus, setDbStatus] = useState("Connecting shared database...");

  function setPageSaved(next, options = {}) {
    const safePage = VALID_PAGES.includes(next) ? next : "home";
    setPage(safePage);
    save("shhp_current_page_v20", safePage);
    updateBrowserUrl(safePage, options.replace === true);
  }
  function setActiveStudentIdSaved(next) { setActiveStudentId(next); save("shhp_active_student_id_v20", next); }
  function setParentLoginSaved(next) { setParentLogin(next); save("shhp_parent_login_v20", next); }
  function setAdminLoggedInSaved(next) { setAdminLoggedIn(next); save("shhp_admin_logged_in_v20", next); }

  useEffect(() => {
    const currentPage = pageFromUrl();
    setPage(currentPage);
    save("shhp_current_page_v20", currentPage);
    updateBrowserUrl(currentPage, true);

    function handleBrowserBack() {
      const nextPage = pageFromUrl();
      setPage(nextPage);
      save("shhp_current_page_v20", nextPage);
    }

    window.addEventListener("popstate", handleBrowserBack);
    return () => window.removeEventListener("popstate", handleBrowserBack);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadSharedDatabase() {
      try {
        const [
          studentRows,
          slotRows,
          signupRows,
          signinRows,
          hourRows,
          certificateRows,
          emergencyRows,
          messageRows,
        ] = await Promise.all([
          sbSelect("students", "?select=*&order=created_at.asc"),
          sbSelect("schedule_slots", "?select=*&order=date.asc,start_time.asc"),
          sbSelect("signups", "?select=*&order=created_at.desc"),
          sbSelect("signins", "?select=*&order=created_at.desc"),
          sbSelect("volunteer_hours", "?select=*&order=created_at.desc"),
          sbSelect("certificate_requests", "?select=*&order=created_at.desc"),
          sbSelect("emergency_contacts", "?select=*"),
          sbSelect("messages", "?select=*&order=created_at.desc"),
        ]);

        if (!alive) return;

        const nextStudents = studentRows.map(studentFromDb);
        const defaultSlots = generateDefaultSchedule();
        const databaseSlots = slotRows.map(slotFromDb);
        const nextSlots = mergeScheduleSlots(defaultSlots, databaseSlots);
        const nextSignups = signupRows.map(signupFromDb);
        const nextSignIns = signinRows.map(signinFromDb);
        const nextHours = hourRows.map(hourFromDb);
        const nextCertificates = certificateRows.map(certificateFromDb);
        const nextEmergency = emergencyMapFromDb(emergencyRows);
        const nextMessages = messageRows.map(messageFromDb);

        setStudents(nextStudents);
        setScheduleSlots(nextSlots);
        setSignups(nextSignups);
        setSignIns(nextSignIns);
        setHours(nextHours);
        setCertificateRequests(nextCertificates);
        setEmergencyContacts(nextEmergency);
        setMessages(nextMessages);

        saveLocal("shhp_students", nextStudents);
        saveLocal("shhp_schedule_slots_v11", nextSlots);
        saveLocal("shhp_signups_v11", nextSignups);
        saveLocal("shhp_signins_v11", nextSignIns);
        saveLocal("shhp_hours", nextHours);
        saveLocal("shhp_certificate_requests", nextCertificates);
        saveLocal("shhp_emergency_contacts_v12", nextEmergency);
        saveLocal("shhp_messages", nextMessages);

        setDbStatus(databaseSlots.length ? "Shared database connected" : "Shared database connected — using default schedule");
      } catch (error) {
        console.error(error);
        if (alive) {
          const defaultSlots = generateDefaultSchedule();
          setScheduleSlots(defaultSlots);
          saveLocal("shhp_schedule_slots_v11", defaultSlots);
          setDbStatus("Database connection failed — showing default schedule only");
        }
      }
    }

    loadSharedDatabase();
    return () => { alive = false; };
  }, []);

  function setStudentsSaved(next) {
    setStudents(next);
    save("shhp_students", next);
    sbUpsert("students", next.map(studentToDb)).catch((error) => console.error(error));
  }
  function setHoursSaved(next) {
    setHours(next);
    save("shhp_hours", next);
    sbUpsert("volunteer_hours", next.map(hourToDb)).catch((error) => console.error(error));
  }
  function setScheduleSaved(next) {
    setScheduleSlots(next);
    save("shhp_schedule_slots_v11", next);
    sbUpsert("schedule_slots", next.map(slotToDb)).catch((error) => console.error(error));
  }
  function setSignupsSaved(next) {
    setSignups(next);
    save("shhp_signups_v11", next);
  }
  function setSignInsSaved(next) {
    setSignIns(next);
    save("shhp_signins_v11", next);
    sbUpsert("signins", next.map(signinToDb)).catch((error) => console.error(error));
  }
  function setMessagesSaved(next) {
    setMessages(next);
    save("shhp_messages", next);
    sbUpsert("messages", next.map(messageToDb)).catch((error) => console.error(error));
  }
  function setCertificatesSaved(next) {
    setCertificateRequests(next);
    save("shhp_certificate_requests", next);
    sbUpsert("certificate_requests", next.map(certificateToDb)).catch((error) => console.error(error));
  }
  function setEmergencySaved(next) {
    setEmergencyContacts(next);
    save("shhp_emergency_contacts_v12", next);
    sbUpsert("emergency_contacts", emergencyMapToDbRows(next, students), "student_id").catch((error) => console.error(error));
  }

  function addStudent(data) {
    const id = makeId(students);
    const student = { ...data, id, parentEmail: clean(data.parentEmail) };
    setStudentsSaved([...students, student]);

    setMessagesSaved([
      {
        id: "MSG-" + Date.now(),
        audience: "student",
        studentId: id,
        parentEmail: student.parentEmail,
        title: "Volunteer Account Ready",
        body: `Welcome ${student.firstName}! Your volunteer ID is ${id}. Log in with your ID and your full first and last name.`,
        createdAt: new Date().toLocaleString(),
      },
      ...messages,
    ]);

    return student;
  }

  function updateStudent(updatedStudent) {
    const cleanedStudent = { ...updatedStudent, parentEmail: clean(updatedStudent.parentEmail) };
    const nextStudents = students.map((student) => student.id === cleanedStudent.id ? cleanedStudent : student);
    setStudents(nextStudents);
    save("shhp_students", nextStudents);
    sbUpsert("students", [studentToDb(cleanedStudent)]).catch((error) => console.error(error));
    setDbStatus("Shared database connected — student updated");
  }

  function deleteStudent(studentId) {
    const student = students.find((item) => item.id === studentId);
    const nextStudents = students.filter((item) => item.id !== studentId);
    const nextHours = hours.filter((item) => item.studentId !== studentId);
    const nextSignups = signups.filter((item) => item.studentId !== studentId);
    const nextSignIns = signIns.filter((item) => item.studentId !== studentId);
    const nextMessages = messages.filter((item) => item.studentId !== studentId);
    const nextCertificates = certificateRequests.filter((item) => item.studentId !== studentId);
    const nextEmergency = { ...emergencyContacts };
    delete nextEmergency[studentId];

    setStudents(nextStudents);
    setHours(nextHours);
    setSignups(nextSignups);
    setSignIns(nextSignIns);
    setMessages(nextMessages);
    setCertificateRequests(nextCertificates);
    setEmergencyContacts(nextEmergency);

    save("shhp_students", nextStudents);
    save("shhp_hours", nextHours);
    save("shhp_signups_v11", nextSignups);
    save("shhp_signins_v11", nextSignIns);
    save("shhp_messages", nextMessages);
    save("shhp_certificate_requests", nextCertificates);
    save("shhp_emergency_contacts_v12", nextEmergency);

    sbDeleteById("students", studentId).catch((error) => console.error(error));
    sbDeleteWhere("messages", "student_id", studentId).catch((error) => console.error(error));

    if (activeStudentId === studentId) setActiveStudentIdSaved("");
    if (parentLogin?.studentId === studentId) setParentLoginSaved(null);

    setDbStatus(student ? `Shared database connected — deleted ${student.firstName} ${student.lastName}` : "Shared database connected — student deleted");
  }

  function addSignup(student, slotOrSlots) {
    const slotsToAdd = Array.isArray(slotOrSlots) ? slotOrSlots : [slotOrSlots];
    const latestSignups = load("shhp_signups_v11", signups);
    const newSignups = [];
    const newMessages = [];

    slotsToAdd.forEach((slot) => {
      if (!slot) return;

      const alreadySigned =
        latestSignups.some((s) => s.studentId === student.id && s.slotId === slot.id) ||
        newSignups.some((s) => s.studentId === student.id && s.slotId === slot.id);

      const alreadyFilled =
        latestSignups.filter((s) => s.slotId === slot.id).length +
        newSignups.filter((s) => s.slotId === slot.id).length;

      if (alreadySigned || alreadyFilled >= slotLimit(slot)) return;

      const signup = {
        id: "SIGN-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        slotId: slot.id,
        date: slot.date,
        title: slot.title,
        time: formatTimeRange(slot),
        category: slot.category,
      };

      newSignups.push(signup);

      newMessages.push({
        id: "MSG-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        audience: "student",
        studentId: student.id,
        parentEmail: student.parentEmail,
        title: "Seva Slot Signed Up",
        body: `You signed up for ${slot.title} on ${slot.date}, ${formatTimeRange(slot)}.`,
        createdAt: new Date().toLocaleString(),
      });
    });

    if (!newSignups.length) return 0;

    setSignupsSaved([...newSignups, ...latestSignups]);
    setMessagesSaved([...newMessages, ...load("shhp_messages", messages)]);

    const slotsForDatabase = slotsToAdd.filter(Boolean);
    sbUpsert("schedule_slots", slotsForDatabase.map(slotToDb))
      .then(() => sbUpsert("signups", newSignups.map(signupToDb)))
      .then(() => setDbStatus(`Shared database connected — saved ${newSignups.length} signup${newSignups.length === 1 ? "" : "s"}`))
      .catch((error) => {
        console.error(error);
        setDbStatus("Signup saved on this device, but database save failed");
      });

    return newSignups.length;
  }

  function cancelSignup(student, signupId) {
    const signup = signups.find((item) => item.id === signupId);
    setSignupsSaved(signups.filter((item) => item.id !== signupId));
    sbDeleteById("signups", signupId).catch((error) => console.error(error));
    if (signup) setMessagesSaved([{ id: "MSG-CANCEL-" + Date.now(), audience: "student", studentId: student.id, parentEmail: student.parentEmail, title: "Seva Slot Cancelled", body: `You cancelled ${signup.title} on ${signup.date}, ${signup.time}.`, createdAt: new Date().toLocaleString() }, ...messages]);
  }

  function addHours(studentId, data) {
    setHoursSaved([{ id: "HR-" + Date.now(), studentId, status: "Pending", ...data }, ...hours]);
  }


  function addSignIn(student, session, code) {
    const record = {
      id: "IN-" + Date.now(),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: today(),
      session,
      code,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      createdAt: new Date().toLocaleString(),
    };

    const todaysSignedSlots = signups.filter((signup) => {
      const matchesStudent = signup.studentId === student.id;
      const matchesDate = signup.date === today();
      const sessionText = `${signup.title} ${signup.category} ${signup.time}`.toLowerCase();
      const matchesSession =
        session === "Morning"
          ? sessionText.includes("morning") || sessionText.includes("am")
          : sessionText.includes("evening") || sessionText.includes("pm");
      return matchesStudent && matchesDate && matchesSession;
    });

    const newHourRequests = todaysSignedSlots
      .filter((signup) => !hours.some((hour) => hour.signupId === signup.id))
      .map((signup) => ({
        id: "HR-AUTO-" + signup.id,
        signupId: signup.id,
        studentId: student.id,
        eventName: signup.title,
        date: signup.date,
        hours: 1,
        notes: `Auto-submitted after ${session} sign-in for ${signup.time}.`,
        status: "Pending",
      }));

    setSignInsSaved([record, ...signIns]);
    if (newHourRequests.length) {
      setHoursSaved([...newHourRequests, ...hours]);
    }

    setMessagesSaved([
      {
        id: "MSG-IN-" + Date.now(),
        audience: "student",
        studentId: student.id,
        parentEmail: student.parentEmail,
        title: "Signed In",
        body: newHourRequests.length
          ? `You signed in for ${session} seva. ${newHourRequests.length} hour request(s) were automatically submitted for admin approval.`
          : `You signed in for ${session} seva. No matching signed-up slot was found for automatic hour submission.`,
        createdAt: new Date().toLocaleString(),
      },
      ...messages,
    ]);

    return { record, autoSubmittedCount: newHourRequests.length };
  }

  function addCertificateRequest(student) {
    const request = { id: "CERT-" + Date.now(), studentId: student.id, studentName: `${student.firstName} ${student.lastName}`, parentEmail: student.parentEmail, status: "Pending", createdAt: new Date().toLocaleString() };
    setCertificatesSaved([request, ...certificateRequests]);
    return request;
  }

  const currentPage = VALID_PAGES.includes(page) ? page : "home";

  return <div className="app" data-build={BUILD_MARKER}>
    <div className={dbStatus.includes("failed") ? "dbBanner dbBannerError" : "dbBanner"}>{dbStatus}</div>
    {currentPage === "home" && <Home setPage={setPageSaved} />}
    {currentPage === "apply" && <Apply setPage={setPageSaved} addStudent={addStudent} />}
    {currentPage === "student" && <StudentPortal setPage={setPageSaved} students={students} hours={hours} scheduleSlots={scheduleSlots} signups={signups} signIns={signIns} messages={messages} certificateRequests={certificateRequests} activeStudentId={activeStudentId} setActiveStudentId={setActiveStudentIdSaved} addSignup={addSignup} cancelSignup={cancelSignup} addHours={addHours} addSignIn={addSignIn} addCertificateRequest={addCertificateRequest} setAdminLoggedIn={setAdminLoggedInSaved} />}
    {currentPage === "parent" && <ParentPortal setPage={setPageSaved} students={students} hours={hours} scheduleSlots={scheduleSlots} signups={signups} messages={messages} parentLogin={parentLogin} setParentLogin={setParentLoginSaved} addSignup={addSignup} cancelSignup={cancelSignup} emergencyContacts={emergencyContacts} setEmergencySaved={setEmergencySaved} setAdminLoggedIn={setAdminLoggedInSaved} />}
    {currentPage === "admin" && <AdminPortal setPage={setPageSaved} adminLoggedIn={adminLoggedIn} setAdminLoggedIn={setAdminLoggedInSaved} students={students} hours={hours} setHoursSaved={setHoursSaved} scheduleSlots={scheduleSlots} setScheduleSaved={setScheduleSaved} signups={signups} signIns={signIns} messages={messages} certificateRequests={certificateRequests} setCertificatesSaved={setCertificatesSaved} emergencyContacts={emergencyContacts} updateStudent={updateStudent} deleteStudent={deleteStudent} />}
    {currentPage === "about" && <AboutPage setPage={setPageSaved} />}
    {currentPage === "why" && <WhyJoinPage setPage={setPageSaved} />}
    {currentPage === "tier" && <TierPage setPage={setPageSaved} />}
    {currentPage === "contact" && <ContactPage setPage={setPageSaved} />}
  </div>;
}

function Header({ setPage, activePage = "home" }) {
  const navItems = [
    ["home", "Home"],
    ["about", "About Us"],
    ["why", "Why Join?"],
    ["tier", "Tier System"],
    ["contact", "Contact Us"],
    ["admin", "Admin"],
  ];

  return (
    <header className="header">
      <button className="brand" onClick={() => setPage("home")}>
        <div className="templeIcon">🛕</div>
        <div><h2>{templeInfo.name}</h2><p>Volunteer Program</p></div>
      </button>
      <nav className="nav">
        {navItems.map(([key, label]) => (
          <button key={key} className={activePage === key ? "activeNavButton" : ""} onClick={() => setPage(key)}>
            {label}
          </button>
        ))}
      </nav>
      <button className="applyTop" onClick={() => setPage("apply")}>Apply Now</button>
    </header>
  );
}

function Home({ setPage }) {
  return (
    <>
      <Header setPage={setPage} activePage="home" />
      <main className="home">
        <section className="heroNoImage">
          <div className="heroContent">
            <div className="heroText">
              <p className="heroKicker">Kids & Teens Seva Program</p>
              <h1>{templeInfo.name}<span>Volunteer Program</span></h1>
              <div className="lotusDivider"><span></span>🪷<span></span></div>
              <h3>Serve. Learn. Lead.</h3>
              <p>Pick hourly seva slots, help during temple activities, and grow through community service.</p>
            </div>

            <div className="portalCards">
              <button className="portalCard redCard" onClick={() => setPage("apply")}>
                <div className="circleIcon">📋</div>
                <div><h3>Apply to Volunteer</h3><p>Get your student ID instantly</p></div>
                <b>›</b>
              </button>

              <button className="portalCard orangeCard" onClick={() => setPage("student")}>
                <div className="circleIcon">🎓</div>
                <div><h3>Student Portal</h3><p>Schedule hourly slots and sign in</p></div>
                <b>›</b>
              </button>

              <button className="portalCard navyCard" onClick={() => setPage("parent")}>
                <div className="circleIcon">👥</div>
                <div><h3>Parent Portal</h3><p>View hours and parent reports</p></div>
                <b>›</b>
              </button>
            </div>

            <div className="homeNotice">
              <b>Important Notice</b>
              <p>Volunteers should be at least 12 years old or currently in middle school. Please arrive on time for your selected slot and check in with the volunteer coordinator when you arrive.</p>
            </div>

            <div className="whyMiniGrid">
              <div><b>🧡 Help the temple</b><p>Support poojas, events, food service, cleanup, and front desk needs.</p></div>
              <div><b>🌟 Build confidence</b><p>Practice responsibility, teamwork, and leadership in a safe community.</p></div>
              <div><b>📌 Track service</b><p>Submit hours, earn tiers, and request official records when needed.</p></div>
            </div>

            <FooterInfo />
          </div>
        </section>
      </main>
    </>
  );
}

function FooterInfo() {
  return (
    <section className="infoFooter bigFooterInfo">
      <div className="footerInfoCard">
        <h2>📍 {templeInfo.name}</h2>
        <p>{templeInfo.address}</p>
        <p>☎ Phone: {templeInfo.phone}</p>
        <p>✉ Email: {templeInfo.email}</p>
      </div>

      <div className="footerInfoCard">
        <h2>🛕 Temple Timings</h2>
        <p><b>☀ Everyday Morning</b></p>
        <div className="timePill">9:30 AM to 12:30 PM</div>
        <p><b>🌙 Everyday Evening</b></p>
        <div className="timePill">5:30 PM to 9:30 PM</div>
      </div>

      <div className="footerQuote footerInfoCard">
        <div className="om">ॐ</div>
        <h2>Together, let’s create a generation of selfless leaders and sevaks.</h2>
        <p>Students can volunteer in hourly slots with a maximum of 5 volunteers per slot.</p>
      </div>
    </section>
  );
}

function Apply({ setPage, addStudent }) {
  const [created, setCreated] = useState(null);
  const [consent, setConsent] = useState(false);
  const [ageWarning, setAgeWarning] = useState(false);
  function submit(e) {
    e.preventDefault();
    if (!consent) return alert("Please check the parent/guardian consent box.");
    const f = new FormData(e.currentTarget);
    if (!canVolunteerByAgeOrGrade(f.get("age"), f.get("grade"))) { setAgeWarning(true); return; }
    setCreated(addStudent({ firstName: f.get("firstName"), lastName: f.get("lastName"), age: f.get("age"), grade: f.get("grade"), city: f.get("city"), parentName: f.get("parentName"), parentEmail: f.get("parentEmail"), parentPhone: f.get("parentPhone"), studentEmail: f.get("studentEmail") || "", interests: f.getAll("interests") }));
  }
  if (created) return (
    <SimplePage title="Application Complete" setPage={setPage}>
      <div className="successCard">
        <h1>Account Created 🙏</h1>
        <p>Your volunteer account is ready. Please save this Student ID.</p>

        <div className="credentialGrid">
          <div className="credentialCard">
            <span>Student ID</span>
            <h3>{created.id}</h3>
          </div>
          <div className="credentialCard">
            <span>Student Login</span>
            <h3>ID + Full Name</h3>
            <p>{created.firstName} {created.lastName}</p>
          </div>
        </div>

        <div className="emailBox">
          <h2>No Email Needed</h2>
          <p>Nothing needs to be sent by email. The account is created automatically after this application.</p>
          <p><b>Student Login:</b> Student ID + first and last name.</p>
          <p><b>Parent Login:</b> Parent email + Student ID.</p>
        </div>

        <button className="primaryBtn" onClick={() => setPage("student")}>Go to Student Login</button>
      </div>
    </SimplePage>
  );

  return <SimplePage title="Volunteer Application" setPage={setPage}>{ageWarning && <div className="modalOverlay"><div className="modalCard"><h2>Volunteer Eligibility Notice</h2><p>For safety and supervision, volunteers should be at least 12 years old or currently in middle school.</p><button className="primaryBtn" type="button" onClick={() => setAgeWarning(false)}>Okay, I Understand</button></div></div>}<form className="formCard" onSubmit={submit}><h1>Volunteer Application</h1><div className="formGrid"><Input name="firstName" label="First Name" required /><Input name="lastName" label="Last Name" required /><Input name="age" label="Age" required /><Input name="grade" label="Grade" required /><Input name="city" label="City" required /><Input name="parentName" label="Parent/Guardian Name" required /><Input name="parentEmail" label="Parent Email" required type="email" /><Input name="parentPhone" label="Parent Phone Number" required /></div><Input name="studentEmail" label="Student Email" /><div className="interestBox"><h3>Areas of Interest</h3><div className="interestGrid">{interestOptions.map((interest) => <label key={interest} className="interestOption"><input type="checkbox" name="interests" value={interest} />{interest}</label>)}</div></div><div className="consentBox">
    <label className="consentLabel">
      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
      <span>I confirm that a parent/guardian gives permission for this student to participate in the Sri HariHara Peetham Volunteer Program. I understand volunteers should be at least 12 years old or currently in middle school, and students must follow temple rules, safety instructions, and volunteer coordinator guidance.</span>
    </label>
  </div><button className="primaryBtn">Submit Application</button></form></SimplePage>;
}

function StudentPortal({ setPage, students, hours, scheduleSlots, signups, signIns, messages, certificateRequests, activeStudentId, setActiveStudentId, addSignup, cancelSignup, addHours, addSignIn, addCertificateRequest, setAdminLoggedIn }) {
  const student = students.find((s) => s.id === activeStudentId);
  if (!student) return <SimplePage title="Student Portal Login" setPage={setPage}><StudentLogin students={students} setActiveStudentId={setActiveStudentId} setPage={setPage} /></SimplePage>;
  return <StudentShell setPage={setPage} student={student} hours={hours} scheduleSlots={scheduleSlots} signups={signups.filter(s => s.studentId === student.id)} allSignups={signups} signIns={signIns.filter(s => s.studentId === student.id)} messages={messages.filter(m => m.studentId === student.id)} certificateRequests={certificateRequests.filter(r => r.studentId === student.id)} addSignup={addSignup} cancelSignup={cancelSignup} addHours={addHours} addSignIn={addSignIn} addCertificateRequest={addCertificateRequest} logout={() => setActiveStudentId("")} />;
}

function StudentShell({ setPage, student, hours, scheduleSlots, signups, allSignups, signIns, messages, certificateRequests, addSignup, cancelSignup, addHours, addSignIn, addCertificateRequest, logout }) {
  const [tab, setTab] = useState("home");
  const stats = statsFor(student.id, hours);
  const tabs = [["home", "Home"], ["schedule", "Sign Up / Schedule Slots"], ["signin", "Sign In"], ["submit", "Submit Hours"], ["approved", "Approved Hours"], ["tier", "Current Tier"], ["certificate", "Certificate"], ["contact", "Contact Us"]];
  return <div className="studentPortalPage"><div className="studentPortalTop"><div><h1>Student Portal</h1><p>{student.firstName} {student.lastName} · ID {student.id}</p></div><div className="studentTopActions"><button className="logoutBtn" onClick={() => setPage("home")}>Home</button><button className="logoutBtn" onClick={logout}>Log Out</button></div></div><div className="studentTabs">{tabs.map(([key, label]) => <button key={key} className={tab === key ? "activeStudentTab" : ""} onClick={() => setTab(key)}>{label}</button>)}</div><main className="studentPortalContent"><div className="studentTabStack">{tab === "home" && <StudentHome student={student} signups={signups} cancelSignup={cancelSignup} setTab={setTab} />}{tab === "schedule" && <StudentSchedule student={student} scheduleSlots={scheduleSlots} signups={signups} allSignups={allSignups} addSignup={addSignup} setTab={setTab} />}{tab === "signin" && <StudentSignIn student={student} signups={signups} signIns={signIns} addSignIn={addSignIn} />}{tab === "submit" && <SubmitHours student={student} addHours={addHours} />}{tab === "approved" && <ApprovedHours hours={hours.filter(h => h.studentId === student.id)} />}{tab === "tier" && <CurrentTier stats={stats} />}{tab === "certificate" && <CertificateTab student={student} stats={stats} certificateRequests={certificateRequests} addCertificateRequest={addCertificateRequest} />}{tab === "contact" && <ContactBox />}</div></main></div>;
}

function StudentHome({ student, signups, cancelSignup, setTab }) {
  const upcoming = [...signups]
    .filter((s) => s.date >= today())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  function handleCancel(id) {
    if (window.confirm("Cancel this seva slot?")) cancelSignup(student, id);
  }

  return (
    <div className="studentPanel upcomingHomePanel">
      <div className="simpleHomeHeader">
        <div>
          <h2>Upcoming Volunteer Hours</h2>
          <p>These are all the future slots you signed up for.</p>
        </div>
        <button className="primaryBtn smallBtn" onClick={() => setTab("schedule")}>Sign Up for More</button>
      </div>

      {upcoming.length ? (
        <div className="upcomingList">
          {upcoming.map((slot) => (
            <div className="upcomingSlot" key={slot.id}>
              <div>
                <b>{weekdayLabel(slot.date)} {slotSessionLabel(slot)}</b>
                <p>{dateLabel(slot.date)} · {slot.time}</p>
                <small>{slot.title}</small>
              </div>
              <button className="cancelSlotBtn" type="button" onClick={() => handleCancel(slot.id)}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <h3>No upcoming volunteer hours yet</h3>
          <p>Go to Sign Up / Schedule Slots to choose a seva time.</p>
          <button className="primaryBtn smallBtn" onClick={() => setTab("schedule")}>Sign Up Now</button>
        </div>
      )}
    </div>
  );
}

function StudentSchedule({ student, scheduleSlots, signups, allSignups, addSignup, setTab }) {
  const [month, setMonth] = useState(todayMonth());
  const [selectedDate, setSelectedDate] = useState(today().startsWith(month) ? today() : `${month}-01`);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [lastSignedSlots, setLastSignedSlots] = useState([]);
  const days = makeMonthDays(month);
  const dateSlots = scheduleSlots.filter((slot) => slot.date === selectedDate && slot.active).sort((a, b) => a.start.localeCompare(b.start));
  const morningSlots = dateSlots.filter((slot) => slot.category === "Regular Morning");
  const eveningSlots = dateSlots.filter((slot) => slot.category === "Regular Evening");
  const specialSlots = dateSlots.filter((slot) => slot.category !== "Regular Morning" && slot.category !== "Regular Evening");

  function hasSlots(date) { return scheduleSlots.some((slot) => slot.date === date && slot.active); }
  function hasSignup(date) { return signups.some((s) => s.date === date); }
  function filledCount(slotId) { return allSignups.filter((s) => s.slotId === slotId).length; }
  function isFull(slot) { return filledCount(slot.id) >= slotLimit(slot); }
  function toggle(id) {
    const currentScroll = window.scrollY;
    setConfirmed(false);
    setSelectedIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    requestAnimationFrame(() => window.scrollTo(0, currentScroll));
  }
  function submitSelected() {
    if (!selectedIds.length) return alert("Please select at least one slot.");

    const selectedSlots = selectedIds
      .map((id) => scheduleSlots.find((slot) => slot.id === id))
      .filter((slot) => slot && !isFull(slot));

    const savedCount = addSignup(student, selectedSlots);

    setSelectedIds([]);
    setLastSignedSlots(selectedSlots.slice(0, savedCount));
    setConfirmed(savedCount > 0);

    if (savedCount === 0) {
      alert("Those slots were already signed up or are full.");
    }
  }

  function renderSlot(slot) {
    const signed = signups.some((s) => s.slotId === slot.id);
    const selected = selectedIds.includes(slot.id);
    const filled = filledCount(slot.id);
    const max = slotLimit(slot);
    const full = filled >= max;

    return (
      <button
        type="button"
        key={slot.id}
        className={signed ? "friendlySlot signedSlot" : selected ? "friendlySlot selectedSlot" : full ? "friendlySlot fullSlot" : "friendlySlot"}
        disabled={signed || full}
        onClick={() => toggle(slot.id)}
      >
        <div>
          <b className="slotTimeText">{formatTimeRange(slot)}</b>
          <p>{slot.title}</p>
          <small>{filled} / {max} spots filled</small>
        </div>
        <span>{signed ? "Signed Up" : full ? "Full" : selected ? "Selected" : "Sign Up"}</span>
      </button>
    );
  }

  function SlotGroup({ title, subtitle, slots, emptyText }) {
    return (
      <div className="scheduleGroupCard">
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <div className="slotChoiceGrid">
          {slots.length ? slots.map(renderSlot) : <div className="emptyState smallEmpty">{emptyText}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="studentPanel scheduleFriendlyPanel">
      <h2>Sign Up for Seva Slots</h2>
      <p className="kidHelpText bigHelpText">Pick a date, then choose your 1-hour slots. You can pick one slot or many open slots.</p>

      <label className="inputGroup compactInput"><span>Month</span><select value={month} onChange={(e) => { setMonth(e.target.value); setSelectedDate(`${e.target.value}-01`); setSelectedIds([]); }}>{months2026.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

      <div className="monthGrid monthHeader"><b>Sun</b><b>Mon</b><b>Tue</b><b>Wed</b><b>Thu</b><b>Fri</b><b>Sat</b></div>
      <div className="monthGrid calendarFriendlyGrid">{days.map((day, index) => day ? <button key={day} className={`monthDay ${day === selectedDate ? "selectedMonthDay" : ""} ${hasSlots(day) ? "hasSlotsDay" : ""} ${hasSignup(day) ? "hasSignupDay" : ""}`} onClick={() => { setSelectedDate(day); setSelectedIds([]); }}><span>{Number(day.slice(-2))}</span>{hasSignup(day) && <small>Signed</small>}</button> : <div key={`blank-${index}`} className="blankDay" />)}</div>

      <div className="selectedDateTitle">
        <h2>{dateLabel(selectedDate)} Slots</h2>
        <p>Morning, evening, and special event options for this date.</p>
      </div>

      <div className="friendlyScheduleGrid">
        <SlotGroup title={`${dateLabel(selectedDate)} Morning`} subtitle="Morning seva hourly slots" slots={morningSlots} emptyText="No morning slots for this day." />
        <SlotGroup title={`${dateLabel(selectedDate)} Evening`} subtitle="Evening seva hourly slots" slots={eveningSlots} emptyText="No evening slots for this day." />
        <SlotGroup title="Special Events / Poojas" subtitle="Extra seva options posted by the temple" slots={specialSlots} emptyText="No special events for this day." />
      </div>

      <div className="selectionBar stickySelectionBar"><div><b>Selected Slots: {selectedIds.length}</b><p>After you submit, your slots will appear on the Home tab.</p></div><button className="primaryBtn" onClick={submitSelected}>Submit Selected Slots</button></div>
      {confirmed && <div className="successNotice successNoticeBlock">
        <div>
          <b>You signed up for {lastSignedSlots.length} slot{lastSignedSlots.length === 1 ? "" : "s"}:</b>
          <ul>
            {lastSignedSlots.map((slot) => (
              <li key={slot.id}>{dateLabel(slot.date)} · {formatTimeRange(slot)} · {slot.title}</li>
            ))}
          </ul>
        </div>
        <button onClick={() => setTab("home")}>Go to Home</button>
      </div>}
    </div>
  );
}

function StudentSignIn({ student, signups, signIns, addSignIn }) {
  const [session, setSession] = useState("Morning");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const todaysSlots = signups.filter((s) => s.date === today());

  function submit(e) {
    e.preventDefault();
    const expected = codeFor(today(), session);
    if (code.trim() !== expected) {
      setMsg("Invalid code. Please ask the front desk for today's 4-digit code.");
      return;
    }

    const already = signIns.some((item) => item.date === today() && item.session === session);
    if (already) {
      setMsg(`You already signed in for ${session} today.`);
      return;
    }

    const result = addSignIn(student, session, expected);
    setCode("");
    setMsg(
      result.autoSubmittedCount
        ? `Signed in! ${result.autoSubmittedCount} hour request(s) were automatically submitted for approval.`
        : `Signed in! No matching signed-up slot was found, so no hours were auto-submitted.`
    );
  }

  return (
    <div className="studentPanel">
      <h2>Sign In at the Temple</h2>
      <p className="kidHelpText">When you arrive, ask the front desk for the 4-digit code. After you sign in, your matching slot will be submitted for hours approval automatically.</p>
      <div className="arrivalSteps">
        <b>What to do when you arrive</b>
        <ol>
          <li>Arrive at the temple for your selected slot.</li>
          <li>Ask the coordinator or front desk for today’s 4-digit code.</li>
          <li>Enter the code here and choose Morning or Evening.</li>
          <li>Your hours will be sent for approval automatically.</li>
        </ol>
      </div>

      <div className="note">
        <b>Today's Signed-Up Slots</b>
        {todaysSlots.length ? todaysSlots.map((s) => <p key={s.id}>{s.title} · {s.time}</p>) : <p>No slots signed up for today.</p>}
      </div>

      <form onSubmit={submit}>
        <label className="inputGroup compactInput">
          <span>Session</span>
          <select value={session} onChange={(e) => setSession(e.target.value)}>
            <option>Morning</option>
            <option>Evening</option>
          </select>
        </label>

        <label className="inputGroup compactInput">
          <span>Enter 4-Digit Code</span>
          <input
            value={code}
            maxLength="4"
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
          />
        </label>

        <button className="primaryBtn">Sign In</button>
      </form>

      {msg && <p className="successText">{msg}</p>}
    </div>
  );
}

function StudentLogin({ students, setActiveStudentId, setPage }) {
  const [id, setId] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  function login(e) {
    e.preventDefault();

    const enteredName = normalizeName(fullName);
    const parts = fullName.trim().split(/\s+/);
    const enteredFirst = normalizeName(parts[0] || "");
    const enteredLast = normalizeName(parts.slice(1).join(" ") || "");

    const match = students.find((s) => {
      const storedFirst = normalizeName(s.firstName);
      const storedLast = normalizeName(s.lastName);
      const storedFullName = normalizeName(`${s.firstName} ${s.lastName}`);

      const exactFullNameMatch = storedFullName === enteredName;

      // This lets old demo data like "Aarav R." still work when typed as "Aarav Rana".
      const oldInitialLastNameMatch =
        storedFirst === enteredFirst &&
        storedLast.length === 1 &&
        enteredLast.startsWith(storedLast);

      return s.id === id.trim() && (exactFullNameMatch || oldInitialLastNameMatch);
    });

    if (!match) {
      setError("We could not find that student. Check the Student ID and full first & last name.");
      return;
    }

    setActiveStudentId(match.id);
  }

  return (
    <form className="loginCard friendlyLoginCard" onSubmit={login}>
      <h1>Student Login</h1>
      <p>No password needed. Enter your Student ID and your full first and last name.</p>
      <InputText label="Student ID" value={id} setValue={setId} />
      <InputText label="First and Last Name" value={fullName} setValue={setFullName} />
      {error && <p className="errorText">{error}</p>}
      <button className="primaryBtn">Log In</button>
      <p className="loginHelpLink">
        Don’t have an account yet? <button type="button" onClick={() => setPage("apply")}>Create one here.</button>
      </p>
    </form>
  );
}

function ParentPortal({ setPage, students, hours, scheduleSlots, signups, messages, parentLogin, setParentLogin, addSignup, cancelSignup, emergencyContacts, setEmergencySaved, setAdminLoggedIn }) {
  if (!parentLogin) {
    return (
      <SimplePage title="Parent Portal Login" setPage={setPage}>
        <ParentLogin students={students} setParentLogin={setParentLogin} />
      </SimplePage>
    );
  }

  const linked = students.filter((s) => clean(s.parentEmail) === clean(parentLogin.parentEmail));

  return (
    <ParentShell
      setPage={setPage}
      parentEmail={parentLogin.parentEmail}
      children={linked}
      hours={hours}
      scheduleSlots={scheduleSlots}
      signups={signups}
      messages={messages.filter((m) => clean(m.parentEmail) === clean(parentLogin.parentEmail))}
      addSignup={addSignup}
      cancelSignup={cancelSignup}
      emergencyContacts={emergencyContacts}
      setEmergencySaved={setEmergencySaved}
      logout={() => setParentLogin(null)}
    />
  );
}

function ParentShell({ setPage, parentEmail, children, hours, scheduleSlots, signups, messages, addSignup, cancelSignup, emergencyContacts, setEmergencySaved, logout }) {
  const [tab, setTab] = useState("kids");
  const tabs = [
    ["kids", "View Kids"],
    ["tier", "Hour Tier"],
    ["emergency", "Emergency Contact / Notes"],
    ["pdf", "Printable PDF"],
  ];

  return (
    <div className="studentPortalPage">
      <div className="studentPortalTop">
        <div>
          <h1>Parent Portal</h1>
          <p>{parentEmail} · {children.length} linked student{children.length === 1 ? "" : "s"}</p>
        </div>
        <div className="studentTopActions">
          <button className="logoutBtn" onClick={() => setPage("home")}>Home</button>
          <button className="logoutBtn" onClick={logout}>Log Out</button>
        </div>
      </div>

      <div className="studentTabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? "activeStudentTab" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <main className="studentPortalContent">
        <div className="studentTabStack">
          {tab === "kids" && <ParentViewKids children={children} hours={hours} signups={signups} cancelSignup={cancelSignup} setTab={setTab} />}
          {tab === "tier" && <ParentTier children={children} hours={hours} />}
          {tab === "emergency" && <ParentEmergency children={children} emergencyContacts={emergencyContacts} setEmergencySaved={setEmergencySaved} />}
          {tab === "pdf" && <ParentPDF parentEmail={parentEmail} students={children} allStudents={children} hours={hours} />}
        </div>
      </main>
    </div>
  );
}

function ParentViewKids({ children, hours, signups, cancelSignup, setTab }) {
  if (!children.length) {
    return <div className="studentPanel"><h2>No kids linked yet</h2><p>No student accounts were found for this parent email.</p></div>;
  }

  function cancelForChild(child, signupId) {
    if (window.confirm("Cancel this child's seva slot?")) cancelSignup(child, signupId);
  }

  return (
    <div className="studentPanel">
      <div className="simpleHomeHeader">
        <div>
          <h2>View Kids</h2>
          <p>See each child’s hours, tier progress, and exact upcoming seva slots. Students schedule their own seva slots from the Student Portal.</p>
        </div>

      </div>

      {children.map((child) => {
        const stats = statsFor(child.id, hours);
        const childSignups = signups
          .filter((s) => s.studentId === child.id && s.date >= today())
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

        return (
          <div className="parentKidCard" key={child.id}>
            <div className="parentKidHeader">
              <div>
                <h3>{child.firstName} {child.lastName}</h3>
                <p>ID: {child.id} · Grade {child.grade}</p>
              </div>
              <span className="statusBadge approved">{stats.tier}</span>
            </div>

            <div className="statsGrid">
              <Stat title="Approved" value={stats.approved} caption="hours completed" />
              <Stat title="Pending" value={stats.pending} caption="under review" />
              <Stat title="Next Tier" value={stats.hoursToNext} caption={stats.nextTierHours === null ? "highest tier" : "hours needed"} />
            </div>

            <h4>Upcoming Signed-Up Slots</h4>
            {childSignups.length ? childSignups.map((signup) => (
              <div className="upcomingSlot" key={signup.id}>
                <div>
                  <b>{signup.title}</b>
                  <p>{dateLabel(signup.date)} · {signup.time}</p>
                  <small>{signup.category}</small>
                </div>
                <button className="cancelSlotBtn" type="button" onClick={() => cancelForChild(child, signup.id)}>Cancel</button>
              </div>
            )) : <p>No upcoming slots signed up yet. Students can schedule slots from their Student Portal.</p>}
          </div>
        );
      })}
    </div>
  );
}

function ParentTier({ children, hours }) {
  if (!children.length) return <div className="studentPanel"><h2>No kids linked</h2></div>;
  return (
    <div className="studentPanel">
      <h2>Hour Tier</h2>
      <p>Track each child’s approved hours and progress toward the next tier.</p>
      {children.map((child) => {
        const stats = statsFor(child.id, hours);
        return (
          <div className="parentKidCard" key={child.id}>
            <div className="parentKidHeader">
              <div>
                <h3>{child.firstName} {child.lastName}</h3>
                <p>ID: {child.id}</p>
              </div>
              <span className="statusBadge approved">{stats.tier}</span>
            </div>
            <div className="credentialGrid">
              <div className="credentialCard"><span>Approved Hours</span><h3>{stats.approved}</h3></div>
              <div className="credentialCard"><span>Hours to Next Tier</span><h3>{stats.nextTierHours === null ? "Done" : stats.hoursToNext}</h3></div>
            </div>
            <progress value={stats.progressValue} max={stats.progressMax}></progress>
          </div>
        );
      })}
      <div className="tierGrid">{tierLevels.map(t => <div className="tierCard" key={t.name}><h3>{t.name}</h3><p>{t.min}+ approved hours</p></div>)}</div>
    </div>
  );
}

function ParentEmergency({ children, emergencyContacts, setEmergencySaved }) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || "");
  const current = emergencyContacts[selectedChildId] || {};
  const [saved, setSaved] = useState(false);

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = {
      ...emergencyContacts,
      [selectedChildId]: {
        emergencyName: f.get("emergencyName"),
        emergencyPhone: f.get("emergencyPhone"),
        relationship: f.get("relationship"),
        pickupNotes: f.get("pickupNotes"),
        specialNotes: f.get("specialNotes"),
        updatedAt: new Date().toLocaleString(),
      },
    };
    setEmergencySaved(next);
    setSaved(true);
  }

  if (!children.length) return <div className="studentPanel"><h2>No kids linked</h2></div>;

  return (
    <form className="studentPanel" onSubmit={submit}>
      <h2>Emergency Contact / Notes</h2>
      <p>Add details the temple volunteer coordinator should know.</p>

      <label className="inputGroup">
        <span>Choose Child</span>
        <select value={selectedChildId} onChange={(e) => { setSelectedChildId(e.target.value); setSaved(false); }}>
          {children.map((child) => <option key={child.id} value={child.id}>{child.firstName} {child.lastName} · {child.id}</option>)}
        </select>
      </label>

      <div className="formGrid" key={selectedChildId}>
        <label className="inputGroup">
          <span>Emergency Contact Name <b>*</b></span>
          <input name="emergencyName" defaultValue={current.emergencyName || ""} required />
        </label>
        <label className="inputGroup">
          <span>Emergency Contact Phone <b>*</b></span>
          <input name="emergencyPhone" defaultValue={current.emergencyPhone || ""} required />
        </label>
        <label className="inputGroup">
          <span>Relationship to Child</span>
          <input name="relationship" defaultValue={current.relationship || ""} />
        </label>
        <label className="inputGroup">
          <span>Pickup Instructions</span>
          <input name="pickupNotes" defaultValue={current.pickupNotes || ""} />
        </label>
      </div>

      <label className="inputGroup" key={`notes-${selectedChildId}`}>
        <span>Additional Notes / Special Supervision Notes</span>
        <input name="specialNotes" defaultValue={current.specialNotes || ""} placeholder="Anything the temple should know" />
      </label>

      <button className="primaryBtn">Save Emergency Info</button>
      {saved && <p className="successText">Emergency contact information saved.</p>}
      {current.updatedAt && <p className="smallMuted">Last updated: {current.updatedAt}</p>}
    </form>
  );
}

function ParentPDF({ parentEmail, students, hours }) {
  return (
    <div className="studentPanel">
      <h2>Printable PDF / Parent Report</h2>
      <div className="note">
        <b>NOT OFFICIAL</b>
        <p>This printable report is for parent reference and includes a NOT OFFICIAL watermark. Students should request an official record from their Student Portal when needed.</p>
        <p>For an official seva record or certificate, the student must request it from Student Portal → Request Certificate.</p>
      </div>

      {students.map((student) => {
        const stats = statsFor(student.id, hours);
        return (
          <div className="miniItem" key={student.id}>
            <b>{student.firstName} {student.lastName}</b>
            <p>ID: {student.id} · Approved: {stats.approved} hrs · Tier: {stats.tier}</p>
          </div>
        );
      })}

      <button className="primaryBtn" onClick={() => printReport(parentEmail, students, hours)}>Print / Save NOT OFFICIAL PDF</button>
    </div>
  );
}

function ParentLogin({ students, setParentLogin }) {
  const [email, setEmail] = useState(""); const [id, setId] = useState(""); const [error, setError] = useState("");
  function login(e) { e.preventDefault(); const match = students.find((s) => clean(s.parentEmail) === clean(email) && s.id === id.trim()); if (!match) return setError("No student found with that parent email and student ID."); setParentLogin({ parentEmail: clean(email), studentId: id.trim() }); }
  return (
    <form className="loginCard" onSubmit={login}>
      <h1>Parent Login</h1>
      <p>Each student receives a unique Student ID after applying. Parents can use their parent email and the student’s ID number to view hours, tiers, emergency notes, and parent reports.</p>
      <InputText label="Parent Email" value={email} setValue={setEmail} />
      <InputText label="Student ID" value={id} setValue={setId} />
      {error && <p className="errorText">{error}</p>}
      <button className="primaryBtn">View Student Info</button>
    </form>
  );
}

function AdminLoginMini({ setPage, setAdminLoggedIn }) {
  const [open, setOpen] = useState(false); const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  if (!open) return <div className="loginCard adminMini"><h2>Volunteer Coordinator Access</h2><button className="secondaryBtn" onClick={() => setOpen(true)}>Admin / Coordinator Login</button></div>;
  function login(e) { e.preventDefault(); if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) { setAdminLoggedIn(true); setPage("admin"); } else setErr("Invalid admin login."); }
  return <form className="loginCard adminMini" onSubmit={login}><h1>Admin Login</h1><InputText label="Username" value={u} setValue={setU} /><InputText label="Password" value={p} setValue={setP} password />{err && <p className="errorText">{err}</p>}<button className="primaryBtn">Log In</button></form>;
}

function AdminPortal({ setPage, adminLoggedIn, setAdminLoggedIn, students, hours, setHoursSaved, scheduleSlots, setScheduleSaved, signups, signIns, messages, certificateRequests, setCertificatesSaved, emergencyContacts, updateStudent, deleteStudent }) {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");

  if (!adminLoggedIn) {
    return (
      <SimplePage title="Admin Login" setPage={setPage}>
        <AdminLoginMini setPage={setPage} setAdminLoggedIn={setAdminLoggedIn} />
      </SimplePage>
    );
  }

  function approve(id) { setHoursSaved(hours.map((h) => h.id === id ? { ...h, status: "Approved" } : h)); }
  function reject(id) { setHoursSaved(hours.map((h) => h.id === id ? { ...h, status: "Rejected" } : h)); }
  function markCertificate(id, status) { setCertificatesSaved(certificateRequests.map((request) => request.id === id ? { ...request, status } : request)); }

  const adminTabs = [
    ["home", "Home / View Code"],
    ["calendar", "Calendar Manager"],
    ["signin", "Sign-Ins"],
    ["pastCodes", "Past Codes"],
    ["students", "Students"],
    ["hours", "Approve Hours"],
    ["signups", "Slot Signups"],
    ["certificates", "Certificates"],
    ["emergency", "Emergency Info"],
    ["messages", "Inbox Log"],
  ];

  return (
    <div className="studentPortalPage adminPortalPage">
      <div className="studentPortalTop">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Daily codes, calendar slots, students, and approvals.</p>
        </div>
        <div className="studentTopActions">
          <button className="logoutBtn" onClick={() => setPage("home")}>Home</button>
          <button className="logoutBtn" onClick={() => setAdminLoggedIn(false)}>Log Out Admin</button>
        </div>
      </div>

      <div className="adminTabs bigPortalTabs">
        {adminTabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={tab === key ? "activeTab" : ""}>
            {label}
          </button>
        ))}
      </div>

      <main className="studentPortalContent">
        <div className="adminToolbar">
          <input className="searchInput" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name, ID, parent email, event, or status..." />
        </div>

        {tab === "home" && <AdminHome students={students} hours={hours} signups={signups} signIns={signIns} />}
        {tab === "calendar" && <AdminCalendar scheduleSlots={scheduleSlots} setScheduleSaved={setScheduleSaved} />}
        {tab === "signin" && <AdminSignIns signIns={signIns} search={search} />}
        {tab === "pastCodes" && <AdminPastCodes />}
        {tab === "students" && <AdminStudents students={students.filter(s => `${s.id} ${s.firstName} ${s.lastName} ${s.parentEmail}`.toLowerCase().includes(search.toLowerCase()))} hours={hours} updateStudent={updateStudent} deleteStudent={deleteStudent} />}
        {tab === "hours" && <AdminHours hours={hours} students={students} search={search} approve={approve} reject={reject} />}
        {tab === "signups" && <AdminSignups signups={signups} search={search} />}
        {tab === "certificates" && <AdminCertificates requests={certificateRequests} students={students} hours={hours} markCertificate={markCertificate} />}
        {tab === "emergency" && <AdminEmergencyInfo students={students} emergencyContacts={emergencyContacts} search={search} />}
        {tab === "messages" && <AdminMessages messages={messages} />}
      </main>
    </div>
  );
}

function AdminHome({ students, hours, signups, signIns }) {
  return <div className="adminWide"><div className="statsGrid adminStats"><Stat title="Students" value={students.length} caption="total" /><Stat title="Pending Hours" value={hours.filter(h => h.status === "Pending").length} caption="review" /><Stat title="Today's Signups" value={signups.filter(s => s.date === today()).length} caption="scheduled" /><Stat title="Today's Sign-Ins" value={signIns.filter(s => s.date === today()).length} caption="checked in" /></div><div className="dashCard"><h2>View Today's Sign-In Codes</h2><p>Give these to students at the front desk. Morning and evening codes are 4 digits, different, and change every day.</p><div className="codeGrid"><CodeCard session="Morning" date={today()} /><CodeCard session="Evening" date={today()} /></div></div></div>;
}

function CodeCard({ session, date }) {
  const code = codeFor(date, session);
  return <div className="codeCard"><span>{session} Code</span><h3>{code}</h3><p>{dateLabel(date)}</p><button className="secondaryBtn smallBtn inlineBtn" onClick={() => navigator.clipboard?.writeText(code)}>Copy Code</button></div>;
}

function AdminPastCodes() {
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
  return <div className="dashCard adminWide"><h2>Past Codes</h2><p>Use this if a student forgot to sign in or admin needs to verify an old code.</p>{days.map(date => <div className="pastCodeRow" key={date}><b>{dateLabel(date)}</b><span>Morning: {codeFor(date, "Morning")}</span><span>Evening: {codeFor(date, "Evening")}</span></div>)}</div>;
}

function AdminCalendar({ scheduleSlots, setScheduleSaved }) {
  const [month, setMonth] = useState(todayMonth()); const [selectedDate, setSelectedDate] = useState(today().startsWith(month) ? today() : `${month}-01`);
  const days = makeMonthDays(month); const dateSlots = scheduleSlots.filter(slot => slot.date === selectedDate).sort((a, b) => a.start.localeCompare(b.start));
  function updateSlot(id, patch) { setScheduleSaved(scheduleSlots.map(slot => slot.id === id ? { ...slot, ...patch } : slot)); }
  function deleteSlot(id) { if (window.confirm("Delete this slot?")) setScheduleSaved(scheduleSlots.filter(slot => slot.id !== id)); }
  function addSlot(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const title = f.get("title"); const start = f.get("start"); const end = f.get("end"); const slot = { id: `CUSTOM-${Date.now()}`, date: selectedDate, title, start, end, category: f.get("category"), maxVolunteers: Math.min(Number(f.get("maxVolunteers") || 5), 5), description: f.get("description"), active: true }; setScheduleSaved([slot, ...scheduleSlots]); e.currentTarget.reset(); }
  function hasSlots(date) { return scheduleSlots.some(slot => slot.date === date && slot.active); }
  return <div className="adminWide"><div className="dashCard"><h2>Calendar Manager</h2><p>Edit each slot for the selected date. Students only see active slots.</p><label className="inputGroup compactInput"><span>Month</span><select value={month} onChange={e => { setMonth(e.target.value); setSelectedDate(`${e.target.value}-01`); }}>{months2026.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="monthGrid monthHeader"><b>Sun</b><b>Mon</b><b>Tue</b><b>Wed</b><b>Thu</b><b>Fri</b><b>Sat</b></div><div className="monthGrid">{days.map((day, index) => day ? <button key={day} className={`monthDay ${day === selectedDate ? "selectedMonthDay" : ""} ${hasSlots(day) ? "hasSlotsDay" : ""}`} onClick={() => setSelectedDate(day)}><span>{Number(day.slice(-2))}</span><small>{scheduleSlots.filter(s => s.date === day && s.active).length} slots</small></button> : <div key={`blank-${index}`} className="blankDay" />)}</div></div><form className="dashCard" onSubmit={addSlot}><h2>Add Slot for {selectedDate}</h2><div className="formGrid"><Input name="title" label="Slot Title" required /><Input name="start" label="Start Time" type="time" required /><Input name="end" label="End Time" type="time" required /><Input name="category" label="Category" required /><Input name="maxVolunteers" label="Max Volunteers" type="number" /><Input name="description" label="Description" /></div><button className="primaryBtn smallBtn">Add Slot</button></form><div className="dashCard"><h2>Edit Slots for {dateLabel(selectedDate)}</h2>{dateSlots.map(slot => <div className="editSlotCard" key={slot.id}><div className="formGrid"><label className="inputGroup"><span>Title</span><input value={slot.title} onChange={e => updateSlot(slot.id, { title: e.target.value })} /></label><label className="inputGroup"><span>Category</span><input value={slot.category} onChange={e => updateSlot(slot.id, { category: e.target.value })} /></label><label className="inputGroup"><span>Start</span><input type="time" value={slot.start} onChange={e => updateSlot(slot.id, { start: e.target.value })} /></label><label className="inputGroup"><span>End</span><input type="time" value={slot.end} onChange={e => updateSlot(slot.id, { end: e.target.value })} /></label><label className="inputGroup"><span>Max Volunteers</span><input type="number" min="1" max="5" value={slotLimit(slot)} onChange={e => updateSlot(slot.id, { maxVolunteers: Math.min(Number(e.target.value), 5) })} /></label><label className="inputGroup"><span>Description</span><input value={slot.description} onChange={e => updateSlot(slot.id, { description: e.target.value })} /></label></div><div className="buttonRow"><button className="secondaryBtn smallBtn inlineBtn" onClick={() => updateSlot(slot.id, { active: !slot.active })}>{slot.active ? "Make Inactive" : "Make Active"}</button><button className="cancelSlotBtn" onClick={() => deleteSlot(slot.id)}>Delete Slot</button></div></div>)}</div></div>;
}

function AdminStudents({ students, hours, updateStudent, deleteStudent }) {
  const [viewId, setViewId] = useState("");
  const [editId, setEditId] = useState("");

  function submitEdit(e, student) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const interestsText = String(f.get("interests") || "");
    const interests = interestsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    updateStudent({
      ...student,
      firstName: f.get("firstName"),
      lastName: f.get("lastName"),
      age: f.get("age"),
      grade: f.get("grade"),
      city: f.get("city"),
      parentName: f.get("parentName"),
      parentEmail: f.get("parentEmail"),
      parentPhone: f.get("parentPhone"),
      studentEmail: f.get("studentEmail"),
      interests,
    });

    setEditId("");
    setViewId(student.id);
  }

  function confirmDelete(student) {
    const ok = window.confirm(`Delete ${student.firstName} ${student.lastName} (${student.id})? This removes the student and related signups/hours from the shared database.`);
    if (!ok) return;
    deleteStudent(student.id);
    if (viewId === student.id) setViewId("");
    if (editId === student.id) setEditId("");
  }

  return (
    <div className="dashCard adminWide">
      <h2>Students List</h2>
      <p className="kidHelpText">Cards are minimized. Click View for full parent/contact details, Edit to update, or Delete to remove a test/student record.</p>

      {students.length ? students.map((s) => {
        const st = statsFor(s.id, hours);
        const isViewing = viewId === s.id;
        const isEditing = editId === s.id;

        return (
          <div className="adminListItem adminStudentMiniCard" key={s.id}>
            <div className="studentMiniTop">
              <div>
                <b>{s.firstName} {s.lastName}</b>
                <p>ID: {s.id}</p>
              </div>

              <div className="studentActionButtons">
                <button className="secondaryBtn smallBtn inlineBtn" type="button" onClick={() => { setViewId(isViewing ? "" : s.id); setEditId(""); }}>
                  {isViewing ? "Hide" : "View"}
                </button>
                <button className="secondaryBtn smallBtn inlineBtn" type="button" onClick={() => { setEditId(isEditing ? "" : s.id); setViewId(s.id); }}>
                  {isEditing ? "Cancel Edit" : "Edit"}
                </button>
                <button className="dangerBtn smallBtn inlineBtn" type="button" onClick={() => confirmDelete(s)}>
                  Delete
                </button>
              </div>
            </div>

            {isViewing && !isEditing && (
              <div className="studentDetailPanel">
                <p><b>Login:</b> Student ID + first and last name</p>
                <p><b>Parent:</b> {s.parentName || "Not provided"} · {s.parentEmail} · {s.parentPhone || "No phone"}</p>
                <p><b>Student:</b> Grade {s.grade || "N/A"} · Age {s.age || "N/A"} · {s.city || "No city"}</p>
                <p><b>Student Email:</b> {s.studentEmail || "Not provided"}</p>
                <p><b>Interests:</b> {(s.interests || []).join(", ") || "Not selected"}</p>
                <p><b>Hours:</b> Approved {st.approved} · Pending {st.pending} · Tier {st.tier}</p>
              </div>
            )}

            {isEditing && (
              <form className="studentEditPanel" onSubmit={(e) => submitEdit(e, s)}>
                <div className="formGrid">
                  <label className="inputGroup"><span>First Name</span><input name="firstName" defaultValue={s.firstName || ""} required /></label>
                  <label className="inputGroup"><span>Last Name</span><input name="lastName" defaultValue={s.lastName || ""} required /></label>
                  <label className="inputGroup"><span>Age</span><input name="age" defaultValue={s.age || ""} /></label>
                  <label className="inputGroup"><span>Grade</span><input name="grade" defaultValue={s.grade || ""} /></label>
                  <label className="inputGroup"><span>City</span><input name="city" defaultValue={s.city || ""} /></label>
                  <label className="inputGroup"><span>Parent/Guardian Name</span><input name="parentName" defaultValue={s.parentName || ""} /></label>
                  <label className="inputGroup"><span>Parent Email</span><input name="parentEmail" defaultValue={s.parentEmail || ""} type="email" required /></label>
                  <label className="inputGroup"><span>Parent Phone</span><input name="parentPhone" defaultValue={s.parentPhone || ""} /></label>
                </div>
                <label className="inputGroup"><span>Student Email</span><input name="studentEmail" defaultValue={s.studentEmail || ""} /></label>
                <label className="inputGroup"><span>Interests, separated by commas</span><input name="interests" defaultValue={(s.interests || []).join(", ")} /></label>
                <div className="buttonRow">
                  <button className="primaryBtn smallBtn" type="submit">Save Changes</button>
                  <button className="secondaryBtn smallBtn inlineBtn" type="button" onClick={() => setEditId("")}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        );
      }) : <p>No students found.</p>}
    </div>
  );
}

function AdminHours({ hours, students, search, approve, reject }) {
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const matchingStudents = students.filter((student) => {
    const studentHours = hours.filter((hour) => hour.studentId === student.id);
    const haystack = `${student.id} ${student.firstName} ${student.lastName} ${student.parentEmail} ${student.parentPhone} ${studentHours.map((hour) => `${hour.eventName} ${hour.date} ${hour.status}`).join(" ")}`;
    return haystack.toLowerCase().includes(search.toLowerCase());
  });

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || matchingStudents[0];
  const selectedHours = selectedStudent ? hours.filter((hour) => hour.studentId === selectedStudent.id) : [];
  const selectedPending = selectedHours.filter((hour) => hour.status === "Pending");

  return (
    <div className="adminWide approvalDashboard">
      <div className="dashCard">
        <h2>Approve Hours by Student</h2>
        <p className="kidHelpText">Students with pending hours show a red dot. Click a student to review and approve their hours.</p>

        <div className="studentApprovalList">
          {matchingStudents.map((student) => {
            const studentStats = statsFor(student.id, hours);
            const pendingCount = hours.filter((hour) => hour.studentId === student.id && hour.status === "Pending").length;

            return (
              <button
                key={student.id}
                className={selectedStudent?.id === student.id ? "studentApprovalRow selectedApprovalRow" : "studentApprovalRow"}
                onClick={() => setSelectedStudentId(student.id)}
                type="button"
              >
                <div>
                  <b>{student.firstName} {student.lastName}</b>
                  <p>ID: {student.id} · Approved: {studentStats.approved} hrs · Pending: {studentStats.pending} hrs</p>
                </div>
                {pendingCount > 0 ? <span className="needsApproval"><span className="redDot"></span>Needs Hours Approved</span> : <span className="allClear">No pending hours</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dashCard">
        <h2>{selectedStudent ? `${selectedStudent.firstName}'s Pending Hours` : "Select a Student"}</h2>
        {selectedPending.length ? selectedPending.map((hour) => (
          <div className="compactApprovalItem" key={hour.id}>
            <div>
              <b>{hour.eventName}</b>
              <p>{dateLabel(hour.date)} · {hour.hours} hr(s)</p>
              <p>{hour.notes}</p>
            </div>
            <div className="buttonRow">
              <button className="primaryBtn smallBtn" onClick={() => approve(hour.id)}>Approve</button>
              <button className="secondaryBtn smallBtn inlineBtn" onClick={() => reject(hour.id)}>Reject</button>
            </div>
          </div>
        )) : <p>No pending hours for this student.</p>}

        {selectedHours.filter((hour) => hour.status !== "Pending").length > 0 && (
          <>
            <h3>Recent Reviewed Hours</h3>
            {selectedHours.filter((hour) => hour.status !== "Pending").slice(0, 5).map((hour) => (
              <div className="historyItem compactReviewed" key={hour.id}>
                <div><b>{hour.eventName}</b><p>{dateLabel(hour.date)} · {hour.hours} hr(s)</p></div>
                <span className={"statusBadge " + hour.status.toLowerCase()}>{hour.status}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function AdminSignups({ signups, search }) { const filtered = signups.filter(s => `${s.studentName} ${s.title} ${s.date} ${s.time}`.toLowerCase().includes(search.toLowerCase())); return <div className="dashCard adminWide"><h2>Slot Signups</h2>{filtered.length ? filtered.map(s => <div className="historyItem" key={s.id}><div><b>{s.studentName}</b><p>{s.title} · {s.date} · {s.time}</p><p>{s.category}</p></div></div>) : <p>No slot signups.</p>}</div>; }
function AdminSignIns({ signIns, search }) { const filtered = signIns.filter(s => `${s.studentName} ${s.studentId} ${s.date} ${s.session}`.toLowerCase().includes(search.toLowerCase())); return <div className="dashCard adminWide"><h2>Student Sign-Ins</h2>{filtered.length ? filtered.map(s => <div className="historyItem" key={s.id}><div><b>{s.studentName}</b><p>{s.date} · {s.session} · {s.time}</p><p>ID: {s.studentId}</p></div><span className="statusBadge approved">Signed In</span></div>) : <p>No sign-ins yet.</p>}</div>; }
function AdminCertificates({ requests, students, hours, markCertificate }) {
  function studentForRequest(request) {
    return students.find((student) => student.id === request.studentId) || {
      id: request.studentId,
      firstName: request.studentName?.split(" ")[0] || "",
      lastName: request.studentName?.split(" ").slice(1).join(" ") || "",
      parentEmail: request.parentEmail || "",
    };
  }

  return (
    <div className="dashCard adminWide">
      <h2>Certificate Requests</h2>
      <p className="kidHelpText">Use Preview to review the generated certificate before approving or sharing. Signature lines stay blank for in-person signatures.</p>
      {requests.length ? requests.map((r) => {
        const student = studentForRequest(r);
        const stats = statsFor(student.id, hours);
        return (
          <div className="adminListItem certificateRequestCard" key={r.id}>
            <div>
              <b>{r.studentName}</b>
              <p>ID: {r.studentId} · Parent: {r.parentEmail}</p>
              <p>Approved Hours: {stats.approved} · Tier: {stats.tier}</p>
              <span className={"statusBadge " + r.status.toLowerCase()}>{r.status}</span>
            </div>
            <div className="adminActions certificateActions">
              <button className="secondaryBtn smallBtn inlineBtn" type="button" onClick={() => openCertificatePreview({ student, stats, request: r })}>Preview</button>
              {r.status === "Approved" && <button className="primaryBtn smallBtn" type="button" onClick={() => openCertificatePreview({ student, stats, request: r, print: true })}>Print</button>}
              {r.status === "Pending" && <>
                <button className="primaryBtn smallBtn" onClick={() => markCertificate(r.id, "Approved")}>Approve</button>
                <button className="secondaryBtn smallBtn inlineBtn" onClick={() => markCertificate(r.id, "Rejected")}>Reject</button>
              </>}
            </div>
          </div>
        );
      }) : <p>No certificate requests yet.</p>}
    </div>
  );
}

function AdminEmergencyInfo({ students, emergencyContacts, search }) {
  const rows = students
    .filter((student) => emergencyContacts[student.id])
    .filter((student) => `${student.firstName} ${student.lastName} ${student.id} ${student.parentEmail}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashCard adminWide">
      <h2>Emergency Contact / Parent Notes</h2>
      {rows.length ? rows.map((student) => {
        const info = emergencyContacts[student.id];
        return (
          <div className="adminListItem" key={student.id}>
            <div>
              <b>{student.firstName} {student.lastName}</b>
              <p>ID: {student.id} · Parent: {student.parentEmail}</p>
              <p><b>Emergency Contact:</b> {info.emergencyName} · {info.emergencyPhone}</p>
              <p><b>Relationship:</b> {info.relationship || "Not provided"}</p>
              <p><b>Pickup:</b> {info.pickupNotes || "Not provided"}</p>
              <p><b>Notes:</b> {info.specialNotes || "None"}</p>
              <small>Updated: {info.updatedAt}</small>
            </div>
          </div>
        );
      }) : <p>No emergency contact notes submitted yet.</p>}
    </div>
  );
}

function AdminMessages({ messages }) { return <div className="dashCard adminWide"><h2>Inbox Log</h2>{messages.length ? messages.map(m => <div className="emailPreview" key={m.id}><h3>{m.title}</h3><p><b>Student ID:</b> {m.studentId}</p><p>{m.body}</p><p>{m.createdAt}</p></div>) : <p>No inbox messages yet.</p>}</div>; }

function SubmitHours({ student, addHours }) { function submit(e) { e.preventDefault(); const f = new FormData(e.currentTarget); addHours(student.id, { eventName: f.get("eventName"), date: f.get("date"), hours: Number(f.get("hours")), notes: f.get("notes") }); e.currentTarget.reset(); alert("Hours submitted for admin approval."); } return <form className="dashCard" onSubmit={submit}><h2>Submit Volunteer Hours</h2><div className="formGrid"><Input name="eventName" label="Seva/Event Name" required /><Input name="date" label="Date" type="date" required /><Input name="hours" label="Hours" type="number" required /><Input name="notes" label="Notes" /></div><button className="primaryBtn smallBtn">Submit Hours</button></form>; }
function ApprovedHours({ hours }) { return <><History title="Approved Hours" items={hours.filter(h => h.status === "Approved")} /><History title="Pending Hours" items={hours.filter(h => h.status === "Pending")} /></>; }
function CurrentTier({ stats }) { return <div className="studentPanel tierFocus"><h2>Current Tier</h2><div className="credentialGrid"><div className="credentialCard"><span>Current Tier</span><h3>{stats.tier}</h3></div><div className="credentialCard"><span>Approved Hours</span><h3>{stats.approved}</h3></div></div>{stats.nextTierHours === null ? <p>You are at the highest tier.</p> : <><p><b>{stats.hoursToNext}</b> more approved hours needed for the next tier.</p><progress value={stats.progressValue} max={stats.progressMax}></progress></>}<div className="tierGrid">{tierLevels.map(t => <div className="tierCard" key={t.name}><h3>{t.name}</h3><p>{t.min}+ approved hours</p></div>)}</div></div>; }
function CertificateTab({ student, stats, certificateRequests, addCertificateRequest }) {
  const [requested, setRequested] = useState(false);
  const approvedRequest = [...certificateRequests].find((request) => request.status === "Approved");
  const pendingRequest = [...certificateRequests].find((request) => request.status === "Pending");
  const rejectedRequest = [...certificateRequests].find((request) => request.status === "Rejected");

  function requestCertificate() {
    addCertificateRequest(student);
    setRequested(true);
  }

  return (
    <div className="studentPanel certificatePanel">
      <h2>Certificate</h2>

      <section className="certificateSection">
        <h3>Request Certificate</h3>
        <p>Request a seva certificate for school, personal records, or volunteer documentation. Admin must approve it before download/printing is available.</p>
        <div className="credentialGrid">
          <div className="credentialCard"><span>Approved Hours</span><h3>{stats.approved}</h3></div>
          <div className="credentialCard"><span>Current Tier</span><h3>{stats.tier}</h3></div>
        </div>

        {pendingRequest ? (
          <p className="successText">Certificate request is pending admin approval.</p>
        ) : (
          <button className="primaryBtn" onClick={requestCertificate}>Request Certificate</button>
        )}
        {requested && <p className="successText">Certificate request sent to admin.</p>}
        {rejectedRequest && !pendingRequest && !approvedRequest && <p className="errorText">Your previous request was rejected. Please contact the volunteer coordinator if you need help.</p>}
      </section>

      <section className="certificateSection">
        <h3>Certificate Download</h3>
        {approvedRequest ? (
          <>
            <p>Your certificate has been approved. Preview it first, then print or save as PDF.</p>
            <div className="buttonRow">
              <button className="secondaryBtn smallBtn inlineBtn" type="button" onClick={() => openCertificatePreview({ student, stats, request: approvedRequest })}>Preview Certificate</button>
              <button className="primaryBtn smallBtn" type="button" onClick={() => openCertificatePreview({ student, stats, request: approvedRequest, print: true })}>Print / Save Certificate</button>
            </div>
            <p className="smallMuted">Signature lines are left blank. Please come in person for official signatures.</p>
          </>
        ) : (
          <p>No approved certificate is available yet. Once admin approves your request, preview and print buttons will appear here.</p>
        )}
      </section>
    </div>
  );
}

function ContactBox() {
  return (
    <div className="studentPanel contactBoxPanel">
      <h2>Contact Us</h2>
      <p><b>{templeInfo.name}</b></p>
      <p>{templeInfo.address}</p>
      <p>Phone: {templeInfo.phone}</p>
      <p>Email: {templeInfo.email}</p>
      <div className="note">Questions about sign-in codes, hours, or certificates? Please ask the front desk or a volunteer coordinator.</div>
    </div>
  );
}

function Inbox({ title, messages }) { return <div className="dashCard"><h2>{title}</h2>{messages.length ? messages.map(m => <div className="historyItem" key={m.id}><div><b>{m.title}</b><p>{m.body}</p><small>{m.createdAt}</small></div><span className="statusBadge pending">New</span></div>) : <p>No messages yet.</p>}</div>; }
function History({ title, items }) { return <div className="dashCard"><h2>{title}</h2>{items.length ? items.map(h => <div className="historyItem" key={h.id}><div><b>{h.eventName}</b><p>{h.date} · {h.hours} hrs · {h.notes}</p></div><span className={"statusBadge " + h.status.toLowerCase()}>{h.status}</span></div>) : <p>No hours submitted yet.</p>}</div>; }
function Input({ name, label, required, type = "text" }) { return <label className="inputGroup"><span>{label} {required && <b>*</b>}</span><input name={name} type={type} required={required} /></label>; }
function InputText({ label, value, setValue, password }) { return <label className="inputGroup"><span>{label}</span><input type={password ? "password" : "text"} value={value} onChange={e => setValue(e.target.value)} /></label>; }
function HeaderBlock({ title, subtitle }) { return <div className="dashboardHeader"><h1>{title}</h1><p>{subtitle}</p></div>; }
function Stat({ title, value, caption }) { return <div className="statCard"><p>{title}</p><h2>{value}</h2><small>{caption}</small></div>; }
function AboutPage({ setPage }) {
  return (
    <SimplePage title="About Us" setPage={setPage} activePage="about">
      <div className="contentCard styledInner bigInfoPage">
        <h1>About Sri HariHara Peetham</h1>
        <p>Sri HariHara Peetham is a local Hindu temple and nonprofit community space serving families in Coppell and the surrounding area.</p>
        <p>Our volunteer program is built around seva — selfless service. Students help with food service, cleanup, event setup, kids activities, cultural programs, and front desk support.</p>
        <p>The goal is to help kids and teens build confidence, responsibility, humility, and leadership while supporting the temple community.</p>
      </div>
    </SimplePage>
  );
}

function WhyJoinPage({ setPage }) {
  return (
    <SimplePage title="Why Join?" setPage={setPage} activePage="why">
      <div className="contentCard styledInner whyJoinPage">
        <h1>Why Join the Volunteer Program?</h1>
        <p>Seva is a simple way to help the temple, meet good people, and grow as a kind, confident leader.</p>
        <div className="whyJoinGrid">
          <div className="whyJoinCard middleSchoolCard">
            <h2>Middle School Students</h2>
            <p>Great for students who are starting to learn responsibility and teamwork.</p>
            <ul>
              <li>Help with kids activities, cleanup, food service, and event setup.</li>
              <li>Build confidence by helping adults and younger children.</li>
              <li>Learn the meaning of seva in a friendly temple environment.</li>
              <li>Start tracking volunteer hours early.</li>
            </ul>
          </div>
          <div className="whyJoinCard highSchoolCard">
            <h2>High School Students</h2>
            <p>Great for leadership, community service, and building strong experience.</p>
            <ul>
              <li>Earn community service hours for school and organizations.</li>
              <li>Build leadership by guiding younger volunteers.</li>
              <li>Add meaningful service experience to resumes and applications.</li>
              <li>Support cultural programs, festivals, front desk, and major temple events.</li>
            </ul>
          </div>
        </div>
        <div className="whyFunRow">
          <span>🧡 Serve</span><span>🤝 Make Friends</span><span>🌟 Lead</span><span>📚 Track Hours</span>
        </div>
      </div>
    </SimplePage>
  );
}

function HowPage({ setPage }) { return <SimplePage title="How It Works" setPage={setPage}><div className="contentCard styledInner"><h1>How the Volunteer Portal Works</h1><div className="steps"><div className="step"><h3>1. Apply</h3><p>Students apply and receive a Student ID immediately. No student password is needed.</p></div><div className="step"><h3>2. Schedule</h3><p>Students pick seva slots from the monthly calendar.</p></div><div className="step"><h3>3. Sign In</h3><p>Students enter the daily admin code when they arrive.</p></div><div className="step"><h3>4. Submit Hours</h3><p>After seva, students submit hours for admin approval.</p></div></div></div></SimplePage>; }
function TierPage({ setPage }) { return <SimplePage title="Tier System" setPage={setPage} activePage="tier"><div className="contentCard styledInner"><h1>Seva Tier System</h1><div className="tierGrid">{tierLevels.map((tier) => <div className="tierCard" key={tier.name}><h3>{tier.name}</h3><p>{tier.min}+ approved hours</p></div>)}</div></div></SimplePage>; }
function ContactPage({ setPage }) {
  return (
    <SimplePage title="Contact Us" setPage={setPage} activePage="contact">
      <div className="contentCard styledInner bigInfoPage contactInfoPage">
        <h1>Contact Sri HariHara Peetham</h1>
        <div className="contactGridLarge">
          <div>
            <h2>Temple Address</h2>
            <p>{templeInfo.address}</p>
            <p><b>Phone:</b> {templeInfo.phone}</p>
            <p><b>Email:</b> {templeInfo.email}</p>
          </div>
          <div>
            <h2>Temple Timings</h2>
            <p><b>Everyday Morning</b></p>
            <div className="timePill">9:30 AM to 12:30 PM</div>
            <p><b>Everyday Evening</b></p>
            <div className="timePill">5:30 PM to 9:30 PM</div>
          </div>
        </div>
      </div>
    </SimplePage>
  );
}

function SimplePage({ title, setPage, activePage = "", children }) {
  const links = [
    ["about", "About Us"],
    ["why", "Why Join?"],
    ["tier", "Tier System"],
    ["contact", "Contact Us"],
  ];

  return (
    <>
      <div className="subPageTop">
        <button className="backHomeBtn" type="button" onClick={() => setPage("home")}>← Back to Home</button>
        <div className="subPageLinks">
          {links.map(([key, label]) => (
            <button key={key} className={activePage === key ? "activeSubPageLink" : ""} type="button" onClick={() => setPage(key)}>
              {label}
            </button>
          ))}
        </div>
        <h3>{title}</h3>
      </div>
      <main className="innerPage">{children}</main>
    </>
  );
}
