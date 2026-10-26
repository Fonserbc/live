<template>
  <div id="container">
    <h1 id="title">
      Ordered Sentence
    </h1>
    <div v-if="canInputWords && !areWordsSent" id="explanation">
      Form a sentence. You can only submit once.
    </div>
    <div v-if="canInputWords && areWordsSent" id="after-sent">
      <div id="sent-words-container">
        <div v-for="([id, word], index) in chosenWords" :key="id" class="sent-word"">
          {{ word }}
        </div>
      </div>
      <div id="sent-info">Sent ✓</div>
    </div>
    <div v-if="canInputWords && !areWordsSent" id="player-order-container">
      <div v-for="([id, word], index) in chosenWords" :key="id" class="button" @click="unchooseWord(index)">
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
  <div v-if="canInputWords && !areWordsSent" id="input-container">
    <div id="input-main">
      <div v-for="([id, word], index) in unchosenWords" :key="id" class="button" @click="chooseWord(index)">
        {{ word }}
      </div>
    </div>
    <div id="send-button" class="input-button" @click="sendPressed()" :class="{'button': true, 'send-disabled': !canSendOrder}">Submit</div>
  </div>
</template>

<script>
import socket from '@/socket.js'

const wordsEng = ["wiser", "what", "I", "you", "think", "it", "than", "how", "change", "know", "is", "of", "are"];
const wordsZh = ["我", "懂", "你", "更", "的", "又", "愛", "了", "白", "想"];

// Only send one sentence per player once

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
      areWordsSent: false,
      englishWords: true,
      words: [],
    }
  },

  beforeMount() {
    this.init();
  },

  mounted() {
    this.url = window.location.protocol + '//' + window.location.host + window.location.pathname

    // this.socket.on('connect', this.connect);
    this.socket.on('new state', this.setState);
    this.socket.on('new display state', this.newDisplayState);
    this.socket.on('reset local', this.resetLocal);
    this.socket.on('allow new order', this.openForNewOrder);
    this.socket.emit('join', (state) => {
      this.setState(state);
    });
  },

  beforeUnmount() {
  },

  computed: {
    canInputWords() {
      return !this.isMod && !this.isScreen && !this.isMusician;
    },
    canSendOrder() {
      return this.chosenWords.length >= 3 && !this.areWordsSent;
    }
  },

  methods: {
    init() {
        let words = this.englishWords? wordsEng : wordsZh;
        this.unchosenWords = [];
        this.chosenWords = [];
        let order = [];
        for (let i = 0; i < words.length; ++i) {
          order.push(i);
        }
        
        for (let i = order.length; i > 0; --i)
        {
          let r = Math.floor(Math.random() * i);
          
          let aux = order[i - 1];
          order[i - 1] = order[r];
          order[r] = aux;
        }

        for (let r = 0; r < order.length; ++r)
        {
          let i = order[r];
          this.unchosenWords.push([i, words[i]]);
        }

        this.areWordsSent = false;
    },
    resetLocal() {
      this.init();
    },
    setState(newState) {
      let wasEnglish = this.englishWords;
      this.englishWords = newState.orderEnglishWords;
      if (wasEnglish != this.englishWords)
        this.resetLocal();
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

      let s = "";
      let isEnglishSentence = this.englishWords;
      for (let i = 0; i < this.chosenWords.length; ++i) {
        if (isEnglishSentence && i != 0) s += " ";
        s += this.chosenWords[i][1];
      }
      if (isEnglishSentence)
        s = s.charAt(0).toUpperCase() + s.slice(1);

      if (confirm(`send "${s}"?`))
      {
        this.socket.emit('send order', s);
        this.areWordsSent = true;
      }
    },
    openForNewOrder() {
      if (this.areWordsSent) {
        this.init();

        if (navigator.vibrate !== undefined)
        {
          navigator.vibrate([100,100,200,100,100]);
        }
      }
    },
    newDisplayState(newDisplayState)
    {
      this.orderedSentences = newDisplayState.orderedSentences;
    }
  },
}
</script>

<style scoped>
  #container {
    min-width: 10em;
    width: 100%;
    font-family: 'Noto Sans TC', sans-serif;
    /* max-width: 18em; */
    line-height: 1.3;

    font-size: 1.2rem;
    padding: 0.5em 0.5em 1em;
    text-align: center;
  }
  h1 {
    text-align: center;
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
  #send-button {
    background-color: lightgreen;
    box-shadow: 0.25rem 0.25rem rgba(0,0,0,0.5);
    margin: 0.5rem;
    margin-top: 2rem;
    color: black;
  }
  #send-button:active {
    background-color: lightgreen;
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
    transform: scale(0.87);
  }
  #send-button.send-disabled {
    background-color: black;
    opacity: 0.7;
    color: darkgray;
  }
  #send-button.send-disabled:active {
    background-color: #783737;
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
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }
  #sent-words-container {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }
  .sent-word {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }

  #sentences-container {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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
