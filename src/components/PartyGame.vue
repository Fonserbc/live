<template>
  <main class="main">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <div class="mod-panel" v-if="isMod">

      <div class="controls">
        <select @change="changeGame" v-model="game">
          <option disabled value="">Select..</option>
          <option>YenTing</option>
          <option>FillingIn</option>
          <option>ChoicesPath</option>
          <!-- <option>Raven</option> -->
          <option>Numbers</option>
          <option>Order</option>
          <option>Voting</option>
          <option>Love</option>
          <option>Tumbleweed</option>
        </select>
      </div>
      <!-- <div class="mod-panel__controls"> -->
        <input type="checkbox" v-model="showQRScreen" @change="showQRCheck()">Show QR on Screen</input>

        <button v-if="game === 'YenTing'" class="btn btn--mod" @click="toggleLanguage()">{{lang}}</button>

        <button v-if="!isLocked && canGameBeLocked" @click="sendLock()" class="btn btn--mod">🔓 Unlocked</button>
        <button v-if="isLocked && canGameBeLocked" @click="sendUnlock()" class="btn btn--mod">🔒 Locked</button>
        
        <button v-if="game === 'ChoicesPath'" @click="togglePathState()" class="btn btn--mod">{{`Path ${pathState}`}}</button>

        <!-- Raven buttons -->
        <button v-if="ravenState === 'voting' && game === 'Raven'" @click="confirmAction(endRound, 'end voting round?')" class="btn btn--mod">End Round</button>
        <button v-if="(ravenState === 'results' || ravenState === 'intro') && game === 'Raven'" @click="confirmAction(startRound, 'start round?')" class="btn btn--mod">Start Round</button>
        <button v-if="ravenState === 'end' && game === 'Raven'" @click="confirmAction(sendReset, 'Are you sure you want to reset everything?')" class="btn btn--mod">Back to intro</button>
        <button v-if="ravenState === 'results' && game === 'Raven'" @click="confirmAction(endRaven,'end raven?')" class="btn btn--mod">End song</button>
        <button v-if="game === 'Order'" @click="confirmAction(changeOrderLanguage,'change language?')" class="btn btn--mod">{{ this.orderEnglishWords? "En" : "Zh" }}</button>
        <button v-if="game === 'Order'" @click="allowNewOrder()" class="btn btn--mod">Allow new order</button>
        <button v-if="game === 'Love'" @click="allowNewLetter()" class="btn btn--mod">Allow new letter</button>

        <button v-if="game !== 'Raven'" @click="offerReset()" class="btn btn--mod">🔄 Reset</button>
        <button v-if="game === 'Numbers' || game == 'FillingIn'" @click="randomize()" class="btn btn--mod">🎲 Randomize</button>
      <!-- </div> -->
    </div>

    <div v-if="isScreen" id="circle-bg-container">
      <img class="circle circle-svg left" src="/circle.svg">
      <img class="circle circle-svg center" src="/circle.svg">
      <img class="circle circle-svg right" src="/circle.svg">
      <img class="circle circle-svg-2 left" src="/circle14.svg">
      <img class="circle circle-svg-2 center" src="/circle14.svg">
      <img class="circle circle-svg-2 right" src="/circle14.svg">
    </div>

    <div v-if="game !== 'YenTing' && isScreen && showQRScreen" id="screen-qr-container">
      <canvas ref="canvas" class="qrcode qrcodescreen"></canvas>
      <div>live.yentinglo.net</div>
    </div>
    

    <component v-if="game !== undefined && game != ''" :is="game" v-bind="$data" />

    <div v-if="game === 'YenTing'" id="yenting-qr-container">
      <canvas ref="canvasBig" id="qrcode-big"></canvas>
      <div>live.yentinglo.net</div>
    </div>

    
    <!-- <p v-if="game === 'YenTing'" style="text-align:center;">Let your neighbour scan and join!</p> -->

  </main>
</template>

