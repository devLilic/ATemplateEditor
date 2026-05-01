# Template Contract

Template Contract defines the JSON shape used by ATemplateEditor templates. Its purpose is to keep template data portable, predictable, and readable by companion broadcast tools.

ATemplateEditor is the source of truth for the complete contract. It owns the full template structure, including authoring metadata, editable fields, preview data, and integration hints.

OnAir Player and TitleEditor should read only the contract parts they need. They should not require editor-only data in order to render or control a template.

## Base Structure

- `schemaVersion` identifies the contract version. The current minimal version is `1.0.0`.
- `canvas` defines the target composition size. The default canvas is `1920x1080`.
- `layers` define the visual stacking groups used by template elements.
- `elements` define renderable items. The initial supported element kinds are `text`, `image`, and `shape`.
- `assets` stores references to media or files used by template elements.
- `editableFields` describes fields intended to be edited by downstream tools.
- `bindings` connects editable data or external values to template elements.
- `previewData` stores sample data for editor preview use.
- `fallbackValues` stores safe values used when a binding or field value is missing.
- `osc` stores OSC metadata for future OnAir Player integration, without executing commands.
- `onAir` stores playout metadata such as timing and visibility behavior.

## Default Template

The default template is a neutral starting point for the editor. It provides enough structure for future UI flows to open a usable template without introducing editor logic in the contract layer.

- `canvas` uses the default `1920x1080` composition size.
- `layers` includes a `Main Layer`.
- `elements` includes a `Title` text element on the main layer.
- `editableFields` includes one editable field with the key `title`.
- `bindings` connects `title` to the text element's `text` target property.
- `previewData.title` stores the sample value shown in previews.
- `fallbackValues.title` stores the safe fallback value for the title field.

## Validation Rules

The base validator returns an object with `valid` and `errors`. Each error includes a `path` and a short `message`.

- Required root fields: `schemaVersion`, `id`, `name`, `canvas`, `layers`, `elements`, `assets`, `editableFields`, and `bindings`.
- `canvas.width` and `canvas.height` must be numbers greater than `0`.
- `layers` must be an array. Each layer requires a non-empty `id` and `name`, boolean `visible` and `locked`, numeric `zIndex`, and `opacity` between `0` and `1`.
- `elements` must be an array. Each element requires a non-empty `id`, `layerId`, `kind`, and `name`, valid `position` and `size`, boolean `visible` and `locked`, and kind-specific fields for `text`, `image`, or `shape`.
- Each element `layerId` must reference an existing layer id.
- `editableFields` must be an array. Each field requires a non-empty `id`, `key`, and `label`, a valid `type`, and boolean `required`.
- Editable field types currently accepted by validation are `text`, `image`, and `number`.
- `bindings` must be an array. Each binding requires a non-empty `id`, `fieldKey`, `elementId`, and valid `targetProperty`.
- Binding `fieldKey` must reference an existing editable field key, and `elementId` must reference an existing element id.
- Accepted binding `targetProperty` values are `text`, `image`, and `visibility`.

This document intentionally stays minimal until the contract evolves through implementation tasks.
