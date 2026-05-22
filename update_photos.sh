#!/usr/bin/env bash
set -euo pipefail

DATA_FILE="js/data.js"
TEMP_FILE="js/data.tmp"
PICTURES_ROOT="pictures"
RAW_ROOT="raw_assets"

# Metadata used when an entirely new folder appears under pictures/.
declare -A CITY_NAMES=(
  [Lanzarote]="Lanzarote"
  [Locarno]="Locarno"
)

declare -A CITY_COORDS=(
  [Lanzarote]="[29.0469, -13.5899]"
  [Locarno]="[46.1699, 8.7943]"
)

declare -A CITY_DESCS=(
  [Lanzarote]="Lanzarote: Volcanic island light"
  [Locarno]="Locarno: Lake Maggiore and Swiss sunshine"
)

image_files_in_dir() {
    local dir="$1"
    find "$dir" -maxdepth 1 -type f \
        \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) \
        ! -iname '*-small.*' -printf '%f\n' 2>/dev/null | sort
}

echo "Starting photo sync: raw_assets -> pictures -> js/data.js"
rm -f "$TEMP_FILE" "$TEMP_FILE.new"

# 1. Generate compressed publish images and thumbnails from raw_assets.
if [ -d "$RAW_ROOT" ]; then
    for city_dir in "$RAW_ROOT"/*; do
        [ -d "$city_dir" ] || continue
        city_name=$(basename "$city_dir")
        mkdir -p "$PICTURES_ROOT/$city_name"

        for img in "$city_dir"/*.{JPG,jpg,jpeg,JPEG,png,PNG}; do
            [ -e "$img" ] || continue

            img_name=$(basename "$img")
            extension="${img_name##*.}"
            filename_no_ext="${img_name%.*}"
            target_hd="$PICTURES_ROOT/$city_name/$img_name"
            target_sm="$PICTURES_ROOT/$city_name/${filename_no_ext}-small.${extension}"

            if [ ! -f "$target_hd" ]; then
                echo "  HD  $city_name/$img_name"
                magick "$img" -auto-orient -resize "2560x2560>" -quality 82 -strip "$target_hd"
            fi

            if [ ! -f "$target_sm" ]; then
                echo "  SM  $city_name/$(basename "$target_sm")"
                magick "$img" -auto-orient -resize "400x400>" -quality 65 -strip "$target_sm"
            fi
        done
    done
fi

# 2. Sync existing city image lists in data.js with pictures/.
echo "Syncing data.js..."
current_folder=""
has_logged_city=0

while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" =~ folder:[[:space:]]*\'pictures/([^\']+) ]]; then
        current_folder="${BASH_REMATCH[1]}"
        has_logged_city=0
        echo "$line" >> "$TEMP_FILE"
        continue
    fi

    if [[ "$line" =~ ^[[:space:]]*\], ]]; then
        real_files=()
        if [ -n "$current_folder" ] && [ -d "$PICTURES_ROOT/$current_folder" ]; then
            mapfile -t real_files < <(image_files_in_dir "$PICTURES_ROOT/$current_folder")
        fi

        is_media=""
        if [ -n "$current_folder" ]; then
            is_media=$(grep -A 10 -F "folder: 'pictures/$current_folder'" "$DATA_FILE" | grep "media: \[" || true)
        fi

        for f in "${real_files[@]}"; do
            if ! grep -Fq "$f" <(sed -n "/folder: 'pictures\/$current_folder'/,/],/p" "$DATA_FILE"); then
                if [ "$has_logged_city" -eq 0 ]; then
                    echo "City: $current_folder"
                    has_logged_city=1
                fi
                echo "  add image: $f"
                if [ -z "$is_media" ]; then
                    echo "        \"$f\"," >> "$TEMP_FILE"
                else
                    echo "        { type: 'image', file: \"$f\" }," >> "$TEMP_FILE"
                fi
            fi
        done

        echo "$line" >> "$TEMP_FILE"
        continue
    fi

    if [[ "$line" =~ \"([^[:space:]]+\.(JPG|jpg|jpeg|JPEG|png|PNG))\" ]]; then
        img_in_line="${BASH_REMATCH[1]}"
        if [[ "$img_in_line" != *"-small"* ]] && [ -n "$current_folder" ]; then
            if [ ! -f "$PICTURES_ROOT/$current_folder/$img_in_line" ]; then
                if [ "$has_logged_city" -eq 0 ]; then
                    echo "City: $current_folder"
                    has_logged_city=1
                fi
                echo "  remove missing image: $img_in_line"
                continue
            fi
        fi
    fi

    echo "$line" >> "$TEMP_FILE"
done < "$DATA_FILE"

# 3. Append new city folders that already have publishable images.
for d in "$PICTURES_ROOT"/*; do
    [ -d "$d" ] || continue
    dir_name=$(basename "$d")

    if ! grep -Fq "folder: 'pictures/$dir_name'" "$TEMP_FILE"; then
        mapfile -t imgs < <(image_files_in_dir "$d")
        if [ "${#imgs[@]}" -eq 0 ]; then
            echo "Skip empty picture folder: $dir_name"
            continue
        fi

        city_name="${CITY_NAMES[$dir_name]-$dir_name}"
        city_coord="${CITY_COORDS[$dir_name]-[0, 0]}"
        city_desc="${CITY_DESCS[$dir_name]-New location: $dir_name}"

        echo "New city: $dir_name"
        {
            echo "    {"
            echo "    name: '$city_name',"
            echo "    coord: $city_coord,"
            echo "    folder: 'pictures/$dir_name',"
            echo "    images: ["
            echo ""
            for i in "${imgs[@]}"; do echo "        \"$i\","; done
            echo "    ],"
            echo "    desc: '$city_desc'"
            echo "    },"
        } >> "$TEMP_FILE.new"
    fi
done

if [ -s "$TEMP_FILE.new" ]; then
    sed -i '$d' "$TEMP_FILE"
    cat "$TEMP_FILE.new" >> "$TEMP_FILE"
    echo "];" >> "$TEMP_FILE"
fi

mv "$TEMP_FILE" "$DATA_FILE"
rm -f "$TEMP_FILE.new"
echo "Photo sync complete."
