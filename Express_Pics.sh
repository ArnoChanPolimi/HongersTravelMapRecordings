for file in *.JPG *.jpg *.png *.PNG; do
  # 如果文件名里已经有 -small，就跳过
  case "$file" in
    *-small.*) continue ;;
  esac

  output="${file%.*}-small.${file##*.}"
  if [ -f "$file" ] && [ ! -f "$output" ]; then
    echo "Processing: $file → $output"
    magick "$file" -resize 1600x1600 -quality 70 "$output"
  fi
done
