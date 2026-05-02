# Preview16x9

## Purpose

`Preview16x9` is the shared preview module used to project a template into a 16:9 preview frame.

Its role is to provide a reusable preview pipeline for template rendering without coupling the calculation layer to one specific screen or editor layout.

## Shared Module

- The module is shared and intended to be reusable across editor and runtime-oriented preview surfaces.
- It does not depend on one specific UI shell.
- It should stay focused on preview projection, not editor interaction logic.

## Engine Responsibilities

The `Preview16x9` engine calculates the preview projection before rendering.

Current responsibilities include:

- calculating the preview frame
- calculating preview scale
- calculating the element layout inside the frame

The engine is responsible for turning template data into a render-ready layout model.

## PreviewCanvas

`PreviewCanvas` is the rendering layer that consumes the output of the `Preview16x9` engine.

- it renders the root preview canvas and the inner 16:9 frame
- it renders the calculated layout output
- it stays lightweight and focused on display

## Supported Element Kinds

The current preview pipeline supports:

- `text`
- `image`
- `shape`

## Layout Rules

The preview respects the main structural rules from the template:

- `layers`
- `zIndex`
- `visible`

This means element order and visibility are derived from the template contract rather than from ad-hoc UI state.

## Text Resolution

For text preview, the module uses template preview value resolution rules:

- `previewData`
- `fallbackValues`
- field default values when applicable

This allows `PreviewCanvas` to show meaningful placeholder or authoring text even when no runtime data is available.

## Asset Behavior

For image elements, the current preview supports template-linked asset metadata at a basic level.

- image elements may reference assets through `assetId`
- preview can show placeholder information for linked or missing assets
- the module does not resolve complex real file paths yet
- the module does not implement a full asset loading pipeline yet

## Current Scope

`Preview16x9` is a presentation and layout helper. It is not responsible for:

- editor interactions
- drag and drop
- property editing
- real playout behavior
- advanced asset resolution
