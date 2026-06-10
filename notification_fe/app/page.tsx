import {
  FiBell,
  FiInbox,
  FiSearch,
  FiBriefcase,
  FiBookOpen,
  FiCalendar,
} from "react-icons/fi";

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
    },
  });

  const notifications = inbox.notifications.slice(0, 10);

  const counts = {
    placement: notifications.filter((n) => n.bucket === "placement").length,

    result: notifications.filter((n) => n.bucket === "result").length,

    event: notifications.filter((n) => n.bucket === "event").length,
  };

  const sidebarItems = [
    {
      icon: <FiInbox />,
      label: "Inbox",
      count: notifications.length,
      active: true,
    },
    {
      icon: <FiBriefcase />,
      label: "Placements",
      count: counts.placement,
    },
    {
      icon: <FiBookOpen />,
      label: "Academics",
      count: counts.result,
    },
    {
      icon: <FiCalendar />,
      label: "Events",
      count: counts.event,
    },
  ];

  const tabs = ["Placements", "Academics", "Events", "Important"];

  const getSender = (bucket: string) => {
    switch (bucket) {
      case "placement":
        return "Placement Cell";
      case "event":
        return "Event Committee";
      case "result":
        return "Academic Office";
      default:
        return "Campus Office";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fc]">
      {/* SIDEBAR */}
      <aside className="hidden w-[260px] shrink-0 bg-[#f8fafd] p-4 lg:block">
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <FiInbox size={20} />
          </div>

          <div>
            <h1 className="text-xl font-bold">CampusInbox</h1>

            <p className="text-xs text-slate-500">Student Mail</p>
          </div>
        </div>

        <button className="mb-6 flex w-full items-center gap-3 rounded-2xl bg-sky-100 px-5 py-4 font-medium text-sky-700 shadow-sm">
          <FiBell />
          Notifications
        </button>

        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-r-full px-4 py-3 transition ${
                item.active
                  ? "bg-indigo-100 font-semibold text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>

              <span>{item.count}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* SEARCH */}
        <div className="border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-full bg-[#eaf1fb] px-5 py-3">
              <FiSearch className="text-slate-500" />

              <input
                placeholder="Search notifications"
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b bg-white">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm transition ${
                index === 0
                  ? "border-b-4 border-indigo-600 font-medium text-indigo-600"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="text-sm text-slate-500">
            Showing {notifications.length} notifications
          </div>

          <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            {notifications.filter((n) => n.isUnread).length} Unread
          </div>
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
                transition
                hover:cursor-pointer
                hover:bg-slate-50
              "
            >
              <input type="checkbox" className="h-4 w-4" />

              <span className="text-slate-300">★</span>

              <div className="w-[220px] truncate font-semibold text-slate-800">
                {getSender(notification.bucket)}
              </div>

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
                  {" - "}
                  {notification.message}
                </span>
              </div>

              <div className="hidden rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 md:block">
                {notification.score}
              </div>

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
