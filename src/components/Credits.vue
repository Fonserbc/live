<template>
  <h1 :class="{'title-h1':true,'is-screen':isScreen}">YenTing & Your Choices</h1>
  <div class="credits-container">
    <div class="credits-name">YenTing Lo 羅妍婷</div>
    <div class="credits-title">Singing, Keys</div>
    <a href="https://instagram.com/yenting.lo" target="_blank">@yenting.lo</a>
  </div>
  <div id="ferran-container" class="credits-container">
    <div class="credits-name"> Ferran Bertomeu Castells</div>
    <div class="credits-title">Computer Keyboard</div>
    <a href="https://instagram.com/ferran.games" target="_blank">@ferran.games</a>
  </div>
</template>

<script>
import socket from '@/socket.js'

export default {
  props: ['isScreen'],
  data() {
    return {
      socket: socket,
    }
  },
  mounted() {
  },
  methods: {
  },
}
</script>

<style scoped>
.static {
  position: absolute;
  left: 0;
  top: 0;
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
  display: block;
  line-height: 0;
  padding: 0;
  margin: 0;
  z-index: -1;
}


.title-h1 {
    margin: 2em;
    text-align: center;
    margin-bottom: 1em;
    margin-top: 1em;
    font-size: 4em;
}

.title-h1.is-screen {
  margin-top: 0em;
    font-size: 5em;
    white-space: nowrap;
}

h1 {
  font-family: 'Dahlia';
}
.credits-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.credits-name {
  font-size: 3em;
  font-weight: 700;
}
.credits-title {
  font-size: 2em;
}

.credits-container>a{
  font-size: 2em;
}


#ferran-container {
  margin-top: 2rem;
  margin-bottom: 3rem;
}

</style>
