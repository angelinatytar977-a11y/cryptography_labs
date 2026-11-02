// =============================================
// Генерує базу користувачів users.json
// Логін = прізвище, пароль = ім’я, id = номер у списку групи.
// У файл потрапляє лише SHA256-хеш пароля (без солі).
// Запуск: npm run hash
// =============================================

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Заміни на себе та двох одногрупників (попередній і наступний у списку)
const people = [
  { id: 21, lastName: "Tyravskyi", firstName: "Oleh" },      // на 1 вище у списку
  { id: 22, lastName: "Tytar",     firstName: "Anhelina" },  // я
  { id: 23, lastName: "Chernysh",  firstName: "Oleh" },      // наступний у списку
];

const sha256 = (text) => crypto.createHash("sha256").update(text, "utf8").digest("hex");

const users = people.map((p) => ({
  id: p.id,
  login: p.lastName,
  passwordHash: sha256(p.firstName),
}));

fs.writeFileSync(path.join(__dirname, "users.json"), JSON.stringify(users, null, 2));
console.log("Базу users.json створено:");
console.table(users);
