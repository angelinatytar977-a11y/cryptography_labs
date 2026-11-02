// =============================================
// Лабораторна №2
// Вебсервер з авторизацією (SHA256) і JWT
// =============================================

const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const path = require("path");
const users = require("./users.json");
const { PORT, JWT_SECRET, TOKEN_LIFETIME } = require("./config");

const app = express();
app.use(express.json());

// Журнал запитів: після кожної відповіді сервер пише в термінал
// час, метод, шлях, код відповіді і користувача, якщо він відомий
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.path.match(/\.(css|js|ico)$/)) return; // файли сторінки не показуємо
    const time = new Date().toLocaleTimeString("uk-UA");
    const who = req.logUser ? `  (${req.logUser})` : "";
    console.log(`[${time}] ${req.method} ${req.path} → ${res.statusCode}${who}`);
  });
  next();
});
app.use(express.static(path.join(__dirname, "public")));

// ---------- Допоміжні функції ----------

// Хеш SHA256 без солі
const sha256 = (text) => crypto.createHash("sha256").update(text, "utf8").digest("hex");

// Шукає користувача і порівнює хеш введеного пароля з хешем у базі
function checkUser(login, password) {
  if (!login || !password) return null;
  const user = users.find((u) => u.login === login);
  if (!user) return null;
  return sha256(password) === user.passwordHash ? user : null;
}

// Читає логін і пароль із заголовка "Authorization: Basic base64(login:password)"
function readBasicAuth(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return {};
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const sep = decoded.indexOf(":");
  return { login: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
}

// Логін і пароль з тіла JSON або з Basic Auth
function readCredentials(req) {
  if (req.body && req.body.login) return { login: req.body.login, password: req.body.password };
  return readBasicAuth(req);
}

// ---------- Завдання 3. Авторизація на шляху /login ----------

// GET /login: браузер або Postman передає Basic Auth
app.get("/login", (req, res) => {
  const { login, password } = readBasicAuth(req);
  const user = checkUser(login, password);
  req.logUser = login ? (user ? `${login}, вхід успішний` : `${login}, неправильний пароль`) : "";

  if (!user) {
    res.set("WWW-Authenticate", 'Basic realm="Lab2", charset="UTF-8"');
    return res.status(401).send("Доступ заборонено. Введіть правильний логін і пароль.");
  }

  res.send(`
    <!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Вхід виконано</title>
    <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css"></head>
    <body class="success-page"><div class="card">
      <p class="course">Лабораторна робота №2</p>
      <h1>Вхід виконано</h1>
      <p>Користувача <b>${user.login}</b> (id ${user.id}) успішно авторизовано.</p>
      <a class="btn btn-primary" href="/#lab2">Повернутися на головну</a>
    </div></body></html>`);
});

// POST /login: те саме для вебсторінки (JSON {login, password})
app.post("/login", (req, res) => {
  const { login, password } = readCredentials(req);
  const user = checkUser(login, password);
  req.logUser = user ? `${login}, вхід успішний` : `${login || "?"}, неправильний логін або пароль`;
  if (!user) return res.status(401).json({ error: "Неправильний логін або пароль" });

  res.json({
    message: `Користувача ${user.login} успішно авторизовано`,
    user: { id: user.id, login: user.login },
    passwordHash: sha256(password),
  });
});

// ---------- Завдання 4. Генерація JWT ----------

app.post("/token", (req, res) => {
  const { login, password } = readCredentials(req);
  const user = checkUser(login, password);
  req.logUser = user ? `${login}, токен видано` : `${login || "?"}, неправильний логін або пароль`;
  if (!user) return res.status(401).json({ error: "Неправильний логін або пароль" });

  // У токені зберігаємо логін та id, підписуємо HS256 (HMAC SHA256)
  const token = jwt.sign({ login: user.login, id: user.id }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: TOKEN_LIFETIME,
  });

  res.json({ token, expiresIn: TOKEN_LIFETIME });
});

// Middleware: перевіряє заголовок "Authorization: Bearer <token>"
function requireToken(req, res, next) {
  const header = req.headers.authorization || "";
  // відповідь залежить від заголовків, тому браузер не повинен її кешувати
  res.set({ Vary: "Accept, Authorization", "Cache-Control": "no-store" });
  if (!header.startsWith("Bearer ")) {
    // Браузер, відкритий через адресний рядок, не може додати заголовок Authorization.
    // Тому для нього сервер віддає порожню сторінку без даних. Її скрипт бере токен,
    // збережений на головній сторінці, і повторює запит уже з заголовком Bearer.
    // Postman і інші клієнти без токена, як і раніше, отримують 401.
    if (req.accepts(["json", "html"]) === "html") {
      req.logUser = "сторінка для браузера, токен надішле скрипт";
      return res.sendFile(path.join(__dirname, "views", "protected.html"));
    }
    return res.status(401).json({ error: "Немає токена. Додайте заголовок Authorization: Bearer <token>" });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET, { algorithms: ["HS256"] });
    req.logUser = `${req.user.login}, токен валідний`;
    next();
  } catch (err) {
    const reason = err.name === "TokenExpiredError" ? "Час дії токена минув" : "Токен недійсний";
    req.logUser = reason.toLowerCase();
    res.status(403).json({ error: reason });
  }
}

// Шлях, доступний лише з валідним токеном
app.get("/protected", requireToken, (req, res) => {
  res.json({
    message: `Привіт, ${req.user.login}! Доступ до захищеного шляху відкрито`,
    user: { login: req.user.login, id: req.user.id },
    issuedAt: new Date(req.user.iat * 1000).toISOString(),
    expiresAt: new Date(req.user.exp * 1000).toISOString(),
  });
});

// База користувачів для перегляду (лише логіни та хеші)
app.get("/api/users", (req, res) => res.json(users));

app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
  console.log(`Secret для jwt.io: ${JWT_SECRET}, час дії токена: ${TOKEN_LIFETIME}`);
});
