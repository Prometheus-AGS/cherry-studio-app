# The Boss Mobile Design System

Rules for visual decisions in The Boss mobile: where colour comes from, how hierarchy and depth are
built, when a surface or border is allowed, and where literal values are still permitted.

The direction is The Boss Brand Guide v2.2, shared with The Boss desktop
(`the-boss` `DESIGN.md`). Mobile ports its values, not its token names: the palette steps and role
values follow desktop, the names and the contract stay mobile-owned, and the places where mobile
chose a different step are listed in [Deviations From Desktop](#deviations-from-desktop).

Interaction component ownership is in [UI Components](docs/references/ui-components.md). The target
contract for competing tap, long-press, scroll, pan, and text-selection interactions is in
[Interaction And Gesture Arbitration](docs/references/interaction-and-gesture-arbitration.md),
which is currently a design rather than an as-built reference. Router structure and safe areas are
in [Navigation And Insets](docs/references/navigation-and-insets.md). Naming is in
[Naming Conventions](docs/references/naming-conventions.md). Component workflow is in
[UI Development](docs/guides/ui-development.md). Local and remote validation ownership is in
[Testing And CI](docs/guides/testing-and-ci.md).

## Direction

The Boss is a content-first agent workspace. The interface is calm, precise, and utilitarian so
that conversation, code, and the user's own content stay in focus.

- **Neutral first.** Chrome is a cool neutral ladder. Colour appears only when it carries action or
  meaning.
- **One accent: ember.** Ember is the whole brand accent. There is no second accent hue; teal,
  purple, or green used as decoration dilutes the identity.
- **Depth from surfaces.** Page, card, and popover are three steps of one surface ladder. Shadows are
  for floating elements, not routine elevation.
- **Semantic colour.** Components name roles (`primary`, `error`, `link`), never palette steps.
- **Theme parity.** Every rule holds in light and dark; neither theme is the "real" one.

## Priority Order

When requirements conflict, protect in this order:

1. **Readability and accessibility.** Failing contrast is a bug, not a style preference.
2. **Contract integrity.** No bypassing the token layer, no literal colours.
3. **Theme parity.** Whatever is readable in light must be readable in dark, and the reverse.
4. **Hierarchy.** One primary object per screen; the eye knows where to start.
5. **Consistency.** The same interaction looks the same everywhere.
6. **Polish.** Motion, spacing refinements, platform differences.

Earlier items do not yield to later ones.

## Colour

### Single Source

`packages/design-tokens/` is the only origin of colour. Components never write colour literals.

```
tokens/colors/boss.css     Brand Guide v2.2 palette: ember brand ramp, cool ink ladder, feedback hues
tokens/colors/vercel.css   Geist palette, still behind charts, tags, code surfaces, usage heat
        ↓
shadcn.css                 Shadcn role names (surfaces, primary, destructive, border, ring, radius)
product.css                The Boss product semantics (link, control, brand, border tiers, feedback, domains)
        ↓
native.css                 Generated. Never edit by hand.
        ↓
components                 className="bg-card text-foreground"  or  useThemeColor('primary')
```

Palette steps (`--boss-brand-500`, `--boss-ink-925`, `--gray-100`) are providers, not public API.
`check.ts` keeps them out of the Tailwind adapter, so a palette step can never become a utility.
The `boss-` prefix separates the v2.2 family from `vercel.css`, whose ramps reuse the same hue names
on a different scale.

Two ways to take a colour, and only two:

- Prefer `className`: `bg-card`, `text-muted-foreground`, `border-border-strong`, `bg-primary/10`.
- Use the hook when a colour must be passed as a value to a native prop (`ActivityIndicator color`,
  Skia, `@expo/ui` `Image color`, `Stack.Screen` options):

```tsx
const scrimColor = useThemeColor('scrim');
const [primary, primaryForeground] = useThemeColor(['primary', 'primary-foreground']);
```

`useThemeColor` takes contract names without the `--color-` prefix. A string returns a string; an
array returns a tuple of the same length.

Three shadcn names are **HeroUI-reserved and not part of either entry point**: `muted`, `accent`,
and `accent-foreground`. HeroUI 1.x uses `accent` for its brand role and `muted` for its
secondary-text role, so the app host remaps `--color-accent` (to `primary`) and `--color-muted` (to
`muted-foreground`) in `src/frontend/styles/global.css`. The contract variables stay declared for the
HeroUI bridge, but there is no `bg-muted` / `bg-accent` utility and `useThemeColor` rejects the names
at typecheck. Use `secondary` for an overlay fill and `muted-foreground` for secondary text.

### Core Roles

| Intent | Roles |
|---|---|
| Page and work surface | `background`, `background-subtle` |
| Contained surface | `card`, `card-foreground` |
| Floating surface | `popover`, `popover-foreground` |
| Navigation drawer | `sidebar` family |
| Primary and secondary text | `foreground`, `muted-foreground` |
| Quiet and unavailable content | `foreground-tertiary`, `foreground-disabled` |
| Overlay fill and its pressed state | `secondary`, `secondary-foreground`, `secondary-active` |
| Primary action, emphasis, focus | `primary`, `primary-foreground`, `ring` |
| "On" control fill | `control-active` |
| Dangerous action | `destructive`, `destructive-foreground` |
| Feedback | `success`, `warning`, `info`, `error`, each with `-subtle`, `-subtle-foreground`, `-border` |
| Structure and selection | `border-subtle`, `border`, `border-strong`, `border-selected`, `input` |
| Clickable text, tool mentions | `link` |
| Logo artwork only | `brand` |
| Categorical data | `chart-1` … `chart-5`, `tag-*` pairs |
| Chrome over photos and camera | `constant-black`, `constant-white` |
| Modal dimming | `scrim` |

### The Surface Ladder

Depth comes from surface colour first. The higher the layer, the further it sits from the page.

| Layer | Role | Light | Dark |
|---|---|---|---|
| Ground | `background` | `boss-ink-50` #F7F7F8 | `boss-ink-950` #0B0F14 |
| Contained | `card` | white | `boss-ink-925` #0F1620 |
| Floating | `popover` | white | `boss-ink-900` #141C26 |
| Overlay fill | `secondary` | black 5% | `boss-ink-850` #1A2432 |
| Drawer | `sidebar` | `boss-ink-100` #EEF0F3 | `boss-ink-925` #0F1620 |

In light mode card and popover are both white on the off-white page; a fine `border` or the sheet
chrome separates them. In dark mode popover sits above card and is lighter. Temporary drawers use
`sidebar` above the page's `background`. Shared bottom sheets use `popover` with a neutral
`secondary` overlay, matching the raised menu surface. Scroll fades match their host surface, and
sheet footers inherit the sheet's fill so they do not fall back to the page colour.

### Ember, Controls, And Brand

These roles are independent:

- `--primary` is ember: `boss-brand-600` in light, `boss-brand-400` (#FF6A3D, "the lit terminal")
  in dark. It carries emphasized actions, adjustable progress, and emphasized text and icons.
  `--primary-foreground` is near-white in light and near-black in dark.
- `--control-active` follows `primary`. Switches use it in both themes; the iOS adapter applies it
  explicitly as the native tint. Switch thumbs use `constant-white`. Android and Web add a one-point
  outline with `constant-black/30` over the track so the white thumb keeps a distinct edge.
- `--ring` is solid `primary`, the focus indicator in both themes.
- `--brand` is the fixed logo ember `boss-brand-500` (#E04E28), the same in both themes, reserved for
  brand artwork. Actions, selections, links, and tool mentions must not consume it.
- `--link` is blue (`boss-blue-600` light, `boss-blue-400` dark). Do not use `primary` as a generic
  link colour.

Default buttons stay neutral; use `primary` only for the action that truly needs it. Ordinary
selection is neutral `secondary` / `border-selected`, not ember. Mobile exposes no custom
action-colour setting; introduce runtime colour inputs together with a real setting and its paired
foreground.

### Feedback

`success`, `warning`, `info`, and `error` are feedback tones; `destructive` is a dangerous action.
Choose them separately. On mobile the feedback base roles render as text, so the light steps are the
lightest step of each hue that reaches 4.5:1 on page, card, and popover. For a feedback surface, use
the paired family together:

```tsx
<View className="bg-error-subtle border border-error-border">
  <Text className="text-error-subtle-foreground">…</Text>
</View>
```

### Monochrome First

Neutral by default. Colour appears only when it carries information: status, selection, action,
brand. Do not turn a number green because it is good news, and do not use colour fields to
partition a layout.

Always pair colour with a non-colour cue. Icon shape, wording, or position must convey the same
thing on its own.

### Domain Tokens On The Geist Palette

Charts, tags, code and chat surfaces, and the usage heat scale (`chart-*`, `tag-*`, `code-block`,
`inline-code`, `chat-user`, `chat-background`, `usage-level-*`) are mobile-owned product-domain
tokens and still point at `vercel.css`. Geist's ramp is deliberately non-monotonic, so when you
touch these, pick steps by measured luminance, never by step number:

- Light: `gray-400` is **lighter** than `gray-300`.
- Light: `gray-alpha-400` (.08) is **weaker** than `gray-alpha-300` (.1).
- Dark: `gray-alpha-800` (.47) is **weaker** than `gray-alpha-700` (.54).

The v2.2 ink ladder in `boss.css` is ordered by lightness and does not have this problem.

### Adding A Token

First answer: **does this role already have a name?** Among the product tokens it usually does. If
it genuinely does not:

1. Declare the value in `product.css`, pointing at a palette step (`var(--boss-ink-400)`), not an
   oklch literal, unless it must not follow the theme (see below). Declare the dark step in `.dark`
   when it differs: `boss.css` steps do not flip with the theme.
2. Add the name to `CHERRY_PRODUCT_VARIABLE_TOKENS` in
   `packages/design-tokens/scripts/theme-contract.ts` (the constant keeps its upstream name, PD-5).
3. Run `pnpm design:build` to regenerate `native.css`, then `pnpm design:check`.
4. If it is worth seeing, add it to `packages/ui/stories/foundations/tokens.ts`.

`check.ts` asserts that the contract list and the generated file agree item by item and in order,
that every reference resolves, that there are no cycles, that `@variant light` and `@variant dark`
declare exactly the same variable set, and that the text and UI pairs meet contrast
(`scripts/contrast.ts`). A missing dark value or a failing pair is caught there.

### Literal Colours: Four Exemptions

There is no fifth. A new literal must state in its commit which case it falls under, and register
its file with that case in the `colorLiteralAllowlist` of
`packages/design-tokens/scripts/check-app-theme.ts`. The check scans `src` and `packages/ui/src` for
colour literals and fails on any unregistered file (and on registered files whose literals are gone).

| Case | Examples | Why a token cannot serve |
|---|---|---|
| **Chrome over uncontrolled content** | Image viewer, camera preview, thumbnail badges | The backdrop is a photo, neither a light nor a dark surface. `--constant-black` / `--constant-white` already cover this; **use them instead of adding more** |
| **Artwork** | `logoPalette.ts` | Its colours encode relationships with each other, not roles. Changing one breaks the image |
| **Upstream of the tokens** | `brandAvatarStyles.ts`, which picks ink by luminance | Its output *is* the colour decision; reading a token back would be a cycle |
| **Outside the render tree** | `LoggerService` `%c` console styles, build scripts | Never passes through uniwind |

"This colour is fixed by the platform" is **not** on the list. The failure mode of literals is silent
divergence: the modal scrim was 40% in one place and 20% in another until it converged on `--scrim`.

## Typography

### Size Scale

The scale is `sizeSequence` in `packages/ui/src/utils/typography-scale.ts`, 13 steps. It stays
mobile's own (PD-8) because it drives the accessibility text-size steps:

| Step | Value | Role |
|---|---|---|
| `text-xs` | 13 / 18 | Label, metadata, eyebrow |
| `text-sm` | 14 / 20 | Compact |
| `text-base` | 16 / 24 | Body |
| `text-lg` | 18 / 28 | Lede |
| `text-xl` | 20 / 26 | Subsection |
| `text-2xl` | 24 / 32 | Section |
| `text-3xl` | 32 / 40 | Title |
| `text-4xl` | 40 / 48 | Page title |
| `text-5xl` | 48 / 56 | Display |
| `6xl`–`9xl` | 60 / 72 / 96 / 128 | No assigned role; original values kept |

**This array is also the accessibility ladder.** `resolveTypographyScale` implements FontSizeStep
0/1/2 by shifting the index, so the sequence must stay monotonically increasing and "+1 step" must
remain "the next size up". Editing it changes accessibility behaviour. **Editing the CSS does
nothing; edit the array.**

### Font Roles

Brand Guide v2.2 uses four faces in four roles, the same as desktop. They are declared in
`packages/design-tokens/src/styles/tokens/typography.css`, vendored in `assets/fonts/`, and
registered by the expo-font plugin in `app.json`, so a change needs a prebuild and a native rebuild;
a Metro reload will not show it.

| Role token | Face | Use | Pair with |
|---|---|---|---|
| `--font-display` | Space Grotesk SemiBold | Headings, section and screen titles. Never uppercase | `font-semibold` |
| `--font-ui` | Inter Regular | Control labels, UI chrome | `font-normal` |
| `--font-ui-medium` | Inter Medium | Emphasized control labels, chips, nav | `font-medium` |
| `--font-body` | Roboto Regular | Descriptive copy inside components | `font-normal` |
| `--font-mono` | JetBrains Mono Regular | Code, commands, paths, raw tokens, timestamps, short identifiers | `font-normal` |
| `--font-eyebrow` | JetBrains Mono SemiBold | The `eyebrow` utility only | (set by the utility) |

Chat prose stays on the platform font, as desktop keeps message text on the user's font.

**Pair a role with its weight class.** React Native takes exactly one registered font per
`fontFamily` and does not fall back through a stack, so each role names one static face, and a role
is a family *and* a weight. Always write the role and its matching weight together:
`font-display font-semibold`, `font-ui-medium font-medium`, `font-ui font-normal`. iOS then resolves
the face from the family, Android keeps the asset as-is, and before a native rebuild both platforms
fall back to the system font at the right weight instead of Regular. A role without its weight, or a
weight that contradicts the role, is a bug.

The `eyebrow` utility (`src/frontend/styles/global.css`) sets JetBrains Mono SemiBold, `text-xs`,
0.12em tracking, uppercase, and `primary` colour. Use it sparingly for a genuine section label, not
above every heading.

### Weights

Three weights only: `font-normal` (400), `font-medium` (500), `font-semibold` (600).
`--font-weight-bold` remaps `font-bold` to 600, so it is identical to `font-semibold`; semibold is the
heaviest role in the system, where desktop H1 uses 700. Never write a numeric `fontWeight`.

**Never set a full sentence or an entire table in mono.**

Build hierarchy with typography first, then spacing, and only then surfaces. Peer elements share
role, size, weight, and leading: **do not restyle one because its string is longer or its number is
larger.**

## Shape And Spacing

Radius has one source: `--radius` = 10px (Brand Guide v2.2 `radius-lg`), authored in `shadcn.css`.
`rounded-sm` through `rounded-4xl` are all derived in `build-native-css.ts` as
`calc(var(--radius) * n)`, with the same multipliers as desktop. The four sub-pixel hairline steps
(`--radius-4xs` … `--radius-xs`, in `tokens/radius.css`) are the exception: they are not on the scale
and are authored individually.

**Never write a numeric `borderRadius`.** A new step means changing a multiplier, not bypassing the
system in a component. Compact controls take smaller steps, containers larger ones, and
`rounded-full` is limited to pills, avatars, and circular controls.

Spacing uses the default Tailwind scale, which already matches the intended
4/8/12/16/20/24/32/40/48/64 with no conversion. Brand v2.2 did not change spacing (PD-11).

Every gap has exactly one owner: if the container sets `gap`, children do not add their own
margins. Fixing an awkward gap means changing the grouping or the owner, not adding a one-off
margin.

## Surfaces And Borders

The interface is one continuous surface by default. **A surface or a border has to earn its place**:
it must express selection, interactivity, a warning, or a real grouping that spacing cannot convey.

Reach for them in this order: spacing → alignment → typography → density → and only then borders and
surfaces.

Do not wrap every section in a card, and never nest cards. The four border tiers
(`border-subtle` < `border` < `border-strong` < `border-selected`) are monotonic in both themes;
choose by meaning, not by eye.

No decorative gradients, glows, glass, or textures. A shadow belongs to a floating element (popover,
menu, sheet) or intentional interaction feedback, never to routine static elevation.

When a screen feels cluttered, separate **volume** from **loudness**. Volume is fixed by removing,
merging, or reordering content. Loudness is fixed by reducing competing colours, sizes, weights,
borders, surfaces, and motion. Keep one deliberate anchor: restraint is not flattening everything
into having no focus.

## Motion

Motion is part of interaction, not decoration. It can make cause and effect legible, preserve
spatial or state continuity, provide immediate feedback, or help someone track a change. Choose it
when it improves understanding or control, not as a default treatment.

The product contract describes behavior rather than a platform-specific effect. The implementation
owner adapts that contract to the target environment, input method, component, content, distance,
and interaction frequency. Prefer established environment behavior and native primitives when they
satisfy the contract. Supported environments keep the same interaction meaning without being
forced into identical choreography.

When an interaction uses motion, that motion must be:

- **Responsive.** The interface responds as the causing action begins; motion never hides latency or
  delays the result.
- **Continuous.** While motion is running or being interrupted, visual state and velocity do not jump
  unexpectedly.
- **Interruptible.** A new action can take control immediately from the current visual state rather
  than waiting for an animation to finish.
- **Proportionate.** Distance, duration, emphasis, and repetition match the size, frequency, and
  importance of the change.
- **Adaptable.** User preferences and environment capabilities may reduce, replace, or remove
  motion. The resulting experience remains complete, understandable, and operable.
- **Performant.** Motion stays within the target environment's frame budget on representative
  supported hardware. Dropped frames, delayed feedback, and discontinuities are defects.

Repeated motion is reserved for communicating active progress or another changing state. It pauses
when inactive and has a nonmoving presentation. Reject motion that competes with content, attracts
attention without conveying new information, replays needlessly during frequent actions, obscures
causality, or moves an interaction target unpredictably.

Use the shared motion vocabulary for reusable behavior. A custom motion treatment documents its
purpose, trigger, ownership, interruption behavior, and reduced-motion result beside the component
or interaction that owns it. Exact implementation and target-specific adaptation remain with that
owner.

## Icons

The icon family is unchanged by the rebrand (PD-11): desktop and mobile use the same family.
General-purpose UI icons are Lucide SVG components adapted by `@cherrystudio/app-icons`. Import each
icon from its deep path, for example `@cherrystudio/app-icons/icons/check`; the package root exports
types only so Metro never traverses the complete Lucide icon set. In `className`, `size-*` sets the
dimensions and `text-*` sets the stroke colour; explicit `size`, `width`, `height`, and `color` props
win over `className`.

To add an icon, add one small adapter under `packages/app-icons/src/icons/` that default-imports the
matching `lucide-react-native/icons/*` module and exports `createIcon(...)`. Do not add icon barrels,
native glyph registries, fonts, or generated PNG/WebP variants. Provider and model brands, avatars,
logos, charts, and content images remain image assets rather than Lucide icons.

Icons are not decoration. Do not place them in coloured tiles and do not add them to fill space.
Prefer words where words are clearer.

The Boss mark is artwork, not an icon. Brand v2.2 keeps its spoke geometry legible only at 32px and
above; below that, use a simplified mark (crown dots only at 32px, hexagon only at 16px) rather than
the full mark.

## Accessibility

- **Contrast gate.** Body text (`text-sm` / `text-base`, including semibold) needs **4.5:1**.
  Graphics, control boundaries, and focus indicators need **3:1**. `pnpm design:check` asserts both
  on the resolved token values in both themes (`packages/design-tokens/scripts/contrast.ts`). Check
  the actual foreground/background pair before choosing a role; a role that passes on `card` may
  not pass on a tinted surface.
- **Border and input exemption.** `--border` and `--input` stay at desktop values (1.26:1 light,
  1.44:1 dark on the page) and are excluded from the gate: `border` draws decorative separators, and
  inputs are identified by their fill and visible label, not by the outline (SC 1.4.11 applies only
  to visual information needed to identify a component). Do not rely on `border` alone to identify
  a control. **The verifier checks input boundaries on device** for every change that touches an
  input or its surface.
- **Not colour alone.** Status, selection, and on/off state also show through icon shape, wording,
  position, or control state. Logo artwork is not a substitute for readable content.
- **Targets and names.** Touch targets are at least 44pt; icon-only controls have an accessible name.
- **Scalable text.** Layouts hold at every FontSizeStep and at large system text sizes.
- **Reduced motion** follows the Adaptable rule in [Motion](#motion).

## Deviations From Desktop

Mobile takes desktop v2.2 values unchanged except where WCAG 2.2 AA required a darker step of the
same hue. Every deviation, with measured ratios, is recorded in
[`packages/design-tokens/DEVIATIONS.md`](packages/design-tokens/DEVIATIONS.md). In short:

- `primary` light is `boss-brand-600`, not `boss-brand-500`; `brand` stays `boss-brand-500`.
- `destructive` is `boss-red-600`, not `boss-red-500`.
- `ring` is solid `primary`, not a 40–45% mix.
- The light feedback bases (`success`, `warning`, `info`, `error`) use the lightest step that reaches
  4.5:1, because mobile renders them as text.
- `inline-code-foreground` is mobile-only (`boss-brand-700` light).
- The type scale stays mobile's (PD-8); font roles, faces, and weights are ported.

Desktop's runtime user-theme default (`#00b96b`) is not ported; mobile has no action-colour setting.
This document also records v2.2 values (palette steps, surface ladder, font roles, radius) that the
desktop `DESIGN.md` delegates to its token files.

## Ownership

- **This document** holds only rules that apply across unrelated screens and stay stable as
  components evolve: role selection, depth, type roles, shape, motion contract, accessibility.
- **`packages/design-tokens/`** owns every value and the contract list; `DEVIATIONS.md` owns every
  departure from desktop. Token names are mobile-owned: no token name is serialized between the two
  apps, so `pnpm design:sync` syncs icons only and must not reinstate a desktop name.
- **CherryUI (`packages/ui`)** owns exact dimensions, variants, states, motion timing, and
  accessibility behaviour of shared components; its stories show supported composition. Do not
  restate those values here.
- **Feature screens** own their composition and layout, against a screen design contract in
  `docs/design/`. A page-specific layout becomes a system rule only after it is reused across
  independent features and has a shared implementation.
- **`boss-mobile-ux`** owns this document, the tokens, CherryUI, and the app shell. Token changes
  pass `pnpm design:check`; CherryUI boundaries pass `pnpm ui:check-boundaries`.

## Rejected

None of the following is accepted:

- **Hardcoded colours**, unless the change falls under one of the four exemptions and says so in the
  commit.
- **A second accent colour**, or ember used for links, ordinary selection, or decoration.
- **Palette steps in components** (`--boss-*`, `--gray-*`). Components use roles.
- **A font role without its weight class**, or a numeric `fontWeight`.
- **Ternaries whose branches are identical**: `isActive ? 'text-foreground' : 'text-foreground'`.
  Either make it differ or delete it along with the prop that feeds it.
- **Shipping a visual change verified in one theme only.**
- **Patching weak hierarchy with a border.** Unclear hierarchy is a typography and spacing problem; a
  border only hides it.
- **Decorative gradients, glows, textures, faux depth, skeuomorphic paper.** A gradient is valid only
  as a labelled continuous data scale.
- **The same role holding different values in different files.** On finding a divergence, converge
  on one token; do not copy one of them over the other.
- **"Desktop has it" as a reason.** The test is whether the thing is serialized: serialized shapes
  (part JSON, DB schema, DTOs) must align; values, interaction, and visuals may diverge. State the
  real reason in the commit, and check whether the desktop code is dead before aligning to it. See
  [Universal Package](docs/references/universal-package.md).
- **Working around `check.ts`.** What it blocks is a real problem, not noise.

## Gates

Token changes:

```bash
pnpm design:build          # regenerate native.css
pnpm design:check          # contract + contrast + app theme + icons
```

Any visual change:

```bash
pnpm typecheck:app
pnpm test:app -- <pattern>  # affected suites only
pnpm lint
pnpm format:check
```

Before opening a draft PR, follow the complete local gate in
[Testing And CI](docs/guides/testing-and-ci.md). If the draft changes later, rerun that gate on the
final head before marking it ready. The full test suite then runs in remote CI.

**Plus: look at it in both light and dark on a device or simulator.** Structural verification is not
the same as having seen it: contrast, hierarchy, and how a colour reads against real content only
show up on screen.

## Seeing The Current State

The Storybook `Foundations/*` stories render the full palette, semantic groups, surface/foreground
pairs, the type scale, weights, radii, and border tiers on device. After changing a token, look there
rather than reading CSS.

`packages/ui/stories/foundations/tokens.ts` holds the list those stories read, and
`__tests__/tokens.test.ts` checks it against the build output. A misspelled name does not throw at
runtime, it just renders a placeholder, and that test is the only thing that catches it.
