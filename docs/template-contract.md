# Template Contract

## Purpose

Template JSON is the shared contract used by `TemplateEditor`, `OnAir Player`, and `TitleEditor`.

- `TemplateEditor` defines and writes the complete contract.
- `OnAir Player` reads only the fields required for rendering and runtime behavior.
- `TitleEditor` reads only the fields required for editable inputs and data mapping.

The contract is intended to keep templates portable, predictable, and readable across applications without requiring editor-only behavior in runtime tools.

## Root Fields

The template root object includes these top-level fields:

- `schemaVersion`
- `id`
- `name`
- `type`
- `canvas`
- `layers`
- `elements`
- `assets`
- `editableFields`
- `bindings`
- `previewData`
- `fallbackValues`
- `osc`
- `onAir`
- `metadata`

## Schema Versioning

- `schemaVersion` is required.
- The current contract version is `"1.0.0"`.
- Breaking changes should increment the major version.
- Backward-compatible changes should increment the minor or patch version.
- Applications should reject unknown schema versions or warn clearly before attempting to continue.
- Formal migration rules and migration tooling will be defined separately in the future.

## Canvas

`canvas` defines the target composition size.

- `width`
- `height`

Current defaults:

- default size is `1920x1080`
- default aspect ratio is `16:9`

The preview system is designed around this 16:9 composition model, even when the editor UI displays the frame at a scaled size.

## Layers

`layers` defines the visual stacking groups used by template elements.

Each layer contains:

- `id`
- `name`
- `visible`
- `locked`
- `zIndex`
- `opacity`

Layer responsibilities:

- `id` is the stable identifier referenced by elements.
- `name` is the editor-facing label.
- `visible` controls whether the layer should be shown.
- `locked` marks the layer as protected from editing interactions.
- `zIndex` defines layer order.
- `opacity` defines layer transparency.

## Elements

`elements` defines the renderable items placed on the canvas.

Supported element kinds:

- `text`
- `image`
- `shape`

### Common Element Fields

All elements share these fields:

- `id`
- `kind`
- `layerId`
- `name`
- `position`
- `size`
- `visible`
- `locked`

Common nested structures:

- `position.x`
- `position.y`
- `size.width`
- `size.height`

### Text Element

A text element extends the common fields with:

- `rotation`
- `sourceField`
- `fallbackText`
- `style`

Current text style fields:

- `style.fontSize`
- `style.fontFamily`
- `style.color`
- `style.textAlign`

Text elements are used for labels, titles, subtitles, or any runtime text content that can later be connected through bindings.

### Image Element

An image element extends the common fields with:

- `assetId`
- `opacity`
- `objectFit`

Image elements do not embed image bytes directly. They reference entries from `assets` by `assetId`.

### Shape Element

A shape element extends the common fields with:

- `shapeType`
- `fillColor`
- `borderColor`
- `borderWidth`

Current supported shape types:

- `rectangle`
- `ellipse`

## Assets

`assets` stores reusable asset references used by templates.

Current role of assets:

- assets describe media sources used by template elements
- current asset type support is focused on image assets
- image elements link to assets through `assetId`

Each asset includes:

- `id`
- `name`
- `type`
- `source`
- `metadata`

Current source model:

- `source.type`
- `source.value`

Current source types:

- `local`
- `remote`
- `data`

For image workflows:

- `image` elements may contain `assetId`
- if `assetId` resolves to an asset in `assets`, the element is considered linked
- if `assetId` is missing or unresolved, the preview currently falls back to placeholder behavior

## Editable Fields

`editableFields` defines what `TitleEditor` is allowed to edit.

Each editable field includes:

- `id`
- `key`
- `label`
- `type`
- `required`
- `defaultValue`

Field roles:

- `key` is the stable logical identifier used by bindings
- `label` is the human-readable name shown in editing tools
- `type` describes the expected data type
- `required` marks whether downstream tools should treat the field as mandatory
- `defaultValue` provides a base value when no preview or fallback value exists

Current implemented field type:

- `text`

## Bindings

`bindings` connects editable fields to template elements.

Each binding includes:

- `id`
- `fieldKey`
- `elementId`
- `targetProperty`

Binding roles:

- `fieldKey` points to one field from `editableFields`
- `elementId` points to one element from `elements`
- `targetProperty` defines what part of the element is driven by the field

Current accepted binding targets:

- `text`

Binding maintenance rules used by the editor:

- removing a field removes the bindings that reference its `key`
- removing a field also removes associated `previewData` and `fallbackValues`
- renaming a field key updates the bindings that referenced the previous key

## Preview Data And Fallback Values

`previewData` and `fallbackValues` support authoring and safe preview behavior.

### Preview Data

- `previewData` is used only by `TemplateEditor`
- it exists to make preview rendering meaningful during authoring
- it is not real playout data

### Fallback Values

- `fallbackValues` is used when real or preview data is missing
- it provides safe defaults for preview and downstream rendering behavior

### Value Priority

Field value resolution uses this priority:

1. `previewData`
2. `fallbackValues`
3. `editableField.defaultValue`
4. `""`

### Relationship To Other Apps

- `TemplateEditor` uses `previewData` directly
- `TitleEditor` will produce the real runtime values in the future application flow
- `OnAir Player` should not treat `previewData` as authoritative live data

## OSC And OnAir Metadata

`osc` and `onAir` store metadata for future runtime integration.

This part of the contract is metadata only. It is not execution logic.

### OSC Metadata

`osc` currently contains:

- `enabled`
- `playCommand`
- `stopCommand`

Important rules:

- `TemplateEditor` does not send OSC
- `osc.enabled` does not start OSC transmission inside `TemplateEditor`
- `playCommand` and `stopCommand` are stored as metadata only

