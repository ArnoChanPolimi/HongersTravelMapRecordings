// js/main.js

// 1. 初始化地图
const map = L.map('map').setView([31.2304, 121.4737], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 2. Fancybox 配置
Fancybox.bind("[data-fancybox]", {
  Video: { autoStart: false },
  Thumbs: { autoStart: false },
  preload: 0,
});

// 3. 核心轮播切换函数
window.showMedia = function(containerId, index) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = Array.from(container.querySelectorAll('.carousel-item'));
  const indicators = container.nextElementSibling;

  items.forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  if (indicators && indicators.classList.contains('carousel-indicators')) {
    const dots = indicators.querySelectorAll('.carousel-indicator');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }
};

window.prevMedia = function(id) {
  const container = document.getElementById(id);
  const items = container.querySelectorAll('.carousel-item');
  const current = Array.from(items).findIndex(el => el.classList.contains('active'));
  window.showMedia(id, (current - 1 + items.length) % items.length);
};

window.nextMedia = function(id) {
  const container = document.getElementById(id);
  const items = container.querySelectorAll('.carousel-item');
  const current = Array.from(items).findIndex(el => el.classList.contains('active'));
  window.showMedia(id, (current + 1) % items.length);
};

// 4. 循环数据并生成标记点
locations.forEach(loc => {
  const popupId = `carousel-${loc.name.replace(/\s+/g, '-')}`;
  const mediaItems = loc.media || (loc.images ? loc.images.map(f => ({ type: 'image', file: f })) : []);

  // 生成轮播图 HTML
  let carouselItems = '';
  mediaItems.forEach((item, i) => {
    if (item.type === 'image') {
      const base = item.file.replace(/\.(JPG|jpg|png)$/i, '');
      const ext = item.file.split('.').pop();
      const smallFile = `${base}-small.${ext}`;
      carouselItems += `
        <img class="carousel-item${i === 0 ? ' active' : ''}" 
             src="${loc.folder}/${smallFile}" 
             data-fancybox="${popupId}" 
             data-src="${loc.folder}/${item.file}" 
             alt="${loc.name}" />`;
    } else if (item.type === 'video') {
      const thumbSrc = item.thumb ? `${loc.folder}/${item.thumb}` : 'video_placeholder.png';
      carouselItems += `
        <div class="carousel-item${i === 0 ? ' active' : ''}">
          <a href="${loc.folder}/${item.file}" data-fancybox="${popupId}" data-type="video">
            <img class="video-thumbnail" src="${thumbSrc}">
            <div class="video-overlay">▶</div>
          </a>
        </div>`;
    }
  });

  // 生成指示器
  let indicators = '';
  if (mediaItems.length > 1) {
    indicators = '<div class="carousel-indicators">';
    mediaItems.forEach((_, i) => {
      indicators += `<div class="carousel-indicator${i === 0 ? ' active' : ''}" onclick="showMedia('${popupId}', ${i})"></div>`;
    });
    indicators += '</div>';
  }

  const popupHTML = `
    <div class="popup-title">${loc.name}</div>
    <div class="photo-carousel" id="${popupId}">
      ${carouselItems}
      ${mediaItems.length > 1 ? `
        <button class="carousel-arrow carousel-prev" onclick="prevMedia('${popupId}')">❮</button>
        <button class="carousel-arrow carousel-next" onclick="nextMedia('${popupId}')">❯</button>
      ` : ''}
    </div>
    ${indicators}
    <p class="popup-text">${loc.desc}</p>
  `;

  const marker = L.marker(loc.coord).addTo(map);
  marker.bindPopup(popupHTML);
});