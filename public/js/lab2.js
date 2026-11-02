/* Лабораторна №2 · Авторизація і JWT
   Код загорнуто у функцію, щоб змінні двох лабораторних не перетиналися. */
(() => {
  /* =========================================
     Лабораторна №2 · Логіка сторінки
     ========================================= */

  const $ = (id) => document.getElementById(id);
  let currentToken = "";
  let timerId = null;

  // ---------- Допоміжні функції ----------

  // SHA256 у браузері (для показу хешу пароля)
  async function sha256(text) {
    if (!window.crypto || !crypto.subtle) return "(браузер не підтримує crypto.subtle)";
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Декодування частини JWT з Base64Url
  function decodePart(part) {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      [...atob(base64)].map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  }

  function showAnswer(el, status, data) {
    const ok = status >= 200 && status < 300;
    el.className = "answer " + (ok ? "ok" : "err");
    el.innerHTML = `<span class="status">HTTP ${status}</span>\n` +
      JSON.stringify(data, null, 2);
  }

  function markStep(n) {
    for (let i = 1; i <= n; i++) $("step-" + i).classList.add("done");
  }

  async function send(url, options = {}) {
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } catch {
      return { status: 0, data: { error: "Сервер не відповідає. Запусти його командою npm start." } };
    }
  }

  const credentials = () => ({ login: $("login").value.trim(), password: $("password").value });

  // ---------- 1. Вхід ----------

  async function updateHash() {
    $("hash-preview").textContent = await sha256($("password").value);
  }

  $("password").addEventListener("input", updateHash);

  $("btn-login").addEventListener("click", async () => {
    const { status, data } = await send("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials()),
    });
    showAnswer($("login-answer"), status, data);
    if (status === 200) markStep(1);
  });

  // ---------- 2. Токен ----------

  function showToken(token) {
    const [h, p, s] = token.split(".");
    $("token-box").innerHTML =
      `<span class="t-header">${h}</span><span class="t-dot">.</span>` +
      `<span class="t-payload">${p}</span><span class="t-dot">.</span>` +
      `<span class="t-signature">${s}</span>`;

    const header = decodePart(h);
    const payload = decodePart(p);
    $("part-header").textContent = JSON.stringify(header, null, 2);
    $("part-payload").textContent = JSON.stringify(payload, null, 2) +
      `\n\niat: ${new Date(payload.iat * 1000).toLocaleTimeString("uk-UA")}` +
      `\nexp: ${new Date(payload.exp * 1000).toLocaleTimeString("uk-UA")}`;

    startTimer(payload.iat, payload.exp);
  }

  // Зворотний відлік до кінця дії токена
  function startTimer(iat, exp) {
    clearInterval(timerId);
    $("timer").hidden = false;
    const total = exp - iat;

    const tick = () => {
      const left = Math.max(0, Math.round(exp - Date.now() / 1000));
      const mm = String(Math.floor(left / 60)).padStart(2, "0");
      const ss = String(left % 60).padStart(2, "0");
      $("timer-value").textContent = left ? `${mm}:${ss}` : "минув";
      $("timer-fill").style.width = (left / total) * 100 + "%";
      if (!left) clearInterval(timerId);
    };
    tick();
    timerId = setInterval(tick, 1000);
  }

  $("btn-token").addEventListener("click", async () => {
    const { status, data } = await send("/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials()),
    });

    if (status !== 200) {
      $("token-box").textContent = `HTTP ${status}: ${data.error}`;
      return;
    }

    currentToken = data.token;
    // зберігаємо токен, щоб сторінка /protected у браузері могла його використати
    try { localStorage.setItem("lab2-token", currentToken); } catch {}
    showToken(currentToken);
    $("bearer").value = currentToken;
    $("btn-copy").disabled = false;
    markStep(2);
  });

  $("btn-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentToken);
      $("btn-copy").textContent = "Скопійовано";
    } catch {
      $("btn-copy").textContent = "Виділи токен вручну";
    }
    setTimeout(() => ($("btn-copy").textContent = "Скопіювати"), 1500);
  });

  // ---------- 3. Захищений шлях ----------

  $("btn-protected").addEventListener("click", async () => {
    const token = $("bearer").value.trim();
    const { status, data } = await send("/protected", {
      headers: { Authorization: "Bearer " + token },
    });
    showAnswer($("protected-answer"), status, data);
    if (status === 200) markStep(3);
  });

  $("btn-noauth").addEventListener("click", async () => {
    const { status, data } = await send("/protected");
    showAnswer($("protected-answer"), status, data);
  });

  // ---------- База користувачів ----------

  async function loadUsers() {
    const { status, data } = await send("/api/users");
    if (status !== 200) return;
    $("db-table").innerHTML =
      "<tr><th>id</th><th>Логін</th><th>SHA256 пароля</th></tr>" +
      data.map((u) => `<tr class="${u.login === $("login").value ? "me" : ""}"><td>${u.id}</td><td>${u.login}</td><td>${u.passwordHash}</td></tr>`).join("");
  }

  updateHash();
  loadUsers();

})();
