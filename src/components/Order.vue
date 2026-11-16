<template>
  <div class="mod-panel" v-if="isMod">
    <button v-if="isMod" @click="selectOrder(-1)" class="btn btn--mod prev-button">Prev</button>
    <button v-if="isMod" @click="selectOrder(+1)" class="btn btn--mod next-button">Next</button>
  </div>
  <div id="container" :class="{'is-screen':isScreen}">
    
    <!-- <div v-if="false && canInputWords && !areWordsSent" id="explanation">
      Form a sentence. You can only submit once.
    </div> -->
    <!-- <div v-if="canInputWords && areWordsSent" id="after-sent">
      <div id="sent-words-container">
        <div v-for="([id, word], index) in chosenWords" :key="id" class="sent-word"">
          {{ word }}
        </div>
      </div>
      <div id="sent-info">Sent ✓</div>
    </div> -->
    <div v-if="canInputWords && !areWordsSent" >
      <h1 id="title">
        {{this.lang == 'zh'? "排序照句" : "Words in Order"}}
      </h1>
      <div id="player-order-container">
        <div v-for="([id, word], index) in chosenWords" :key="id" class="button" @click="unchooseWord(index)">
          {{ word }}
        </div>
      </div>
    </div>
    
    <!-- TODO scroll synced through network? -->
    <div v-if="!canInputWords || areWordsSent" id="sentences-container">
      <div id="scrollable-container" :class="{'is-screen': isScreen, 'is-mod': isMod}" :style="{top: isScreen || isMusician? `${-3.8*Math.max(0,selectedOrdered - 6)}rem`: '0'}">
        <div v-for="(sentence, index) in orderedSentences" :class="{'sentence': true, 'is-player':isPlayer, 'selected-sentence': index == selectedOrdered, 'own-sentence': ( sentIterator >= 0 && index == sentIterator)}">
          {{ sentence }}
        </div> 
      </div>
      <div id="gradient-after" :class="{'is-screen':isScreen}"><h1 id="title">
        {{this.lang == 'zh'? "排序照句" : "Words in Order"}}
      </h1></div>
    </div>
  </div>

  <div v-if="canInputWords && !areWordsSent" id="input-container">
    <div id="input-main">
      <div v-for="([id, word], index) in unchosenWords" :key="id" :class="{'button': true, 'chose-disabled': !canChoseMoreWords}" @click="chooseWord(index)">
        {{ word }}
      </div>
      
    </div>
    <div v-if="!canChoseMoreWords" id="info-max-words">{{ `${chosenWords.length}/${chosenWords.length} words chosen` }}</div>
    <div id="send-button" class="input-button" @click="sendPressed()" :class="{'button': true, 'send-disabled': !canSendOrder}">Submit</div>
  </div>
</template>

<script>
import socket from '@/socket.js'

const wordsEng = ["wiser", "what", "I", "you", "think", "it", "than", "how", "change", "know", "is", "of", "are"];
const wordsZh = ["我", "懂", "你", "更", "的", "又", "愛", "了", "白", "想"];
const maxWords = 8;

// Only send one sentence per player once

export default {
  props: ['lang', 'isMod', 'isScreen', 'isMusician', 'isLocked', 'isPlayer'],
  data() {
    return {
      socket: socket,
      unchosenWords: [],
      chosenWords: [],
      orderedSentences: [],
      areWordsSent: false,
      englishWords: true,
      words: [],
      selectedOrdered: 0,
      sentIterator: -1,
    }
  },

  beforeMount() {
    this.init();
  },

  mounted() {
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
      return this.chosenWords.length >= 3 && !this.areWordsSent && !this.isLocked;
    },
    canChoseMoreWords() {
      return this.chosenWords.length < maxWords;
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
        this.sentIterator = -1;
    },
    resetLocal() {
      this.init();
    },
    setState(newState) {
      let wasEnglish = this.englishWords;
      this.englishWords = newState.orderEnglishWords;
      if (wasEnglish != this.englishWords)
        this.resetLocal();
      
        
      this.orderedSentences = newState.orderedSentences;
      this.selectedOrdered = newState.selectedOrdered;
    },
    chooseWord(it)
    {
      if (this.chosenWords.length < maxWords) {
        let w = this.unchosenWords.splice(it, 1)[0];
        this.chosenWords.push(w);
      }
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
        this.areWordsSent = true;
        this.socket.emit('send order', s, (it) => {
          this.sentIterator = it;
          console.log(it);
        });
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
    selectOrder(delta)
    {
      if (delta < 0 && this.selectedOrdered == 0) return;
      if (delta > 0 && this.selectedOrdered >= this.orderedSentences.length - 1) return

      this.selectedOrdered = (this.selectedOrdered + delta) % this.orderedSentences.length;
      if (this.selectedOrdered < 0) this.selectedOrdered += this.orderedSentences.length - 1;

      this.socket.emit("select order", this.selectedOrdered);
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
    font-size: 3.5rem;
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
  #scrollable-container {
    position:absolute;
    
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    top: 0;
    padding-top: 10vh;
    transition: top 0.5s ease;
    padding-bottom: 4rem;
  }
  #scrollable-container.is-screen {
    padding-top: 20vh;
    overflow-y: hidden;
    position: fixed;
  }
  #scrollable-container.is-mod {
    padding-top: 25vh;
  }
  #input-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }
  .button {
    background-color: rgb(235, 235, 235);
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
  .button.chose-disabled {
    background-color: black;
    opacity: 0.7;
    color: darkgray;
  }
  .button.chose-disabled:active {
    background-color: #783737;
    transform: scale(0.87);
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
  }
  #info-max-words {
    font-size: 1.5rem;
    margin-top: 1rem;
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
    padding-top: 1rem;
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
    margin-bottom: 3em;
  }
  .sentence {
    display: flex;
    white-space: nowrap;
    padding-right: 1rem;
    padding-left: 1rem;
    font-size: 2.5rem;
    height: 3.5rem;
    margin-bottom: 0.3rem;
  }
  .sentence.is-player {
    font-size: 1.5rem;
    flex-wrap: unset;
    height: unset;
    white-space: unset;
    margin-left: 1rem;
    margin-right: 1rem;
    margin-bottom: 0.2rem;
    padding-bottom: 0.3rem;
  }
  .sentence.own-sentence {
    background-color: #e7e7e7;
    border-radius: 1em;
  }
  .sentence.selected-sentence {
    border-radius: 0.5em;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  }
  .sentence.sentence.own-sentence.selected-sentence {
    background-color: rgb(57, 57, 57);
    color:white;
  }
  #container {
    padding-top: 0;
  }
  #title {
  }
  .is-screen>#title {
    margin-top: 2rem;
    font-size: 5rem;
  }

  #gradient-after {
    top: 0;
    height: 10vh;
    z-index: 1;
    
    width: 100vw;
    background: white;
    background: linear-gradient(0deg,rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 1) 100%);
  }
  #gradient-after.is-screen {
    width: 50vw;
    height: 20vh;
    border-radius: 5rem;
  }

  .mod-panel {
    display: flex;
    justify-content: flex-end;
    background: #002fff;
    background: linear-gradient(0deg,rgba(0, 47, 255, 0) 0%, rgba(83, 211, 237, 1) 100%);
    color: black;
    height: 4rem;
    padding: 0.5rem;
  }

  .mod-panel .btn {
    font-size: 1rem;
  }

  .next-button {
    position: relative;
    float: right;
    align-self: flex-end;
    right:0;
  }
  .prev-button {
    position: absolute;
    float: left;
    left:0;
    margin-left: 0.5rem;
  }

</style>
