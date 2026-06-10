type RawNotificationRecord = Record<string, unknown>;

export type NotificationBucket = "placement" | "event" | "result" | "other";

export type PriorityInboxNotification = {
  id: string;
  title: string;
  message: string;
  bucket: NotificationBucket;
  timestamp: string;
  timestampMs: number;
  isUnread: boolean;
  score: number;
  reasons: string[];
};

export type PriorityInboxResponse = {
  notifications: PriorityInboxNotification[];
  fetchedCount: number;
  limit: number;
  generatedAt: string;
  sourceUrl: string;
};

const DEFAULT_NOTIFICATION_API_URL =
  process.env.NOTIFICATION_API_URL ?? "http://4.224.186.213/evaluation-service/notifications";

const FALLBACK_NOTIFICATION_RECORDS: RawNotificationRecord[] = [
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

function toText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1", "unread", "pending"].includes(normalized)) {
      return true;
    }
    if (["false", "no", "0", "read", "seen"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function parseTimestamp(value: unknown) {
  const text = toText(value);
  const timestampMs = Date.parse(text);

  if (Number.isNaN(timestampMs)) {
    return { timestamp: new Date().toISOString(), timestampMs: Date.now() };
  }

  return { timestamp: new Date(timestampMs).toISOString(), timestampMs };
}

function classifyBucket(record: RawNotificationRecord) {
  const typeText = `${toText(record.Type) || toText(record.type)}`.trim().toLowerCase();
  const messageText = `${toText(record.Message) || toText(record.message)}`.trim().toLowerCase();

  if (typeText.includes("placement") || messageText.includes("placement")) {
    return "placement" as const;
  }

  if (typeText.includes("event") || messageText.includes("event")) {
    return "event" as const;
  }

  if (typeText.includes("result") || messageText.includes("result")) {
    return "result" as const;
  }

  return "other" as const;
}

function bucketWeight(bucket: NotificationBucket) {
  switch (bucket) {
    case "placement":
      return 100;
    case "event":
      return 80;
    case "result":
      return 60;
    default:
      return 40;
  }
}

function freshWeight(timestampMs: number) {
  const ageMinutes = Math.max(0, (Date.now() - timestampMs) / 60000);
  return Math.max(0, 40 - ageMinutes * 0.75);
}

function collectReasons(record: RawNotificationRecord, bucket: NotificationBucket, timestampMs: number) {
  const reasons = [];

  if (toBoolean(record.unread) !== false && toBoolean(record.read) !== true) {
    reasons.push("Unread");
  }

  if (bucket === "placement") {
    reasons.push("Placement signal");
  } else if (bucket === "event") {
    reasons.push("Event signal");
  } else if (bucket === "result") {
    reasons.push("Result signal");
  }

  const ageMinutes = Math.max(0, (Date.now() - timestampMs) / 60000);
  if (ageMinutes <= 30) {
    reasons.push("Fresh");
  } else if (ageMinutes <= 180) {
    reasons.push("Recent");
  }

  return reasons;
}

function normalizeNotification(record: RawNotificationRecord, index: number): PriorityInboxNotification {
  const { timestamp, timestampMs } = parseTimestamp(
    record.Timestamp ?? record.timestamp ?? record.createdAt ?? record.receivedAt,
  );
  const bucket = classifyBucket(record);
  const title =
    toText(record.Title) ||
    toText(record.title) ||
    toText(record.Type) ||
    toText(record.type) ||
    `Notification ${index + 1}`;
  const message =
    toText(record.Message) ||
    toText(record.message) ||
    toText(record.summary) ||
    "No notification message was provided.";
  const unreadValue = toBoolean(record.unread);
  const readValue = toBoolean(record.read);
  const isUnread = unreadValue ?? (readValue === undefined ? true : !readValue);
  const score = Math.round((isUnread ? 120 : 0) + bucketWeight(bucket) + freshWeight(timestampMs));

  return {
    id: toText(record.ID) || toText(record.id) || `notification-${index + 1}`,
    title,
    message,
    bucket,
    timestamp,
    timestampMs,
    isUnread,
    score,
    reasons: collectReasons(record, bucket, timestampMs),
  };
}

function comparePriority(a: PriorityInboxNotification, b: PriorityInboxNotification) {
  if (a.score !== b.score) {
    return a.score - b.score;
  }

  if (a.timestampMs !== b.timestampMs) {
    return a.timestampMs - b.timestampMs;
  }

  return a.id.localeCompare(b.id);
}

class FixedSizeTopN {
  private heap: PriorityInboxNotification[] = [];

  constructor(private readonly limit: number) {}

  push(notification: PriorityInboxNotification) {
    if (this.limit <= 0) {
      return;
    }

    if (this.heap.length < this.limit) {
      this.heap.push(notification);
      this.bubbleUp(this.heap.length - 1);
      return;
    }

    if (comparePriority(notification, this.heap[0]) <= 0) {
      return;
    }

    this.heap[0] = notification;
    this.sinkDown(0);
  }

  toSortedArray() {
    return [...this.heap].sort((left, right) => comparePriority(right, left));
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (comparePriority(this.heap[index], this.heap[parentIndex]) >= 0) {
        break;
      }

      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      let smallest = index;

      if (
        leftIndex < this.heap.length &&
        comparePriority(this.heap[leftIndex], this.heap[smallest]) < 0
      ) {
        smallest = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        comparePriority(this.heap[rightIndex], this.heap[smallest]) < 0
      ) {
        smallest = rightIndex;
      }

      if (smallest === index) {
        break;
      }

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

function extractNotificationRecords(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as RawNotificationRecord[];
  }

  if (payload && typeof payload === "object") {
    const value = payload as { notifications?: unknown };
    if (Array.isArray(value.notifications)) {
      return value.notifications as RawNotificationRecord[];
    }
  }

  return [] as RawNotificationRecord[];
}

export function rankNotifications(records: RawNotificationRecord[], limit = 10) {
  const topN = new FixedSizeTopN(limit);

  records.forEach((record, index) => {
    topN.push(normalizeNotification(record, index));
  });

  return topN.toSortedArray();
}

export async function fetchPriorityInbox(limit = 10, sourceUrl = DEFAULT_NOTIFICATION_API_URL) {
  let records: RawNotificationRecord[] = [];

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(process.env.NOTIFICATION_API_TOKEN
          ? { authorization: `Bearer ${process.env.NOTIFICATION_API_TOKEN}` }
          : {}),
        ...(process.env.NOTIFICATION_API_KEY ? { "x-api-key": process.env.NOTIFICATION_API_KEY } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as unknown;
    records = extractNotificationRecords(payload);
  } catch {
    records = FALLBACK_NOTIFICATION_RECORDS;
    sourceUrl = "local-fallback";
  }

  const notifications = rankNotifications(records, limit);

  return {
    notifications,
    fetchedCount: records.length,
    limit,
    generatedAt: new Date().toISOString(),
    sourceUrl,
  } satisfies PriorityInboxResponse;
}

export function formatRelativeTime(timestamp: string) {
  const timestampMs = Date.parse(timestamp);

  if (Number.isNaN(timestampMs)) {
    return "Unknown";
  }

  const deltaMinutes = Math.max(0, Math.round((Date.now() - timestampMs) / 60000));

  if (deltaMinutes < 1) {
    return "Just now";
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const hours = Math.floor(deltaMinutes / 60);
  const minutes = deltaMinutes % 60;

  return minutes === 0 ? `${hours}h ago` : `${hours}h ${minutes}m ago`;
}

export function formatBucket(bucket: NotificationBucket) {
  return bucket.charAt(0).toUpperCase() + bucket.slice(1);
}