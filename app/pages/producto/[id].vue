<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from '#app'
import { products } from '~/data/products'
import * as THREE from 'three'

const { $gsap: gsap } = useNuxtApp()
const route = useRoute()
const router = useRouter()

const productId = Number(route.params.id)
const selectedProduct = ref(products.find(p => p.id === productId))

if (!selectedProduct.value) {
  // redirect or show 404
  router.push('/')
}

const activeAccordion = ref<string>('description')

const toggleAccordion = (id: string) => {
  activeAccordion.value = activeAccordion.value === id ? '' : id
}

const showDescription = ref(false)

const selectProduct = (prod: any) => {
  router.push(`/producto/${prod.id}`)
}

const backToGrid = () => {
  router.push('/#product-session')
}

// macOS Dock Animation Logic
const dockRef = ref<HTMLElement | null>(null)
let dockIcons: NodeListOf<HTMLElement> | null = null
let lastPointerY = -9999
let autoScrollFrame: number | null = null
let currentScrollSpeed = 0

const updateDockIconsPosition = () => {
  if (!dockRef.value || !dockIcons || dockIcons.length === 0) return
  if (lastPointerY === -9999) return
  
  const min = 88; // 72px height + 16px gap
  const max = 130; // max scale size
  const bound = min * Math.PI;

  for (let i = 0; i < dockIcons.length; i++) {
    let icon = dockIcons[i];
    let iconCenterY = dockRef.value.getBoundingClientRect().top - dockRef.value.scrollTop + icon.offsetTop + icon.offsetHeight / 2;
    let distance = iconCenterY - lastPointerY;
    
    let y = 0;
    let scale = 1;
    
    if (-bound < distance && distance < bound) {
      let rad = distance / min * 0.5;
      scale = 1 + (max / min - 1) * Math.cos(rad);  
      y = 1.5 * (max - min) * Math.sin(rad);
    } else {
      y = (-bound < distance ? 1.5 : -1.5) * (max - min);
    }
    
    gsap.to(icon, { duration: 0.3, y: y, scale: scale, transformOrigin: "100% 50%" });
  }
}

const handleDockMove = (event: MouseEvent) => {
  if (!dockRef.value) return
  
  if (!dockIcons || dockIcons.length === 0) {
    dockIcons = dockRef.value.querySelectorAll('.thumbnail-item')
  }
  if (!dockIcons || dockIcons.length === 0) return
  
  lastPointerY = event.clientY
  updateDockIconsPosition()

  const rect = dockRef.value.getBoundingClientRect()
  const relativeY = event.clientY - rect.top
  const edgeThreshold = 120 // pixels from top/bottom to trigger scroll
  
  if (relativeY < edgeThreshold) {
    currentScrollSpeed = -((edgeThreshold - relativeY) / edgeThreshold) * 15
  } else if (relativeY > rect.height - edgeThreshold) {
    currentScrollSpeed = ((relativeY - (rect.height - edgeThreshold)) / edgeThreshold) * 15
  } else {
    currentScrollSpeed = 0
  }
  
  if (currentScrollSpeed !== 0 && !autoScrollFrame) {
    const loop = () => {
      if (dockRef.value && currentScrollSpeed !== 0) {
        dockRef.value.scrollTop += currentScrollSpeed
        updateDockIconsPosition()
        autoScrollFrame = requestAnimationFrame(loop)
      } else {
        autoScrollFrame = null
      }
    }
    autoScrollFrame = requestAnimationFrame(loop)
  }
}

const handleDockLeave = () => {
  if (!dockIcons) return
  lastPointerY = -9999
  currentScrollSpeed = 0
  if (autoScrollFrame) {
    cancelAnimationFrame(autoScrollFrame)
    autoScrollFrame = null
  }
  gsap.to(dockIcons, { duration: 0.3, scale: 1, y: 0 })
}

const handleDockScroll = () => {
  updateDockIconsPosition()
}

// ---------------- THREE JS 360 Logic ----------------
const SPHERE_R = 500

