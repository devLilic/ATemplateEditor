# Preview16x9

## Purpose

`Preview16x9` is the shared preview module that projects a template into a 16:9 frame for editor and viewer rendering.

Its job is to:

- read the shared template contract
- resolve preview text values
- sort and project layers into frame space
- render optional editorial overlays in editor mode only

## Final Input

The final preview input is:

- `template`
- `data?`
- `mode?`

Shape:

```ts
interface Preview16x9Input {
  template: TemplateContract
  data?: Record<string, string>
  mode?: 'editor' | 'viewer'
}
```

Rules:

- `template` is required
- `data` is optional runtime-style text input
- `mode` defaults to `"editor"` when omitted

## Layer Rendering

`Preview16x9` renders `template.layers` directly.

Current rendering rules:

- layers are sorted by `zIndex`
- layers with `visible: false` are not rendered
- `group` layers are organizational in the first version and are not rendered directly
- layout uses `layer.box`

`box` contains:

- `x`
- `y`
- `width`
- `height`

## Supported Layer Types

The preview currently understands:

- `text`
- `image`
- `shape`
- `background`
- `group`

Behavior by type:

- `text` resolves content through `fieldId` and fallback rules
- `image` resolves image content through `assetId` and `fallbackPath`
- `shape` renders `fill`, `stroke`, `strokeWidth`, and `borderRadius`
- `background` renders `fill` and may render a background asset image
- `group` is not rendered directly

## Text Resolve Order

Text resolution is centralized in `resolveTextLayerContent(input, layer)`.

Final resolve order:

1. `input.data[fieldId]`
2. `template.preview.sampleData[fieldId]`
3. `field.defaultValue`
4. `layer.fallbackText`
5. `""`

Special cases:

- if `layer.fieldId` is missing, the preview uses `layer.fallbackText`
- if the field does not exist, the preview falls back to `layer.fallbackText`

## Editor And Viewer Mode

`mode` controls whether editorial overlays are visible.

### Editor Mode

In `"editor"` mode:

- `preview.showSafeArea` may render the safe area overlay
- `preview.showLayerBounds` may render a bounds outline for each rendered layer

### Viewer Mode

In `"viewer"` mode:

- editorial overlays are not rendered
- safe area is hidden
- layer bounds are hidden

## Safe Area

The safe area overlay is derived from `template.canvas.safeArea`.

It uses:

- `enabled`
- `marginX`
- `marginY`

The safe area is only shown when all of these are true:

- `mode === "editor"`
- `template.preview.showSafeArea === true`
- `template.canvas.safeArea.enabled === true`

## Layer Bounds

Layer bounds are editorial outlines drawn for each rendered layer layout box.

They are only shown when:

- `mode === "editor"`
- `template.preview.showLayerBounds === true`

Bounds are based on the final projected layer layout after:

- `zIndex` sorting
- visibility filtering
- frame scaling

## zIndex

`zIndex` is the stacking source of truth for preview rendering.

Rules:

- lower `zIndex` renders first
- higher `zIndex` renders later
- visual stacking follows sorted layer order, not UI selection state

## fitInBox

Text fitting follows the final contract behavior:

- `fitInBox: true`
- `fitMode: "scaleX"`
- default `minScaleX: 0.65`
- `whiteSpace: "nowrap"`

Rendering rules:

- text does not wrap
- text does not truncate
- horizontal scale is recalculated from text content, font, and container width
- fitting uses `scaleX(...)`

The effective scale is recalculated when these inputs change:

- text content
- `fontSize`
- `fontFamily`
- container width
- font readiness when `document.fonts.ready` is available

## Current Scope

`Preview16x9` is responsible for preview projection and rendering only.

It is not responsible for:

- editor interactions
- drag and drop
- template editing
- runtime playout logic
- transport behavior