<script>
import QRCode from 'qrcode'
import socket from '@/socket.js'
import wordList from '@/fei-words.js'
import FillingIn from './FillingIn.vue'
import ChoicesPath from './ChoicesPath.vue'
import Raven from './Raven.vue'
import YenTing from './YenTing.vue'
import Numbers from './Numbers.vue'
import Order from './Order.vue'
import Voting from './Voting.vue'
import Love from './Love.vue'
import Tumbleweed from './Tumbleweed.vue'


export default {
  components: { FillingIn, Raven, YenTing, ChoicesPath, Numbers, Order, Voting, Love, Tumbleweed },
  data() {
    return {
      socket: socket,
      isMod: this.$route.query.role === 'mod',
      isScreen: this.$route.query.role === 'screen',
      isYenTing: this.$route.query.role === 'yenting',
      isMusician: this.$route.query.role === 'musician' || this.$route.query.role === 'yenting',
      wordList,
      blankList: new Array(wordList.length),
      isLocked: false,
      url: '',
      game: '',
      ravenState: 'intro',
      pathState: 'half',
      showQRScreen: true,

      orderEnglishWords: true,
      lang: 'en',

      // Only one WordSelector is allowed open at a time.
      // This represents the index of the one that's open.
      //openWordSelectorIndex: -1,
    }
  },


  watch: {
    // the small/big QR canvases are swapped in and out by v-if depending
    // on `game`, and whichever one is relevant doesn't exist in the DOM
    // yet the first time this component mounts (game starts out as ''),
    // so redraw whichever canvas is currently present every time `game`
    // changes, once Vue has actually updated the DOM for it
    game() {
      this.$nextTick(this.drawQRCodes)
    },
  },

  computed: {
    canGameBeLocked() {
      return this.game == 'FillingIn' || this.game == 'ChoicesPath' || this.game == 'Numbers' || this.game == 'Order';
    }
  },

  mounted() {
    this.url = window.location.protocol + '//' + window.location.host + window.location.pathname

    this.drawQRCodes()

    this.socket.on('connect', this.connect)
    this.socket.on('new state', this.setState)
    this.socket.on('new display state', this.setDisplayState)
    if (this.$route.query.role !== undefined)
      this.socket.emit('report role', this.$route.query.role);
    this.socket.emit('join');
  },

  beforeUnmount() {
    this.socket.off('connect', this.connect)
    this.socket.off('new state', this.setState)
  },

  methods: {
    toggleLanguage() {
      if (this.lang == 'en')
        this.lang = 'zh'
      else this.lang = 'en';

      this.socket.emit('set lang', this.lang);
    },
    togglePathState() {
      this.socket.emit('toggle path state');
    },
    drawQRCodes() {
      if (this.$refs.canvas) {
        QRCode.toCanvas(this.$refs.canvas, this.url, {
          scale: 8,
          margin: 0,
          color: {
            dark: '#000',  // Blue dots
            light: '#0000' // Transparent background
          }
        }, function (error) {
          if (error) console.error(error)
        })
      }

      if (this.$refs.canvasBig) {
        QRCode.toCanvas(this.$refs.canvasBig, this.url, {
          scale: 12,
          margin: 0,
          color: {
            dark: '#000',  // Black dots
            light: '#fff' // White bg
          }
        }, function (error) {
          if (error) console.error(error)
        })
      }
    },
    showQRCheck()
    {
      if (this.isMod)
      {
        this.socket.emit('show qr screen', this.showQRScreen);
      }
    },
    endRound() {
      this.socket.emit('end round')
    },
    startRound() {
      this.socket.emit('start round')
    },
    endRaven() {
      this.socket.emit('end game')
    },
    changeGame() {
        this.socket.emit('change game', this.game)
    },
    connect() {
      console.log('connected')
    },
    wordSelectorOpen(i) {
    },
    wordSelectorClose() {
      this.openWordSelectorIndex = -1
    },
    confirmAction(cb, text) {
      if (confirm(text)) {
        cb();
      }
    },
    offerReset() {
      if (confirm('Are you sure you want to reset everything?')) {
        this.sendReset()
      }
    },
    sendReset() {
      this.socket.emit('send reset')
    },
    sendLock() {
      this.socket.emit('lock state')
    },
    sendUnlock() {
      this.socket.emit('unlock state')
    },
    changeOrderLanguage() {
      this.socket.emit('change order language');
    },
    allowNewOrder() {
      this.socket.emit('allow new order');
    },
    allowNewLetter() {
      this.socket.emit('allow new letter');
    },
    randomize() {
      this.socket.emit('randomize', this.game);
    },

    setState(newState) {
      this.blankList = newState.blankList
      this.isLocked = newState.isLocked
      this.game = newState.game
      this.ravenState = newState.ravenState
      this.pathState = newState.pathState;
      this.orderEnglishWords = newState.orderEnglishWords;
      this.lang = newState.lang;
      let qr = this.showQRScreen
      this.showQRScreen = newState.showQRScreen;
      if (!qr && newState.showQRScreen) {
        window.setTimeout(1000, this.drawQRCodes)
      }
    },

    setDisplayState(newDisplayState) {
      //console.log("received new display state")
    }
  },
}
</script>

