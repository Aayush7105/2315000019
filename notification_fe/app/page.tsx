import { FiBell, FiTrendingUp, FiInbox } from "react-icons/fi";
import { logFrontendInfo } from "@/lib/logging";
import {
  fetchPriorityInbox,
  type PriorityInboxResponse,
} from "@/lib/priority-inbox";

export const dynamic = "force-dynamic";

export default async function Home() {
  const inbox = (await fetchPriorityInbox(10)) as PriorityInboxResponse;

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
    <div className="flex h-screen overflow-hidden bg-[#f6f8fc]">
      {/* SIDEBAR */}
      <aside className="hidden w-[260px] shrink-0 bg-[#f8fafd] p-4 lg:block">
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <FiInbox size={20} />
          </div>

          <div>
            <h1 className="text-xl font-bold">CampusInbox</h1>
            <p className="text-xs text-slate-500">Student Mail</p>
          </div>
        </div>

        <button className="mb-6 flex w-full items-center gap-3 rounded-2xl bg-sky-100 px-5 py-4 text-left font-medium shadow-sm">
          <FiBell />
          Compose Notice
        </button>

        <nav className="space-y-1">
          <div className="flex items-center justify-between rounded-r-full bg-indigo-100 px-4 py-3 font-semibold text-indigo-700">
            <span>Inbox</span>
            <span>{notifications.length}</span>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-r-full">
            <span>Placements</span>
            <span>
              {notifications.filter((n) => n.bucket === "placement").length}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-r-full">
            <span>Academics</span>
            <span>
              {notifications.filter((n) => n.bucket === "result").length}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-r-full">
            <span>Events</span>
            <span>
              {notifications.filter((n) => n.bucket === "event").length}
            </span>
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-full bg-[#eaf1fb] px-5 py-3">
              <svg
                className="h-5 w-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>

              <input
                placeholder="Search notifications"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex border-b bg-white">
          <button className="flex flex-1 items-center justify-center gap-2 border-b-4 border-indigo-600 py-4 font-medium text-indigo-600">
            Placements
          </button>

          <button className="flex flex-1 items-center justify-center gap-2 py-4 text-slate-500 hover:bg-slate-50">
            Academics
          </button>

          <button className="flex flex-1 items-center justify-center gap-2 py-4 text-slate-500 hover:bg-slate-50">
            Events
          </button>

          <button className="flex flex-1 items-center justify-center gap-2 py-4 text-slate-500 hover:bg-slate-50">
            Important
          </button>
        </div>

        {/* INBOX */}
        <div className="flex-1 overflow-y-auto bg-white">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="
              flex
              items-center
              gap-4
              border-b
              border-slate-100
              px-4
              py-3
              hover:cursor-pointer
              hover:bg-slate-50
              hover:shadow-sm
            "
            >
              {/* Checkbox */}
              <input type="checkbox" className="h-4 w-4" />

              {/* Star */}
              <span className="text-slate-300">★</span>

              {/* Sender */}
              <div className="w-[220px] truncate font-semibold text-slate-800">
                {notification.bucket === "placement"
                  ? "Placement Cell"
                  : notification.bucket === "event"
                    ? "Event Committee"
                    : "Academic Office"}
              </div>

              {/* Subject */}
              <div className="flex-1 truncate">
                <span
                  className={
                    notification.isUnread
                      ? "font-bold text-slate-900"
                      : "font-medium text-slate-700"
                  }
                >
                  {notification.title}
                </span>

                <span className="text-slate-500">
                  {" "}
                  - {notification.message}
                </span>
              </div>

              {/* Score Badge */}
              <div className="hidden rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 md:block">
                {notification.score}
              </div>

              {/* Date */}
              <div className="w-[90px] text-right text-xs font-medium text-slate-500">
                {new Date(notification.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
