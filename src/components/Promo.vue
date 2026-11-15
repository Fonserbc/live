<template>
  <div id="promo-container">
    <canvas class="static" ref="canvas"></canvas>
    <h1 class="title-h1" v-if="lang === 'zh'">羅妍婷的多重選擇</h1>
    <h1 :class="{'title-h1':true,'is-screen':isScreen}" v-if="lang === 'en'">YenTing & Your Choices</h1>
    <h2 v-else>YenTing & Your Choices</h2>


    
    <p id="welcome">Concert + Interactive Songwriting</p>
    <div id="promo-content">
      <p v-for="(line, index) in promoWords" :key="index" :class="['line', `line-${index}`]">
          <span>{{ line[0].substring(0, line[0].indexOf("$")) }}</span>
          <WordChoice v-if="line[1].length > 1" :id="index * 2" @open="wordSelectorOpen" @close="wordSelectorClose" :isLocked="false" :pathState="'11'" :pathOpen="true" :choices="line[1]" :openedBy="openedBy" :syncChoices="choices" :socket="socket" :initialChoiceId="choices[index * 2]"/>
          <!-- {{ line[1][pathFirstChoice[index]]}} -->
          <span>{{ line[0].substring(line[0].indexOf("$") + 1, line[0].length) + " "}}</span>
          <!-- {{ line[2][pathSecondChoice[index]] }} -->
          <WordChoice :id="index * 2 + 1" @open="wordSelectorOpen" @close="wordSelectorClose" :isLocked="isLocked && !isMod" :choices='line[2]' :pathState="'11'" :pathOpen="true" :openedBy="openedBy" :socket='socket' :syncChoices="choices" :initialChoiceId="choices[index * 2 + 1]"/>
        </p>
    </div>
    <div class="credits-container">
      <div class="credits-name">YenTing Lo 羅妍婷</div>
      <div class="credits-title">Singing, Keys</div>
    </div>
    <div id="ferran-container" class="credits-container">
      <div class="credits-name"> Ferran Bertomeu Castells</div>
      <div class="credits-title">Computer Keyboard</div>
    </div>
    <div id="info">
      <img id="hola-logo" src="/Hola Escolta 2026 - Logo.png" />
      <div id="info-text">Sat 21st Nov 2026, 13:00<br>First United Building, Manila</div>
      <img id="fub-logo"src="/FUB Logo.jpg" />
    </div>
    <img id="sw-logo"src="/somewarez_network_logo_1.png" />

    <textarea v-if="isMod" v-model="message" placeholder="message" @change="setMessage()"></textarea>
  </div>
</template>

<script>
import socket from '@/socket.js'
import WordChoice from '@/components/WordChoice.vue'
import promoWords from '@/promo-words.js'

export default {
  components: { WordChoice },
  props: ['isMod', 'lang', 'socket', 'isScreen'],
  data() {
    return {
      openWordSelectorIndex: -1,
      choices: new Array(promoWords.length * 2),
      openedBy: new Array(promoWords.length * 2),
      promoWords,
    }
  },
  mounted() {
    this.socket.on('new state', this.setState)
    this.socket.emit('join',this.setState)
  },
  methods: {
    wordSelectorOpen(i) {
      this.openWordSelectorIndex = i
    },
    wordSelectorClose() {
      this.openWordSelectorIndex = -1
    },
    setState(newState) {
      let gameState = newState.choices[newState.game];
      if (gameState !== undefined) {
        this.openedBy = newState.choices[newState.game].openedBy;
        this.choices = newState.choices[newState.game].choices;
      }
    }
  },
}
</script>

<style>
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

#mod-message {
  font-size: 1.5rem;
  margin: 2em 0 2em 0;
  text-align: center;
  white-space: pre-line;
}


.title-h1 {
    margin: 2em;
    text-align: center;
    margin-bottom: 0.1em;
    font-size: 2em;
}

.title-h1.is-screen {
  margin-top: 0em;
    font-size: 5em;
    white-space: nowrap;
}

h1 {
  font-family: 'Dahlia';
}

h2 {
  text-align: center;
    margin-bottom: 1em;
    font-size: 1.75em;
}

  #welcome {
    text-align: center;
    margin: 1em 0 1em 0;
  font-size: 3.2rem;
  font-family: 'Dahlia';
  font-weight: 500;
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

  #promo-content {
    height: 256px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 3.5em;
    gap: 0.2em;
    margin-bottom: 1em;
    border-radius: 2rem;
    /* background-color: rgb(215, 215, 215); */
    border: rgb(124, 124, 124) solid 3px;
    box-shadow: 5px 5px 15px rgb(124, 124, 124) ;
    padding: 1em;
    padding-bottom: 1.1em;
    transition: all 0.3s;
  }

  #ferran-container {
    margin-top: 2rem;
    margin-bottom: 3rem;
  }

  p {
    margin: 0 0 2rem;
  }
  p > span {
    display: block;
    white-space: pre;
  }
  .line {
    display: flex;
    flex-direction: line;
    margin-bottom: 0.3rem;
  }

  #info {
    display: flex;
    flex-direction: line;
    align-items: center;
    justify-content: center;
  }

  #info-text {
    font-size: 2rem;
    text-align: center;
    margin-left: 1rem;
    margin-right: 1rem;
    font-weight: 500;
  }

  #hola-logo {
    width: 256px;
  }

  #fub-logo {
    width: 256px;
  }

  #sw-logo {
    width: 256px;
    margin: auto;
    display: block;
    margin-top: 0rem;
  }

  #promo-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
