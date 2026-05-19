# ICON Platform — API Routes Reference

## Base URL: `/api/v1`

## Authentication

All protected endpoints require `Authorization: Bearer <token>` header.

---

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register with university email |
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/logout` | Logout / invalidate token |
| POST | `/auth/oauth/google` | Google OAuth callback |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/verify-email` | Verify university email with token |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password with token |

---

### Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile |
| GET | `/users/:id` | Get public profile |
| GET | `/users/:id/posts` | Get user's posts |
| POST | `/users/:id/follow` | Follow a user |
| DELETE | `/users/:id/follow` | Unfollow |

---

### Posts
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/posts` | Get feed (with pagination) |
| POST | `/posts` | Create a post |
| GET | `/posts/:id` | Get single post |
| PATCH | `/posts/:id` | Edit post (author only) |
| DELETE | `/posts/:id` | Delete post |
| POST | `/posts/:id/like` | Toggle like |
| POST | `/posts/:id/save` | Toggle save |
| GET | `/posts/:id/comments` | Get comments |
| POST | `/posts/:id/comments` | Add comment |
| DELETE | `/posts/:postId/comments/:commentId` | Delete comment |

**Query params for GET /posts:**
- `university` — filter by university ID
- `type` — post, announcement, event, alert
- `tag` — filter by tag
- `cursor` — pagination cursor
- `limit` — default 20

---

### Jobs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/jobs` | List jobs with filters |
| POST | `/jobs` | Create job (admin/company) |
| GET | `/jobs/:id` | Get job details |
| POST | `/jobs/:id/apply` | Apply to job |
| POST | `/jobs/:id/save` | Toggle save |
| GET | `/jobs/saved` | Get saved jobs |
| GET | `/jobs/recommended` | AI-recommended jobs for user |

**Query params for GET /jobs:**
- `type` — part-time, internship, research, etc.
- `visa` — D-2, D-4, F-2, etc.
- `search` — full-text search
- `university` — near university
- `salary_min` / `salary_max`
- `cursor`, `limit`

---

### Universities
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/universities` | List all universities |
| GET | `/universities/:id` | Get university details |
| GET | `/universities/:id/ambassadors` | Get ambassadors |
| GET | `/universities/:id/announcements` | Get announcements |
| GET | `/universities/:id/posts` | Get university feed |

---

### Ambassadors
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/ambassadors/apply` | Apply to be ambassador |
| GET | `/ambassadors/:id` | Get ambassador profile |
| POST | `/ambassadors/announcements` | Post announcement (ambassador only) |

---

### Support
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/support/guides` | List guides (by category) |
| GET | `/support/guides/:slug` | Get guide content |
| POST | `/support/guides/:id/helpful` | Mark as helpful |
| GET | `/support/categories` | List categories |

---

### AI
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/ai/chat` | Send message to AI assistant |
| GET | `/ai/sessions` | Get user's AI sessions |
| GET | `/ai/sessions/:id` | Get session history |
| POST | `/ai/translate` | Translate Korean ↔ English |
| GET | `/ai/recommendations/jobs` | AI job recommendations |
| GET | `/ai/recommendations/guides` | Relevant support guides |

---

### Notifications
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/notifications` | Get notifications (paginated) |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all as read |

---

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cursor": "...",
    "total": 100,
    "hasMore": true
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

## Rate Limiting
- Standard endpoints: 100 req/min per user
- AI endpoints: 20 req/min per user
- Auth endpoints: 10 req/min per IP

## WebSocket Events (for real-time features)
```
ws://api.icon.study/ws

Events emitted by server:
- notification:new   { notification }
- post:liked         { postId, count }
- comment:new        { postId, comment }
- announcement:new   { announcement }
- user:online        { userId }
```
