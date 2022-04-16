# @drovp/encode

[Drovp](https://drovp.app) plugin for encoding video, audio, and images into common formats.

Uses [ffmpeg](https://ffmpeg.org/) under the hood.

##### Features

-   All configuration designed to be agnostic to the type/size of the input files.
-   Resizing by setting size limits, or max desired megapixels, or both.
-   Ability to skip encoding of files that are already compressed enough with **Skip thresholds**.
-   Optionally discard inefficient encodes that didn't compress the file enough.

### Supported encoders:

-   **Video**: libx264 (`mp4`/`mkv`), libx265 (`mp4`/`mkv`), libvpx (`webm`/`mkv`), libvpx-vp9 (`webm`/`mkv`)
    -   libopus for audio track
-   **Images**: jpeg2000 (`jpg`), libwebp (`webp`)
-   **Audio**: libmp3lame (`mp3`), libopus (`ogg`)

NOTE: Animated GIFs are encoded as video, while GIFs with only 1 frame are encoded as images.

### Resizing

Built in powerful output dimension controls:

-   resize based on a single dimension constraint (other dimension will be calculated to maintain aspect ratio)
-   cover, contain, or stretch modes when both dimension constraints are defined
-   resize based on desired number of megapixels

All options above can be combined, encode will calculate output dimensions to ensure they are all satisfied, with max megapixels limit having priority over dimension limits.

### Skip threshold

An ability to configure data density threshold to skip encoding of files that are already compressed enough. Speeds up jobs where you need to compress huge amounts of files of unknown compression.

Threshold is configured by setting relative data density units per each item type:

-   Video: kilobytes per megapixel per minute
-   Audio: kilobytes per channel per minute
-   Image: kilobytes per megapixel

### Min savings recovery

When you've configured encode to replace original files, you can use **Min savings recovery** to ensure the file savings are significant enough to warrant the loss of quality due to re-encode. When the output is not at least a configured percent smaller than the original, it'll be automatically discarded and original kept in place.

## Advanced

You can see exactly the ffmpeg parameters used in each operation's log section, or check the `src/lib/{video|image|audio}.ts` files to see how they're constructed. If you see something that is not optimal, or have any ideas how to improve things, [create an issue](https://github.com/drovp/encode/issues)!.

## Changelog

### 5.0.0

- Breaking: `video.ignore`, `audio.ignore`, `image.ignore` options consolidated into one `process: Type[]` option.
- Added output flairs to inform about file size savings.

### 4.2.1

-   Fixed fit and cover resizing not respecting downscale only option.
-   When min savings is not satisfied, processor won't emit warnings anymore, it'll only log about it.
-   Skip threshold option no only takes an effect when no resizing needs to happen to the output.

### 4.2.0

-   Added GIF and PNG output formats.
