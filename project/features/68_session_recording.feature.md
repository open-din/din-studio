# 68 Session Recording (Graph Output)

## Feature

Capture the master output of the active graph while transport is running, with a dedicated **Recording** bottom-drawer tab for live waveform feedback, post-capture preview, crop, loop, file export, and library import (sample or impulse).

### F68-S01 Recording tab appears in the bottom drawer

**User Story** As an editor, I want a Recording tab next to Runtime and Diagnostics so I can manage captures without leaving the shell.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Jakob's Law`, `Selective Attention`

**Given** the bottom drawer is open  
**When** I scan the tab row  
**Then** I see Runtime, Diagnostics, Recording, and AI Agent tabs

### F68-S02 Transport record arms capture and can be cancelled

**User Story** As an editor, I want to arm recording from the canvas transport and cancel before play without leaving a stale state.
**Future Test Layer** `e2e` via `playwright`
**UX Laws** `Hick's Law`, `Postel's Law`

**Given** the graph is stopped and I open the recording drawer  
**When** I press the record control on the canvas transport  
**Then** the UI shows an armed state and I can cancel without creating a clip

### F68-S03 WAV export encodes cropped buffers deterministically

**User Story** As a contributor, I want WAV encoding to remain stable for tests and library import.
**Future Test Layer** `integration` via `vitest`
**UX Laws** `Postel's Law`

**Given** a decoded `AudioBuffer` and crop windows  
**When** WAV export runs  
**Then** the output contains a valid RIFF/WAVE header and expected sample frame counts
