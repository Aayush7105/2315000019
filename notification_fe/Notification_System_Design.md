# Stage 1

## Objective

Build a Priority Inbox for the campus notifications app that surfaces the top 10 unread notifications first, using a combination of unread state, notification type, and recency.

## Data Flow

- The frontend fetches notifications from the protected Notification API.
- The API response is normalized into a consistent shape with `id`, `title`, `message`, `bucket`, `timestamp`, and unread state.
- The UI renders only the highest-priority 10 items.
- If the protected API is unavailable in the local demo environment, the API route falls back to a bundled sample feed so the inbox can still render for validation screenshots.

## Ranking Model

Priority is computed from three signals:

1. Unread state: unread notifications receive the strongest boost.
2. Type signal: placement notifications outrank event notifications, which outrank result notifications.
3. Recency: newer notifications receive a higher score than older ones.

## Efficient Top-10 Maintenance

The inbox is maintained with a fixed-size min-heap of 10 items. Each incoming notification is scored once, compared against the weakest item currently in the heap, and inserted only if it outranks that item.

This keeps the update cost at `O(n log 10)` for a feed of `n` notifications, while memory stays constant. That is better than sorting the entire feed every time new items arrive.

## Frontend Layout

- A bold hero header explains the inbox state.
- Stat cards summarize feed volume, unread count, and best score.
- The main list shows the ranked top 10 items with reason tags and score bars.
- A side panel explains the ranking model and the maintenance strategy.

## Notes

- No database is used.
- The live inbox path does not hard-code notification state, but the demo route includes a bundled fallback feed for protected-API outages.
- The API remains the source of truth, and the frontend is responsible for ranking and presentation.