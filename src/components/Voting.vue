<template>
  <div>
    <div class="mod-panel" v-if="isMod">
      <button @click="startVoting()" class="btn btn--mod">{{selectedVoting == ''? 'Select voting first..' : `Start ${selectedVoting} vote`}}</button>
      <select v-model="selectedVoting">
          <option disabled value="">Select..</option>
          <option>leader</option>
          <option>length</option>
          <option>loudness</option>
          <option>pitch</option>
          <option>mood</option>
          <option disabled value="">Multiple</option>
          <option>leader + length</option>
          <!-- <option>leader + loudness</option> -->
          <option>leader + pitch</option>
          <option>leader + mood</option>
          <option>length + loudness</option>
          <option>length + pitch</option>
          <option>length + mood</option>
          <option>loudness + pitch</option>
          <option>loudness + mood</option>
          <option>pitch + mood</option>
        </select>
        <button v-if="votingState === 'voting'" @click="confirmAction(endVoting, 'end voting round?')" class="btn btn--mod">End Vote</button>
    </div>
    <div id="content">
    <h1 id="title">
      Voting
    </h1>
    
    <div v-if="votingState=='results'" class="results">
      <div id="results-subtitle">Results:</div>
      <div class="results-flex">
        <div :class="['result-column', `column-${index}`]" v-for="(v, index) in orderedVotes">
          <div class="result" v-for="i in v.slice(0,1)">
            <div class="result-name"><strong>{{displays[index][i]}} </strong></div>
            <div class="result-votes">
            <svg width="31" height="28" viewBox="0 0 31 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.0562 5.67499L15.5 6.52989L15.9438 5.67499C17.1005 3.44663 19.2907 1.70064 21.6021 0.929149C23.9163 0.156704 26.2417 0.388316 27.7838 1.9284C31.4054 5.54518 31.4054 11.4089 27.7838 15.0257L15.5 27.2934L3.21616 15.0257C-0.405386 11.4089 -0.405386 5.54518 3.21616 1.9284C4.75827 0.388316 7.08371 0.156704 9.39794 0.929149C11.7093 1.70065 13.8995 3.44663 15.0562 5.67499Z" />
            </svg> &times; {{this.votes[index][i]}}
            </div>
          </div>
          <div class="result-rest" v-for="i in v.slice(1)">
            {{displays[index][i]}}
            <svg width="23" height="23" viewBox="0 0 31 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.0562 5.67499L15.5 6.52989L15.9438 5.67499C17.1005 3.44663 19.2907 1.70064 21.6021 0.929149C23.9163 0.156704 26.2417 0.388316 27.7838 1.9284C31.4054 5.54518 31.4054 11.4089 27.7838 15.0257L15.5 27.2934L3.21616 15.0257C-0.405386 11.4089 -0.405386 5.54518 3.21616 1.9284C4.75827 0.388316 7.08371 0.156704 9.39794 0.929149C11.7093 1.70065 13.8995 3.44663 15.0562 5.67499Z" />
            </svg> &times; {{this.votes[index][i]}}
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isScreen">
      <div v-if="votingState=='voting'" class="results-flex">
        <div v-for="(v, id) in votes" :class="['result-column', `column-${id}`]">
          <button v-for="(numVotes, index) in v" @click="triggerVote(id, index)" class="vote-btn">
            <span class="results-bg"></span>
            <span class="results-bar" :style="{ width: `${ numVotes / Math.max(totalVotes[id], 1) * 100 }%` }"></span>
            {{displays[id][index]}}
            <span class="vote-count">{{numVotes}}</span>
            <svg width="31" height="28" viewBox="0 0 31 28" fill="gray" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.0562 5.67499L15.5 6.52989L15.9438 5.67499C17.1005 3.44663 19.2907 1.70064 21.6021 0.929149C23.9163 0.156704 26.2417 0.388316 27.7838 1.9284C31.4054 5.54518 31.4054 11.4089 27.7838 15.0257L15.5 27.2934L3.21616 15.0257C-0.405386 11.4089 -0.405386 5.54518 3.21616 1.9284C4.75827 0.388316 7.08371 0.156704 9.39794 0.929149C11.7093 1.70065 13.8995 3.44663 15.0562 5.67499Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="isScreen" class="screen">
      <div v-if="votingState=='voting'" class="results-flex">
        <div v-for="(v, id) in orderedVotes" :class="['result-column', `column-${id}`]">
          <TransitionGroup name="list" tag="ul">
            <li v-for="item in v" :key="item" class="vote-btn">
              <span class="results-bg"></span>
              <span class="results-bar" :style="{ width: `${ votes[id][item] / Math.max(totalVotes[id], 1) * 100 }%` }"></span>
              {{displays[id][item]}}

              <span class="vote-count">{{votes[id][item]}}</span>
              <svg width="31" height="28" viewBox="0 0 31 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.0562 5.67499L15.5 6.52989L15.9438 5.67499C17.1005 3.44663 19.2907 1.70064 21.6021 0.929149C23.9163 0.156704 26.2417 0.388316 27.7838 1.9284C31.4054 5.54518 31.4054 11.4089 27.7838 15.0257L15.5 27.2934L3.21616 15.0257C-0.405386 11.4089 -0.405386 5.54518 3.21616 1.9284C4.75827 0.388316 7.08371 0.156704 9.39794 0.929149C11.7093 1.70065 13.8995 3.44663 15.0562 5.67499Z" />
              </svg>

            </li>
          </TransitionGroup>
        </div>
      </div>
    </div>
    </div>
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
      isLocked: false,
      url: '',

      votingState: 'intro',
      votes: [],
      displays: [],
      selectedVoting: '',

      // displayText: {
      //   Piano: "Piano 🎹",
      //   Guitar: "Guitar 🎸",
      //   Bass: "Bass 🎻",
      //   Drums: "Drums 🥁"
      // }
    }
  },

  computed: {
    totalVotes() {
      let tv = new Array();
      for (let i = 0; i < this.votes.length; ++i)
      {
        let num = 0;
        for (let j = 0; j < this.votes[i].length; ++j)
          num += this.votes[i][j];
        tv.push(num);
      }
      return tv;
    },
    orderedVotes() {
      let allOrderedVotes = new Array();
      for (let i = 0; i < this.votes.length; ++i)
      {
        let votesArray = new Array();
        for (let j = 0; j < this.votes[i].length; ++j)
          votesArray.push(j);
        
        let ordered = votesArray.sort((a, b) => { return this.votes[i][b] - this.votes[i][a] })
        allOrderedVotes.push(ordered);
      }

      return allOrderedVotes;
    }
  },

  mounted() {

    this.socket.on('new state', this.setState)
    this.socket.emit('join', this.setState)
  },

  beforeUnmount() {
  },

  methods: {
    connect() {
      console.log('connected')
    },
    triggerVote(votingId, chosenId) {
      this.socket.emit('send vote', votingId, chosenId)
    },
    setState(newState) {
      this.votes = newState.votes
      this.displays = newState.votesDisplay
      this.votingState = newState.votingState
    },
    startVoting() {
      if (this.selectedVoting != '')
      {
        let wannaVote = [];
        let vs = this.selectedVoting.split('+');
        vs.forEach((v) => {
          wannaVote.push(v.trim())
        });
        this.socket.emit('start vote', wannaVote);
      }
    },
    endVoting() {
      this.votingState = 'results';
      this.socket.emit('end vote');
    },
    confirmAction(cb, text) {
      if (confirm(text)) {
        cb();
      }
    }
  },
}
</script>

