# Assignment 9 – Reading List (Full-Stack)

A REST API built with **Node.js + Express 5** (ES modules, in-memory data) and a **React + Vite** client that uses it through a dedicated API module. CORS is handled by the server with the `cors` package — there is no Vite proxy.

## How to install and run

Requirements: Node.js (current LTS) and npm.

### Server (port 3000)

```bash
cd server
npm install
npm run dev      # node --watch server.js
# or
npm start        # node server.js
```

Environment variables (optional, both have defaults):

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port the API listens on |
| `CLIENT_ORIGIN` | `http://localhost:5173` | The only origin allowed by CORS |

Example: `PORT=4000 CLIENT_ORIGIN=http://localhost:5173 npm start`

### Client (port 5173)

```bash
cd client
cp .env.example .env    # sets VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Open http://localhost:5173. The server must be running.

| Variable | Example | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Base URL of the API (read with `import.meta.env.VITE_API_URL`) |

`.env` files and `node_modules` are in `.gitignore` and are not committed.

## File organization

```
/assignment9
├─ server/
│  ├─ server.js        # Express app: middleware, routes, 404 fallback, error handler
│  ├─ booksStore.js    # In-memory data; async functions, immutable updates only
│  ├─ validate.js      # Hand-written validation for books, ids and query options
│  ├─ package.json
│  └─ package-lock.json
├─ client/
│  ├─ src/
│  │  ├─ api/books.js        # All fetch calls + shared request helper
│  │  ├─ components/
│  │  │  ├─ Filters.jsx      # Search, genre, read and sort controls
│  │  │  ├─ BookForm.jsx     # Add (POST) and edit (PUT) form
│  │  │  ├─ BookList.jsx     # List, toggle read / rate (PATCH), delete
│  │  │  └─ StatsPanel.jsx   # GET /api/stats
│  │  ├─ App.jsx             # State, AbortController loading, handlers
│  │  ├─ main.jsx
│  │  └─ index.css
│  ├─ .env.example
│  ├─ index.html
│  ├─ vite.config.js         # React plugin only, no proxy
│  └─ package.json
├─ .gitignore
└─ README.md
```

## API summary

| Method and path | Success | Errors |
|---|---|---|
| `GET /api/books` | 200 | 400 |
| `GET /api/books/:id` | 200 | 400, 404 |
| `POST /api/books` | 201 + `Location` | 400, 409 |
| `PUT /api/books/:id` | 200 | 400, 404, 409 |
| `PATCH /api/books/:id` | 200 | 400, 404, 409 |
| `DELETE /api/books/:id` | 204 (no body) | 400, 404 |
| `GET /api/stats` | 200 | — |

Query options for `GET /api/books`: `genre`, `read`, `q`, `sort` (`title`, `author`, `year`, `rating`; default by id), `order` (`asc`/`desc`), `limit` (1–50, default 50), `page` (default 1). Invalid, unknown or repeated parameters return 400. Unrated books always come last when sorting by rating.

**About `GET /api/crash`:** this route deliberately throws inside an `async` handler to prove that Express 5 forwards the rejected promise to the error-handling middleware, which logs the error and answers `500 { "error": "Something went wrong" }` without a stack trace. It is kept on purpose and documented here.

## Testing evidence (curl --include)

All output below is real output from this server, captured after a fresh start (seed data).

#### 1. GET /api/stats (before changes) — 200
```
$ curl --include -s http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 111
ETag: W/"6f-JvXDmIif6zwDCKQ3nP8/0IEPgEE"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":6,"read":4,"unread":2,"averageRating":4.5,"byGenre":{"fantasy":2,"fiction":2,"science":1,"history":1}}
```

#### 2. List with two query parameters — 200
```
$ curl --include -s 'http://localhost:3000/api/books?read=true&sort=rating&order=desc'
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 442
ETag: W/"1ba-iEAenC/TqijdZHJ8nHD4qhrA+F8"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":5},{"id":6,"title":"The Name of the Wind","author":"Patrick Rothfuss","year":2007,"genre":"fantasy","read":true,"rating":5},{"id":2,"title":"1984","author":"George Orwell","year":1949,"genre":"fiction","read":true,"rating":4},{"id":4,"title":"Sapiens","author":"Yuval Noah Harari","year":2011,"genre":"history","read":true,"rating":4}]
```

#### 3. One book — 200
```
$ curl --include -s http://localhost:3000/api/books/1
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 108
ETag: W/"6c-wksYbf6e3ZJvQpjSjKuybvZ7BPQ"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":1,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":5}
```

#### 4. Create — 201 with Location header
```
$ curl --include -s -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"Cosmos","author":"Carl Sagan","year":1980,"genre":"science"}'
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Location: /api/books/7
Content-Type: application/json; charset=utf-8
Content-Length: 104
ETag: W/"68-uVi4dmo0zj/pOVyXCji8yfYzh9o"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"title":"Cosmos","author":"Carl Sagan","year":1980,"genre":"science","read":false,"rating":null,"id":7}
```

#### 5. Invalid body — 400
```
$ curl --include -s -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"Future Book","author":"Someone","year":3000,"genre":"fiction"}'
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 57
ETag: W/"39-2hxkQVGUygT77eAZY8u2BQSh9Ts"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"year must be an integer between 1000 and 2026"}
```

#### 6. Repeated query parameter — 400
```
$ curl --include -s 'http://localhost:3000/api/books?genre=fiction&genre=history'
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 59
ETag: W/"3b-+Pyzvh5O/cfvrJPVG80NrWCNuKM"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Query parameter \"genre\" must appear only once"}
```

#### 7. Missing book — 404
```
$ curl --include -s http://localhost:3000/api/books/999
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 38
ETag: W/"26-NCNuNg8Bq8kpSh64K6XedJL3BrE"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book with id 999 not found"}
```

#### 8. Duplicate (case-insensitive) — 409
```
$ curl --include -s -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"the hobbit","author":"j.r.r. tolkien","year":1937,"genre":"fantasy"}'
HTTP/1.1 409 Conflict
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 60
ETag: W/"3c-YJy0XpDp5agPe/8cl8QkvyagI8A"
Date: Tue, 24 Nov 2026 20:20:51 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"A book with this title and author already exists"}
```

#### 9. PATCH book 7 — only the sent field changes
```
$ curl --include -s -X PATCH http://localhost:3000/api/books/7 -H 'Content-Type: application/json' -d '{"read":true,"rating":5}'
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 100
ETag: W/"64-/ts9con/OYrAmc1rWXTzuDXcppc"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"title":"Cosmos","author":"Carl Sagan","year":1980,"genre":"science","read":true,"rating":5,"id":7}
```

#### 10. PUT book 7 — complete replacement (fields not sent fall back to defaults: read=false, rating=null)
```
$ curl --include -s -X PUT http://localhost:3000/api/books/7 -H 'Content-Type: application/json' -d '{"title":"Cosmos","author":"Carl Sagan","year":1980,"genre":"science"}'
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 104
ETag: W/"68-uVi4dmo0zj/pOVyXCji8yfYzh9o"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"title":"Cosmos","author":"Carl Sagan","year":1980,"genre":"science","read":false,"rating":null,"id":7}
```

#### 11. DELETE — 204
```
$ curl --include -s -X DELETE http://localhost:3000/api/books/7
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5


