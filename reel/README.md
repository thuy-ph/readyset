# /reel/

Placeholder page for the campaign reel. Served at `/reel/`.

`index.html` is **generated** — edit `landing-page/src/reel.html` and run
`node landing-page/src/build.mjs`.

## Publishing the reel

Drop two files in this folder:

| File | |
|---|---|
| `reel.mp4` | The video. 9:16, H.264, AAC audio. |
| `poster.jpg` | First-frame still, 9:16. Optional but worth it — without it the frame is blank until playback starts. |

Nothing else to change. The page probes for `reel.mp4` on load: if it's there
the player appears and the status line flips to **Published**; if it isn't,
the placeholder stays and the status reads **Awaiting upload**. So committing
the page before the video is finished is safe.

## Encoding

Straight from a phone export:

```sh
ffmpeg -i input.mov -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart reel.mp4

ffmpeg -i reel.mp4 -vframes 1 -q:v 3 poster.jpg
```

`-movflags +faststart` matters — without it the browser downloads the whole
file before the first frame renders.

Keep it under ~10MB so it isn't a slow load on a phone.
