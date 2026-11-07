# Word Bot

Learn to program in English, then make your own games and stories. Bit is a little robot who only understands English, so every block is a real English sentence: `go forward`, `repeat 4 times`, `if Bit can go forward`, `to paint a box:`. Built for Japanese elementary students (grade 5 pilot) on school Chromebooks: touch-friendly, no typing, no server.

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

## Make (the Studio)

The goal of the course: kids use the ideas to make their own things. **Make** is a Scratch-style studio where every block is English.

- **Sprites and backdrops.** 16 characters and objects (Bit, Pip, Cat, Ghost, Rocket, Fish…) and 8 backdrops, all drawn in code. Drag sprites on the stage to place them.
- **Scripts that run together.** Event blocks start scripts: `when I press Run`, `when I tap it`, `when I press space`, `when it touches Ghost`, `when I get the message hello`, `when I start as a copy`.
- **Blocks.** Motion (`move 10 steps`, `point towards Bit`, `glide to a random place in 1 seconds`, `bounce if on the edge`, `jump`), Looks (`say Hello! for 2 seconds`, `look happy`, `change my color`), Sound (`play the note mi`), Control (`forever`, `wait`, `wait until`, `make a copy of me`), If (`if I am pressing right arrow`, `if score is more than 5`), variables (`set score to 0`, `change lives by -1`), new words, and `you win!` / `game over`.
- **Typing English.** Speech can be any sentence kids type ("✏️ write…").
- **Learn to make.** Three guided tutorials (a first game, a talking story, raining apples) that check each step by themselves.
- **Remix a game.** Five starter games (Apple Catch, Ghost Chase, Hello Pip!, Star Music, Space Dodge), each with challenge cards.
- **Ideas.** Ready-made scripts to drop onto any sprite, e.g. "Move with the arrow keys", "Fall like rain", "Win at 10 points".
- **Saving.** Projects save in the browser (My projects). "⬇" saves a `.wordbot.json` file to hand in on Google Classroom, and "Open a file" opens one.
- Touch Chromebooks get an on-screen arrow pad whenever a project uses keys. The ⛶ button gives a big stage for playing.

`?make` opens Make, `?starter=apples` opens a starter, `?new` opens an empty project.

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
| `src/screens/` | Title, level select, play, Make home and Studio screens. |
| `src/studio/` | The Studio: runtime (`vm.js`, scripts as generator threads, like Scratch), stage drawing, sprite and backdrop art, starter games and ideas, tutorials. |
| `src/audio/sfx.js` | Synthesised sound effects and the English voice (browser speech for now). |
| `src/progress/save.js` | Stars, saved programs and settings in the browser. |

No image or sound files: all art is drawn in code and all sounds are synthesised. Fonts are Fredoka and M PLUS Rounded 1c (SIL Open Font License) via Fontsource.

## Next ideas

Share links between classmates, a class gallery, recorded voice lines, and more tutorials (a maze game, a quiz).


## How the course teaches (not just tells)

- **Every big idea is forced by a problem.** A block limit (or several maps) makes the old way impossible, and tests brute-force check it. The nested-loop levels (Fences, Big square) cannot be beaten with fewer than two loop levels.
- **Check! questions.** Each concept card ends with a one-question check; the OK button unlocks when answered (a wrong answer is explained).
- **Hints on every level.** A nudge, then the plan, then the answer. They unlock after a first failed try or 40 seconds.
- **The point of it all.** After a win, Bit says how many actions it did versus how many blocks you wrote.
