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
        </select>
      </div>
      <!-- <div class="mod-panel__controls"> -->

        <button v-if="!isLocked && canGameBeLocked" @click="sendLock()" class="btn btn--mod">🔓 Unlocked</button>
        <button v-if="isLocked && canGameBeLocked" @click="sendUnlock()" class="btn btn--mod">🔒 Locked</button>
        
        <button v-if="game === 'ChoicesPath'" @click="togglePathState()" class="btn btn--mod">{{ pathState == 'half'? 'Showing Half' : 'Showing Full' }}</button>

        <!-- Raven buttons -->
        <button v-if="ravenState === 'voting' && game === 'Raven'" @click="confirmAction(endRound, 'end voting round?')" class="btn btn--mod">End Round</button>
        <button v-if="(ravenState === 'results' || ravenState === 'intro') && game === 'Raven'" @click="confirmAction(startRound, 'start round?')" class="btn btn--mod">Start Round</button>
        <button v-if="ravenState === 'end' && game === 'Raven'" @click="confirmAction(sendReset, 'Are you sure you want to reset everything?')" class="btn btn--mod">Back to intro</button>
        <button v-if="ravenState === 'results' && game === 'Raven'" @click="confirmAction(endRaven,'end raven?')" class="btn btn--mod">End song</button>
        <button v-if="game === 'Order'" @click="confirmAction(changeOrderLanguage,'change language?')" class="btn btn--mod">{{ this.orderEnglishWords? "En" : "Zh" }}</button>
        <button v-if="game === 'Order'" @click="allowNewOrder()" class="btn btn--mod">Allow new order</button>
        <button v-if="game === 'Love'" @click="allowNewLetter()" class="btn btn--mod">Allow new letter</button>

        <button v-if="game !== 'Raven'" @click="offerReset()" class="btn btn--mod">🔄 Reset</button>
      <!-- </div> -->
    </div>

    <canvas v-if="game !== 'YenTing' && isScreen" ref="canvas" class="qrcode" :class="{ qrcodescreen: isScreen }"></canvas>

    <component v-if="game !== undefined && game != ''" :is="game" />

    <canvas v-if="game === 'YenTing'" ref="canvasBig" id="qrcode-big"></canvas>
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


export default {
  components: { FillingIn, Raven, YenTing, ChoicesPath, Numbers, Order, Voting, Love },
  data() {
    return {
      socket: socket,
      isMod: this.$route.query.role === 'mod',
      isScreen: this.$route.query.role === 'screen',
      wordList,
      blankList: new Array(wordList.length),
      isLocked: false,
      url: '',

      game: '',
      ravenState: 'intro',
      pathState: 'half',

      orderEnglishWords: true,

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
      return this.game == 'FillingIn' || this.game == 'ChoicesPath';
    }
  },

  mounted() {
    this.url = window.location.protocol + '//' + window.location.host + window.location.pathname

    this.drawQRCodes()

    this.socket.on('connect', this.connect)
    this.socket.on('new state', this.setState)
    this.socket.on('new display state', this.setDisplayState)
    this.socket.on('end party', this.receivePartyEnd)
    if (this.$route.query.role !== undefined)
      this.socket.emit('report role', this.$route.query.role);
    this.socket.emit('join');
  },

  beforeUnmount() {
    this.socket.off('connect', this.connect)
    this.socket.off('new state', this.setState)
    this.socket.off('end party', this.receivePartyEnd)
  },

  methods: {
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
          scale: 8,
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

    receivePartyEnd() {
      this.$router.push({ path: '/', query: this.$route.query })
    },

    endParty() {
      this.socket.emit('end party', this.$route.params.party )
    },

    endPartyConfirm() {
      if (confirm('Are you sure you want to end the party?')) {
        this.endParty()
      }
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

    setState(newState) {
      this.blankList = newState.blankList
      this.isLocked = newState.isLocked
      this.game = newState.game
      this.ravenState = newState.ravenState
      this.pathState = newState.pathState;
      this.orderEnglishWords = newState.orderEnglishWords;
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

    width: 3.7em !important;
    height: 3.7em !important;
    padding: 0.5em;
    background: white;
    z-index: 1;
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

  .qrcodescreen {
    position: absolute;
    top: 0;
    right: 0;
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
