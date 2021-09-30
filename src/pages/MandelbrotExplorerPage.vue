<template>
  <q-page>
    <transition :enter-active-class="`animated ${yellAnimIn}`" :leave-active-class="`animated ${yellAnimOut}`">
      <div
        v-if="yell !== ''"
        :class="`absolute-center text-h2 text-bold text-center text-${yellColor} q-mt-xl full-width non-selectable`"
        :style="`text-shadow: 0px 0px 20px ${yellShadowColor}`"
      >
        {{ yell }}
      </div>
    </transition>

    <transition enter-active-class="animated slideInRight" leave-active-class="animated slideOutDown" mode="out-in">
      <q-page-sticky position="bottom-right" :offset="[32, 32]" v-if="!isLoading && !isStarted"> </q-page-sticky>
    </transition>

    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <q-page-sticky v-if="!isLoading && isStarted && isGuiUnlocked && !isDrawerOpen" position="top-left" :offset="[16, 16]">
        <q-btn size="xl" color="white" icon="settings" flat @click="isDrawerOpen = true"></q-btn>
      </q-page-sticky>
    </transition>

    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
      <div class="absolute-top z-top text-center row" v-if="!isLoading && !isStarted">
        <div class="col-12 q-pa-xl">
          <div class="text-blue-6 text-h6 q-ma-sm col-6" style="line-height:1.2">
            Left mouse drag or W, S, A, D <span class="text-white text-h5 on-right">PAN</span><br />
            Mouse wheel or arrows up/down<span class="text-white text-h5 on-right">ZOOM</span><br />
            Middle mouse or Q, E<span class="text-white text-h5 on-right">ROTATE</span><br />
            Right mouse<span class="text-white text-h5 on-right">SAVE IMAGE</span><br />
          </div>
        </div>
      </div>
    </transition>

    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
      <div class="absolute-center z-top text-center row" v-if="!isLoading && !isStarted">
        <q-btn label="Audio is playing? let's start in fullscreen!" size="xl" color="green-6" flat @click="start" class="col-12 fullscreenbuttton infinite" />
        <q-btn
          label="Can't hear anything? Retry audio initialization!"
          size="md"
          color="blue-4"
          no-caps
          flat
          @click="audio"
          class="animated heartBeat fullscreenbuttton infinite col-12"
        />
      </div>
      <div class="absolute-center z-top text-h6 text-white q-pa-md" v-if="isLoading">
        Loading, please wait...
      </div>
    </transition>
    <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
      <div class="fixed-bottom-left z-top q-ma-md" v-if="!isLoading && !isStarted && isAudioTested">
        <q-btn label="Run in classic mode" size="md" color="grey-8" flat @click="startClassic" />
      </div>
    </transition>

    <q-drawer v-model="isDrawerOpen" overlay :width="400">
      <div class="row q-pa-md">
        <div class="absolute-right q-pa-sm">
          <q-btn size="md" color="white" icon="close" flat round @click="isDrawerOpen = false"></q-btn>
        </div>

        <div class="text-h5 text-blue q-my-md col-grow non-selectable">
          Max iterations
        </div>

        <div class="row items-center col-12">
          <q-slider
            v-model="maxIter"
            :min="10"
            :max="1000"
            :step="10"
            label-always
            label
            markers
            color="blue-10"
            @input="updateMandelbrot"
            class="q-mt-md col-grow"
            snap
          />
        </div>

        <div class="text-h5 text-green q-my-md col-grow non-selectable">
          Palette repeat
        </div>

        <div class="row items-center col-12">
          <q-slider
            v-model="repeat"
            :min="-20"
            :max="20"
            :step="1"
            label-always
            label
            markers
            color="green-10"
            @input="updateMandelbrot"
            class="q-mt-md col-grow"
            snap
          />
        </div>

        <div class="text-h5 text-green q-my-md col-grow non-selectable">
          Palette speed
        </div>

        <div class="row items-center col-12">
          <q-slider
            v-model="speed"
            :min="0.01"
            :max="1.5"
            :step="0.04"
            label-always
            label
            markers
            color="green-10"
            @input="updateMandelbrot"
            class="q-mt-md col-grow"
            snap
          />
        </div>

        <div class="text-h5 text-purple-10 q-my-md col-grow non-selectable">
          Stripe factor
        </div>

        <div class="row items-center col-12">
          <q-slider
            v-model="stripeFactor"
            :min="0.01"
            :max="3"
            :step="0.04"
            label-always
            label
            markers
            color="purple-10"
            @input="updateMandelbrot"
            class="q-mt-md col-grow"
            snap
          />
        </div>
        <div class="text-h5 text-purple-10 q-my-md col-grow non-selectable">
          Symmetry
        </div>

        <div class="row items-center col-12">
          <q-btn-toggle
            v-model="symmetry"
            @input="updateMandelbrot"
            toggle-color="purple-10"
            toggle-text-color="purple-10"
            color="grey-8"
            flat
            :options="[
              { label: 'None', value: 0 },
              { label: 'X', value: 10 },
              { label: 'Y', value: 20 },
              { label: 'X/Y', value: 30 },
              { label: 'Caleidoscope', value: 40 }
            ]"
          />
        </div>

        <div class="text-h5 text-yellow-5 q-my-md col-grow non-selectable">
          Glow factor
        </div>

        <div class="row items-center col-12">
          <q-slider
            v-model="glow"
            :min="0.01"
            :max="6"
            :step="0.04"
            label-always
            label
            markers
            color="yellow-5"
            label-text-color="black"
            @input="updateMandelbrot"
            class="q-mt-md col-grow"
            snap
          />
        </div>

        <div class="row col-12 q-mt-xl">
          <q-btn flat color="red-6" @click="resetPosition" class="col-6">Reset position</q-btn>
          <q-btn flat color="red" @click="resetAll" class="col-6">Reset all</q-btn>
        </div>

        <div class="col-12 fixed-bottom q-pa-md">
          <div class="text-right">
            <q-btn
              flat
              round
              color="white"
              @click="toggleFullScreen"
              :disable="!$q.fullscreen.isCapable"
              :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
              :class="$q.fullscreen.isActive ? '' : 'animated infinite heartBeat fullscreenbuttton'"
            >
              <q-tooltip>Toggle fullscreen</q-tooltip>
            </q-btn>
            <q-btn flat round icon="volume_off" color="orange-8" @click="toggleMute">
              <q-tooltip>Toggle music</q-tooltip>
            </q-btn>

            <q-btn flat round icon="reset_tv" color="orange-8" @click="toggleDisplayUVs">
              <q-tooltip>Display UVs</q-tooltip>
            </q-btn>
            <q-btn flat round icon="pest_control" color="orange" @click="showDebug" class="on-right">
              <q-tooltip>Open BJS Inspector</q-tooltip>
            </q-btn>
          </div>
          <div class="row items-center">
            <q-img
              src="bjs-logo.png"
              spinner-color="white"
              style="height: 64px; width: 64px"
              :class="`col ${isLoading ? '' : 'animated'} flip bjs-logo bjs-link col-shrink`"
              @click="gotoBabylonSite"
            />
            <div class="text-white col-grow non-selectable">Powered by BabylonJS & Roland Csibrei, 2021 <br />Original shader by @The_ArtOfCode</div>
          </div>
          <div class="text-caption text-grey-7 text-center non-selectable">
            In game music www.bensound.com<br />
            Intro music www.bensound.com
          </div>
        </div>
      </div>
    </q-drawer>

    <canvas ref="bjsCanvas" width="1920" height="1080" class="bjs-canvas" />
  </q-page>