function makeRoomCanvas(cfg: any) {
  const W=2048,H=1024;
  const c = document.createElement('canvas');
  c.width=W; c.height=H;
  const x = c.getContext('2d');
  if(!x) return c;
  const g = x.createLinearGradient(0,0,0,H);
  g.addColorStop(0,cfg.ceiling);g.addColorStop(.32,cfg.ceiling);
  g.addColorStop(.38,cfg.wall);g.addColorStop(.62,cfg.wallLow||cfg.wall);
  g.addColorStop(.68,cfg.floor);g.addColorStop(1,cfg.floorDark||cfg.floor);
  x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(0,0,0,.16)';x.fillRect(0,H*.375,W,4);x.fillRect(0,H*.655,W,5);
  x.strokeStyle='rgba(0,0,0,.09)';x.lineWidth=3;
  for(let i=0;i<26;i++){const y=H*.68+(H*.32)*(i/26)**1.6;x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();}
  x.fillStyle='rgba(255,244,214,.9)';x.beginPath();x.ellipse(W/2,H*.06,130,34,0,0,Math.PI*2);x.fill();
  (cfg.items||[]).forEach((it: any)=>{
    const cx=(it.lon/360)*W,w=it.w,hgt=it.h,top=H*.5-hgt/2+(it.dy||0);
    if(it.type==='window'){
      x.fillStyle='#0e1520';x.fillRect(cx-w/2-10,top-10,w+20,hgt+20);
      const s=x.createLinearGradient(0,top,0,top+hgt);
      s.addColorStop(0,'#9fd4ff');s.addColorStop(.7,'#cfe9ff');s.addColorStop(1,'#eef7ff');
      x.fillStyle=s;x.fillRect(cx-w/2,top,w,hgt);
      x.fillStyle='rgba(120,170,90,.85)';
      for(let i=0;i<6;i++){const bw=w/6;x.fillRect(cx-w/2+i*bw+4,top+hgt*(0.55+Math.sin(i*2.7)*.1),bw-8,hgt*.45);}
      x.strokeStyle='#0e1520';x.lineWidth=8;x.strokeRect(cx-w/2,top,w,hgt);
      x.beginPath();x.moveTo(cx,top);x.lineTo(cx,top+hgt);
      x.moveTo(cx-w/2,top+hgt/2);x.lineTo(cx+w/2,top+hgt/2);x.stroke();
    }
    if(it.type==='door'){
      x.fillStyle=it.color||'#6b4a32';x.fillRect(cx-w/2,top,w,hgt);
      x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=6;x.strokeRect(cx-w/2,top,w,hgt);
      x.fillStyle='#d9c07a';x.beginPath();x.arc(cx+w/2-22,top+hgt*.52,7,0,Math.PI*2);x.fill();
    }
    if(it.type==='block'){
      x.fillStyle=it.color;x.fillRect(cx-w/2,top,w,hgt);
      x.fillStyle='rgba(255,255,255,.12)';x.fillRect(cx-w/2,top,w,hgt*.18);
      x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=4;x.strokeRect(cx-w/2,top,w,hgt);
    }
    if(it.type==='art'){
      x.fillStyle='#20242a';x.fillRect(cx-w/2-8,top-8,w+16,hgt+16);
      const a=x.createLinearGradient(cx-w/2,0,cx+w/2,0);
      a.addColorStop(0,'#ccff00');a.addColorStop(1,'#2f6b3f');
      x.fillStyle=a;x.fillRect(cx-w/2,top,w,hgt);
    }
  });
  return c;
}

