[**din-studio**](../../../README.md)

***

[din-studio](../../../README.md) / [editor/types](../README.md) / RecordingState

# Interface: RecordingState

Defined in: [ui/editor/types.ts:647](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L647)

## Properties

### audioBuffer

> **audioBuffer**: `AudioBuffer` \| `null`

Defined in: [ui/editor/types.ts:651](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L651)

Set after stop when decode succeeds

***

### blob

> **blob**: `Blob` \| `null`

Defined in: [ui/editor/types.ts:649](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L649)

***

### cropEnd

> **cropEnd**: `number` \| `null`

Defined in: [ui/editor/types.ts:661](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L661)

***

### cropStart

> **cropStart**: `number` \| `null`

Defined in: [ui/editor/types.ts:660](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L660)

Crop region in seconds (inclusive start, exclusive end), null = full buffer

***

### decodeError

> **decodeError**: `string` \| `null`

Defined in: [ui/editor/types.ts:654](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L654)

***

### durationSec

> **durationSec**: `number`

Defined in: [ui/editor/types.ts:652](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L652)

***

### isPlayingBack

> **isPlayingBack**: `boolean`

Defined in: [ui/editor/types.ts:657](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L657)

***

### loopEnabled

> **loopEnabled**: `boolean`

Defined in: [ui/editor/types.ts:658](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L658)

***

### mimeType

> **mimeType**: `string`

Defined in: [ui/editor/types.ts:653](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L653)

***

### phase

> **phase**: [`RecordingPhase`](../type-aliases/RecordingPhase.md)

Defined in: [ui/editor/types.ts:648](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L648)

***

### playbackPosition

> **playbackPosition**: `number`

Defined in: [ui/editor/types.ts:656](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/types.ts#L656)

Post-recording preview
