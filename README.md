# scream-site

Визитка в стиле PS1: Ghostface (low-poly, дрожащие вершины, аффинные текстуры, 5-бит цвет + дизеринг), CRT-оверлей, бут-экран, контакты в виде PS1-меню.

Статика, без сборки: `index.html` + `style.css` + `main.js` + `vendor/three.module.min.js` (Three.js 0.158, локально).

## Правки

Все данные — в блоке `CONFIG` в начале `main.js`: имя, подпись, строка-тизер, контакты (`label / value / href`).
Там же `ps1Short` (разрешение рендера, 240 = «320×240») и `jitter` (сила дрожания вершин).

Цвета/шрифты — переменные в начале `style.css` (`--ink` = цвет маски, `--blood` = акцент).

## Запуск локально

```bash
python3 -m http.server 8791
```

(модуль `main.js` не откроется по `file://`, нужен любой http-сервер).

## Деплой

GitHub Pages: залить папку как есть (есть `.nojekyll`). Любой статик-хостинг тоже подойдёт.

## Управление

Мышь — персонаж следит; клик по пустому месту — атака (нож колет, AK стреляет, телефон вешает трубку, руки бьют); двойной клик — сменить скин с глитчем; ↑/↓ + Enter — меню с клавиатуры; на бут-экране Enter/клик — старт.
Клавиши: `G` — случайный жест, `S` — случайная смена (оружие/маска/балахон), `W` — сменить оружие.

## Жесты и варианты

Сами по себе: жест каждые `gestureEvery` секунд (wave, shrug, look, inspect, point, nod, no, tpose, spin, crouch, dance), смена модели каждые `swapEvery` секунд.
Варианты: оружие knife/ak/phone/none, маска classic/bloody/dark, балахон black/blood/bone. Всё в `VARIANTS`/`GESTURES` в `main.js`.
В консоли есть `GF.swap('weapon','ak')`, `GF.gesture('wave')`, `GF.attack()`, `GF.event('cow')`.

## Ивенты

Каждые `eventEvery` секунд (клавиша `E` — вручную) случайный прикол с глитч-переходом: nomask (маска пропадает, красные глаза), hoodoff (снимает капюшон), upsidedown, cow, burger, console (превращается в корову / чизбургер / приставку), giant, tiny, bighead, wireframe, invert, static (помехи + смена скина), clones, float, fall, spinhead, sink, disco, jumpscare. Список — `EVENTS` в `main.js`.