const SCENES: Record<string, any> = {
  sala:{label:'Sala',ceiling:'#e9e4da',wall:'#d8cfc0',wallLow:'#cfc4b2',floor:'#9c7350',floorDark:'#7c5a3e',
    items:[{type:'window',lon:180,w:420,h:300},{type:'block',lon:95,w:460,h:150,dy:80,color:'#5f7d8c'},
           {type:'art',lon:300,w:200,h:150},{type:'door',lon:20,w:150,h:330}]},
  cocina:{label:'Cocina',ceiling:'#eef0f2',wall:'#e3e7ea',wallLow:'#d7dde1',floor:'#b9bfc6',floorDark:'#9aa1a9',
    items:[{type:'block',lon:200,w:700,h:170,dy:70,color:'#3d4b55'},{type:'block',lon:200,w:700,h:120,dy:-140,color:'#eef1f3'},
           {type:'window',lon:305,w:260,h:230},{type:'block',lon:130,w:170,h:330,color:'#a7adb4'},{type:'door',lon:20,w:150,h:330,color:'#4a4f55'}]},
  habitacion:{label:'Habitación principal',ceiling:'#efe9e1',wall:'#e5d9c8',wallLow:'#dccdb8',floor:'#8d6a4c',floorDark:'#6f5238',
    items:[{type:'block',lon:160,w:560,h:200,dy:70,color:'#8c7f9c'},{type:'window',lon:250,w:330,h:280},
           {type:'block',lon:60,w:360,h:300,color:'#7a5c40'},{type:'door',lon:355,w:150,h:330}]},
  bano:{label:'Baño',ceiling:'#f2f4f5',wall:'#dfe8ea',wallLow:'#cfdcdf',floor:'#aebcc0',floorDark:'#93a3a8',
    items:[{type:'block',lon:180,w:300,h:140,dy:90,color:'#ffffff'},{type:'window',lon:90,w:180,h:150,dy:-60},
           {type:'block',lon:270,w:220,h:280,color:'#c7d3d6'},{type:'door',lon:0,w:150,h:330,color:'#8a939b'}]},
  balcon:{label:'Balcón / Vista',ceiling:'#bfe0f5',wall:'#a8d4ef',wallLow:'#cde9f8',floor:'#b7aa96',floorDark:'#998c78',
    items:[{type:'block',lon:180,w:900,h:120,dy:120,color:'#6f7c85'},
           {type:'block',lon:80,w:160,h:130,dy:60,color:'#4d5d52'},{type:'door',lon:340,w:170,h:330,color:'#37424a'}]},
};

const viewerContainer = ref<HTMLElement | null>(null)
let scene3: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, mat: THREE.MeshBasicMaterial
let animationFrameId: number

const activeSceneKey = ref('sala')
const activeSceneLabel = ref('Sala')
const isExpanded = ref(false)
const isDragging = ref(false)
const showDragHint = ref(true)

let lon=175, lat=0, fovT=75, isDown=false, sx=0, sy=0, slon=0, slat=0, auto=true;

const sizeViewer = () => {
  if (!viewerContainer.value || !renderer || !camera) return
  const r = viewerContainer.value.getBoundingClientRect()
  camera.aspect = r.width/r.height
  camera.updateProjectionMatrix()
  renderer.setSize(r.width, r.height)
}

const onFullscreenChange = () => {
  isExpanded.value = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
  setTimeout(() => sizeViewer(), 100)
}

const toggleExpand = () => {
  const elem = viewerContainer.value as any
  if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
    if (elem?.requestFullscreen) {
      elem.requestFullscreen().catch(() => {})
    } else if (elem?.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    }
  }
}

const down = (x: number, y: number) => {
  isDown=true; auto=false; isDragging.value=true; sx=x; sy=y; slon=lon; slat=lat;
  showDragHint.value = false
}
const move = (x: number, y: number) => {
  if(!isDown)return;
  lon=slon+(sx-x)*0.18; lat=Math.max(-80,Math.min(80,slat+(y-sy)*0.18));
}
const up = () => { isDown=false; isDragging.value=false; }

const setScene = (key: string) => {
  if(key === activeSceneKey.value && mat?.map) return;
  activeSceneKey.value = key;
  activeSceneLabel.value = SCENES[key].label;
  const canvas = makeRoomCanvas(SCENES[key]);
  if(mat?.map) mat.map.dispose();
  mat.map = new THREE.CanvasTexture(canvas);
  mat.map.colorSpace = THREE.SRGBColorSpace;
  mat.needsUpdate = true;
  lon=175; lat=0;
}

const thumbnails = ref<Array<{key: string, label: string, img: string}>>([])
const isMobileMenuOpen = ref(false)

