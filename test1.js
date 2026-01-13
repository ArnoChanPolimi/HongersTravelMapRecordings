    // 00
    // locations.forEach(loc => {
    //   const popupId = `carousel-${loc.name}`.replace(/\s+/g, '-');

    //   const popupHTML = `
    //     <div class="popup-title">${loc.name}</div>
    //     <div class="photo-carousel viewer-group" id="${popupId}">
    //       ${loc.images.map((img, i) => {
    //     const base = img.replace(/\.(JPG|jpg|png)$/i, '');
    //     const ext = img.split('.').pop();
    //     return `<img class="carousel-img viewer-item${i === 0 ? ' active' : ''}" 
    //           src="${loc.folder}/${base}-small.${ext}" 
    //           data-original="${loc.folder}/${img}" 
    //           alt="${base}" />`;
    //   }).join('')}
    //       <button class="carousel-arrow carousel-prev" onclick="prevImage('${popupId}')">❮</button>
    //       <button class="carousel-arrow carousel-next" onclick="nextImage('${popupId}')">❯</button>
    //     </div>
    //     <p class="popup-text">${loc.desc}</p>
    //   `;

    //   L.marker(loc.coord).addTo(map).bindPopup(popupHTML);
    // });

    // function prevImage(id) {
    //   const container = document.getElementById(id);
    //   const images = Array.from(container.querySelectorAll('img'));
    //   const current = images.findIndex(img => img.classList.contains('active'));
    //   images[current].classList.remove('active');
    //   const nextIndex = (current - 1 + images.length) % images.length;
    //   images[nextIndex].classList.add('active');
    // }

    // function nextImage(id) {
    //   const container = document.getElementById(id);
    //   const images = Array.from(container.querySelectorAll('img'));
    //   const current = images.findIndex(img => img.classList.contains('active'));
    //   images[current].classList.remove('active');
    //   const nextIndex = (current + 1) % images.length;
    //   images[nextIndex].classList.add('active');
    // }

    // 01
//     locations.forEach(loc => {
//       const popupId = `carousel-${loc.name}`.replace(/\s+/g, '-');

//       const popupHTML = `
//     <div class="popup-title">${loc.name}</div>
//     <div class="photo-carousel viewer-group" id="${popupId}">
//       ${loc.media.map((item, i) => {
//         const base = item.file.replace(/\.(JPG|jpg|png|mp4)$/i, '');
//         const ext = item.file.split('.').pop();
//         if (item.type === 'image') {
//           return `<img class="carousel-item viewer-item${i === 0 ? ' active' : ''}" 
//                   src="${loc.folder}/${base}-small.${ext}" 
//                   data-original="${loc.folder}/${item.file}" 
//                   alt="${base}" />`;
//         } else if (item.type === 'video') {
//           return `<video class="carousel-item${i === 0 ? ' active' : ''}" 
//                   src="${loc.folder}/${item.file}" 
//                   controls preload="metadata" 
//                   style="width:100%; height:100%; display:none; position:absolute; top:0; left:0;"></video>`;
//         }
//       }).join('')}
//       <button class="carousel-arrow carousel-prev" onclick="prevMedia('${popupId}')">❮</button>
//       <button class="carousel-arrow carousel-next" onclick="nextMedia('${popupId}')">❯</button>
//     </div>
//     <p class="popup-text">${loc.desc}</p>
//   `;

//       L.marker(loc.coord).addTo(map).bindPopup(popupHTML);
//     });

//     function prevMedia(id) {
//       const container = document.getElementById(id);
//       const items = Array.from(container.querySelectorAll('.carousel-item'));
//       const current = items.findIndex(el => el.classList.contains('active'));
//       items[current].classList.remove('active');
//       const nextIndex = (current - 1 + items.length) % items.length;
//       items[nextIndex].classList.add('active');
//     }

//     function nextMedia(id) {
//       const container = document.getElementById(id);
//       const items = Array.from(container.querySelectorAll('.carousel-item'));
//       const current = items.findIndex(el => el.classList.contains('active'));
//       items[current].classList.remove('active');
//       const nextIndex = (current + 1) % items.length;
//       items[nextIndex].classList.add('active');
//     }


