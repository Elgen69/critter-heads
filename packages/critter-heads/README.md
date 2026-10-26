# critter-heads

Animated cartoon animals for React. Ten of them (a fox, an owl, a cat, a raccoon, a panda, a shiba, a bunny, a bear, a frog and an otter), each with **12 expressions** they act out **their own way**: the fox fist-pumps, the owl swivels its head and pushes up its glasses, the cat kneads and hisses, the raccoon rubs its little hands, the panda munches bamboo, the shiba does the head-tilt, the bunny's ears flop, the bear pats its belly, the frog snaps flies out of the air, the otter grooms its whiskers.

Drawn as SVG: no canvas, no WebGL, no runtime dependencies. Every frame is a pure function of time, so you can scrub to any moment and get the exact same frame every time.

## Install

```bash
npm install critter-heads
```

React 18 or newer is a peer dependency (optional if you only use `critter-heads/vanilla`).

## Quick start

```jsx
import { CritterHead } from "critter-heads";

function Agent({ status }) {
  return <CritterHead character="fox" expression={status} size={160} />;
}
```

## Characters

| `character` | Who | Accessory |
| :--- | :--- | :--- |
| `fox` | Kit, the builder | teal scarf |
| `owl` | Hoot, the skeptic | round glasses |
| `cat` | Miso, the scout | bell collar |
| `raccoon` | Bandit, the night shift | purple hoodie |
| `panda` | Bao, the anchor | bamboo sprout |
| `dog` | Kona, the cheerleader | red bandanna |
| `bunny` | Pippin, the speedrunner | marigold bow tie |
| `bear` | Barnaby, the gentle giant | mustard knit vest |
| `frog` | Moss, the zen philosopher | lily-leaf bandana |
| `otter` | Ollie, the tinkerer | lucky pebble necklace |

The list is exported as `critterCharacters`.

## Expressions

`idle` · `happy` · `thinking` · `searching` · `listening` · `speaking` · `working` · `surprised` · `upset` · `sad` · `sleeping` · `love`

Switching expressions blends the face and body into the new pose. The same expression looks different per animal, and `describe(character, expression)` returns a one-line description (for example `describe("owl", "searching")` → "The full owl head swivel, side to side."). The list is exported as `critterExpressions`.

## Props

```jsx
<CritterHead
  character="fox"        // fox, owl, cat, raccoon, panda, dog, bunny, bear, frog or otter
  expression="idle"      // one of the 12 above
  view="bust"            // "bust" (head and shoulders) or "full" (whole body)
  size={160}             // px width; full view is 1.25x as tall
  palette={{ fur_main: "#3B5BA5" }}  // override any colour (see characters.fox.defaultPalette)
  speed={1}              // multiplier on every animation
  paused={false}         // hold the current pose
  interactive            // eyes follow the pointer; a click makes it hop and spin
  accessory              // scarf, glasses, collar, sprout, bandanna, bow tie, vest, leaf, pebble
  prop="coffee"          // coffee, phone or laptop: sips, scrolls, takes calls, types
  shadow                 // soft floor shadow (alias: floorShadow)
  seed={0.42}            // desyncs blinks and glances in a row of critters
  lookAt={{ x: 0, y: 0 }} // aim the eyes yourself (-1..1); turns off pointer following
/>
```

Any other attribute (`className`, `style`, `onClick`, `aria-label`, …) goes on the wrapper element. A `ref` gives you `seek(ms)`, `setExpression()`, `react()`, `lookAt()`, `setAmplitude()` and `toSVG()`.

## Behaviour

- **Pointer play.** With `interactive` on (the default), the head and eyes ease toward a nearby pointer, and a click plays a hop with a spin and a happy face.
- **Talking.** In `speaking`, the mouth follows `setAmplitude(number[] | (tMs) => 0..1)`: feed it audio levels for lip-sync.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, or `paused`, the current pose holds still.
- **Accessible.** The SVG has `role="img"` and a label like "Kit the red fox, thinking".
- **Cheap to run many.** Every critter on the page shares one animation loop, which sleeps while the tab is hidden.

## Without React

```js
import { createCritter, defineCritterElement } from "critter-heads/vanilla";

const kit = createCritter(document.querySelector("#kit"), { character: "fox", view: "full" });
kit.setExpression("thinking");

defineCritterElement(); // <critter-head character="owl" expression="searching"></critter-head>
```

### Frame-exact (seekable)

```js
const kit = createCritter(el, { character: "fox", autoplay: false, beats: [[0, "idle"], [2000, "surprised"]] });
kit.seek(2400); // the same pose at 2.4 s, every time
```

## Credits

Original characters, art and code by Elgen Mar Arinasa.

MIT