onMounted(async () => {
  if (typeof window === 'undefined') return;

  // Render thumbnails
  Object.entries(SCENES).forEach(([key,cfg])=>{
    const full = makeRoomCanvas(cfg);
    const th = document.createElement('canvas'); th.width=120; th.height=120;
    th.getContext('2d')?.drawImage(full, 700, 260, 620, 620, 0, 0, 120, 120);
    thumbnails.value.push({
      key, label: cfg.label.split(' ')[0], img: th.toDataURL()
    })
  })

  // Ensure DOM is ready for viewer
  await nextTick()

  // ThreeJS Init
  scene3 = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, 1, 1, 1100)
  camera.position.set(0,0,0.1)
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  
  if (viewerContainer.value) {
    viewerContainer.value.appendChild(renderer.domElement)
  }

  const geo = new THREE.SphereGeometry(SPHERE_R, 60, 40); geo.scale(-1, 1, 1)
  mat = new THREE.MeshBasicMaterial()
  scene3.add(new THREE.Mesh(geo, mat))

  sizeViewer()
  setScene('sala') // initialize texture

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate)
    if(auto) lon += 0.02
    const phi = THREE.MathUtils.degToRad(90-lat), theta = THREE.MathUtils.degToRad(lon)
    camera.lookAt(SPHERE_R*Math.sin(phi)*Math.cos(theta), SPHERE_R*Math.cos(phi), SPHERE_R*Math.sin(phi)*Math.sin(theta))
    camera.fov += (fovT-camera.fov)*0.12; camera.updateProjectionMatrix()
    renderer.render(scene3, camera)
  }
  animate()

  window.addEventListener('resize', sizeViewer)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', sizeViewer)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (renderer) renderer.dispose()
})

const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  fovT = Math.max(40, Math.min(95, fovT + e.deltaY * 0.04));
}
</script>