<style scoped>
#content {
  padding-top: 1rem;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}
#title {
  margin-bottom: 4rem;
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

.vote-btn {
  background: white;
  border-radius: 0 0 8px 8px;
  padding: 1.2em 1em 0.8em;
  width: 100%;
  display: block;
  margin: 1em 0;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);

  text-align: left;
  font-size: 1.3em;
  /* font-weight: bold; */

  touch-action: manipulation;

  display: flex;
  justify-content: space-between;

  position: relative;
}

.vote-count {
  font-weight: normal;
  margin-left: auto;
  margin-right: 0.5em;
  text-align: right;
  transition: all 0.2s;
}

.result-votes {
  text-wrap: nowrap;
}

.vote-btn:active .vote-count {
  transition: none;
 transform: translate3d(-20px, 0, 0);
}

.vote-btn svg {
  width: 1em;
  height: 1em;
  overflow: visible;
  z-index:1;
  position: relative;
  align-self: center;
}

.vote-btn svg path {
  transition: all 0.2s;
  fill: white;
 stroke: #C4C4C4;
 transform: scale(1);
 transform-origin: 50%;
}

.vote-btn:active svg path {
  transition: none;
  fill: red;
  stroke: red;
  transform: scale(3);
}

.result-rest svg path {
  transition: none;
  fill: #aaa;
  stroke: #aaa;
}
.result-rest {
  margin-top: 1rem;
}

.results-flex {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

#results-subtitle {
  font-size: 1.3rem;
  margin-bottom: 2rem;
}

.result-column {
  flex: 1 1 auto;
  padding-left: 1rem;
  padding-right: 1rem;
  width: 40vw;
  max-width: 20rem;
  min-width: 10rem;
}

.result-column:first-child:not(:last-child) {
  border-right: 2px dashed black;
}


.results-bar, .results-bg {
  position: absolute;
  background: green;
  display: block;
  height: 0.5em;
  width: 100%;
  top: 0;
  left: 0;
}

.column-1>button>.results-bar, .column-1>ul>li>.results-bar {
  background: blue;
}

.column-2>button>.results-bar, .column-2>ul>li>.results-bar {
  background: red;
}

.results-bg {
  background: #efefef;
}

.results {
  text-align: center;
}

.results svg {
  vertical-align: middle;
}
.result svg path {
  fill: red;
  stroke: red;
}

.result {
  padding: 1em;
  margin: 0.5em;

  border-radius: 8px;

  border: 1px solid #aaa;
  font-size: 1.5em;
  
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.2em 1em;
}

.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}

.screen {
  text-align: center;
  font-size: 1.3em;
}
.screen svg path {
  fill: red;
  stroke: red;
}
h1 {
    text-align: center;
}

.raven {
    image-rendering: pixelated;
    display: block;
    margin: auto;
}
</style>