```

#### 12. Same DELETE repeated — 404
```
$ curl --include -s -X DELETE http://localhost:3000/api/books/7
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 36
ETag: W/"24-HIfh0codT9o3vSyTciAegQybDnI"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book with id 7 not found"}
```

#### 13. Invalid id — 400
```
$ curl --include -s http://localhost:3000/api/books/abc
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 41
ETag: W/"29-eiZTR092ClXGPeHi/BDwiytO0ew"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"id must be a positive integer"}
```

#### 14. Malformed JSON — 400 (JSON, not HTML)
```
$ curl --include -s -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title": '
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 42
ETag: W/"2a-Kp6r6EoQdfa9J08PVdn0M1MJ9NY"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON in request body"}
```

#### 15. Unknown /api route — 404
```
$ curl --include -s http://localhost:3000/api/unknown
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

#### 16. Deliberate crash route — 500
```
$ curl --include -s http://localhost:3000/api/crash
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 32
ETag: W/"20-cI8B1wZuBEyTE5ClDvphKZx7wd0"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Something went wrong"}
```

#### 17. PATCH on book 2 then GET /api/stats (after change)
```
$ curl -s -X PATCH http://localhost:3000/api/books/2 -H 'Content-Type: application/json' -d '{"rating":2}' > /dev/null && curl --include -s http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 109
ETag: W/"6d-wSNUq8K2XvZ7c7L+tNMDx9ojpS4"
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":6,"read":4,"unread":2,"averageRating":4,"byGenre":{"fantasy":2,"fiction":2,"science":1,"history":1}}
```

#### 18. CORS preflight (OPTIONS) as the browser sends it
```
$ curl --include -s -X OPTIONS http://localhost:3000/api/books/1 -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type'
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Content-Length: 0
Date: Tue, 24 Nov 2026 20:20:52 GMT
Connection: keep-alive
Keep-Alive: timeout=5


```

### Preflight in the browser's Network tab (written description)

When the client sends a `PATCH` (toggle read / set rating) or `PUT` with `Content-Type: application/json`, the request is not a "simple" request, so the browser first sends an **OPTIONS** preflight to the same URL (for example `OPTIONS /api/books/2`). In the Network tab this OPTIONS row appears just before the real PATCH row, with status **204 No Content**. Its request headers include `Origin: http://localhost:5173`, `Access-Control-Request-Method: PATCH` and `Access-Control-Request-Headers: content-type`. Its response headers are the ones shown in request 18 above: `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE`, `Access-Control-Allow-Headers: content-type` and `Vary: Origin, Access-Control-Request-Headers`. Only after this succeeds does the browser send the real PATCH. Simple GET requests have no preflight; they just get the `Access-Control-Allow-Origin` header on the response.

## Reasoning questions

