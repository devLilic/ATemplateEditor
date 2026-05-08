# Template Contract

## Purpose

Template JSON is the shared contract used by `TemplateEditor`, downstream renderers, and import/export flows.

- `TemplateEditor` authors and writes the contract.
- Runtime tools read only the visual and output data they need.
- The contract remains independent from React, Electron, OSC transport details, and editor-only UI state.

## Root Fields

The template root object includes these top-level fields:

- `schemaVersion`
- `id`
- `name`
- `description`
- `canvas`
- `output`
- `fields`
- `assets`
- `layers`
- `preview`
- `metadata`

The root contract does not include:

- `editableFields`
- `previewData`
- `osc`
- `onAir`

Legacy compatibility may still exist internally in some helper modules, but exported template JSON must follow the root shape above.

## Schema Versioning

- `schemaVersion` is required.
- The current contract version is `"1.0.0"`.
- Breaking changes should increment the major version.
- Backward-compatible changes should increment the minor or patch version.

## Canvas

`canvas` defines the target visual composition.

Required fields:

- `width`
- `height`

Current defaults:

- `width: 1920`
- `height: 1080`
- `aspectRatio: "16:9"`
- `safeArea.enabled: true`
- `safeArea.marginX: 80`
- `safeArea.marginY: 60`

`safeArea` is a visual authoring guide for preview and layout. It is not runtime playback logic.

## Layers

`layers` are the visual contract for composition structure and stacking.

Each layer contains the common fields:

- `id`
- `name`
- `type`
- `visible`
- `locked`
- `zIndex`
- `box`
- `opacity`

`box` replaces separate position/size fields and contains:

- `x`
- `y`
- `width`
- `height`

Layer intent:

- `layers` are contract-level visual groups.
- They describe ordering and visibility rules for renderable content.
- They are not UI panels, editor tabs, or runtime timers.

Supported final layer types:

- `text`
- `image`
- `shape`
- `background`
- `group`

Layer behavior:

- `zIndex` controls stacking order.
- `visible` controls whether the layer should render.
- `locked` is editor authoring metadata.
- `group` is organizational and uses `children: string[]` to reference child layer ids.

### Text Layer

Text layers use:

- `fieldId`
- `fallbackText`
- `style.fontFamily`
- `style.fontSize`
- `style.color`
- `style.textAlign`
- `behavior.fitInBox`
- `behavior.fitMode`
- `behavior.minScaleX`
- `behavior.whiteSpace`

### Image Layer

Image layers use:

- `assetId`
- `fallbackPath`
- `style.objectFit`
- `style.objectPosition`

### Shape Layer

Shape layers use:

- `shape`
- `style.fill`
- `style.stroke`
- `style.strokeWidth`
- `style.borderRadius`

Supported `shape` values:

- `rectangle`
- `ellipse`
- `line`

### Background Layer

Background layers use:

- `style.fill`
- `style.assetId`
- `style.objectFit`

Background layers typically default to a full-canvas `box`.

### Group Layer

Group layers use:

- `children`

`children` is a string array of referenced child layer ids.

## Elements

`elements` remains the renderable item list used by the preview/rendering engine.

Supported kinds:

- `text`
- `image`
- `shape`

Text elements may still reference a field through `sourceField`, using the field `id` as the source identifier.

## Output

`output` stores downstream publishing metadata.

Current supported output field:

- `output.liveboard.templateName`

Important rules:

- The only LiveBoard-specific contract field is `output.liveboard.templateName`.
- `TemplateEditor` does not store OSC host, OSC port, OSC addresses, or playback commands in the final contract.
- `TemplateEditor` does not store OnAir runtime timers or transport state in the final contract.
- `TemplateEditor` defines only the template identifier needed downstream: `output.liveboard.templateName`.
- `OnAir Player` is responsible for OSC target configuration and OSC addresses at runtime.

## Fields

`fields` replaces `editableFields`.

Each field contains:

- `id`
- `label`
- `type`
- `required`
- `defaultValue`
- `placeholder`
- `description`

Rules:

- `id` is the stable field identifier.
- `type` is currently `"text"`.
- `defaultValue` is the field-level fallback value when preview data is absent.
- `fields` is the canonical authoring contract.

This means:

- `fields` replaces `editableFields` as the main contract structure.
- New code should identify fields by `id`, not by `fieldKey`.

## Assets

`assets` stores reusable media references.

Each asset contains:

- `id`
- `name`
- `type`
- `path`

Important rules:

- Assets use `path`.
- Exported template JSON must contain `path`, not `source.type` / `source.value`.
- Current asset type support is focused on `image`.
- Image elements link to assets through `assetId`.

Example asset:

```json
{
  "id": "asset-logo",
  "name": "Station Logo",
  "type": "image",
  "path": "assets/logo.png"
}
```

## Preview

`preview` stores authoring-only visual preview data.

`preview` contains:

- `sampleData`
- `background`
- `showSafeArea`
- `showLayerBounds`

Important changes:

- `preview.sampleData` replaces `previewData`.
- `preview.sampleData` is used only for authoring and preview.
- It is not live playout data.

Background variants:

- `{ "type": "color", "value": "#111827" }`
- `{ "type": "image", "assetId": "asset-id", "opacity": 0.24, "fitMode": "contain" }`

Defaults:

- `sampleData: {}`
- `background.type: "color"`
- `background.value: "#111827"`
- `showSafeArea: true`
- `showLayerBounds: false`

## Metadata

