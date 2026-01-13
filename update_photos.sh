#!/bin/bash

# --- 基础配置 ---
DATA_FILE="js/data.js"
TEMP_FILE="js/data.tmp"
PICTURES_ROOT="pictures"
RAW_ROOT="raw_assets"

echo "🚀 执行逻辑：[1. 目录扫描] -> [2. 增量压制] -> [3. 物理转正] -> [4. 代码同步]"

# --- 第一阶段：智能资产预处理 ---
if [ -d "$RAW_ROOT" ]; then
    for city_dir in "$RAW_ROOT"/*; do
        [ -d "$city_dir" ] || continue
        city_name=$(basename "$city_dir")
        
        # 【功能：文件夹扫描与自动新建】
        # 无论 pictures 是否被删，这里都会确保目标城市文件夹存在
        mkdir -p "$PICTURES_ROOT/$city_name"

        for img in "$city_dir"/*.{JPG,jpg,jpeg,JPEG}; do
            [ -e "$img" ] || continue
            img_name=$(basename "$img")
            target_hd="$PICTURES_ROOT/$city_name/$img_name"
            target_sm="$PICTURES_ROOT/$city_name/${img_name%.*}-small.JPG"

            # 【功能：增量生成 - 检查高清图是否存在】
            if [ ! -f "$target_hd" ]; then
                echo "  📸 加工新原图 (物理校正方向): $city_name/$img_name"
                # -auto-orient 负责把转了90度的图物理修正
                magick "$img" -auto-orient -resize "2560x2560>" -quality 82 -strip "$target_hd"
            fi

            # 【功能：增量生成 - 检查缩略图是否存在】
            if [ ! -f "$target_sm" ]; then
                echo "  🔍 生成新缩略图: $city_name/$(basename "$target_sm")"
                magick "$img" -auto-orient -resize "400x400>" -quality 65 -strip "$target_sm"
            fi
        done
    done
fi

# --- 第二阶段：同步 data.js 代码 ---
# (这部分逻辑保持不变，它会根据 pictures 里的新图更新你的 JS 代码)
echo "📝 正在同步代码库..."
> "$TEMP_FILE"
current_folder=""

while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" =~ folder:[[:space:]]*\'pictures/([^\']+) ]]; then
        current_folder="${BASH_REMATCH[1]}"
        has_logged_city=0
        echo "$line" >> "$TEMP_FILE"
        continue
    fi

    if [[ "$line" =~ ^[[:space:]]*\], ]]; then
        real_files=$(ls "$PICTURES_ROOT/$current_folder" 2>/dev/null | grep -E "\.(JPG|jpg|png|PNG)$" | grep -v "\-small")
        is_media=$(grep -A 10 "folder: 'pictures/$current_folder'" "$DATA_FILE" | grep "media: \[")

        for f in $real_files; do
            if ! grep -q "$f" <(sed -n "/folder: 'pictures\/$current_folder'/,/],/p" "$DATA_FILE"); then
                if [ $has_logged_city -eq 0 ]; then
                    echo "📂 城市: $current_folder"
                    has_logged_city=1
                fi
                echo "  ➕ 追加新图: $f"
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

    if [[ "$line" =~ \"([^[:space:]]+\.(JPG|jpg|png|PNG))\" ]]; then
        img_in_line="${BASH_REMATCH[1]}"
        if [[ ! "$img_in_line" == *"-small"* ]]; then
            if [ ! -f "$PICTURES_ROOT/$current_folder/$img_in_line" ]; then
                if [ $has_logged_city -eq 0 ]; then
                    echo "📂 城市: $current_folder"
                    has_logged_city=1
                fi
                echo "  🗑️ 同步删除: $img_in_line"
                continue
            fi
        fi
    fi

    echo "$line" >> "$TEMP_FILE"
done < "$DATA_FILE"

# 处理完全新增的城市
for d in "$PICTURES_ROOT"/*; do
    [ -d "$d" ] || continue
    dir_name=$(basename "$d")
    [ "$dir_name" == "raw_assets" ] && continue
    if ! grep -q "folder: 'pictures/$dir_name'" "$TEMP_FILE"; then
        echo "✨ 发现新城市: $dir_name"
        imgs=$(ls "$d" | grep -E "\.(JPG|jpg|png|PNG)$" | grep -v "\-small")
        {
            echo "    {"
            echo "    name: '$dir_name',"
            echo "    coord: [0, 0],"
            echo "    folder: 'pictures/$dir_name',"
            echo "    images: ["
            for i in $imgs; do echo "        \"$i\","; done
            echo "    ],"
            echo "    desc: 'New location: $dir_name'"
            echo "    },"
        } >> "$TEMP_FILE.new"
    fi
done

if [ -f "$TEMP_FILE.new" ]; then
    sed -i '$d' "$TEMP_FILE"
    cat "$TEMP_FILE.new" >> "$TEMP_FILE"
    echo "];" >> "$TEMP_FILE"
    rm "$TEMP_FILE.new"
fi

mv "$TEMP_FILE" "$DATA_FILE"
echo "✅ 全量重刷与代码同步圆满完成！"