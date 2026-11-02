/* Лабораторна №1 · Класичні шифри
   Код загорнуто у функцію, щоб змінні двох лабораторних не перетиналися. */
(() => {
  /* =========================================
     Лабораторна №1
     Шифр Цезаря, шифр Віженера, шифр перестановки,
     частотний аналіз і діаграми частот
     ========================================= */

  // ---------- Алфавіти ----------
  const ALPHABETS = {
    ua: "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ", // 33 літери, А = 0, Я = 32
    en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",        // 26 літер
  };

  // Частоти літер у мові (таблиця 1.3 з методички)
  const LANG_FREQ = {
    ua: {
      А: 0.072, Б: 0.017, В: 0.052, Г: 0.015, Ґ: 0.001, Д: 0.035, Е: 0.017, Є: 0.008,
      Ж: 0.009, З: 0.023, И: 0.061, І: 0.057, Ї: 0.006, Й: 0.008, К: 0.035, Л: 0.036,
      М: 0.031, Н: 0.065, О: 0.094, П: 0.029, Р: 0.047, С: 0.041, Т: 0.055, У: 0.04,
      Ф: 0.001, Х: 0.012, Ц: 0.006, Ч: 0.018, Ш: 0.012, Щ: 0.001, Ь: 0.029, Ю: 0.004,
      Я: 0.029,
    },
    en: {
      A: 0.082, B: 0.015, C: 0.028, D: 0.043, E: 0.127, F: 0.022, G: 0.02, H: 0.061,
      I: 0.07, J: 0.002, K: 0.008, L: 0.04, M: 0.024, N: 0.067, O: 0.075, P: 0.019,
      Q: 0.001, R: 0.06, S: 0.063, T: 0.091, U: 0.028, V: 0.01, W: 0.023, X: 0.001,
      Y: 0.02, Z: 0.001,
    },
  };

  const $ = (id) => document.getElementById(id);

  // =========================================
  // 1. ШИФР ЦЕЗАРЯ
  // =========================================

  /**
   * Зсуває кожну літеру тексту на shift позицій.
   * Регістр літери зберігається, інші символи не змінюються.
   */
  function caesar(text, shift, lang) {
    const alphabet = ALPHABETS[lang];
    const n = alphabet.length;

    return [...text].map((ch) => {
      const upper = ch.toUpperCase();
      const index = alphabet.indexOf(upper);
      if (index === -1) return ch; // не літера алфавіту

      const newIndex = (((index + shift) % n) + n) % n;
      const newChar = alphabet[newIndex];
      return ch === upper ? newChar : newChar.toLowerCase();
    }).join("");
  }

  const caesarEncrypt = (text, k, lang) => caesar(text, k, lang);
  const caesarDecrypt = (text, k, lang) => caesar(text, -k, lang);

  // =========================================
  // 2. ШИФР ВІЖЕНЕРА
  // =========================================

  // Залишає в ключі лише літери вибраного алфавіту
  function cleanKey(key, lang) {
    return [...key.toUpperCase()].filter((ch) => ALPHABETS[lang].includes(ch)).join("");
  }

  /**
   * Шифр Віженера: i-та літера тексту зсувається на номер
   * i-ї літери ключа (ключ повторюється). Інші символи не змінюються
   * і не зсувають позицію в ключі.
   * direction = 1 для шифрування, -1 для дешифрування.
   */
  function vigenere(text, key, lang, direction) {
    const alphabet = ALPHABETS[lang];
    const n = alphabet.length;
    const k = cleanKey(key, lang);
    if (!k) return text;

    let j = 0; // позиція в ключі
    return [...text].map((ch) => {
      const upper = ch.toUpperCase();
      const index = alphabet.indexOf(upper);
      if (index === -1) return ch;

      const shift = alphabet.indexOf(k[j % k.length]) * direction;
      j++;
      const newChar = alphabet[(((index + shift) % n) + n) % n];
      return ch === upper ? newChar : newChar.toLowerCase();
    }).join("");
  }

  const vigenereEncrypt = (text, key, lang) => vigenere(text, key, lang, 1);
  const vigenereDecrypt = (text, key, lang) => vigenere(text, key, lang, -1);

  // =========================================
  // 3. ШИФР ПЕРЕСТАНОВКИ
  // =========================================

  // Позиція літери ключа для сортування (спершу укр., потім англ. алфавіт)
  function keyCharRank(ch) {
    const up = ch.toUpperCase();
    const ua = ALPHABETS.ua.indexOf(up);
    if (ua !== -1) return ua;
    const en = ALPHABETS.en.indexOf(up);
    if (en !== -1) return 100 + en;
    return 1000 + ch.charCodeAt(0);
  }

  /**
   * Повертає порядок стовпців за ключем.
   * Наприклад, "Шифр" → [4, 1, 3, 2] (номер кожного стовпця).
   * Однакові літери нумеруються зліва направо.
   */
  function columnNumbers(key) {
    const letters = [...key];
    const sorted = letters
      .map((ch, i) => ({ rank: keyCharRank(ch), i }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i);

    const numbers = new Array(letters.length);
    sorted.forEach((item, pos) => { numbers[item.i] = pos + 1; });
    return numbers;
  }

  function permEncrypt(text, key, pad) {
    const cols = [...key].length;
    if (cols === 0) return text;

    let chars = [...text];
    if (pad) {
      while (chars.length % cols !== 0) chars.push(pad);
    }

    const numbers = columnNumbers(key);
    // індекси стовпців у порядку читання
    const readOrder = numbers
      .map((num, col) => ({ num, col }))
      .sort((a, b) => a.num - b.num)
      .map((x) => x.col);

    let result = "";
    for (const col of readOrder) {
      for (let i = col; i < chars.length; i += cols) result += chars[i];
    }
    return result;
  }

  function permDecrypt(cipher, key) {
    const cols = [...key].length;
    if (cols === 0) return cipher;

    const chars = [...cipher];
    const len = chars.length;
    const rows = Math.ceil(len / cols);
    const fullCols = len % cols === 0 ? cols : len % cols; // стовпці з повною висотою

    const numbers = columnNumbers(key);
    const readOrder = numbers
      .map((num, col) => ({ num, col }))
      .sort((a, b) => a.num - b.num)
      .map((x) => x.col);

    const result = new Array(len);
    let pos = 0;
    for (const col of readOrder) {
      const height = col < fullCols ? rows : rows - 1;
      for (let r = 0; r < height; r++) {
        result[r * cols + col] = chars[pos++];
      }
    }
    return result.join("");
  }

  // =========================================
  // 4. ЧАСТОТИ
  // =========================================

  // Кількість кожної літери алфавіту в тексті
  function countLetters(text, lang) {
    const alphabet = ALPHABETS[lang];
    const counts = Object.fromEntries([...alphabet].map((ch) => [ch, 0]));
    let total = 0;
    for (const ch of text.toUpperCase()) {
      if (ch in counts) { counts[ch]++; total++; }
    }
    return { counts, total };
  }

  /**
   * Індекс збігу: імовірність, що дві випадково взяті літери тексту однакові.
   * Для природної мови він близький до 0,055, для рівномірного тексту до 1 / n.
   */
  function indexOfCoincidence(text, lang) {
    const { counts, total } = countLetters(text, lang);
    if (total < 2) return 0;
    let sum = 0;
    for (const c of Object.values(counts)) sum += c * (c - 1);
    return sum / (total * (total - 1));
  }

  // Визначає алфавіт тексту за кількістю кириличних і латинських літер
  function detectLang(text) {
    const cyr = (text.match(/[а-яґєії]/gi) || []).length;
    const lat = (text.match(/[a-z]/gi) || []).length;
    return lat > cyr ? "en" : "ua";
  }

  /**
   * Малює згруповану діаграму.
   * seriesA і seriesB є масивами чисел, labels є підписами під стовпчиками.
   */
  function drawChart(container, labels, seriesA, seriesB, maxValue, format) {
    container.innerHTML = "";
    const max = maxValue || Math.max(...seriesA, ...seriesB) || 1;

    labels.forEach((label, i) => {
      const group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = `
        <div class="bars">
          <div class="bar bar-in" data-i="${i}" style="height:${(seriesA[i] / max) * 100}%"
               title="${label}: ${format(seriesA[i])}"></div>
          <div class="bar bar-out" data-i="${i}" style="height:${(seriesB[i] / max) * 100}%"
               title="${label}: ${format(seriesB[i])}"></div>
        </div>
        <span class="bar-label">${label}</span>`;
      container.appendChild(group);
    });
  }

  const percent = (v) => (v * 100).toFixed(1) + "%";

  // Діаграма «вхід / результат» у відсотках
  function drawCompareChart(container, input, output, lang) {
    const a = countLetters(input, lang);
    const b = countLetters(output, lang);
    const labels = [...ALPHABETS[lang]];
    const fa = labels.map((ch) => (a.total ? a.counts[ch] / a.total : 0));
    const fb = labels.map((ch) => (b.total ? b.counts[ch] / b.total : 0));
    drawChart(container, labels, fa, fb, null, percent);
  }

  /**
   * Анімація: символи вхідного тексту і результату з’являються по одному,
   * а стовпчики діаграми ростуть разом з ними.
   */
  const animations = {};

  function playAnimation(name, container, liveEl, input, output, lang) {
    clearInterval(animations[name]);

    const labels = [...ALPHABETS[lang]];
    const finalA = countLetters(input, lang);
    const finalB = countLetters(output, lang);
    const max = Math.max(...Object.values(finalA.counts), ...Object.values(finalB.counts), 1);

    const ca = labels.map(() => 0);
    const cb = labels.map(() => 0);
    drawChart(container, labels, ca, cb, max, (v) => v + " раз");

    const inChars = [...input];
    const outChars = [...output];
    const steps = Math.max(inChars.length, outChars.length);
    const delay = Math.max(25, Math.min(140, 6000 / steps));
    let step = 0;

    animations[name] = setInterval(() => {
      if (step >= steps) {
        clearInterval(animations[name]);
        liveEl.textContent = "Готово";
        return;
      }

      const x = (inChars[step] || "").toUpperCase();
      const y = (outChars[step] || "").toUpperCase();
      const ia = labels.indexOf(x);
      const ib = labels.indexOf(y);

      if (ia !== -1) ca[ia]++;
      if (ib !== -1) cb[ib]++;

      const barsIn = container.querySelectorAll(".bar-in");
      const barsOut = container.querySelectorAll(".bar-out");
      container.querySelectorAll(".flash").forEach((el) => el.classList.remove("flash"));

      if (ia !== -1) {
        barsIn[ia].style.height = (ca[ia] / max) * 100 + "%";
        barsIn[ia].classList.add("flash");
      }
      if (ib !== -1) {
        barsOut[ib].style.height = (cb[ib] / max) * 100 + "%";
        barsOut[ib].classList.add("flash");
      }

      if (x.trim() || y.trim()) liveEl.textContent = `${x || "·"} → ${y || "·"}`;
      step++;
    }, delay);
  }

  // =========================================
  // 5. ЗЛАМ ЦЕЗАРЯ ЧАСТОТНИМ АНАЛІЗОМ
  // =========================================

  // Хі-квадрат: наскільки частоти тексту схожі на частоти мови
  function chiSquared(text, lang) {
    const { counts, total } = countLetters(text, lang);
    if (!total) return Infinity;
    let sum = 0;
    for (const ch of ALPHABETS[lang]) {
      const expected = LANG_FREQ[lang][ch] * total;
      sum += (counts[ch] - expected) ** 2 / expected;
    }
    return sum;
  }

  function crackCaesar(cipher, lang) {
    const alphabet = ALPHABETS[lang];
    const n = alphabet.length;
    const topLang = lang === "ua" ? "О" : "E";
    const topIndex = alphabet.indexOf(topLang);
    const { counts, total } = countLetters(cipher, lang);

    // Крок 1. Найчастіша літера шифротексту і ключ, який з неї випливає
    const [topLetter, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const freqKey = (alphabet.indexOf(topLetter) - topIndex + n) % n;

    // Крок 2. Перевіряємо всі можливі ключі і рахуємо χ² для кожного.
    // Для кожного ключа також показуємо, яка літера шифротексту тоді відповідає «О».
    const candidates = [];
    for (let k = 0; k < n; k++) {
      const plain = caesarDecrypt(cipher, k, lang);
      const letter = alphabet[(topIndex + k) % n];
      candidates.push({ k, letter, count: counts[letter], plain, chi: chiSquared(plain, lang) });
    }
    candidates.sort((a, b) => a.chi - b.chi);

    return {
      candidates,
      best: candidates[0],
      freq: { letter: topLetter, count: topCount, k: freqKey },
      counts, total, topLang,
    };
  }

  // =========================================
  // 6. ІНТЕРФЕЙС
  // =========================================

  // Вкладки
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      $(tab.dataset.tab).classList.add("active");
    });
  });

  // ----- Цезар -----
  const caesarState = { input: "", output: "", mode: "enc" };

  function updateAlphabetStrip() {
    const lang = $("caesar-lang").value;
    const k = Number($("caesar-key").value);
    const alphabet = ALPHABETS[lang];
    const strip = $("caesar-alphabet");
    strip.style.gridTemplateRows = "auto auto";
    strip.innerHTML =
      [...alphabet].map((ch) => `<span class="plain">${ch}</span>`).join("") +
      [...alphabet].map((ch) => `<span class="shifted">${caesar(ch, k, lang)}</span>`).join("");
    strip.style.gridTemplateColumns = `repeat(${alphabet.length}, minmax(26px, 1fr))`;
    strip.style.gridAutoFlow = "row";
  }

  function runCaesar(mode) {
    const lang = $("caesar-lang").value;
    const k = Number($("caesar-key").value);
    const input = $("caesar-input").value;
    const output = mode === "enc" ? caesarEncrypt(input, k, lang) : caesarDecrypt(input, k, lang);

    $("caesar-output").textContent = output;
    caesarState.input = input;
    caesarState.output = output;
    caesarState.mode = mode;
    drawCompareChart($("caesar-chart"), input, output, lang);
    $("caesar-live").textContent = mode === "enc" ? "Шифрування, K = " + k : "Дешифрування, K = " + k;
  }

  $("caesar-lang").addEventListener("change", () => {
    const max = $("caesar-lang").value === "ua" ? 32 : 25;
    const range = $("caesar-key");
    range.max = max;
    if (Number(range.value) > max) range.value = max;
    $("caesar-key-val").textContent = range.value;
    updateAlphabetStrip();
    runCaesar(caesarState.mode);
  });

  $("caesar-key").addEventListener("input", () => {
    $("caesar-key-val").textContent = $("caesar-key").value;
    updateAlphabetStrip();
    runCaesar(caesarState.mode); // результат оновлюється разом із ключем
  });

  $("caesar-enc").addEventListener("click", () => runCaesar("enc"));
  $("caesar-dec").addEventListener("click", () => runCaesar("dec"));
  $("caesar-swap").addEventListener("click", () => {
    if (caesarState.output) $("caesar-input").value = caesarState.output;
  });
  $("caesar-play").addEventListener("click", () => {
    if (!caesarState.output) runCaesar("enc");
    playAnimation("caesar", $("caesar-chart"), $("caesar-live"),
      caesarState.input, caesarState.output, $("caesar-lang").value);
  });

  // ----- Віженер -----
  const vigState = { input: "", output: "" };

  // Таблиця: літери тексту, літери ключа, зсув, результат (перші 16 літер)
  function drawVigTable(input, output, key, lang) {
    const alphabet = ALPHABETS[lang];
    const k = cleanKey(key, lang);
    const rows = { text: [], key: [], shift: [], out: [] };
    const inChars = [...input];
    const outChars = [...output];
    let j = 0;

    for (let i = 0; i < inChars.length && rows.text.length < 16; i++) {
      const up = inChars[i].toUpperCase();
      if (!alphabet.includes(up)) continue;
      const keyChar = k[j % k.length];
      rows.text.push(up);
      rows.key.push(keyChar);
      rows.shift.push(alphabet.indexOf(keyChar));
      rows.out.push(outChars[i].toUpperCase());
      j++;
    }

    const line = (name, arr, cls = "") =>
      `<tr class="${cls}"><td class="row-name">${name}</td>` + arr.map((x) => `<td>${x}</td>`).join("") + "</tr>";

    $("vig-table").innerHTML =
      line("Текст", rows.text) + line("Ключ", rows.key, "order") +
      line("Зсув", rows.shift) + line("Результат", rows.out, "row-out");
  }

  function drawVigStats(input, output, lang) {
    const n = ALPHABETS[lang].length;
    const fmt = (v) => v.toFixed(4).replace(".", ",");
    $("vig-stats").innerHTML = `
      <div class="stat in"><b>${fmt(indexOfCoincidence(input, lang))}</b><span>індекс збігу вхідного тексту</span></div>
      <div class="stat out"><b>${fmt(indexOfCoincidence(output, lang))}</b><span>індекс збігу результату</span></div>
      <div class="stat"><b>${fmt(1 / n)}</b><span>рівномірний розподіл, 1 / ${n}</span></div>`;
  }

  function runVig(mode) {
    const lang = $("vig-lang").value;
    const key = $("vig-key").value;
    const input = $("vig-input").value;

    if (!cleanKey(key, lang)) {
      $("vig-output").textContent = "Ключ має містити хоча б одну літеру вибраного алфавіту.";
      return;
    }

    const output = mode === "enc" ? vigenereEncrypt(input, key, lang) : vigenereDecrypt(input, key, lang);
    $("vig-output").textContent = output;
    vigState.input = input;
    vigState.output = output;

    drawVigTable(input, output, key, lang);
    drawVigStats(input, output, lang);
    drawCompareChart($("vig-chart"), input, output, lang);
    $("vig-live").textContent = (mode === "enc" ? "Шифрування" : "Дешифрування") + ", ключ " + cleanKey(key, lang);
  }

  $("vig-enc").addEventListener("click", () => runVig("enc"));
  $("vig-dec").addEventListener("click", () => runVig("dec"));
  $("vig-lang").addEventListener("change", () => {
    $("vig-key").value = $("vig-lang").value === "ua" ? "КЛЮЧ" : "LEMON";
    runVig("enc");
  });
  $("vig-swap").addEventListener("click", () => {
    if (vigState.output) $("vig-input").value = vigState.output;
  });
  $("vig-play").addEventListener("click", () => {
    if (!vigState.output) runVig("enc");
    playAnimation("vig", $("vig-chart"), $("vig-live"),
      vigState.input, vigState.output, $("vig-lang").value);
  });

  // ----- Перестановка -----
  const permState = { input: "", output: "" };

  function drawPermTable(text, key, pad) {
    const keyChars = [...key];
    const cols = keyChars.length;
    const table = $("perm-table");
    if (!cols) { table.innerHTML = ""; return; }

    const chars = [...text];
    if (pad) while (chars.length % cols !== 0) chars.push(pad);

    const numbers = columnNumbers(key);
    let html = "<tr>" + keyChars.map((c) => `<th>${c}</th>`).join("") + "</tr>";
    html += '<tr class="order">' + numbers.map((n) => `<td>${n}</td>`).join("") + "</tr>";
    for (let i = 0; i < chars.length; i += cols) {
      html += "<tr>";
      for (let j = 0; j < cols; j++) {
        const ch = chars[i + j];
        html += `<td>${ch === undefined ? "" : ch === " " ? "␣" : ch}</td>`;
      }
      html += "</tr>";
    }
    table.innerHTML = html;
  }

  function runPerm(mode) {
    const key = $("perm-key").value.trim();
    const pad = $("perm-pad").value;
    const input = $("perm-input").value;
    if (!key) {
      $("perm-output").textContent = "Введи ключове слово, щоб зашифрувати текст.";
      return;
    }

    const output = mode === "enc" ? permEncrypt(input, key, pad) : permDecrypt(input, key);
    $("perm-output").textContent = output;
    permState.input = input;
    permState.output = output;

    drawPermTable(mode === "enc" ? input : output, key, mode === "enc" ? pad : "");
    const lang = detectLang(input);
    drawCompareChart($("perm-chart"), input, output, lang);
  }

  $("perm-enc").addEventListener("click", () => runPerm("enc"));
  $("perm-dec").addEventListener("click", () => runPerm("dec"));
  $("perm-swap").addEventListener("click", () => {
    if (permState.output) $("perm-input").value = permState.output;
  });
  $("perm-play").addEventListener("click", () => {
    if (!permState.output) runPerm("enc");
    playAnimation("perm", $("perm-chart"), $("perm-live"),
      permState.input, permState.output, detectLang(permState.input));
  });

  // ----- Злам -----
  function runCrack() {
    const lang = $("crack-lang").value;
    const cipher = $("crack-input").value;
    const res = crackCaesar(cipher, lang);
    const box = $("crack-result");

    if (!res.total) {
      box.classList.add("show");
      box.innerHTML = "<p>У тексті немає літер вибраного алфавіту. Перевір мову або встав інший шифротекст.</p>";
      return;
    }

    const alphabet = ALPHABETS[lang];
    const f = res.freq;
    const agrees = f.k === res.best.k;
    box.classList.add("show");
    box.innerHTML = `
      <p>Найчастіша літера шифротексту: <b>«${f.letter}»</b> має номер ${alphabet.indexOf(f.letter)} (${f.count} разів з ${res.total}).</p>
      <p>Припускаємо, що вона відповідає літері <b>«${res.topLang}»</b> з номером ${alphabet.indexOf(res.topLang)}. Тоді K = ${f.k}.</p>
      ${res.total < 60 ? `<p class="note">Текст короткий (${res.total} літер), тому найчастіша літера може не відповідати «${res.topLang}». Програма перевірила всі ${alphabet.length} ключі за χ².</p>` : ""}
      <p>Ключ за найменшим χ², де χ² = Σ (O − E)² / E: <span class="big-key">K = ${res.best.k}</span>${agrees ? "" : ` <span class="note">(частотне припущення дало K = ${f.k})</span>`}</p>
      <p><b>Відкритий текст:</b><br>${res.best.plain}</p>`;

    // діаграма: частоти шифротексту проти частот мови
    const labels = [...ALPHABETS[lang]];
    const fa = labels.map((ch) => res.counts[ch] / res.total);
    const fb = labels.map((ch) => LANG_FREQ[lang][ch]);
    drawChart($("crack-chart"), labels, fa, fb, null, percent);

    // таблиця кандидатів
    let html = "<tr><th>K</th><th>χ²</th><th>Розшифрований текст</th></tr>";
    res.candidates.slice(0, 5).forEach((c) => {
      html += `<tr class="${c === res.best ? "best" : ""}">
        <td>${c.k}</td>
        <td>${c.chi.toFixed(1)}</td><td class="plain-text">${c.plain}</td></tr>`;
    });
    $("crack-table").innerHTML = html;
  }

  $("crack-run").addEventListener("click", runCrack);
  $("crack-lang").addEventListener("change", runCrack);

  // ----- Старт -----
  updateAlphabetStrip();
  runCaesar("enc");
  runVig("enc");
  runPerm("enc");
  runCrack();

})();
