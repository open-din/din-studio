# Audio library

The **Audio Library** opens from the activity rail (**Library**). It shares the same **left drawer** as Explorer and Catalog, so you always see one browsing context at a time.

## What it is for

- **Upload** audio files your graphs can reference by stable IDs.  
- **Preview** files with playback controls on each tile.  
- **Search** the library as it grows.  
- **Delete** files when you no longer need them (confirm destructive actions).  

## Using library audio in graphs

- **Sampler** nodes choose **samples** from the library.  
- **Convolver** nodes choose **impulse** responses from the library.  

Node-level pickers and the library panel use the **same inventory**, so assets you add here appear where patch parameters need audio.

## Upload

You can add files via **file picker** or **drag-and-drop**. The editor accepts common browser-playable types (MP3, WAV, M4A/AAC are reliable choices). Files that the browser cannot decode may be rejected with a hint.

## Scope

The library is for **in-workspace asset management**. Large **project import** flows start from the **launcher**; day-to-day file management for patching happens here.

---

[← User guide](./README.md) · [Review and publish →](./review-and-publish.md)
