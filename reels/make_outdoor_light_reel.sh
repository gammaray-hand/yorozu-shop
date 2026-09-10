#!/usr/bin/env bash
set -euo pipefail

font="${1:-NotoSansCJKjp-Bold.otf}"
out="${2:-yorozu_outdoor_light_reel_candidate_2026-09-10.mp4}"

images=(
  outdoor_light_07.jpg
  outdoor_light_04.jpg
  outdoor_light_02.jpg
  outdoor_light_08.jpg
  outdoor_light_06.jpg
  outdoor_light_01.jpg
)
durations=(1.2 1.2 0.8 2.0 1.8 2.0)
texts=(
  "これ、何になると思う？"
  "これ、何になると思う？"
  "これ、何になると思う？"
  "正解は、折りたたみ式アウトドアライト。"
  "正解は、折りたたみ式アウトドアライト。"
  "これ、キャンプに持ってく？"
)
font_sizes=(58 58 58 44 44 58)

rm -f reel_segment_*.mp4 reel_concat.txt

for i in "${!images[@]}"; do
  n=$(printf '%02d' "$((i + 1))")
  duration="${durations[$i]}"
  ffmpeg -y -loglevel error \
    -loop 1 -t "$duration" -i "${images[$i]}" \
    -f lavfi -t "$duration" -i anullsrc=channel_layout=stereo:sample_rate=48000 \
    -filter_complex "color=c=#0b1812:s=1080x1920:r=30[bg];[0:v]scale=1040:1280:force_original_aspect_ratio=decrease[img];[bg][img]overlay=(W-w)/2:160,drawtext=fontfile='${font}':text='${texts[$i]}':fontcolor=white:fontsize=${font_sizes[$i]}:x=(w-text_w)/2:y=1440:box=1:boxcolor=#000000B0:boxborderw=28,format=yuv420p[v]" \
    -map '[v]' -map 1:a \
    -c:v libx264 -preset medium -crf 18 -r 30 \
    -c:a aac -b:a 128k -ar 48000 -ac 2 \
    -movflags +faststart -shortest "reel_segment_${n}.mp4"
  printf "file '%s'\n" "reel_segment_${n}.mp4" >> reel_concat.txt
done

ffmpeg -y -loglevel error -f concat -safe 0 -i reel_concat.txt -c copy "$out"
rm -f reel_segment_*.mp4 reel_concat.txt
