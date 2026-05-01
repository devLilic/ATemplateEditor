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

This document intentionally stays minimal until the contract evolves through implementation tasks.
