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

## Export / Import JSON

- Export uses `JSON.stringify(template, null, 2)`, so the produced JSON is indented with `2` spaces.
- Import starts with `JSON.parse` on the provided input text.
- After parsing, import runs `validateTemplate()` on the parsed value.
- Import rejects invalid JSON and returns an error at path `$` with the message `Invalid JSON`.
- Import rejects templates that do not pass validation and returns the validator errors with their `path` and `message`.
- Import preserves the template `id`; importing an exported template keeps the same identifier.
- The current editor UI exposes export and import through textareas. It does not use a file picker yet.

## Preview Data And Fallback Values

- `previewData` is used only for preview inside `TemplateEditor`.
- `fallbackValues` is used when real data is missing for a field or binding target.
- Value resolution priority is:
  1. `previewData`
  2. `fallbackValues`
  3. `editableField.defaultValue`
  4. `""`
- `previewData` is not real playout data and should not be treated as on-air content.
- `TitleEditor` will produce the real data payloads in the separate application flow.

## Editable Fields And Bindings

- `editableFields` defines the values that `TitleEditor` is allowed to edit in the companion application flow.
- `bindings` connects a `fieldKey` from `editableFields` to a target `elementId` in the template.
- Accepted `targetProperty` values are:
  - `text`
  - `image`
  - `visibility`
- Removing an editable field also removes the bindings that reference its `key`, together with the associated `previewData` and `fallbackValues` entries.
- Renaming the `key` of an editable field updates the bindings that referenced the previous key.
- `editableFields` and `bindings` are part of the shared template contract used between authoring and downstream applications.

## OnAir Metadata Bridge

- `onAir` metadata is configuration only for the future `OnAir Player`.
- `TemplateEditor` does not send OSC and does not execute playout commands.
- `osc.enabled` does not start OSC transmission inside `TemplateEditor`.
- `osc.playCommand` and `osc.stopCommand` are stored as metadata only.
- `onAir.durationMs` can be used by `OnAir Player` for runtime behaviors such as auto-hide.
- `onAir.prerollMs` and `onAir.postrollMs` are informative timing values for runtime integration.
- This section is read by `OnAir Player`; it is not executed by `TemplateEditor`.

This document intentionally stays minimal until the contract evolves through implementation tasks.