<style>
  .qrcode {
    /* using sticky instead of absolute
    so it doesn't cover mod bar */
    position: sticky;
    top: 0;

    align-self: flex-end;

    /* width: 3.7em !important;
    height: 3.7em !important; */
    padding: 0.5em;
    background: white;
    z-index: 1;
  }

  #circle-bg-container {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -2;
    background-color: black;
    overflow: hidden;
    background-image: url('/yenting lo_white_padding_small_30_fill.png');
    background-size: 256px;
  }

  .circle {
    overflow: hidden;
    position: absolute;
    height: 100%;
    aspect-ratio: 1;
    top:0;
  }

  .circle-svg {
    animation: rotateForever 160s linear infinite;
    filter:brightness(95%);
  }
  .circle-svg-2 {
    animation: rotateForever 240s linear infinite;
  }
  .circle.left {
    left:0;
    animation-delay: -180s;
  }
  .circle.right {
    right:0;
    animation-delay: -90s;
  }
  .circle.center {
    width:100%;
  }

  @keyframes rotateForever {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  #qrcode-big {
    position: block;
    margin: auto;

    width:100%;
    padding: 1em;
    background: white;
  }

  .qrcode {
    font-size: 1.2rem;
  }

  #yenting-qr-container {
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    justify-items: center;
    padding: 0.5em;
    font-weight: 700;
    font-size: 1.5rem;
    color: black;
    z-index: 2;
  }

  #screen-qr-container {
    position: absolute;
    top: 0;
    right: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    justify-items: center;
    padding: 0.5em;
    font-weight: 700;
    font-size: 1.5rem;
    color: black;
    z-index: 2;
    background-color: white;
  }

  .qrcodescreen {
    width: 7em !important;
    height: 7em !important;
  }
  @media (min-width: calc(336px)) {
    .qrcode {
      /* this font size will grow with the browser */
      font-size: calc(0.2rem + 5vw);
    }
  }
  @media (min-width: calc(590px)) {
    .qrcode {
      /* cap off font size growth */
      font-size: 2rem;
    }
  }

  .button {
    flex-grow: 0;
    flex-shrink: 1;
    flex-basis: content;
    transition: all 0.2s;
    border-radius: 1rem;
    background-color: white;
    box-shadow: 0.25rem 0.25rem rgba(0,0,0,0.5);
    /* height: 8vh; */
    text-align: center;
    font-size: 2rem;
    margin-bottom: 0.5rem;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
    padding: 0.5rem;
    transform: scale(1);
    cursor: pointer;
  }

  .button:active {
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
    transform: scale(0.87);
    background-color: #AACCFF;
  }
  
  .button.disabled {
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
    transform: scale(0.87);
    background-color: black;
    opacity: 0.7;
    color: darkgray;
  }

  .mod-panel {
    display:flex;
  }

</style>
