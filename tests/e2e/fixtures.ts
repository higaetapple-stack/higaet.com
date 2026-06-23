import { test as base, expect, type Page } from "@playwright/test";

export type RoleKey = "student" | "counselor" | "faculty" | "admin" | "guest";

export const TEST_USERS: Record<Exclude<RoleKey, "guest">, { email: string; dashboard: string }> = {
  student: { email: "student.test@higaet.dev", dashboard: "/dashboard" },
  counselor: { email: "counselor.test@higaet.dev", dashboard: "/dashboard/counselor" },
  faculty: { email: "faculty.test@higaet.dev", dashboard: "/dashboard/faculty" },
  admin: { email: "admin.test@higaet.dev", dashboard: "/dashboard/admin" },
};

export const PASSWORD = process.env.TEST_FIXTURE_PASSWORD ?? "";

export async function signIn(page: Page, role: Exclude<RoleKey, "guest">) {
  if (!PASSWORD) throw new Error("TEST_FIXTURE_PASSWORD not set");
  const user = TEST_USERS[role];
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"));
}

export const test = base;
export { expect };
