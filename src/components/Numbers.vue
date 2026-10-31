<template>
  <div class="mod-panel" v-if="isMod">
    <!-- <button v-if="isMod" @click="selectNumber(-1)" class="btn btn--mod prev-button">Prev</button> -->
    <button v-if="isMod" @click="selectNumber(+1)" class="btn btn--mod next-button">Next</button>
  </div>
  <h1 v-if="!canInputNumbers" id="title-screen">
    Numbers
  </h1>
  <div id="container">
    <h1 v-if="canInputNumbers" id="title">
      Numbers
    </h1>
    <div v-if="canInputNumbers" id="player-number-container" :class="{'sent-container': numbersLocked}">
      <div v-for="number in currentNumbers" :class="['number-'+number, numberClassObject]">
        {{ number }}
      </div>
    </div>
    
    <div id="display" v-if="!canInputNumbers">
      <div id="player-numbers-after">
        <div v-if="selectedId >= 0" v-for="([numbers, nid], index) in playerNumbers.slice(0,selectedId)" :key="nid" :class="{'list-numbers-container': true}">
          <div v-for="number in numbers" :class="['number-'+number, 'player-number', 'unsent-number']">
            {{ number }}
          </div>
        </div>
      </div>
      <div id="player-number-container" :class="{'sent-container': selectedId >= 0 && selectedId < playerNumbers.length, 'player-number-display': true}">
        <div v-if="selectedId >= 0 && selectedId < playerNumbers.length" v-for="number in playerNumbers[selectedId][0]" :class="['number-'+number, 'player-number']">
          {{ number }}
        </div>
      </div>
      <div id="player-numbers-before">
        <div v-for="([numbers, nid], index) in playerNumbers.slice(selectedId + 1)" :key="nid" :class="{'list-numbers-container': true}">
          <div v-for="number in numbers" :class="['number-'+number, 'player-number',  'unsent-number']">
            {{ number }}
          </div>
        </div>
      </div>
      <div id="gradient-after"></div>
    </div>
    
  </div>
  <div v-if="canInputNumbers" id="input-container">
    <div id="input-main">
      <div class="input-space"></div>
      <div id="input-numbers-container">
        <div class="input-number-line">
          <div class="input-button" @click="numberPressed(1)">1</div>
          <div class="input-button" @click="numberPressed(2)">2</div>
          <div class="input-button" @click="numberPressed(3)">3</div>
        </div>
        <div class="input-number-line">
          <div class="input-button" @click="numberPressed(4)">4</div>
          <div class="input-button" @click="numberPressed(5)">5</div>
          <div class="input-button" @click="numberPressed(6)">6</div>
        </div>
        <div class="input-number-line">
          <div class="input-button" @click="numberPressed(7)">7</div>
          <div class="input-button" @click="numberPressed(8)">8</div>
          <div class="input-button" @click="numberPressed(9)">9</div>
        </div>
      </div>
      <div class="input-space">
        <div class="input-button" @click="deletePressed()">⌫</div>
      </div>
    </div>
    <div id="send-button" class="input-button" @click="sendPressed()" :class="{'send-disabled': !canSendNumbers}">✓</div>
  </div>
</template>

<script>
import socket from '@/socket.js'


export default {
  data() {
    return {
      socket: socket,
      isMod: this.$route.query.role === 'mod',
      isScreen: this.$route.query.role === 'screen',
      isMusician: this.$route.query.role === 'musician',
      url: '',
      currentNumbers: [],
      numbersLocked: false,
      playerNumbers: [],
      selectedId: -1,
      isLocked: false,
    }
  },

  beforeMount() {
  },

  mounted() {
    this.url = window.location.protocol + '//' + window.location.host + window.location.pathname

    this.socket.on('connect', this.connect);
    this.socket.on('new state', this.setState);
    this.socket.on('new display state', this.newDisplayState);
    if (!this.canInputNumbers)
      this.numbersLocked = true;
    
    this.socket.emit('join', (state) => {
      this.setState(state);
    });
  },

  beforeUnmount() {
  },

  computed: {
    numberClassObject() {
      return {
        'player-number': true,
        'unsent-number': !this.numbersLocked,
      }
    },
    canInputNumbers() {
      return !this.isMod && !this.isScreen && !this.isMusician;
    },
    canSendNumbers() {
      return this.currentNumbers.length > 1 && !this.numbersLocked && !this.isLocked;
    }
  },

  methods: {
    connect() {
      console.log('connected')
    },
    offerReset() {
      if (confirm('Are you sure you want to reset everything?')) {
        this.sendReset()
      }
    },
    sendReset() {
      this.socket.emit('send reset')
    },
    setState(newState) {
      this.isLocked = newState.isLocked;
    },
    numberPressed(n)
    {
      if (!this.isLocked && !this.numbersLocked && this.currentNumbers.length < 10) {
        this.currentNumbers.push(n);
      }
    },
    deletePressed()
    {
      if (!this.numbersLocked)
        this.currentNumbers.pop();
    },
    sendPressed()
    {
      if (this.isLocked) {
        this.currentNumbers = [];
        return;
      }

      if (this.currentNumbers.length < 2)
        return; // TODO ask for more numbers
      this.socket.emit('send numbers', this.currentNumbers);
      this.numbersLocked = true;

      setTimeout(this.clearNumbers, 1300)
    },
    clearNumbers()
    {
      this.numbersLocked = false;
      this.currentNumbers = [];
    },
    newDisplayState(newDisplayState)
    {
      this.playerNumbers = newDisplayState.playerNumbers;
      this.selectedId = newDisplayState.selectedNumber;
    },
    selectNumber(delta)
    {
      this.selectedId = (this.selectedId + delta) % this.playerNumbers.length;
      if (this.selectedId < 0) this.selectedId += this.playerNumbers.length - 1;

      this.socket.emit("select number", this.selectedId);
    }
  },
}
</script>

