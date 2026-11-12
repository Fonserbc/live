<template>
  <div id="container">
    <h1 id="title" class="cursive-bold">
      Writing Love
    </h1>
    <!-- <div v-if="canInputWords && languageChosen && !areWordsSent" id="explanation">
      Fill in the words in this love letter
    </div> -->
    <div v-if="canInputWords && !languageChosen" id="language-container">
      <div id="en-button" class="button" @click="chooseLanguage('en')">English</div>
      <div id="zh-button" class="button" @click="chooseLanguage('zh')">中文</div>
    </div>
    <!-- Sent letter -->
    <div v-if="(canInputWords && areWordsSent) || (!canInputWords && sentLetter.length > 0)">
      <div align='left' class="sent-letter-container">
        {{ sentLetter }}
      </div>
      <div v-if="canInputWords" id="sent-info" class="cursive">Sent ✓</div>
    </div>

    <!-- Sending letter -->
    <div v-if="canInputWords && !areWordsSent" id="letter-container">
      <p align='left' v-for="(line, index) in processedLines" :key="index" class="line">
        <span v-for="(subLine, id) in line" :key="id" class="sub-line-container">
          <span v-if="!Number.isInteger(subLine)" class="sub-line">{{ subLine }}</span>
          <input :id="'input-'+subLine" v-if="Number.isInteger(subLine)" class="blank-input" v-model="writtenWords[subLine]" />
        </span>
        <p v-if="index==0 || index == processedLines.length-2"><br></p>
      </p>
    </div>
    <div v-if="canInputWords && !areWordsSent && languageChosen" id="input-container">
      <div id="send-button" class="input-button" @click="sendPressed()" :class="{'button': true, 'send-disabled': !canSendLetter}">Send</div>
    </div>

    <div id="description-noletters" v-if="isScreen" >
      {{lang == "zh"? "等待你的情詩..." : "Waiting for your love letters..."}}
    </div>
    <div id="description-noletters" v-if="false && (isYenTing || isMod)" >
      {{`Received ${loveLetters.length}, approved ${approvedLetters.length}`}}
    </div>
    
    <div align='left' v-if="(isYenTing || isMusician) && loveLetterId >= 0 && loveLetters.length > 0" class="sent-letter-container" >
      {{loveLetters[loveLetterId%loveLetters.length]}}
    </div>

    <div id="open-letter-button" v-if="isYenTing || isMod" :class="{'button': true, 'disabled': unseenLetterCount == 0}" @click="showNextLetter()">
      {{"Open next approved letter"}}
      <div v-if="unseenLetterCount > 0" id="letters-count"><div>{{ unseenLetterCount }}</div></div>
    </div>

    <div align='left' v-if="isYenTing && approvedLetters.length > 0" class="sent-letter-container preview" >
      <!-- <div style="margin-bottom: 1em; font-size: 0.8em;">Next one ({{ approvedLetters[0] }}): </div>       -->
      <div>{{loveLetters[approvedLetters[0]]}}</div>
    </div>

    <div v-if="isMod" v-for="(letter, index) in loveLetters" :key="index" :class="{'approval-container': true, 'hiding': approvalMap.has(index) && !approvalMap.get(index).show, 'approved': approvalMap.has(index) && approvalMap.get(index).approved,  'denied': approvalMap.has(index) && !approvalMap.get(index).approved }">
      <div :class="{'approval-id': true, 'seen': index == loveLetterId}" @click="toggleLetterShow(index)">{{ index == loveLetterId? "👁️" : index }}</div>
      <div align='left' v-if="!approvalMap.has(index) || approvalMap.get(index).show">{{ letter }}</div>
      <div class="approve-container"><div style="color: green" class="button" @click="approveLetter(index)">Approve</div><div style="color: red" class="button" @click="disproveLetter(index)">Don't approve</div></div>
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
  props: ['isMod', 'isYenTing', 'isScreen', 'isMusician', 'lang'],
  data() {
    return {
      socket: socket,
      areWordsSent: false,
      letterLanguage: '',
      processedLines: [],
      writtenWords: [],
      sentLetter: "",
      loveLetters: [],
      loveLetterId: 0,
      approvedLetters: [],
      approvalMap: new Map(),
    }
  },

  beforeMount() {
    this.init();
    this.newLetterAllowed();
  },

  mounted() {
    // this.socket.on('connect', this.connect);
    // this.socket.on('new state', this.setState);
    // this.socket.emit('join', (state) => {
    //   this.setState(state);
    // });
    this.socket.on('new display state', this.newDisplayState);
    this.socket.on('reset local', this.resetLocal);
    this.socket.on('allow new letter', this.newLetterAllowed);
    this.socket.emit('join', (state) => {
      this.setState(state);
    });
  },

  beforeUnmount() {
  },

  computed: {
    canInputWords() {
      return !this.isMod && !this.isScreen && !this.isMusician && !this.isYenTing;
    },
    canSendLetter() {
      let allWritten = this.writtenWords.length > 0;
      for (let i = 0; allWritten && i < this.writtenWords.length; ++i)
        allWritten = this.writtenWords[i].trim().length > 0;
      return allWritten && !this.areWordsSent;
    },
    languageChosen() {
      return this.letterLanguage != '';
    },
    unseenLetterCount() {
      return this.approvedLetters.length;
    },
    canReadLetters() {
      return this.isMod || this.isYenTing;
    }
  },

  methods: {
    init() {
        this.areWordsSent = false;
        this.letterLanguage = '';
        this.processedLines = [];
        this.writtenWords = [];
        this.sentLetter = "";
        this.loveLetterId = -1;
        this.loveLetters = [];
        this.approvedLetters = [];
    },
    chooseLanguage(lg)
    {
      this.letterLanguage = lg;

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
      this.newLetterAllowed();
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
      this.approvedLetters = newDisplayState.approvedLetters;
    },
    showNextLetter() {
      if (this.canReadLetters)
      {
        if (this.approvedLetters.length > 0) {
          this.loveLetterId = this.approvedLetters.shift();
          socket.emit('visualize letter', this.loveLetterId);
        }
      }
    },
    newLetterAllowed() {
      this.areWordsSent = false;
      this.processedLines = [];
      this.writtenWords = [];
      this.sentLetter = "";
      if (this.lang == 'en')
        this.chooseLanguage(this.lang);
      else this.letterLanguage = '';
    },
    toggleLetterShow(index) {
      if (this.approvalMap.has(index))
      { // Only do it if we have already decided on it
        let w = this.approvalMap.get(index);
        w.show = !w.show;
      }
    },
    approveLetter(index) {
      if (!this.approvalMap.has(index))
      {
        this.approvalMap.set(index, {show: false, approved: true})
        socket.emit('change approved letter', index, true);
      }
      else {
        let a = this.approvalMap.get(index);
        if (!a.approved) {
          a.approved = true;
          socket.emit('change approved letter', index, true);
        }
      }
    },
    disproveLetter(index) {
      if (!this.approvalMap.has(index))
      {
        this.approvalMap.set(index, {show: false, approved: false})
      }
      else {
        let a = this.approvalMap.get(index);
        a.approved = false;
      }
      socket.emit('change approved letter', index, false);
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
  #description-noletters {
    font-size: 1.75em;
  }
  h1 {
    margin-top: 2rem;
    text-align: center;
    font-size: 6rem;
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
    margin-bottom: 2rem;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    pointer-events: none;
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
    position: fixed;
    bottom: 2rem;
    margin-right: 1em;
    z-index: 1;
  }
  .approval-container {
    display: flex;
    flex-direction: column;
    gap: 1em;
    border: solid black 2px;
    padding: 0.5em;
    border-radius: 1em;
  }
  .approval-container.hiding {
    flex-direction: row;
    justify-content: space-between;
  }
  .approval-id {
    align-self: flex-start;
    border-radius: 1em;
    background-color: white;
    aspect-ratio: 1;
    cursor: pointer;
    width: 2rem;
  }
  .approval-id.seen {
    background-color: #7ad3ff;
  }
  .approval-container.approved {
    background-color: lightgreen;
  }
  .approval-container.denied {
    background-color: lightcoral;
  }
  .approve-container {
    display: flex;
    justify-content: center;
    gap: 1em;
    align-self: flex-end;
  }
  .approve-container>.button {
    font-size: 1em;
  }
  .preview {
    font-size: 0.8em;
    flex-direction: column;
  }
  .sent-letter-container.preview {
    margin-left: 1em;
  }

</style>
