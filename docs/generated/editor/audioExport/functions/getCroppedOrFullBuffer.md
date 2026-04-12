[**din-studio**](../../../README.md)

***

[din-studio](../../../README.md) / [editor/audioExport](../README.md) / getCroppedOrFullBuffer

# Function: getCroppedOrFullBuffer()

> **getCroppedOrFullBuffer**(`buffer`, `cropStart`, `cropEnd`): `AudioBuffer`

Defined in: [ui/editor/audioExport.ts:11](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/audioExport.ts#L11)

Returns a shallow copy of the buffer window [cropStart, cropEnd) in seconds.
When crop covers the full buffer, returns the same buffer reference.

## Parameters

### buffer

`AudioBuffer`

### cropStart

`number` \| `null`

### cropEnd

`number` \| `null`

## Returns

`AudioBuffer`