### OnAir Metadata

`onAir` currently contains:

- `durationMs`
- `autoHide`
- `prerollMs`
- `postrollMs`

Runtime intent:

- `onAir.durationMs` can be used by `OnAir Player` for behaviors such as auto-hide timing
- `prerollMs` and `postrollMs` are informative runtime values
- this section is read by `OnAir Player`, not executed by `TemplateEditor`

## Default Template

The default template is a neutral starting point for authoring.

It currently provides:

- a `1920x1080` canvas
- one `Main Layer`
- one `Title` text element
- one editable field with key `title`
- one binding from `title` to the text element `text` target
- one preview value for `title`
- one fallback value for `title`

## Minimal Valid Template Example

```json
{
  "schemaVersion": "1.0.0",
  "id": "template-001",
  "name": "Lower Third",
  "type": "graphic",
  "canvas": {
    "width": 1920,
    "height": 1080
  },
  "layers": [
    {
      "id": "layer-main",
      "name": "Main Layer",
      "visible": true,
      "locked": false,
      "zIndex": 0,
      "opacity": 1
    }
  ],
  "elements": [
    {
      "id": "element-title",
      "kind": "text",
      "layerId": "layer-main",
      "name": "Title",
      "position": {
        "x": 120,
        "y": 120
      },
      "size": {
        "width": 800,
        "height": 100
      },
      "visible": true,
      "locked": false,
      "rotation": 0,
      "fallbackText": "Breaking News",
      "style": {
        "fontSize": 48,
        "fontFamily": "Arial",
        "color": "#FFFFFF",
        "textAlign": "left"
      }
    }
  ],
  "assets": [],
  "editableFields": [
    {
      "id": "field-title",
      "key": "title",
      "label": "Title",
      "type": "text",
      "required": true,
      "defaultValue": "Breaking News"
    }
  ],
  "bindings": [
    {
      "id": "binding-title",
      "fieldKey": "title",
      "elementId": "element-title",
      "targetProperty": "text"
    }
  ],
  "previewData": {
    "title": "Preview headline"
  },
  "fallbackValues": {
    "title": "Fallback headline"
  },
  "osc": {
    "enabled": false
  },
  "onAir": {
    "autoHide": false,
    "prerollMs": 0,
    "postrollMs": 0
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

## Image Asset Example

```json
{
  "assets": [
    {
      "id": "asset-logo",
      "name": "Station Logo",
      "type": "image",
      "source": {
        "type": "remote",
        "value": "https://example.com/logo.png"
      },
      "metadata": {
        "mimeType": "image/png"
      }
    }
  ],
  "elements": [
    {
      "id": "element-logo",
      "kind": "image",
      "layerId": "layer-main",
      "name": "Logo",
      "position": {
        "x": 1600,
        "y": 60
      },
      "size": {
        "width": 220,
        "height": 220
      },
      "visible": true,
      "locked": false,
      "assetId": "asset-logo",
      "opacity": 1,
      "objectFit": "contain"
    }
  ]
}
```

- The asset defines the image source.
- The image element refers to that asset through `assetId`.
- `PreviewCanvas` can show a placeholder when the referenced asset is not resolved.

## Validation Rules

The validator returns an object with `valid` and `errors`. Each error includes a `path` and a short `message`.

- Required root fields include `schemaVersion`, `id`, `name`, `canvas`, `layers`, `elements`, `assets`, `editableFields`, and `bindings`.
- `canvas.width` and `canvas.height` must be numbers greater than `0`.
- `layers` must be an array. Each layer requires a non-empty `id` and `name`, boolean `visible` and `locked`, numeric `zIndex`, and `opacity` between `0` and `1`.
- `elements` must be an array. Each element requires a non-empty `id`, `layerId`, `kind`, and `name`, valid `position` and `size`, boolean `visible` and `locked`, and kind-specific fields for `text`, `image`, or `shape`.
- Each element `layerId` must reference an existing layer id.
- `editableFields` must be an array. Each field requires a non-empty `id`, `key`, and `label`, a valid `type`, and boolean `required`.
- Editable field types currently accepted by validation are `text`.
- `bindings` must be an array. Each binding requires a non-empty `id`, `fieldKey`, `elementId`, and valid `targetProperty`.
- Binding `fieldKey` must reference an existing editable field key, and `elementId` must reference an existing element id.
- Accepted binding `targetProperty` values are `text`.

## Export / Import JSON

- Export uses `JSON.stringify(template, null, 2)`, so the produced JSON is indented with `2` spaces.
- Import starts with `JSON.parse` on the provided input text.
- After parsing, import runs `validateTemplate()` on the parsed value.
- Import rejects invalid JSON and returns an error at path `$` with the message `Invalid JSON`.
- Import rejects templates that do not pass validation and returns the validator errors with their `path` and `message`.
- Import preserves the template `id`; importing an exported template keeps the same identifier.
- The current editor UI exposes export and import through textareas. It does not use a file picker yet.

## Application Compatibility

### TemplateEditor

- `TemplateEditor` reads and writes the full contract.
- It uses `previewData` for local preview behavior.
- It uses `fallbackValues` for preview simulation when data is missing.
- It does not send OSC.

### TitleEditor

- `TitleEditor` reads `editableFields`.
- It reads `bindings` as logical mapping information.
- It produces the real field values used by downstream runtime flows.
- It does not modify the template layout structure.

### OnAir Player

- `OnAir Player` reads `canvas`, `layers`, and `elements`.
- It reads `assets`.
- It reads `bindings`.
- It reads `fallbackValues`.
- It reads `osc` and `onAir`.
- OSC transmission belongs only to `OnAir Player`, not to `TemplateEditor`.
