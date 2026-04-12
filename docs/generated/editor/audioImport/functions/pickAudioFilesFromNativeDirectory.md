[**din-studio**](../../../README.md)

***

[din-studio](../../../README.md) / [editor/audioImport](../README.md) / pickAudioFilesFromNativeDirectory

# Function: pickAudioFilesFromNativeDirectory()

> **pickAudioFilesFromNativeDirectory**(): `Promise`\<`File`[] \| `"unsupported"` \| `"cancelled"`\>

Defined in: [ui/editor/audioImport.ts:131](https://github.com/open-din/din-studio/blob/31e06758712a7d406225d6b4218252e8e7c11eeb/ui/editor/audioImport.ts#L131)

Uses `showDirectoryPicker` (read-only) when available, then walks the tree for audio extensions.

## Returns

`Promise`\<`File`[] \| `"unsupported"` \| `"cancelled"`\>

`unsupported` — use a fallback `<input webkitdirectory>`; `cancelled` — user dismissed the dialog; or file list (possibly empty).
