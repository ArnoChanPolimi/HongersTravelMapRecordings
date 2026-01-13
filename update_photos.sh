#!/bin/bash

# --- 基础配置 ---
DATA_FILE="js/data.js"
TEMP_FILE="js/data.tmp"
PICTURES_ROOT="pictures"
RAW_ROOT="raw_assets"

echo "🚀 执行逻辑：[1. 目录扫描] -> [2. 继承后缀压制] -> [3. 物理转正] -> [4. 代码同步]"

# --- 第一阶段：智能资产预处理 ---
if [ -d "$RAW_ROOT" ]; then
    for city_dir in "$RAW_ROOT"/*; do
        [ -d "$city_dir" ] || continue
        city_name=$(basename "$city_dir")
        
        # 确保目标城市文件夹存在
        mkdir -p "$PICTURES_ROOT/$city_name"

        # 扫描各种可能的图片后缀
        for img in "$city_dir"/*.{JPG,jpg,jpeg,JPEG,png,PNG}; do
            [ -e "$img" ] || continue
            
            img_name=$(basename "$img")
            
            # --- 【核心修改点：提取并继承后缀】 ---
            extension="${img_name##*.}"
            filename_no_ext="${img_name%.*}"
            
            target_hd="$PICTURES_ROOT/$city_name/$img_name"
            # 缩略图后缀现在完全跟随原图变量 ${extension}
            target_sm="$PICTURES_ROOT/$city_name/${filename_no_ext}-small.${extension}"

            # 【功能：增量生成 - 高清图】
            if [ ! -f "$target_hd" ]; then
                echo "  📸 加工新原图: $city_name/$img_name"
                magick "$img" -auto-orient -resize "2560x2560>" -quality 82 -strip "$target_hd"
            fi

            # 【功能：增量生成 - 缩略图】
            if [ ! -f "$target_sm" ]; then
                echo "  🔍 生成新缩略图 (继承后缀 .$extension): $(basename "$target_sm")"
                magick "$img" -auto-orient -resize "400x400>" -quality 65 -strip "$target_sm"
            fi
        done
    done
fi

# --- 第二阶段：同步 data.js 代码 ---
echo "📝 正在同步代码库..."
> "$TEMP_FILE"
current_folder=""

while IFS= read -r line || [ -n "$line" ]; do
    # 匹配文件夹行
    if [[ "$line" =~ folder:[[:space:]]*\'pictures/([^\']+) ]]; then
        current_folder="${BASH_REMATCH[1]}"
        has_logged_city=0
        echo "$line" >> "$TEMP_FILE"
        continue
    fi

    # 匹配图片数组结束行
    if [[ "$line" =~ ^[[:space:]]*\], ]]; then
        # 获取 pictures 文件夹下真实存在的文件，排除掉带 -small 的
        real_files=$(ls "$PICTURES_ROOT/$current_folder" 2>/dev/null | grep -E "\.(JPG|jpg|jpeg|JPEG|png|PNG)$" | grep -v "\-small")
        
        # 检查是否为 media 模式（适配你代码里可能的两种格式）
        is_media=$(grep -A 10 "folder: 'pictures/$current_folder'" "$DATA_FILE" | grep "media: \[")

        for f in $real_files; do
            # 如果 data.js 里还没这张图，就追加进去
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

    # 同步删除逻辑：如果 data.js 里的图在文件夹里没了，就删掉对应的行
    if [[ "$line" =~ \"([^[:space:]]+\.(JPG|jpg|jpeg|JPEG|png|PNG))\" ]]; then
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

# --- 第三阶段：处理完全新增的城市 ---
for d in "$PICTURES_ROOT"/*; do
    [ -d "$d" ] || continue
    dir_name=$(basename "$d")
    [ "$dir_name" == "raw_assets" ] && continue
    if ! grep -q "folder: 'pictures/$dir_name'" "$TEMP_FILE"; then
        echo "✨ 发现新城市: $dir_name"
        imgs=$(ls "$d" 2>/dev/null | grep -E "\.(JPG|jpg|jpeg|JPEG|png|PNG)$" | grep -v "\-small")
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

# 将新增城市合并进 data.js
if [ -f "$TEMP_FILE.new" ]; then
    sed -i '$d' "$TEMP_FILE"
    cat "$TEMP_FILE.new" >> "$TEMP_FILE"
    echo "];" >> "$TEMP_FILE"
    rm "$TEMP_FILE.new"
fi

mv "$TEMP_FILE" "$DATA_FILE"
echo "✅ 全量同步圆满完成！(已实现后缀继承逻辑)"