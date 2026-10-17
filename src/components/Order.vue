<template>
  <div id="container">
    <h1 id="title">
      Word Order
    </h1>
    <div v-if="canInputWords" id="player-order-container">
      <div v-for="([id, word], index) in chosenWords" :key="id" class="word-button" @click="unchooseWord(index)">
        {{ word }}
      </div>
    </div>
    
    <!-- TODO scroll synced through network? -->
    <div v-if="!canInputWords" id="sentences-container">
      <div v-for="(sentence, index) in orderedSentences" class="sentence">
        {{ sentence }}
      </div> 
    </div>
  </div>
  <div v-if="canInputWords" id="input-container">
    <div id="input-main">
      <div v-for="([id, word], index) in unchosenWords" :key="id" class="word-button" @click="chooseWord(index)">
        {{ word }}
      </div>
    </div>
    <div id="send-button" class="input-button" @click="sendPressed()" :class="{'send-disabled': !canSendOrder}">✓</div>
  </div>
</template>

<script>
import socket from '@/socket.js'

const wordsEng = ["wiser", "what", "I", "you", "think", "it", "than", "how", "change", "know", "is", "of"];
const wordsZh = ["我", "懂", "你", "更", "的", "又", "愛", "了", "白", "想"];

let words = wordsEng;

export default {
  data() {
    return {
      socket: socket,
      isMod: this.$route.query.role === 'mod',
      isScreen: this.$route.query.role === 'screen',
      isMusician: this.$route.query.role === 'musician',
      url: '',
      unchosenWords: [],
      chosenWords: [],
      orderedSentences: [],
    }
  },

  beforeMount() {
    this.unchosenWords = [];
    this.chosenWords = []
    for (let i = 0; i < words.length; ++i) {
      this.unchosenWords.push([i, words[i]]);
    }
  },

  mounted() {
    this.url = window.location.protocol + '//' + window.location.host + window.location.pathname

    // this.socket.on('connect', this.connect);
    this.socket.on('new state', this.setState);
    this.socket.emit('join', (state) => {
      this.setState(state);
    });
    this.socket.on('new display state', this.newDisplayState);
  },

  beforeUnmount() {
  },

  computed: {
    canInputWords() {
      return !this.isMod && !this.isScreen && !this.isMusician;
    },
    canSendOrder() {
      return this.unchosenWords.length == 0;
    }
  },

  methods: {
    offerReset() {
      if (confirm('Are you sure you want to reset everything?')) {
        this.sendReset()
      }
    },
    sendReset() {
      this.socket.emit('send reset')
    },
    setState(newState) {
      
    },
    chooseWord(it)
    {
      let w = this.unchosenWords.splice(it, 1)[0];
      this.chosenWords.push(w);
    },
    unchooseWord(it)
    {
      let w = this.chosenWords.splice(it, 1)[0];
      this.unchosenWords.push(w);
    },
    sendPressed()
    {
      if (!this.canSendOrder || !this.canInputWords)
        return;

      console.log("send words");
      this.socket.emit('send order', this.chosenWords);
    },
    newDisplayState(newDisplayState)
    {
      this.orderedSentences = newDisplayState.orderedSentences;
    }
  },
}
</script>

<style>
  #container {
    min-width: 10em;
    width: 100%;
    font-family: 'Noto Sans TC', sans-serif;
    /* max-width: 18em; */
    line-height: 1.3;

    font-size: 1.2rem;
    padding: 0.5em 0.5em 1em;
  }
  #input-container {
    position: absolute;
    bottom:0;
    width: 100%;
    background-color: gray;
    margin: auto;
    padding-top: 1rem;
    padding-bottom: 1rem;


    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
  }
  #input-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }
  .word-button {
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
  .word-button:active {
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
    transform: scale(0.87);
    background-color: #AACCFF;
  }
  #send-button {
    background-color: lightgreen;
    aspect-ratio: 1;
    width: 8vh;
  }
  #send-button.send-disabled {
    background-color: white;
  }
  #send-button.send-disabled:active {
    background-color: #FF7777;
    transform: scale(0.87);
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
  }
  .input-space {
    margin:0.5rem;
    width: 8vh;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
  }
  .input-number-line {
    display: flex;
    flex-direction: row;
  }
  #input-container {
    display: flex;
    flex-wrap: wrap;
  }

  #player-order-container {
    display: flex;
    flex-wrap: wrap;
  }

  #sentences-container {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: column;
  }
  .sentence {
    display: flex;
    font-size: 1.5rem;
    white-space: nowrap;
    margin-top: 0.35rem;
  }
  @media (min-width: calc(336px)) {
    #poemcontainer {
      /* this font size will grow with the browser */
      font-size: calc(0.2rem + 5vw);
    }
  }
  @media (min-width: calc(590px)) {
    #poemcontainer {
      /* cap off font size growth */
      font-size: 2rem;
    }
  }
  /* This styling only happens if we are a role=screen, and actually I've been only testing it against a 1280p screen */
  @media (max-height: calc(1000px)) and (min-width: calc(1100px)) {
    #title {
      text-align: left;
    }
  }

</style>
