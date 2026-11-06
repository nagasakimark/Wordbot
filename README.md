# Word Bot

Learn to program in English. Bit is a little robot who only understands English, so every block is a real English sentence: `go forward`, `repeat 4 times`, `if Bit can go forward`, `to paint a box:`. Built for Japanese elementary students (grade 5 pilot) on school Chromebooks: touch-friendly, no typing, no server.

## The course

Five worlds, each built around one big programming idea. Every world opens with a concept card in very easy Japanese.

| World | Big idea | What kids do | New English |
| --- | --- | --- | --- |
| 1 Hello, Bit! | Commands, order, debugging | Walk Bit home, turn from Bit's point of view, fix a buggy program | go forward, turn left/right, pick it up |
| 2 Again and again | Loops, nested loops | Repeat moves, paint stripes and squares | repeat 4 times, paint it red |
| 3 New words | Functions | Teach Bit a word (`to paint a box:`), name your own, fix a word | to …:, turn around, get the gem |
| 4 If… | Conditions, general programs | One program must solve 3 maps at once: until home, if/otherwise, colour signs, the right-hand maze rule | repeat until Bit is home, if Bit can go forward, otherwise |
| 5 Count it! | Variables | Count steps and gems, say the answer, spiral with `repeat size times` | set steps to 0, add 1 to steps, say steps |

Things that push past "move the robot":

- **Several maps per level (from World 4).** The same program runs on every map, like tests. A list of moves can't pass, so kids have to write a general program.
- **English code view (`<>` button).** It shows the blocks as indented English text, like Python, and highlights the running line. It's a bridge toward typed code.
- **Visible control flow.** Conditions flash ✓/✗ on the block, loops show `2/4`, and a "new word" lights up its definition while it runs.
- **Debug levels.** Kids get a broken program and fix it. `Step` runs one block at a time.
- **Stars for short programs.** ★★★ means the fewest blocks.

## Quick start

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # play at http://localhost:5173
npm test           # checks the language rules and every level
npm run build      # the finished site in dist/
```

URL helpers: `?level=4-6` opens a level, `?levels` opens the level list, `?unlock` opens every level, `?nointro` skips concept cards.

## Publishing on GitHub Pages

`.github/workflows/pages.yml` tests, builds and publishes on every push to `main`. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Adding or changing a level

Levels live in `src/content/levels.js`. A map is a list of strings:

```
' ' sky (Bit falls)   '.' grass   '#' rock   'T' tree   'p' white paint pad
'g' gem   'H' Bit's house   '1' red tile   '2' blue tile   '^ > v <' Bit's start and facing
```

Every level has a `solution` written in English code. `npm test` proves it passes every map, sets ★★★ (par) to its block count, and checks that multi-map levels can't be solved by replaying map 1's moves. If a test fails after you edit a map, the message says which map and why.

## Code map

| Folder | What's in it |
| --- | --- |
| `src/engine/` | The language: blocks (EN text, JA hints, spoken text), the world rules, the interpreter (records a trace for animation), and English code ↔ blocks. No graphics. |
| `src/content/` | The course (`levels.js`) and concept cards (`intros.js`). |
| `src/editor/` | Drag-and-drop block editor: nested C-blocks, tap-to-add cursor, pickers, undo. |
| `src/play/board.js` | The floating-island stage on a canvas, and every animation. |
| `src/art/bit.js` | Bit, drawn with canvas paths in three views. |
| `src/screens/` | Title, level select and play screens. |
| `src/audio/sfx.js` | Synthesised sound effects and the English voice (browser speech for now). |
| `src/progress/save.js` | Stars, saved programs and settings in the browser. |

No image or sound files: all art is drawn in code and all sounds are synthesised. Fonts are Fredoka and M PLUS Rounded 1c (SIL Open Font License) via Fontsource.

## Next

Remix (change the rules of small ready-made games with `when` blocks, score and speed), then Make (build and share your own game).
