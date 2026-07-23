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

const SCENES: Record<string, { label: string, img: string }> = {
  sala:{label:'Sala',img:'/images/prueba1.webp'},
  cocina:{label:'Cocina',img:'/images/prueba2.webp'},
  habitacion:{label:'Habitación principal',img:'/images/prueba3.webp'},
  bano:{label:'Baño',img:'/images/prueba4.webp'},
  balcon:{label:'Balcón / Vista',img:'/images/prueba5.webp'},
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
  const cfg = SCENES[key];
  activeSceneLabel.value = cfg.label;
  new THREE.TextureLoader().load(cfg.img, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    if(mat.map) mat.map.dispose();
    mat.map = tex;
    mat.needsUpdate = true;
  });
  lon=175; lat=0;
}

const thumbnails = ref<Array<{key: string, label: string, img: string}>>([])
const isMobileMenuOpen = ref(false)

onMounted(async () => {
  if (typeof window === 'undefined') return;

  // Render thumbnails
  Object.entries(SCENES).forEach(([key,cfg])=>{
    thumbnails.value.push({ key, label: cfg.label.split(' ')[0], img: cfg.img })
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
        <Icon name="footsteps" width="24" height="24" class="-rotate-90" />
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
              <Icon name="chevronDown" width="10" height="10" />
            </button>
            <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
              Moneda: USD 
              <Icon name="chevronDown" width="10" height="10" />
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
        <Icon name="footsteps" width="24" height="24" class="-rotate-90" />
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
        <Icon name="bag" width="20" height="20" stroke-width="1.5" />
        <div @click="isMobileMenuOpen = true" class="cursor-pointer">
          <Icon name="menu" width="24" height="24" stroke-width="1.5" />
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
                  <Icon :name="isExpanded ? 'collapse' : 'expand'" class="w-3.5 h-3.5" />
                  <span class="hidden md:inline">{{ isExpanded ? 'Salir' : 'Pantalla completa' }}</span>
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
                <Icon name="filterLines" width="20" height="20" class="lg:w-6 lg:h-6" />
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
                  <Icon name="chevronDown" width="10" height="10" />
                </button>
                <button class="bg-[#e3e3df] px-4 py-2 rounded-full text-[15px] font-medium flex items-center gap-2 hover:bg-gray-300 transition-colors">
                  Moneda: USD 
                  <Icon name="chevronDown" width="10" height="10" />
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
              <Icon name="footstepsSolid" width="24" height="24" stroke="none" class="text-white" />
            </div>
            <div @click="isMobileMenuOpen = false" class="cursor-pointer text-white">
              <Icon name="close" width="24" height="24" stroke-width="1.5" />
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
