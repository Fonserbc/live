<template>
  <div id="container">
    <h1 id="title">
      Writting Love
    </h1>
    <!-- <div v-if="canInputWords && languageChosen && !areWordsSent" id="explanation">
      Fill in the words in this love letter
    </div> -->
    <div v-if="canInputWords && !languageChosen" id="language-container">
      <div id="en-button" class="button" @click="chooseLanguage('en')">English</div>
      <div id="zh-button" class="button" @click="chooseLanguage('zh')">中文</div>
    </div>
    <div v-if="(canInputWords && areWordsSent) || (!canInputWords && sentLetter.length > 0)">
      <div align='left' class="sent-letter-container">
        {{ sentLetter }}
      </div>
      <div v-if="canInputWords" id="sent-info">Sent ✓</div>
    </div>

    <div v-if="canInputWords && !areWordsSent" id="letter-container">
      <p align='left' v-for="(line, index) in processedLines" :key="index" class="line">
        <span v-for="(subLine, id) in line" :key="id" class="sub-line-container">
          <span v-if="!Number.isInteger(subLine)" class="sub-line">{{ subLine }}</span>
          <input :id="'input-'+subLine" v-if="Number.isInteger(subLine)" class="blank-input" v-model="writtenWords[subLine]" />
        </span>
        <p v-if="index==0 || index == processedLines.length-2"><br></p>
      </p>
    </div>
    
    <div align='left' v-if="!canInputWords && loveLetterId >= 0 && loveLetters.length > 0" class="sent-letter-container" >
      {{loveLetters[loveLetterId%loveLetters.length]}}
    </div>
    <div id="open-letter-button" v-if="!canInputWords && loveLetters.length > 0" :class="{'button': true, 'disabled': unseenLetterCount == 0 || !isMod}" @click="showNextLetter()">
      Open letter
      <div v-if="unseenLetterCount > 0" id="letters-count"><div>{{ unseenLetterCount }}</div></div>
    </div>
    <div v-if="canInputWords && !areWordsSent && languageChosen" id="input-container">
      <div id="send-button" class="input-button" @click="sendPressed()" :class="{'button': true, 'send-disabled': !canSendLetter}">Send</div>
    </div>
  </div>
  
</template>

<script>
import socket from '@/socket.js'

const wordsEn = [
  "Dear ＿,",

  "＿ in the ＿ reminds me of you.",
  "＿ speaks of you, and your ＿ is everywhere.",
  "I'll never forget the way ＿ start ＿ when you're around",
  "Your favorite ＿ is what I'll ＿,",
  "as the ＿ gets ＿ when you're gone.",

  "Sincerely, ＿."
];

const wordsZh = [
  "親愛的＿，",

  "＿的＿讓我想到你。",
  "你的＿無所不在，連＿也變得＿。",
  "請別忘了我們一起＿的＿。",
  "為了你最愛的＿，我會永遠＿。",

  "愛你的＿"
];

// Only send one sentence per player once

