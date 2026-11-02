/* =========================================
   Перемикання між лабораторними роботами.
   Адреса #lab1 або #lab2 зберігає вибір, тому посилання
   «Повернутися на головну» відкриває потрібну лабораторну.
   ========================================= */

function showLab(id) {
  if (!["lab1", "lab2"].includes(id)) id = "lab1";

  document.querySelectorAll(".lab").forEach((section) => {
    section.hidden = section.id !== id;
  });
  document.querySelectorAll(".lab-link").forEach((link) => {
    const active = link.dataset.lab === id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

window.addEventListener("hashchange", () => showLab(location.hash.slice(1)));
showLab(location.hash.slice(1));
