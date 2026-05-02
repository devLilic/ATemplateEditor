# UI / UX Notes

## Visual direction

- ATemplateEditor uses a dark UI as the primary visual style.
- Panels should remain clear, separated, and easy to scan.
- Cyan is the main accent color for focus, emphasis, and editor actions.
- Blue is reserved for selected items such as templates, layers, and elements.
- Success, warning, and danger colors are used only for state messaging and status feedback.

## Layout rules

- The preview is the main workspace area and stays visually central.
- The template library sits on the left side in desktop layouts.
- Properties and metadata panels sit on the right side in desktop layouts.
- On smaller viewports, panels may stack, but the preview should remain easy to reach and read.

## Forms

- Forms are compact and optimized for dense editor workflows.
- Labels are small, clear, and consistent across all inspector panels.
- Inputs, selects, and checkboxes should use the same dark UI treatment and spacing rhythm.

## Testing scope

- UI tests verify structure, labels, and basic accessibility markers.
- Tests do not enforce pixel-perfect rendering, exact spacing, or exact color values.
