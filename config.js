// =============================================
// Налаштування лабораторної №2
// Заміни дані на свої (ім’я, прізвище, номер у списку групи)
// =============================================

const STUDENT = {
  firstName: "Anhelina",  // твоє ім’я латиницею
  lastName: "Tytar",      // твоє прізвище латиницею
  listNumber: 22,         // твій номер у списку групи
};

module.exports = {
  PORT: process.env.PORT || 3000,

  // Secret у форматі FirstnameLastname, однаковий для всіх користувачів
  JWT_SECRET: STUDENT.firstName + STUDENT.lastName,

  // Час дії токена дорівнює номеру у списку (у хвилинах)
  TOKEN_LIFETIME: `${STUDENT.listNumber}m`,

  STUDENT,
};
