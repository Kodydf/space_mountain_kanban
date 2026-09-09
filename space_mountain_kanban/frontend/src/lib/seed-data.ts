import type { BoardState } from "./types";

export const seedBoard: BoardState = {
  columns: [
    { id: "col-1", title: "To Do" },
    { id: "col-2", title: "In Progress" },
    { id: "col-3", title: "Review" },
    { id: "col-4", title: "Blocked" },
    { id: "col-5", title: "Done" },
  ],
  cards: [
    {
      id: "card-1",
      title: "Design onboarding flow",
      details: "Sketch the first-run experience for new users.",
      columnId: "col-1",
      dueDate: "2026-09-25",
    },
    {
      id: "card-2",
      title: "Set up analytics",
      details: "Wire up basic event tracking for the dashboard.",
      columnId: "col-1",
      dueDate: "2026-09-03",
    },
    {
      id: "card-3",
      title: "Build settings page",
      details: "Account and notification preferences.",
      columnId: "col-2",
      dueDate: "2026-09-12",
    },
    {
      id: "card-4",
      title: "Refactor auth module",
      details: "Simplify token refresh logic.",
      columnId: "col-2",
      dueDate: "2026-08-28",
    },
    {
      id: "card-5",
      title: "Review pull request #142",
      details: "Check the new pagination component.",
      columnId: "col-3",
      dueDate: "2026-09-07",
    },
    {
      id: "card-6",
      title: "Waiting on design assets",
      details: "Blocked until the icon set is delivered.",
      columnId: "col-4",
      dueDate: null,
    },
    {
      id: "card-7",
      title: "Launch marketing site",
      details: "Published the new landing page.",
      columnId: "col-5",
      dueDate: "2026-08-20",
    },
    {
      id: "card-8",
      title: "Migrate database schema",
      details: "Applied the v2 schema migration in production.",
      columnId: "col-5",
      dueDate: "2026-09-01",
    },
  ],
};
