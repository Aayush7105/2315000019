import { logFrontendInfo } from "@/lib/logging";
import {
  fetchPriorityInbox,
  type PriorityInboxResponse,
} from "@/lib/priority-inbox";
import NotificationDashboard from "@/components/NotificationDashboard";

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

  return (
    <NotificationDashboard
      notifications={inbox.notifications.slice(0, 10)}
      limit={inbox.limit}
      fetchedCount={inbox.fetchedCount}
    />
  );
}
