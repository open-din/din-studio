# 10 Asset Library Actions

## Feature

Describe how contributors search, preview, import, relink, and recover assets through the workspace Asset Library without overlapping launcher import ownership.

### F10-S01 Asset search and filtering reduce the visible decision set

**User Story** As a contributor, I want search and filtering to reduce noise so I can find the right asset quickly in a large library.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Hick's Law`, `Selective Attention`

**Given** the Asset Library is opened from the left drawer and contains audio, impulse, MIDI, or patch files
**When** the contributor searches or filters the list
**Then** the result set narrows predictably and keeps the next likely action obvious

### F10-S02 Asset preview and relink flows recover from imperfect input gracefully

**User Story** As a contributor, I want import and relink flows to tolerate imperfect input so I can recover without restarting the task.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Postel's Law`, `Doherty Threshold`

**Given** the contributor enters an incomplete file name, path, or relink hint
**When** the Asset Library attempts to resolve the target asset
**Then** the UI proposes useful matches, preserves intent, and guides recovery instead of failing hard

### F10-S03 Missing asset repair ends on a clear and satisfying recovery state

**User Story** As a contributor, I want missing-asset repair to end clearly so I know the broken reference was actually resolved.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Peak-End Rule`, `Von Restorff Effect`

**Given** an asset is missing and the contributor completes the repair flow
**When** the relink or replacement succeeds
**Then** the library removes the error emphasis, confirms the fix, and restores the expected preview state

### F10-S04 Library category tabs switch between Audio, Convolvers, MIDI, and Patches asset views

**User Story** As a contributor, I want the Asset Library tabs to separate file families clearly so I can stay inside one decision set at a time.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Hick's Law`, `Selective Attention`

**Given** the library contains audio, impulse, MIDI, and patch files
**When** the contributor switches category tabs
**Then** each tab isolates the matching file family without leaking unrelated results into view

### F10-S05 Importing a MIDI file routes the asset into the MIDI library category

**User Story** As a contributor, I want MIDI imports to land in the MIDI category automatically so I do not need to reorganize them after import.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Postel's Law`, `Doherty Threshold`

**Given** the contributor imports a supported MIDI file
**When** the Asset Library stores it in the workspace
**Then** the file appears under the MIDI category with the expected project-relative path

### F10-S06 Importing an impulse file routes the asset into the Convolvers library category

**User Story** As a contributor, I want impulse responses to land in the Convolvers category so routing assets stay grouped together.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Postel's Law`, `Doherty Threshold`

**Given** the contributor imports a supported impulse file
**When** the Asset Library stores it in the workspace
**Then** the file appears under the Convolvers category with the expected project-relative path

### F10-S07 Importing a patch file routes the asset into the Patches library category

**User Story** As a contributor, I want imported `.patch.json` and `.din` files to land in the Patches category automatically so reusable nested graphs stay easy to find.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Postel's Law`, `Doherty Threshold`

**Given** the contributor imports a supported patch file
**When** the Asset Library stores it in the workspace
**Then** the file appears under the Patches category inside the `patches/` project folder
