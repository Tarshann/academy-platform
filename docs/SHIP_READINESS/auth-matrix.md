# Auth + Role Enforcement Matrix

| Surface | Identifier                    | Access        | Notes                                                 |
| ------- | ----------------------------- | ------------- | ----------------------------------------------------- |
| Route   | `/signup`                     | Public        | Guest checkout supported.                             |
| Route   | `/sign-in`                    | Public        | Clerk/OAuth.                                          |
| Route   | `/member`                     | Auth required | Redirects unauthenticated users.                      |
| Route   | `/orders`                     | Auth required | Shop order history.                                   |
| Route   | `/guardian`                   | Auth required | Guardian dashboard with linked athletes.              |
| Route   | `/chat`                       | Auth required | Chat token required; UI gated when realtime disabled. |
| Route   | `/settings`                   | Auth required | Notification preferences.                             |
| Route   | `/admin`                      | Admin only    | Role enforced server-side.                            |
| API     | `auth.me`                     | Public        | Returns session user or null.                         |
| API     | `auth.chatToken`              | Auth required | Issues short-lived chat token.                        |
| API     | `programs.list`               | Public        |                                                       |
| API     | `schedules.register`          | Auth required | Enforces capacity + duplication checks.               |
| API     | `announcements.list`          | Auth required |                                                       |
| API     | `shop.createCheckout`         | Auth required | Idempotency key supported.                            |
| API     | `payment.createCheckout`      | Auth required | Idempotency key supported.                            |
| API     | `payment.createGuestCheckout` | Public        | Guest checkout requires email.                        |
| API     | `guardian.getMyLinks`         | Auth required | Parent/guardian link listing.                         |
| API     | `guardian.linkChildByEmail`   | Auth required | Links athlete by email.                               |
| API     | `guardian.getAttendance`      | Auth required | Attendance history for linked athletes.               |
| API     | `admin.*`                     | Admin only    | CRUD operations.                                      |