<template>
  <section v-if="selectedProduct" class="relative w-full bg-[var(--color-surface)] min-h-screen flex flex-col lg:flex-row">
    
    <!-- LEFT SIDEBAR (Sticky) -->
    <div class="hidden lg:flex sticky top-0 h-screen w-[32%] flex-shrink-0 flex-col justify-between p-6 z-40">
      <div class="flex items-center gap-2 cursor-pointer text-black" @click="backToGrid">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-footsteps -rotate-90"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 16.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M15 18.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M8.52 12h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /><path d="M19.52 14h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /></svg>
        <span class="text-[20px] font-medium tracking-tight text-black" style="font-family: var(--font-body);">
          Volver a Paseito
        </span>
      </div>

      <div class="flex-grow flex flex-col justify-center">
        <div class="flex flex-col pr-8">
          <h1 class="text-[20px] font-medium leading-tight tracking-tight mb-1" style="font-family: var(--font-body);">{{ selectedProduct.name }}</h1>
          <p class="text-[17px] text-gray-500 mb-6 font-normal">{{ selectedProduct.price }}</p>

          <div class="flex gap-2 mb-4">
            <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              Operación: Venta 
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              Moneda: USD 
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="text-[18px] font-medium" style="font-family: var(--font-body);">
        Mi Lista (0)
      </div>
    </div>

    <!-- MOBILE HEADER -->
    <div class="lg:hidden w-full flex items-center justify-between p-4 px-6 z-[1100] bg-[var(--color-surface)] sticky top-0 border-b border-transparent">
      <!-- Left: Logo (Goes back to grid) -->
      <div class="flex items-center gap-2 cursor-pointer text-black" @click="backToGrid">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-footsteps -rotate-90"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 16.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M15 18.5a2.5 2.5 0 0 0 5 0a1.5 1.5 0 0 0 -1.5 -1.5h-2a1.5 1.5 0 0 0 -1.5 1.5" /><path d="M8.52 12h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /><path d="M19.52 14h-4.04c-.348 0 -.678 -.179 -.823 -.496c-1.326 -2.904 -.774 -8.504 2.843 -8.504s4.17 5.6 2.843 8.504c-.145 .317 -.475 .496 -.824 .496" /></svg>
        <span class="text-[20px] font-medium tracking-tight text-black" style="font-family: var(--font-body);">Paseito</span>
      </div>

      <!-- Center: Product Thumbnails -->
      <div class="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-[50%]">
        <div 
          v-for="p in products.slice(0,5)" 
          :key="'mob-thumb-'+p.id" 
          class="w-10 h-10 rounded-xl flex-shrink-0 p-1 cursor-pointer transition-colors"
          :class="selectedProduct.id === p.id ? 'bg-[#d0d0cc]' : 'bg-[#e3e3df]'"
          @click="selectProduct(p)"
        >
          <img :src="p.image" class="w-full h-full object-contain mix-blend-multiply" />
        </div>
      </div>

      <!-- Right: Icons -->
      <div class="flex items-center gap-4 text-black">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <div @click="isMobileMenuOpen = true" class="cursor-pointer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </div>
      </div>
    </div>

    <!-- RIGHT CONTENT AREA -->
    <div class="w-full lg:w-[68%] flex-grow relative min-h-screen">
      <div class="w-full flex flex-col lg:flex-row min-h-screen lg:h-screen lg:sticky top-0 relative">
        
        <!-- Center Column (Viewer & Info) -->
        <div class="flex-1 min-w-0 flex flex-col h-auto lg:h-full relative overflow-y-visible lg:overflow-y-auto no-scrollbar py-8 lg:py-12 px-4 lg:pl-[120px] lg:pr-6 justify-start lg:justify-center">
          
          <!-- Main Center Column: Viewer OR Accordions -->
          <div class="flex-1 flex flex-col justify-center items-center max-w-3xl w-full mx-auto">
            
            <!-- 360 Viewer Wrapper (Hidden when showing Description) -->
            <div 
              v-show="!showDescription"
              class="w-full relative transition-all duration-300 ease-in-out"
              :class="{ 'fixed inset-0 z-[100] max-w-none p-0 bg-black flex items-center justify-center': isExpanded }"
            >
              <!-- Stage -->
              <div 
                id="viewer" 
                ref="viewerContainer"
                class="w-full aspect-[16/10] max-h-[65vh] rounded-[32px] overflow-hidden cursor-grab relative shadow-sm bg-gray-100"
                :class="{ 
                  'dragging': isDragging,
                  '!w-screen !h-screen !max-h-none !aspect-auto !rounded-none': isExpanded 
                }"
                @mousedown="down($event.clientX, $event.clientY)"
                @mousemove="move($event.clientX, $event.clientY)"
                @mouseup="up"
                @mouseleave="up"
                @touchstart.passive="down($event.touches[0].clientX, $event.touches[0].clientY)"
                @touchmove.passive="move($event.touches[0].clientX, $event.touches[0].clientY)"
                @touchend="up"
                @wheel.prevent="onWheel"
              >
                <!-- Viewer Overlays & Controls -->
                <div class="absolute top-4 left-4 z-10 bg-[#ccff00] text-black text-xs font-bold px-3 py-1.5 rounded-full tracking-wider">
                  360°
                </div>
                <button 
                  class="absolute top-4 right-4 z-10 bg-white/90 text-black text-sm font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform"
                  @click="toggleExpand"
                >
                  ⛶ <span class="hidden md:inline">{{ isExpanded ? 'Salir' : 'Pantalla completa' }}</span>
                </button>
                <div class="absolute bottom-4 left-4 z-10 bg-black/75 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md transition-opacity duration-300">
                  {{ activeSceneLabel }}
                </div>
                <div class="absolute bottom-4 right-4 z-10 bg-white/85 text-gray-500 text-xs px-3 py-1.5 rounded-full transition-opacity duration-500" :style="{ opacity: showDragHint ? 1 : 0 }">
                  Arrastra para recorrer
                </div>
              </div>
            </div>

            <!-- Centered Accordions (Shown when Description is selected) -->
            <div 
              v-show="showDescription" 
              class="w-full max-w-xl flex flex-col gap-3 mt-6 lg:mt-0 transition-opacity duration-300"
            >
              <!-- Description accordion -->
              <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
                <div @click="toggleAccordion('description')" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors">
                  <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Descripción general</span>
                </div>
                <div 
                  class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" 
                  :class="activeAccordion === 'description' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                >
                  <div class="overflow-hidden">
                    <div class="px-6 pb-6">
                      <p class="text-[16px] text-gray-600 leading-relaxed font-normal">
                        {{ selectedProduct.description || 'Excelente oportunidad. Propiedad o vehículo en óptimas condiciones, lista para su uso inmediato. Ubicación y acabados de primera categoría.' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Product details accordion -->
              <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
                <div @click="toggleAccordion('details')" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors">
                  <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Características y Amenidades</span>
                </div>
                <div 
                  class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" 
                  :class="activeAccordion === 'details' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                >
                  <div class="overflow-hidden">
                    <div class="px-6 pb-6">
                      <p class="text-[16px] text-gray-600 leading-relaxed font-normal">
                        Cuenta con espacios bien distribuidos, diseño moderno y excelente iluminación natural. Ideal para quienes buscan máximo confort, seguridad y rendimiento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Policies accordion -->
              <div class="bg-[#e3e3df] rounded-[24px] overflow-hidden transition-all duration-300">
                <div @click="toggleAccordion('policies')" class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-300/50 transition-colors">
                  <span class="text-[17px] font-medium" style="font-family: var(--font-body);">Condiciones y Políticas</span>
                </div>
                <div 
                  class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out" 
                  :class="activeAccordion === 'policies' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                >
                  <div class="overflow-hidden">
                    <div class="px-6 pb-6">
                      <p class="text-[16px] text-gray-600 leading-relaxed font-normal">
                        Se requiere depósito de garantía y validación de antecedentes. Documentación sujeta a revisión. Para más detalles, consulte con nuestros asesores.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <!-- Room Rail (Absolute on Desktop, Static on Mobile) -->
          <div 
            v-show="!isExpanded" 
            class="flex flex-row lg:flex-col gap-3 lg:gap-4 static lg:absolute lg:left-8 lg:top-1/2 lg:-translate-y-1/2 z-20 w-full lg:w-auto overflow-x-auto lg:overflow-visible no-scrollbar pt-6 pb-2 lg:pt-0 lg:pb-0 items-center lg:items-stretch"
          >
            <div 
              v-for="th in thumbnails" :key="th.key"
              class="w-[64px] lg:w-[76px] flex flex-col items-center gap-1 cursor-pointer rounded-2xl lg:rounded-[20px] p-1.5 lg:p-2 transition-all flex-shrink-0"
              :class="activeSceneKey === th.key && !showDescription ? 'bg-white shadow-md scale-105' : 'bg-[#e3e3df]/60 hover:bg-[#e3e3df]'"
              @click="setScene(th.key); showDescription = false;"
            >
              <img :src="th.img" :alt="th.label" class="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] object-cover rounded-xl lg:rounded-[14px] block" />
              <span class="text-[10px] lg:text-[11px] font-bold text-center leading-tight mt-1" :class="activeSceneKey === th.key && !showDescription ? 'text-black' : 'text-gray-600'">{{ th.label }}</span>
            </div>

            <!-- Description Thumbnail -->
            <div 
              class="w-[64px] lg:w-[76px] flex flex-col items-center gap-1 cursor-pointer rounded-2xl lg:rounded-[20px] p-1.5 lg:p-2 transition-all flex-shrink-0 lg:mt-2"
              :class="showDescription ? 'bg-white shadow-md scale-105' : 'bg-[#e3e3df]/60 hover:bg-[#e3e3df]'"
              @click="showDescription = true"
            >
              <div class="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-xl lg:rounded-[14px] flex items-center justify-center bg-[#e3e3df] text-gray-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lg:w-6 lg:h-6">
                  <line x1="21" y1="10" x2="3" y2="10"></line>
                  <line x1="21" y1="6" x2="3" y2="6"></line>
                  <line x1="21" y1="14" x2="3" y2="14"></line>
                  <line x1="21" y1="18" x2="3" y2="18"></line>
                </svg>
              </div>
              <span class="text-[10px] lg:text-[11px] font-bold text-center leading-tight mt-1" :class="showDescription ? 'text-black' : 'text-gray-600'">Detalles</span>
            </div>
          </div>

            <!-- MOBILE PRODUCT INFO (Below Viewer) -->
            <div class="flex lg:hidden flex-col w-full mt-8 mb-6 max-w-xl text-left px-2">
              <h1 class="text-[24px] font-medium leading-tight tracking-tight mb-2" style="font-family: var(--font-body);">{{ selectedProduct.name }}</h1>
              <p class="text-[18px] text-gray-500 mb-6 font-normal">{{ selectedProduct.price }}</p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
                  Operación: Venta 
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
                  Moneda: USD 
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Right Sidebar (Thumbnails / Dock) -->
        <div 
          ref="dockRef" 
          class="hidden lg:flex w-48 flex-shrink-0 h-full overflow-y-auto no-scrollbar flex-col gap-4 py-8 items-end z-10 pr-6 border-l border-transparent transition-opacity duration-300"
          :class="{ 'opacity-0 pointer-events-none': isExpanded }"
          @mousemove="handleDockMove"
          @mouseleave="handleDockLeave"
          @scroll="handleDockScroll"
        >
          <div 
            v-for="p in products" 
            :key="'thumb-'+p.id" 
            class="w-[72px] h-[72px] rounded-3xl cursor-pointer flex-shrink-0 p-3 thumbnail-item"
            :class="selectedProduct.id === p.id ? 'bg-[#e3e3df]' : ''"
            @click="selectProduct(p)"
          >
            <img :src="p.image" class="w-full h-full object-contain mix-blend-multiply" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- MOBILE MENU OVERLAY -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-show="isMobileMenuOpen" class="fixed inset-0 z-[2000] bg-[#4a4a4a] text-white flex flex-col">
          <div class="flex items-center justify-between p-6">
            <div class="flex items-center gap-2 cursor-pointer text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-white">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.966 22.028a.747.747 0 01-.137-1.042c1.472-1.895 2.502-3.824 3.013-5.596.505-1.751.528-3.411.025-4.887a1.144 1.144 0 00-.022-.06l-.008-.02a3.841 3.841 0 01-.157-.457c-.171-.58-.337-1.393.003-2.316C15.006 6.784 15.688 6 17 6c1.026 0 1.942.545 2.56 1.39.61.835.94 1.954.94 3.11 0 1.155-.33 2.274-.94 3.11-.62.846-1.536 1.39-2.56 1.39-.444 0-.847-.123-1.196-.32.062.593.037 1.258-.112 1.922-.387 1.722-1.189 3.497-2.616 5.378a.75.75 0 01-1.11.047zM17.5 13.5c.783 0 1.458-.426 1.92-1.057.452-.619.69-1.424.69-2.222 0-1.052-.401-2.008-1.082-2.735C18.358 6.771 17.502 6 17 6c-.347 0-.585.148-.711.365-.121.209-.153.518-.046.883a4.707 4.707 0 00.323.834c.548 1.168.807 2.68.213 4.417a8.558 8.558 0 01-.849 1.838A2.697 2.697 0 0017 13.5zm-5.419 6.275a.75.75 0 01-1.02-.294c-1.637-2.883-2.62-5.736-2.92-8.232-.303-2.528.271-4.801 1.758-6.666C10.748 3.517 11.967 2.5 13.5 2.5c1.196 0 2.274.52 3.064 1.385a.75.75 0 11-1.106 1.015c-.569-.621-1.341-.9-2.072-.9-1.22 0-2.195.836-2.85 1.658C9.37 7.087 8.89 8.926 9.155 11.13c.264 2.203 1.144 4.8 2.632 7.42a.75.75 0 01-.294 1.021z" fill="currentColor"/>
              </svg>
            </div>
            <div @click="isMobileMenuOpen = false" class="cursor-pointer text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-6 pt-4 pb-12 no-scrollbar">
            <ul class="space-y-3 text-[19px] leading-tight font-normal tracking-tight" style="font-family: var(--font-body);">
              <li v-for="p in products" :key="p.id" class="cursor-pointer opacity-90 hover:opacity-100 transition-opacity text-white" @click="selectProduct(p); isMobileMenuOpen = false;">
                {{ p.name }}
              </li>
              <li class="font-medium mt-6 cursor-pointer text-white" @click="isMobileMenuOpen = false">
                All Products
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
/* Disable scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

#viewer :deep(canvas) {
  display: block;
}

#viewer.dragging {
  cursor: grabbing;
}
</style>