**Parameters.** The `id` identifies one specific resource, so it is part of the path: `/api/books/3` *is* book 3. `genre` and `sort` do not identify a resource; they only change how the same collection is filtered or shown, so they are optional query parameters. If the id were in the query string (`/api/books?id=3`) the URL would describe "the list, filtered by id", which would return an array (maybe empty) instead of one book, and a missing book would naturally be a 200 with `[]` instead of a clear 404.

**Body parsing (experiment).** I moved `app.use(express.json())` below the routes and sent a valid POST. `req.body` was `undefined` inside the route, because the JSON parser had not run yet when the handler executed. My validation therefore answered `400 Bad Request` with `{"error":"Request body must be a JSON object"}`, even though the JSON I sent was correct.

**One response (experiment).** I removed the `return` before `res.status(404)` in `GET /api/books/:id` and requested `/api/books/999`. The client still received the 404, but the server log showed `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`. Without `return`, the function kept running and reached `res.status(200).json(book)`, trying to send a second response for the same request, which is not possible because the first one was already sent.

**PUT and PATCH.** PATCH is the better choice for the "Read" checkbox and the rating select: the client only knows that one field changed, so it sends `{ "read": true }` and the rest of the book stays the same (request 9). PUT is the better choice for the edit form, where the user sees and submits every field: it replaces the whole book, and any field not sent goes back to its default, as request 10 shows (`read` became `false` and `rating` became `null` because they were not in the body).

**CORS (experiment).** I started the server with `CLIENT_ORIGIN=http://localhost:9999`. The server still logged the request (`GET /api/books/1`) and answered 200, but with `Access-Control-Allow-Origin: http://localhost:9999`, which does not match the page's origin `http://localhost:5173`. Because of that, the browser blocks the response from JavaScript and the console shows a CORS error saying the request "has been blocked by CORS policy" since the allowed origin is not equal to the supplied origin, so the list shows an error. `curl` still works because CORS is enforced by browsers, not by servers: curl does not check the `Access-Control-Allow-Origin` header at all.

**Validation.** Client-side checks only exist for a better user experience; anyone can bypass them with curl, Postman or the browser's dev tools and send any JSON directly to the API. Also some rules, like the duplicate title/author check, can only be checked on the server because only the server has all the data. So the server is the real source of truth and must validate every request again.

**State.** After restarting the server, every book I had added, edited or deleted was gone and the list was back to the 6 seed books with ids starting again from 7. This shows the data lives only in the memory of the Node.js process (a JavaScript variable in `booksStore.js`), so it disappears when the process stops. To keep it, the data must be stored outside the process, for example in a file or (better) a database.

## Self-study notes

- **`URLSearchParams`** (MDN): builds a query string and encodes values automatically, so a search like `harry & co` becomes `q=harry+%26+co` and cannot break the URL. In `api/books.js` I add only the non-empty filters with `params.set()` and append `params.toString()` to the path.
- **`localeCompare`** (MDN): compares two strings by alphabetical order for a language and returns a negative, zero or positive number, which is exactly what `Array.prototype.sort` needs. I use `a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })` so that upper/lower case does not affect the order. I sort a copy (`[...result].sort()`) so the stored array is not changed.
- **`import.meta.env` in Vite** (Vite docs, "Env Variables and Modes"): Vite reads `.env` files and exposes variables on `import.meta.env` at build time. Only variables starting with `VITE_` are exposed to client code; this prefix is a safety feature so secrets in `.env` are not accidentally bundled into the JavaScript sent to the browser. The client uses `import.meta.env.VITE_API_URL`.
- **Empty 204 response in Express 5** (Express docs): `res.status(204).end()` sends the status with no body. Sending JSON with a 204 is wrong because a 204 must not have a body. On the client, the helper checks `response.status === 204` and returns `null` instead of calling `response.json()`, which would fail on an empty body.
- **Cancelling fetch with `AbortController`** (MDN): passing `controller.signal` to `fetch` lets me cancel the request with `controller.abort()`. The `useEffect` that loads the list returns `() => controller.abort()` as cleanup, so when a filter changes the old request is cancelled. A cancelled fetch rejects with an error whose `name` is `"AbortError"`; I ignore that error so it is not shown to the user and an old response can never overwrite a newer one.
- **Express 5 and async errors:** in Express 5, a rejected promise from an `async` handler is passed to the error middleware automatically, so no try/catch wrapper is needed (proven by `GET /api/crash`). Malformed JSON from `express.json()` reaches the same error middleware with `err.type === 'entity.parse.failed'`, which I turn into a JSON 400.

## Challenges

- **Repeated query parameters:** Express parses `?genre=a&genre=b` into an array, so I check that every query value is a string and return 400 otherwise.
- **PATCH validation:** a PATCH like `{ "rating": 4 }` on an unread book is invalid even though the field itself is fine. I solved this by merging the existing book with the allowed fields from the body and validating the merged book with the same function used for POST and PUT.
- **Rating sort:** unrated books had to stay at the end in both directions, so I sort the rated books separately and append the unrated ones afterwards.
- **Not updating the UI too early:** the client changes state only after the server confirms, then reloads the list and the statistics so filters and sorting stay correct.
