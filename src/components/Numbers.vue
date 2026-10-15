<template>
  <div id="container">
    <h1 id="title">
      Numbers
    </h1>
    <div id="player-number-container" :class="{'sent-container': numbersSent}">
      <div v-for="number in currentNumbers" :class="['number-'+number, numberClassObject]">
        {{ number }}
      </div>
    </div>
  </div>
  <div id="input-container">
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
        <div class="input-button" @click="deletePressed()">␡</div>
      </div>
    </div>
    <div class="input-button" @click="sendPressed()">✓</div>
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
      url: '',
      currentNumbers: [],
      numbersSent: false,
    }
  },

  beforeMount() {
  },

  mounted() {
    this.url = window.location.protocol + '//' + window.location.host + window.location.pathname

    this.socket.on('connect', this.connect)
    this.socket.on('new state', this.setState)
    this.socket.emit('join', (state) => {
      this.setState(state);
    })
  },

  beforeUnmount() {
  },

  computed: {
    numberClassObject() {
      return {
        'player-number': true,
        'unsent-number': !this.numbersSent,
      }
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
      let gameState = newState.choices[newState.game];
      
    },
    numberPressed(n)
    {
      if (this.currentNumbers.length < 10) {
        this.currentNumbers.push(n);
        this.numbersSent = false;
      }
    },
    deletePressed()
    {
      this.currentNumbers.pop();
      this.numbersSent = false;
    },
    sendPressed()
    {
      this.socket.emit('send numbers', this.currentNumbers);
      this.numbersSent = true;
    }
  },
}
</script>

<style>
  #container {
    min-width: 10em;
    font-family: 'Noto Sans TC', sans-serif;
    /* max-width: 18em; */
    line-height: 1.3;

    font-size: 1.2rem;
    padding: 0.5em 0.5em 1em;
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
    height: 10rem;
    padding-bottom: 2.75rem;
    transition: all 0.3s;
    background-color: lightgreen;
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
