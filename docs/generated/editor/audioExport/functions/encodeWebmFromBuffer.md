[**din-studio**](../../../README.md)

***

[din-studio](../../../README.md) / [editor/audioExport](../README.md) / encodeWebmFromBuffer

# Function: encodeWebmFromBuffer()

> **encodeWebmFromBuffer**(`buffer`, `cropStart?`, `cropEnd?`): `Promise`\<`Blob`\>

Defined in: [ui/editor/audioExport.ts:142](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/audioExport.ts#L142)

Best-effort WebM/Opus re-encode by playing the buffer into a MediaRecorder sink.
Falls back to WAV if MediaRecorder is unavailable.

## Parameters

### buffer

`AudioBuffer`

### cropStart?

`number` \| `null`

### cropEnd?

`number` \| `null`

## Returns

`Promise`\<`Blob`\>