<style scoped>
#title-screen {
  z-index: 1;
  position:relative;
  top:0;
  font-size: 2.5rem;
      line-height: 1.3;
          font-family: 'Noto Sans TC', sans-serif;
}
  #container {
    min-width: 10em;
    font-family: 'Noto Sans TC', sans-serif;
    /* max-width: 18em; */
    line-height: 1.3;

    font-size: 1.2rem;
    padding: 0.5em 0.5em 1em;
  }
  #display {
    align-items: center;
    width: 100vw;
    position: absolute;
    left: 0;
    display: flex;
    justify-content: center;
  }
  #player-number-container {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-shrink: 1;
    align-items: start;
    justify-content: center;

    background-color: #AACCFF;
    border-radius: 1rem;
    padding-left: 1em;
    padding-right: 1em;
    transition: all 0.3s;
    height: 3.65rem;
  }
  #player-number-container.player-number-display {
    position: fixed;
    width: min-content;
    bottom: calc(50vh - 4rem - 4rem);
  }
  #gradient-after {
    position: fixed;
    bottom: calc(50vh);
    height: 50vh;
    width: 100vh;
    background: #F3F3F3;
    background: linear-gradient(0deg,rgba(243, 243, 243, 0) 0%, rgba(243, 243, 243, 1) 100%);
  }
  #player-numbers-after {
    display: flex;
    flex-direction: column;
    align-items: end;
    justify-content: center;
    position: fixed;
    bottom: calc(50vh);
    margin: auto;
  }
  #player-numbers-before {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    position: fixed;
    top: calc(50vh + 4rem + 4rem);
    margin: auto;
  }
  .list-numbers-container {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-shrink: 1;
    align-items: start;
    justify-content: center;

    background-color: rgba(1,1,1,0);
    border-radius: 1rem;
    padding-left: 1em;
    padding-right: 1em;
    height: 3.65rem;
    margin-top: 0;
  }
  #player-numbers-before>.list-numbers-container:first-child {
    animation: before-become-first 0.69s forwards;
  }
  @keyframes before-become-first {
    from {
      margin-top: 3.65rem;
    }
    to {
      margin-top: 0;
    }
  }
  #player-numbers-after>.list-numbers-container:last-child {
    animation: after-become-first 0.69s forwards;
  }
  @keyframes after-become-first {
    from {
      margin-bottom: -3.65rem;
    }
    to {
      margin-bottom: 0;
    }
  }

  .player-number {
    display: flex;
    font-size: 2rem;
    font-weight: bold;
    padding: 0.5rem;
    position: relative;
    transition: all 0.3s;
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
    justify-content: center;
  }
  #input-main {
    flex-direction: row;
    display: flex;
  }
  #number-list {
    flex-direction: column-reverse;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .input-button {
    transition: all 0.2s;
    border-radius: 1rem;
    background-color: white;
    box-shadow: 0.25rem 0.25rem rgba(0,0,0,0.5);
    aspect-ratio: 1;
    width: 8vh;
    text-align: center;
    font-size: 6vh;
    margin: 0.5rem;
    transform: scale(1);
  }
  .input-button:active {
    box-shadow: 0rem 0rem rgba(0,0,0,0.5);
    transform: scale(0.87);
    background-color: #AACCFF;
  }
  #send-button {
    background-color: lightgreen;
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
  #input-numbers-container {
    display: flex;
    flex-direction: column-reverse;
  }

  .number-1 {
    top: 88%;
  }
  .number-2 {
    top: 77%;
  }
  .number-3 {
    top: 66%;
  }
  .number-4 {
    top: 55%;
  }
  .number-5 {
    top: 44%;
  }
  .number-6 {
    top: 33%;
  }
  .number-7 {
    top: 22%;
  }
  .number-8 {
    top: 11%;
  }
  .number-9 {
    top: 0%;
  }

  .player-number.unsent-number {
    top: 0%;
  }
  #player-number-container.sent-container {
    height: 7rem;
    padding-bottom: 2.75rem;
    transition: all 0.3s;
    background-color: lightgreen;
  }
  .list-numbers-container.sent-container {
    height: 7rem;
    padding-bottom: 2.75rem;
    background-color: lightgreen;
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
    position: relative;
    float: left;
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