</template>

<script lang="ts">
import { Engine } from '@babylonjs/core'
import { defineComponent, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { MandelbrotExplorerScene } from 'src/scenes/MandelbrotExplorerScene'
import defaultValues from 'src/scenes/mandelbrot.config'

export default defineComponent({
  name: 'PageIndex',
  setup(_, { root }) {
    const $q = root.$q
    const bjsCanvas = ref<HTMLCanvasElement | null>(null)
    const isDrawerOpen = ref(false)
    const isLoading = ref(true)
    const isAudioTested = ref(false)
    const isStarted = ref(false)
    const isGuiUnlocked = ref(true)
    const isTimeForTheShow = ref(false)
    const isRotation = ref(false)

    const maxIter = ref(10)
    const stripeFactor = ref(0.2)
    const repeat = ref(2)
    const speed = ref(0.1)
    const symmetry = ref(0)
    const glow = ref(1)
    const displayUVs = ref(0)

    const maxTimer = 20
    const timer = ref(maxTimer)
    const yell = ref('')
    const yellAnimIn = ref('')
    const yellAnimOut = ref('')
    const yellColor = ref('white')
    const yellShadowColor = ref('white')

    let engine: Engine

    let scene: MandelbrotExplorerScene

    onMounted(async () => {
      if (bjsCanvas?.value) {
        scene = new MandelbrotExplorerScene(bjsCanvas.value)
        engine = scene.getEngine()
        await scene.initScene()
        window.addEventListener('resize', onWindowResize)
        isLoading.value = false

        scene.loadIntroMusic(() => {
          // scene.playIntroMusic()
          // startClassic()
        })
      }
    })

    onUnmounted(() => {
      cleanup()
    })

    const cleanup = () => {
      window.removeEventListener('resize', onWindowResize)
    }

    const gotoBabylonSite = () => {
      window.open('https://www.babylonjs.com', '_blank')
    }

    const audio = () => {
      scene.playIntroMusic()
      isAudioTested.value = true
    }

    const toggleFullScreen = async () => {
      if ($q.fullscreen.isCapable) {
        await $q.fullscreen.toggle()
      }
    }

    const onWindowResize = () => {
      if (bjsCanvas.value) {
        bjsCanvas.value.width = bjsCanvas.value?.clientWidth
        bjsCanvas.value.height = bjsCanvas.value?.clientHeight
      }
      engine.resize()
    }

    const showDebug = async () => {
      isDrawerOpen.value = false
      await scene?.showDebug()
    }
    const hideDebug = async () => {
      await scene?.hideDebugLayer()
    }

    const start = async () => {
      if ($q.fullscreen.isCapable) {
        await $q.fullscreen.toggle()
        startClassic()
      }
    }

    const startClassic = () => {
      updateMandelbrot()

      scene.stopIntroMusic()
      scene.startScene()

      let opacity = 0
      function fade() {
        if (opacity < 1) {
          opacity += 0.015
          if (opacity < 1) {
            window.requestAnimationFrame(fade)
          }
          if (bjsCanvas.value) {
            bjsCanvas.value.style.opacity = opacity.toPrecision(4)
          }
        }
      }

      window.requestAnimationFrame(fade)

      isStarted.value = true
      setTimeout(() => {
        isGuiUnlocked.value = true
        const animInIdx = Math.floor(Math.random() * 3)
        yellAnimIn.value = 'fadeIn' // ['lightSpeedInRight', 'bounceInRight', 'slideInUp'][animInIdx]

        const animOutIdx = Math.floor(Math.random() * 4)
        yellAnimOut.value = 'fadeOut' //['rollOut', 'zoomOutLeft', 'slideOutLeft', 'zoomOutDown'][animOutIdx]

        yell.value = 'Drag with the left mouse button to move around'
        yellColor.value = 'orange'
        yellShadowColor.value = 'orange'
        setTimeout(() => {
          yell.value = ''
          setTimeout(() => {
            yell.value = 'Mouse wheel to zoom'
            yellColor.value = 'blue'
            yellShadowColor.value = 'blue'
            setTimeout(() => {
              yell.value = ''
              setTimeout(() => {
                yell.value = 'Middle mouse to rotate'
                yellColor.value = 'green'
                yellShadowColor.value = 'green'
                setTimeout(() => {
                  yell.value = ''
                  if (!isDrawerOpen.value) {
                    setTimeout(() => {
                      yell.value = 'Discover and try out the settings!'
                      yellColor.value = 'red'
                      yellShadowColor.value = 'red'
                      isDrawerOpen.value = true
                      setTimeout(() => {
                        yell.value = ''
                        maxIter.value = 100
                        updateMandelbrot()
                      }, 2000)
                    }, 1500)
                  }
                }, 3000)
              }, 1500)
            }, 3000)
          }, 1500)
        }, 3000)
      }, 2000)
    }

    const toggleDisplayUVs = () => {
      displayUVs.value = displayUVs.value === 0 ? 1 : 0
      updateMandelbrot()
    }

    const updateMandelbrot = () => {
      scene.update(maxIter.value, repeat.value, speed.value, symmetry.value, displayUVs.value, stripeFactor.value, glow.value)
    }

    const resetGui = () => {
      maxIter.value = defaultValues.maxIter
      repeat.value = defaultValues.repeat
      speed.value = defaultValues.speed
      symmetry.value = defaultValues.symmetry
      displayUVs.value = 0
      stripeFactor.value = defaultValues.stripeFactor
      glow.value = defaultValues.glow
    }

    const resetPosition = () => {
      scene.resetPosition()
      resetGui()
    }

    const resetAll = () => {
      scene.resetAll()
      resetGui()
    }

    const toggleMute = () => {
      scene.toggleMute()
    }

    return {
      isAudioTested,
      isGuiUnlocked,
      audio,
      start,
      startClassic,
      gotoBabylonSite,
      bjsCanvas,
      toggleFullScreen,
      isStarted,
      toggleMute,
      showDebug,
      isTimeForTheShow,
      maxIter,
      repeat,
      speed,
      glow,
      symmetry,
      stripeFactor,
      displayUVs,
      isRotation,
      isLoading,
      yell,
      yellAnimIn,
      yellAnimOut,
      yellColor,
      yellShadowColor,
      isDrawerOpen,
      timer,
      updateMandelbrot,
      toggleDisplayUVs,
      resetPosition,
      resetAll
    }
  }
})
</script>

<style lang="sass">
.bjs-canvas
  width: 100%
  height: 100%
  opacity: 0
.bjs-link
  cursor: pointer
.bjs-logo
  --animate-duration: 1.2s
  animation-delay: 10s
.fullscreenbuttton
  --animate-duration: 2s
aside
  background-color: rgba(0,0,0,0.6) !important
</style>
