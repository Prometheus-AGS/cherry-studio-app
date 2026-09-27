# Bundled fonts

The Boss Brand Guide v2.2 §03 type roles, the same four faces as The Boss desktop. Every file is a
static TrueType face whose file name equals its PostScript name, which is what the font-role
variables in `packages/design-tokens/src/styles/tokens/typography.css` reference. The expo-font plugin
in `app.json` embeds them at build time, so adding or removing a face needs a prebuild and a native
rebuild.

| Role | Family | Files | Version | Source | License |
|---|---|---|---|---|---|
| display | Space Grotesk | `SpaceGrotesk-Regular.ttf`, `SpaceGrotesk-SemiBold.ttf`, `SpaceGrotesk-Bold.ttf` | 2.000 (release 2.0.0) | https://github.com/floriankarsten/space-grotesk/releases/download/2.0.0/SpaceGrotesk-2.0.0.zip | `SpaceGrotesk-OFL.txt` (OFL 1.1) |
| ui | Inter | `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf` | 4.001 (release v4.1), `extras/ttf/` | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip | `Inter-OFL.txt` (OFL 1.1) |
| body | Roboto | `Roboto-Regular.ttf`, `Roboto-Medium.ttf` | 3.016, `unhinted/static/` | https://github.com/googlefonts/roboto-3-classic/releases/download/v3.016/Roboto_v3.016.zip | `Roboto-OFL.txt` (OFL 1.1, from the same repository at tag v3.016) |
| mono, eyebrow | JetBrains Mono | `JetBrainsMono-Regular.ttf`, `JetBrainsMono-Medium.ttf`, `JetBrainsMono-SemiBold.ttf` | 2.304, `fonts/ttf/` | https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip | `JetBrainsMono-OFL.txt` (OFL 1.1) |
| legacy mono | Geist Mono | `GeistMono-Regular.ttf` | — | — | `GeistMono-OFL.txt` |

Release archive SHA-256:

- `SpaceGrotesk-2.0.0.zip` `53b415577d4139248555300710bea0d268c7a5be67b93de53b716a9736cabffd`
- `Inter-4.1.zip` `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`
- `Roboto_v3.016.zip` `1653dbe12f248da8fb0b9920db7b9496cd677ed3981154f6f15285c8bd4e334f`
- `JetBrainsMono-2.304.zip` `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf`

## Space Grotesk SemiBold is an instance, not an upstream file

Space Grotesk 2.0.0 ships static Light, Regular, Medium and Bold, and a variable font
(`ttf/SpaceGrotesk[wght].ttf`, weight 300–700) with no SemiBold instance. The mobile system's
heaviest weight is 600, so `SpaceGrotesk-SemiBold.ttf` was instanced from that variable font at
`wght=600` with fontTools 4.54.1 (`fontTools.varLib.instancer`), then named to match the upstream
static naming (family `Space Grotesk`, subfamily `SemiBold`, PostScript `SpaceGrotesk-SemiBold`,
`usWeightClass` 600). The OFL permits this Modified Version under the same name because the font
declares no Reserved Font Name.

## Registered versus vendored

Only faces that a font-role variable names are registered in `app.json`: `SpaceGrotesk-SemiBold`,
`Inter-Regular`, `Inter-Medium`, `Roboto-Regular`, `JetBrainsMono-Regular`, `JetBrainsMono-SemiBold`.
The other faces are vendored for desktop parity but are not bundled into the app until a role uses
them; add the role variable and the `app.json` entry in the same change.

`GeistMono-Regular.ttf` is no longer referenced by any style. Remove it, with `GeistMono-OFL.txt`,
once `app.json` stops registering it.