`metadata` stores lifecycle and editorial bookkeeping.

Current fields:

- `createdAt`
- `updatedAt`
- `duplicatedFromTemplateId`
- `tags`

This section does not define playback behavior.

## Removed From Final Contract

The final contract intentionally does not carry runtime transport metadata.

Not part of the final template contract:

- OSC host
- OSC port
- OSC play/stop/resume addresses
- OSC enabled state
- OnAir duration timers
- preroll/postroll timers
- auto-hide runtime state

Summary:

- `TemplateEditor` does not contain OSC host/port/address.
- `TemplateEditor` does not contain OnAir runtime/timers.
- The single LiveBoard field is `output.liveboard.templateName`.
- `OnAir Player` owns OSC target/address resolution and runtime playback transport.

## Default Template

The default template currently provides:

- a `1920x1080` canvas
- a `16:9` aspect ratio
- enabled safe area margins
- one `Main Layer`
- one `Title` text element
- one field with `id: "title"`
- `preview.sampleData.title = "Sample title"`
- `output.liveboard.templateName = ""`

## Minimal Valid Template Example

```json
{
  "schemaVersion": "1.0.0",
  "id": "template-001",
  "name": "Lower Third",
  "description": "",
  "canvas": {
    "width": 1920,
    "height": 1080,
    "aspectRatio": "16:9",
    "safeArea": {
      "enabled": true,
      "marginX": 80,
      "marginY": 60
    }
  },
  "output": {
    "liveboard": {
      "templateName": ""
    }
  },
  "fields": [
    {
      "id": "title",
      "label": "Title",
      "type": "text",
      "required": false,
      "defaultValue": "Breaking News"
    }
  ],
  "assets": [
    {
      "id": "asset-logo",
      "name": "Station Logo",
      "type": "image",
      "path": "assets/logo.png"
    }
  ],
  "layers": [
    {
      "id": "layer-main",
      "name": "Main Layer",
      "type": "text",
      "visible": true,
      "locked": false,
      "zIndex": 0,
      "box": {
        "x": 160,
        "y": 820,
        "width": 1400,
        "height": 120
      },
      "opacity": 1,
      "fieldId": "title",
      "fallbackText": "Breaking News",
      "style": {
        "fontFamily": "IBM Plex Sans",
        "fontSize": 64,
        "color": "#FFFFFF",
        "textAlign": "left"
      },
      "behavior": {
        "fitInBox": true,
        "fitMode": "scaleX",
        "minScaleX": 0.65,
        "whiteSpace": "nowrap"
      }
    }
  ],
  "preview": {
    "sampleData": {
      "title": "Preview headline"
    },
    "background": {
      "type": "color",
      "value": "#111827"
    },
    "showSafeArea": true,
    "showLayerBounds": false
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "duplicatedFromTemplateId": null,
    "tags": []
  }
}
```

## Export / Import JSON

- Export uses `JSON.stringify(template, null, 2)`.
- Import starts with `JSON.parse`.
- Import validates the parsed object before accepting it.
- Exported asset references use `path`.
- Exported preview authoring data uses `preview.sampleData`.

## Validation

`validateTemplate(template, options?)` returns:

- `valid`
- `errors`
- `warnings`

Each validation issue contains:

- `path`
- `message`

Validation intent:

- `errors` block a valid template result.
- `warnings` describe incomplete or risky authoring state without making the template invalid in draft mode.

### Validation Modes

`validateTemplate` supports:

- `mode: "draft"`
- `mode: "finalExport"`

Draft mode:

- keeps authoring permissive
- reports `output.liveboard.templateName === ""` as a warning

Final export mode:

- is stricter for exported delivery
- reports `output.liveboard.templateName === ""` as an error

### Duplicate Id Validation

The validator reports errors for duplicate ids in:

- `fields[].id`
- `layers[].id`
- `assets[].id`

Ids must be unique inside their own collection.

### Invalid Reference Validation

The validator reports errors when a reference points to a missing target:

- `text` layer `fieldId` references a missing field
- `image` layer `assetId` references a missing asset
- `background` layer `style.assetId` references a missing asset
- `group` layer `children[]` references a missing layer

These checks protect the final contract from dangling references in render/export flows.

### Warning Cases

Current warning cases include:

- a field is defined but unused by any text layer
- a text layer has neither `fieldId` nor `fallbackText`
- a template has no layers
- an asset is defined but unused
- `output.liveboard.templateName` is empty in draft mode

Warnings are intended to surface editorial cleanup work before final export, not to block ongoing authoring.

## Application Compatibility

### TemplateEditor

- Reads and writes the final contract.
- Uses `fields` as the canonical editable data definition.
- Uses `preview.sampleData` for local preview authoring.
- Does not store OSC transport config in the final contract.
- Does not store OnAir runtime timers in the final contract.
- Defines `output.liveboard.templateName` and no other OSC runtime settings.

### LiveBoard Integration

- Reads `output.liveboard.templateName` when a template needs a LiveBoard identifier.
- No other LiveBoard transport or runtime settings are stored in the template contract.

### OnAir Player

- Reads `output.liveboard.templateName` to locate or map the downstream playout template.
- Owns OSC host, OSC port, OSC addresses, and runtime playout commands.
- Owns timer-based playback behavior outside the template authoring contract.

### Render / Preview Engines

- Read `canvas`, `layers`, `assets`, and `preview`.
- Treat `layers` as visual contract structure.
- Resolve image assets through `assetId -> assets[].path`.
