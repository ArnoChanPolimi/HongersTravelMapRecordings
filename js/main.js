// js/main.js

// 1. 初始化地图
const map = L.map('map').setView([31.2304, 121.4737], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
const countryViews = [
  { id: 'china', name: 'China', flag: 'assets/country-flags/china.svg', center: [35.8617, 104.1954], zoom: 4 },
  { id: 'italy', name: 'Italy', flag: 'assets/country-flags/italy.svg', center: [42.5042, 12.6464], zoom: 6 },
  { id: 'switzerland', name: 'Switzerland', flag: 'assets/country-flags/switzerland.svg', center: [46.8182, 8.2275], zoom: 7 },
  { id: 'france', name: 'France', flag: 'assets/country-flags/france.svg', center: [46.2276, 2.2137], zoom: 6 },
  { id: 'spain', name: 'Spain', flag: 'assets/country-flags/spain.svg', center: [40.4637, -3.7492], zoom: 6 },
  { id: 'netherlands', name: 'Netherlands', flag: 'assets/country-flags/netherlands.svg', center: [52.1326, 5.2913], zoom: 7 },
  { id: 'belgium', name: 'Belgium', flag: 'assets/country-flags/belgium.svg', center: [50.5039, 4.4699], zoom: 7 },
  { id: 'germany', name: 'Germany', flag: 'assets/country-flags/germany.svg', center: [51.1657, 10.4515], zoom: 6 },
];

function setupCountryDock() {
  const dock = document.getElementById('country-dock');
  const toggle = document.getElementById('country-toggle');
  const strip = document.getElementById('country-strip');

  if (!dock || !toggle || !strip) return;

  const statsButton = document.createElement('a');
  statsButton.className = 'country-button stats-button';
  statsButton.href = 'https://clustrmaps.com/site/1c80g';
  statsButton.target = '_blank';
  statsButton.rel = 'noopener noreferrer';
  statsButton.title = 'Open visitor statistics';
  statsButton.setAttribute('aria-label', 'Open visitor statistics');
  statsButton.innerHTML = `
    <span class="stats-glyph" aria-hidden="true">🌏</span>
    <span>Stats</span>
  `;
  strip.appendChild(statsButton);

  countryViews.forEach(country => {
    const button = document.createElement('button');
    button.className = 'country-button';
    button.type = 'button';
    button.title = country.name;
    button.setAttribute('aria-label', `Go to ${country.name}`);
    button.innerHTML = `
      <img src="${country.flag}" alt="" loading="lazy" />
      <span>${country.name}</span>
    `;

    button.addEventListener('click', () => {
      map.closePopup();
      map.flyTo(country.center, country.zoom, { animate: true, duration: 1.15 });
      strip.querySelectorAll('.country-button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
    });

    strip.appendChild(button);
  });

  toggle.addEventListener('click', () => {
    const collapsed = dock.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });
}

setupCountryDock();
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