export default {
  data() {
    return {
      socket: socket,
      isMod: this.$route.query.role === 'mod',
      isScreen: this.$route.query.role === 'screen',
      isMusician: this.$route.query.role === 'musician',
      areWordsSent: false,
      lang: '',
      processedLines: [],
      writtenWords: [],
      sentLetter: "",
      loveLetters: [],
      loveLetterId: -1,
      loveLettersSeen: 0,
    }
  },

  beforeMount() {
    this.init();
  },

  mounted() {
    // this.socket.on('connect', this.connect);
    // this.socket.on('new state', this.setState);
    // this.socket.emit('join', (state) => {
    //   this.setState(state);
    // });
    this.socket.on('new display state', this.newDisplayState);
    this.socket.on('reset local', this.resetLocal);
  },

  beforeUnmount() {
  },

  computed: {
    canInputWords() {
      return !this.isMod && !this.isScreen && !this.isMusician;
    },
    canSendLetter() {
      let allWritten = this.writtenWords.length > 0;
      for (let i = 0; allWritten && i < this.writtenWords.length; ++i)
        allWritten = this.writtenWords[i].trim().length > 0;
      return allWritten && !this.areWordsSent;
    },
    languageChosen() {
      return this.lang != '';
    },
    unseenLetterCount() {
      return this.loveLetters.length - this.loveLettersSeen;
    }
  },

  methods: {
    init() {
        this.areWordsSent = false;
        this.lang = '';
        this.processedLines = [];
        this.writtenWords = [];
        this.sentLetter = "";
        this.loveLettersSeen = 0;
        this.loveLetterId = -1;
        this.loveLetters = [];
    },
    chooseLanguage(lg)
    {
      this.lang = lg;

      let words = lg == "en"? wordsEn : wordsZh;
      this.processedLines = [];
      this.writtenWords = [];
      for (let i = 0; i < words.length; ++i)
      {
        let processedLine = [];
        let line = words[i];
        let lineBlanks = [];
        for (let j = 0; j < line.length; ++j)
          if (line[j] == '＿') lineBlanks.push(j);
        
        let startIndex = 0;
        for (let b = 0; b < lineBlanks.length; ++b)
        {
          let beforeBlank = line.substring(startIndex, lineBlanks[b]);
          processedLine.push(beforeBlank);
          processedLine.push(this.writtenWords.length); // a number is a blank
          startIndex = lineBlanks[b] + 1;
          this.writtenWords.push("");
        }
        if (startIndex < line.length) {
          processedLine.push(line.substring(startIndex));
        }
        
        this.processedLines.push(processedLine);
      }
    },
    resetLocal() {
      this.init();
    },
    sendPressed()
    {
      if (!this.canSendLetter || !this.canInputWords)
        return;

      let s = "";
      for (let i = 0; i < this.processedLines.length; ++i) {
        let line = this.processedLines[i];
        for (let j = 0; j < line.length; ++j) {
          if (Number.isInteger(line[j]))
            s += this.writtenWords[line[j]].trim();
          else s += line[j];
        }
        s += "\n";
        if (i == 0 || i == this.processedLines.length - 2)
          s += "\n";
      }

      if (confirm(`send letter?`))
      {
        this.socket.emit('send letter', s);
        this.areWordsSent = true;
        this.sentLetter = s;
      }
    },
    newDisplayState(newDisplayState)
    {
      this.loveLetters = newDisplayState.loveLetters;
      this.loveLetterId = newDisplayState.loveLetterId;
      this.loveLettersSeen = newDisplayState.loveLettersSeen;
    },
    showNextLetter() {
      if (this.isMod)
      {
        if (this.loveLetterId < this.loveLetters.length - 1) {
          this.loveLetterId ++;
          this.loveLettersSeen ++;
          socket.emit('visualize letter', this.loveLetterId, this.loveLettersSeen);
        }
      }
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

    font-size: 1.5rem;
    padding: 0.5em 0.5em 1em;
    text-align: center;
  }
  h1 {
    text-align: center;
  }
  #input-container {
    width: 100%;
    /* background-color: gray; */
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
  #language-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 2rem;
  }
  #en-button {
    margin-bottom: 2rem;
  }
  #letter-container {
    justify-content: left;
    align-items: left;
    margin-top: 2rem;
    font-size: 1.5rem;
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
  .line {
    display: block;
    margin-top: 0.5rem;
  }
  .line>span {
    display: inline-block;
    white-space-collapse: preserve;
  }
  input {
    field-sizing: content;
    min-width: 5rem;
    
    font-family: 'Noto Sans TC', sans-serif;
    /* max-width: 18em; */
    line-height: 1;
    font-size: 1.5rem;

    padding-left: 0.25rem;
    padding-right: 0.25rem;
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
    border-radius: 0.5rem;
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
  .sent-letter-container {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    align-items: left;
    white-space: pre;
    margin-bottom: 2rem;
  }
  .sent-word {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }
  #letters-count {
    width: 2rem;
    height: 2rem;
    position: absolute;
    top: -1rem;
    right: -1rem;
    border-radius: 1rem;
    background-color: #e53636;
    color: white;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-size: 1rem;
    display: flex;
  }
  #open-letter-button {
    margin: auto;
    display: inline-block;
    margin-top: 2rem;
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