//     map.on('popupopen', function (e) {
//       const group = e.popup._contentNode.querySelector('.viewer-group');
//       if (group) {
//         // 不再克隆 DOM，直接用已有的图片节点
//         const viewer = new Viewer(group, {
//           hidden: () => viewer.destroy(),
//           toolbar: true
//         });
//         group.querySelectorAll('img').forEach(img => {
//           img.addEventListener('click', () => viewer.show());
//         });
//       }
//     });

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Arno's Travel Map</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body { height: 100%; margin:0; padding:0; background: transparent; }
  #map { height: 100%; }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background: rgba(255,255,255,0.8); box-shadow:none;
  }
  .photo-carousel { position: relative; width:220px; height:160px; margin:0 auto 10px; overflow:hidden; }
  .carousel-item { width:100%; height:100%; object-fit:cover; border-radius:8px; cursor: zoom-in; position:absolute; top:0; left:0; display:none; }
  .carousel-item.active { display:block; }
  .carousel-arrow {
    position:absolute; top:0; bottom:0; width:40px; background: linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0)); color:white; font-size:24px;
    border:none; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;
  }
  .carousel-arrow.carousel-next { right:0; background: linear-gradient(to left, rgba(0,0,0,0.4), rgba(0,0,0,0)); }
  .carousel-arrow:hover { background-color: rgba(0,0,0,0.6); }
  .popup-title { font-weight:bold; margin:5px 0; text-align:center; color:#000; }
  .popup-text { font-size:14px; text-align:center; color:#000; }

  /* 自定义放大弹窗 */
  .lightbox-overlay {
    position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:none; align-items:center; justify-content:center; z-index:9999;
  }
  .lightbox-content { position: relative; max-width:90%; max-height:90%; }
  .lightbox-content img, .lightbox-content video { max-width:100%; max-height:100%; display:block; margin:0 auto; }
  .lightbox-close { position:absolute; top:5px; right:5px; font-size:30px; color:white; cursor:pointer; }
  .lightbox-arrow { position:absolute; top:50%; transform:translateY(-50%); font-size:40px; color:white; cursor:pointer; }
  .lightbox-prev { left:10px; }
  .lightbox-next { right:10px; }
</style>
</head>
<body>
<div id="map"></div>

<div class="lightbox-overlay" id="lightbox">
  <div class="lightbox-content" id="lightboxContent">
    <span class="lightbox-close" id="lightboxClose">&times;</span>
    <span class="lightbox-arrow lightbox-prev" id="lightboxPrev">&#10094;</span>
    <span class="lightbox-arrow lightbox-next" id="lightboxNext">&#10095;</span>
  </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('map').setView([31.2304, 121.4737], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

// 示例 locations（保留你原来的结构）
const locations = [
  {
    name: 'Cergy',
    coord: [49.052502, 2.038830],
    folder: 'Nikon/Cergy',
    media: [
      { type: 'image', file: "DSC_7146.JPG" },
      { type: 'image', file: "DSC_7140.JPG" },
      { type: 'video', file: "Cergy_V01.mp4" }
    ],
    desc: 'Charivari in Cergy'
  }
];

// 生成 popup
locations.forEach(loc => {
  const popupId = `carousel-${loc.name}`.replace(/\s+/g,'-');
  const mediaItems = loc.media || (loc.images?.map(f=>({type:'image', file:f}))||[]);
  const popupHTML = `
    <div class="popup-title">${loc.name}</div>
    <div class="photo-carousel" id="${popupId}">
      ${mediaItems.map((item,i)=>{
        if(item.type==='image') return `<img class="carousel-item${i===0?' active':''}" src="${loc.folder}/${item.file}" />`;
        else return `<video class="carousel-item${i===0?' active':''}" src="${loc.folder}/${item.file}" controls preload="metadata"></video>`;
      }).join('')}
      <button class="carousel-arrow carousel-prev" onclick="prevMedia('${popupId}')">❮</button>
      <button class="carousel-arrow carousel-next" onclick="nextMedia('${popupId}')">❯</button>
    </div>
    <p class="popup-text">${loc.desc}</p>
  `;
  L.marker(loc.coord).addTo(map).bindPopup(popupHTML);
});

// 轮播控制
function showMedia(containerId,index){
  const container=document.getElementById(containerId);
  const items=Array.from(container.querySelectorAll('.carousel-item'));
  items.forEach((el,i)=>{
    if(i===index){ el.classList.add('active'); el.style.display='block'; el.pause?.(); } 
    else { el.classList.remove('active'); el.style.display='none'; el.pause?.(); }
  });
}
function prevMedia(id){ const container=document.getElementById(id); const items=Array.from(container.querySelectorAll('.carousel-item')); const current=items.findIndex(el=>el.classList.contains('active')); showMedia(id,(current-1+items.length)%items.length);}
function nextMedia(id){ const container=document.getElementById(id); const items=Array.from(container.querySelectorAll('.carousel-item')); const current=items.findIndex(el=>el.classList.contains('active')); showMedia(id,(current+1)%items.length);}

// ------------------- 自定义放大弹窗 -------------------
let currentMedia=[], currentIndex=0;
const lightbox=document.getElementById('lightbox');
const lightboxContent=document.getElementById('lightboxContent');
const lbClose=document.getElementById('lightboxClose');
const lbPrev=document.getElementById('lightboxPrev');
const lbNext=document.getElementById('lightboxNext');

map.on('popupopen', e=>{
  const carousel=e.popup._contentNode.querySelector('.photo-carousel');
  if(!carousel) return;
  const items=Array.from(carousel.querySelectorAll('.carousel-item'));
  items.forEach((el,i)=>{
    el.addEventListener('click',()=>{
      // 点击放大
      currentMedia = items.map(it=>{
        if(it.tagName==='IMG') return {type:'image', src:it.src};
        else return {type:'video', src:it.src};
      });
      currentIndex = i;
      openLightbox();
    });
  });
});

function openLightbox(){
  lightbox.style.display='flex';
  renderLightbox();
}

function closeLightbox(){ lightbox.style.display='none'; lightboxContent.querySelectorAll('img,video').forEach(el=>el.remove()); }
function renderLightbox(){
  lightboxContent.querySelectorAll('img,video').forEach(el=>el.remove());
  const item=currentMedia[currentIndex];
  let el;
  if(item.type==='image'){
    el=document.createElement('img'); el.src=item.src;
  } else {
    el=document.createElement('video'); el.src=item.src; el.controls=true; el.autoplay=false; el.preload='metadata';
  }
  lightboxContent.appendChild(el);
}
lbClose.addEventListener('click',closeLightbox);
lbPrev.addEventListener('click',()=>{ currentIndex=(currentIndex-1+currentMedia.length)%currentMedia.length; renderLightbox(); });
lbNext.addEventListener('click',()=>{ currentIndex=(currentIndex+1)%currentMedia.length; renderLightbox(); });

</script>
</body>
</html>
