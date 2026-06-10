"use client";

import { useMemo, useState } from "react";
import {
  FiBell,
  FiBarChart2,
  FiSettings,
  FiSearch,
  FiBriefcase,
  FiCalendar,
  FiBookOpen,
  FiEye,
} from "react-icons/fi";

import { BsLightningChargeFill } from "react-icons/bs";

interface Notification {
  id: string;
  title: string;
  message: string;
  bucket: string;
  score: number;
  timestamp: string;
  isUnread: boolean;
}

export default function NotificationDashboard({
  notifications,
  limit,
  fetchedCount,
}: {
  notifications: Notification[];
  limit: number;
  fetchedCount: number;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const categoryMatch = filter === "all" || n.bucket === filter;

      const searchMatch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [notifications, filter, search]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const placementCount = notifications.filter(
    (n) => n.bucket === "placement",
  ).length;

  const categoryIcon = (bucket: string) => {
    switch (bucket) {
      case "placement":
        return <FiBriefcase />;
      case "event":
        return <FiCalendar />;
      case "result":
        return <FiBookOpen />;
      default:
        return <FiBell />;
    }
  };

  const categoryStyle = (bucket: string) => {
    switch (bucket) {
      case "placement":
        return "bg-indigo-100 text-indigo-700";
      case "event":
        return "bg-amber-100 text-amber-700";
      case "result":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">
            CAMPUS
            <span className="font-light text-indigo-500">HUB</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white">
            <FiBell />
            Inbox
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-100">
            <FiBarChart2 />
            Analytics
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-100">
            <FiSettings />
            Settings
          </button>
        </nav>
      </aside>

      <main className="flex-1 lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h2 className="font-bold">Priority Inbox</h2>
              <p className="text-xs text-slate-500">Smart notification feed</p>
            </div>

            <div className="relative w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs uppercase text-slate-400">
                Total Notifications
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {notifications.length}
              </h3>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs uppercase text-slate-400">Unread</p>
              <h3 className="mt-2 text-3xl font-bold text-indigo-600">
                {unreadCount}
              </h3>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs uppercase text-slate-400">
                Placement Updates
              </p>
              <h3 className="mt-2 text-3xl font-bold">{placementCount}</h3>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "placement", label: "Placement" },
              { id: "event", label: "Events" },
              { id: "result", label: "Academic" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === item.id
                    ? "bg-slate-900 text-white"
                    : "border bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${categoryStyle(
                          notif.bucket,
                        )}`}
                      >
                        {categoryIcon(notif.bucket)}
                        {notif.bucket}
                      </span>

                      {notif.isUnread && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      )}
                    </div>

                    <h3 className="text-lg font-semibold">{notif.title}</h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {notif.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>ID: {notif.id.slice(0, 8)}</span>
                      <span>Score: {notif.score}</span>
                      <span>
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BsLightningChargeFill className="text-xl text-indigo-500" />

                    <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                      <FiEye />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold">No notifications found</h3>
              <p className="text-slate-500">
                Try another filter or search term.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
