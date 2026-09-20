<template>
  <span style="position: relative;">
    <!-- 

      sorry about how weirdly this is formatted.
      it's formatted this way in order to prevent whitespace
      between most of the tags which helps prevent some
      text from reflowing when the state changes.

    -->
    <span :class="classObject">
      <button v-if="!isLocked && !isBeingEdited" @click="openWordList" :class="{ 'word-present': choiceId >= 0 }">
        {{ word || underscores }}
      </button>
      <button @click="closeWordList" :class="{ 'word-present': choiceId >= 0}" v-else>
        {{ word || underscores }}
      </button>
    </span>
    <div v-if="isBeingEditedByMe" v-bind:class="['word-list', anchor ? `word-list--anchor-${anchor}` : null,]">
      <div v-bind:class="[lengthClass]">
        <button v-for="(choice, index) in choices" :key="index" @click="submitWord(index)">
          {{choice}}
        </button>
      </div>
    </div>
  </span>
</template>

<script>
export default {
  props: ['id', 'anchor', 'choices', 'openedBy', 'syncChoices', 'socket', 'isLocked', 'initialChoiceId'],
  setup(props) {
  },
  computed: {
    choiceId() {
      return this.syncChoices[this.id];
    },
    classObject () {
      return {
        'word-selector': true,
        'word-selector--is-being-edited': this.isBeingEdited,
        'word-selector--is-being-edited-by-me': this.isBeingEditedByMe,
      }
    },
    "underscores": function() {
      return "＿".repeat(parseInt(4, 10))
    },
    "openedBySocketId": function() {
      return this.openedBy[this.id]
    },
    isBeingEditedByMe: function() {
      return this.openedBySocketId === this.socket.id && typeof this.socket.id !== 'undefined'
    },
    isBeingEdited: function() {
      return !!this.openedBySocketId
    },
    word() {
      return this.choiceId < 0? "" : this.choices[this.choiceId]
    },
  },
  methods: {
    editBlank() {
    },
    openWordList() {
      this.isWordListOpen = true
      this.socket.emit('open word choice', this.id)
      this.$emit('open', this.id)
    },
    closeWordList() {
      this.isWordListOpen = false
      this.socket.emit('close word choice', this.id)
      this.$emit('close')
    },
    submitWord(index) {
      //const to = e.target.innerHTML
      const to = index;
      const from = this.choiceId;

      this.socket.emit('submit choice', to, from, this.id, (err) => {
        if (err) {
          // the server rejected it, so blankList (and this.word) is already
          // back to how it was - nothing to revert
          alert(err.err)
        }
      })
    },
  },
  data() {
    return {
      isWordListOpen: false,
      lengthClass: `word-group word-group--length-4`,//${this.length}`,
      wordListClass: 'word-list',
    }
  },
}
</script>

<style>
  button {
    display: inline-block;
    color: inherit;
  }

  .word-selector {
    position: relative;
    display: inline-block;
    opacity: 1;
    line-height: 1;
  }

  .word-present {
    color: #45818E;
  }

  @keyframes blink {
    from {
      transform: scale(0.9, 0.8);
      opacity: 1;
    }
    to {
      transform: scale(0.8, 1);
      opacity: 0.8;
    }
  }
  .word-selector--is-being-edited {
    background: #aaa;
    color: transparent;
    animation: blink 500ms infinite alternate;
    transform-origin: 50% 100%;
    position: relative;
  }
  .word-selector--is-being-edited:not(.word-selector--is-being-edited-by-me)::after {
    content: '🔒';
    color: black;
    font-size: 0.7em;
    filter: brightness(0);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate3d(-50%, -50%, 0);
    margin-top: -0.125em;
  }
  .word-selector--is-being-edited-by-me {
    background: #54f;
  }
  select, option {
    font-family: inherit;
    font-size: 1em;
  }
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    border: 0px;
    text-align: center;
    color: #000;
    background: white;
    border-radius: 7px;
    padding: 0 3px;
    margin: 0 3px;

  }
  button:disabled {
    color: inherit;
    opacity: 0.2;
  }
  select::-ms-expand {
    display: none;
  }
  option {
    -webkit-appearance: none;
    -moz-appearance: none;
    text-align: center;
    font-family: 'Noto Sans TC', sans-serif;
    background-color: transparent;
  }

  option[disabled] {
    color: #ddd;
  }


  .word-list {
    background: #FFFFFF;
    box-shadow: 0px 100px 80px rgba(0, 0, 0, 0.09), 0px 33.2436px 29.2013px rgba(0, 0, 0, 0.0696101), 0px 5.32773px 14.1767px rgba(0, 0, 0, 0.0500626), 0px -6.98175px 6.94968px rgba(0, 0, 0, 0.0313772), 0px -8.15691px 2.74791px rgba(0, 0, 0, 0.013912);
    border-radius: 7px;
    z-index: 1;
    position: absolute;
    top: 100%;
    left: 50%;
    margin-top: 0.1em;
    z-index: 1;
    transform: translate3d(-50%,0,0);
  }

  .word-list--anchor-left {
    left: 0;
    transform: none;
  }

  .word-list--anchor-right {
    left: auto;
    right: 0;
    transform: none;
  }

  .word-group {
    text-align: center;
  }
  .word-group {
  }
  .word-group--length-1 {
    width: 8.5em;
  }
  .word-group--length-2 {
    width: 11.5em;
    font-size: 0.9em;
  }
  .word-group--length-4 {
  }
  .word-group--length-1 button {
    width: 2em;
    height: 2.2em;
  }
  .word-group--length-2 button {
    width: 2.7em;
    height: 2.2em;
  }
  .word-group--length-4 button {
    width: 4.5em;
    height: 2.2em;
  }


</style>
