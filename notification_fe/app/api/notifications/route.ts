import { logFrontendInfo, withFrontendRequestLogging } from "@/lib/logging";
import { fetchPriorityInbox, rankNotifications, type PriorityInboxResponse } from "@/lib/priority-inbox";

export const dynamic = "force-dynamic";

async function getNotifications(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || 10);
  let inbox: PriorityInboxResponse;

  try {
    inbox = await fetchPriorityInbox(Number.isFinite(limit) && limit > 0 ? limit : 10);
  } catch {
    const fallbackLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    inbox = {
      notifications: rankNotifications(fallbackNotifications, fallbackLimit),
      fetchedCount: fallbackNotifications.length,
      limit: fallbackLimit,
      generatedAt: new Date().toISOString(),
      sourceUrl: "local-fallback",
    } satisfies PriorityInboxResponse;
  }

  await logFrontendInfo({
    packageName: "notifications-api",
    message: "Priority inbox prepared",
    metadata: {
      notificationCount: inbox.notifications.length,
      fetchedCount: inbox.fetchedCount,
      authentication: "pre-authorized",
    },
  });

  return Response.json({
    ...inbox,
    authentication: "pre-authorized",
  });
}

export const GET = withFrontendRequestLogging(getNotifications, {
  packageName: "notifications-api",
  startMessage: "Notification API request received",
  successMessage: "Notification API request completed",
  errorMessage: "Notification API request failed",
});

const fallbackNotifications = [
  {
    ID: "d146095a-0d86-4a34-9e69-3900a14576bc",
    Type: "Result",
    Message: "mid-sem",
    Timestamp: "2026-04-22 17:51:30",
  },
  {
    ID: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
    Type: "Placement",
    Message: "CSX Corporation hiring",
    Timestamp: "2026-04-22 17:51:18",
  },
  {
    ID: "81589ada-0ad3-4f77-9554-f52fb558e09d",
    Type: "Event",
    Message: "farewell",
    Timestamp: "2026-04-22 17:51:06",
  },
  {
    ID: "0005513a-142b-4bbc-8678-eefec65e1ede",
    Type: "Result",
    Message: "mid-sem",
    Timestamp: "2026-04-22 17:50:54",
  },
  {
    ID: "ea836726-c25e-4f21-a72f-544a6af8a37f",
    Type: "Result",
    Message: "project-review",
    Timestamp: "2026-04-22 17:50:42",
  },
  {
    ID: "003cb427-8fc6-47f7-bb00-be228f6b0d2c",
    Type: "Result",
    Message: "external",
    Timestamp: "2026-04-22 17:50:30",
  },
  {
    ID: "e5c4ff20-31bf-4d40-8f02-72fda59e8918",
    Type: "Result",
    Message: "project-review",
    Timestamp: "2026-04-22 17:50:18",
  },
  {
    ID: "1cfce5ee-ad37-4894-8946-d707627176a5",
    Type: "Event",
    Message: "tech-fest",
    Timestamp: "2026-04-22 17:50:06",
  },
  {
    ID: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8",
    Type: "Result",
    Message: "project-review",
    Timestamp: "2026-04-22 17:49:54",
  },
  {
    ID: "8a7412bd-6065-4d09-8501-a37f11cc848b",
    Type: "Placement",
    Message: "Advanced Micro Devices Inc. hiring",
    Timestamp: "2026-04-22 17:49:42",
  },
];
