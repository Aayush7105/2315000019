import { logFrontendInfo } from "@/lib/logging";
import { headers } from "next/headers";
import { type PriorityInboxResponse } from "@/lib/priority-inbox";

export const dynamic = "force-dynamic";

async function getInboxUrl() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const host = requestHeaders.get("host");

  if (host) {
    return `${forwardedProto || "http"}://${host}/api/notifications?limit=10`;
  }

  return process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications?limit=10`
    : "http://localhost:3000/api/notifications?limit=10";
}

export default async function Home() {
  const inboxUrl = await getInboxUrl();
  const response = await fetch(inboxUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load priority inbox: ${response.status}`);
  }

  const inbox = (await response.json()) as PriorityInboxResponse;

  await logFrontendInfo({
    packageName: "home-page",
    message: "Priority inbox rendered",
    metadata: {
      notificationCount: inbox.notifications.length,
      fetchedCount: inbox.fetchedCount,
      sourceUrl: inbox.sourceUrl,
      authentication: "pre-authorized",
    },
  });

  const notifications = inbox.notifications.slice(0, 10);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold text-slate-950">Priority Inbox</h1>
        <p className="mt-2 text-sm text-slate-600">
          Stage 1: fetched notifications through the local middleware-backed route.
        </p>
      </header>

      <section className="mb-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white px-4 py-3">
          <div className="font-medium text-slate-500">Source API</div>
          <div className="mt-1 break-all">{inbox.sourceUrl}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white px-4 py-3">
          <div className="font-medium text-slate-500">Fetched</div>
          <div className="mt-1">{inbox.fetchedCount}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white px-4 py-3">
          <div className="font-medium text-slate-500">Showing top</div>
          <div className="mt-1">{inbox.limit}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Notifications</h2>
        {notifications.length > 0 ? (
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">Rank</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">Title</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">Message</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">Bucket</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">Unread</th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification, index) => (
                  <tr key={notification.id} className="align-top odd:bg-white even:bg-slate-50/60">
                    <td className="border-b border-slate-200 px-4 py-3">{index + 1}</td>
                    <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-950">
                      {notification.title}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                      {notification.message}
                      <div className="mt-1 text-xs text-slate-500">{notification.id}</div>
                      <div className="mt-1 text-xs text-slate-500">{notification.timestamp}</div>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 capitalize">
                      {notification.bucket}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3">
                      {notification.isUnread ? "yes" : "no"}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3">{notification.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No notifications available.
          </p>
        )}
      </section>
    </main>
  );
}
