# Word Bot

Browser block-coding game where every block is a short English sentence (`go right 3`, `jump`, `get the key`, `say "Hello!"`). Kids tell **Bit** the robot what to do, so coding practice is English practice. Built for Japanese elementary students on school Chromebooks (1366×598, touchscreen, no typing, no server).

Plan: see the "Word Bot: English Block Coding Plan" doc. Learning path is **Move → Remix → Make**.

## Status: milestone 1 (Move, levels 1–8)

| Level | Teaches | New English |
| --- | --- | --- |
| 1 Hello, Bit | sequence | go right |
| 2 Go right 3 | numbers matter | number slot |
| 3 Up and over | two-step sequence | go up |
| 4 Jump the water | new command | jump |
| 5 Bonk! | debugging, Step button | go left, go down |
| 6 Get the coin | actions on objects, locked star | get the coin |
| 7 The red door | order of actions | get the key, open the door |
| 8 Hello, friend | speaking / greeting | say "Hello!" |

Not yet built: loops (`repeat`), turning, events (`when`), conditions (`if`), variables, Remix mini-games, Make mode, sharing.

## Run it

Static site, no build step. Open `index.html`, or serve the folder (`python3 -m http.server`) and visit it.

- `?unlock` unlocks every level (teacher shortcut). `?level=3` jumps to a level.
- Progress (stars), the ヒント toggle, sound and speed are saved in `localStorage`.

## How it's organised

| File | Job |
| --- | --- |
| `js/core.js` | Pure game logic: blocks, `exec()` (one block → events), win check, a breadth-first solver. No DOM, runs in Node. |
| `js/levels.js` | Levels as ASCII maps + palette + `par`. Adding a level = adding an object. |
| `js/render.js` | Canvas drawing and animations. Consumes the events from `core.js`. |
| `js/audio.js` | Synthesised sound effects + browser speech (synthetic English voice). No audio files. |
| `js/app.js` | Screens, block palette/program, tap + drag, run/step loop, progress. |
| `tests/levels.test.js` | `node tests/levels.test.js`: every level is solvable and `par` is the true minimum. |

Map legend: `.` floor, `#` wall, `o` hole/water, `B` Bit, `*` star, `c` coin, `k` key, `D` door, `F` friend.

## Design rules

- Blocks are real English sentences. Menus and instructions are Japanese (hiragana); the ヒント toggle adds a Japanese gloss under every block.
- No typing anywhere. Tap a block to add it (and hear it), or drag it.
- Mistakes are funny, never red: Bit bonks and says "Oops!".
- A level is won only if the program *ends* on an awake star, so numbers and order matter.
- Stars: 1 for clearing, 2 within par+2 blocks, 3 for par (the fewest blocks).
