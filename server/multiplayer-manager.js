let wordList = require('./fei-words.js')
let pathWords = require('./path-words.js')

let state = {
  // Player

  game: 'YenTing',

  // FillingIn
  blankList: new Array(wordList.length),
  isLocked: false,

  // Raven
  ravenState: 'intro',
  pathState: 'half',
  votesRaven: {
    Piano: 0,
    Guitar: 0,
    /*Bass: 0,*/
    Drums: 0
  },
  // Voting
  votes: [],
  votesDisplay: [],
  votingState: 'intro',

  // Choices
  choices: {
    'ChoicesPath': {
      openedBy: new Array(pathWords.length * 2),
      choices: new Array(pathWords.length * 2)
    }
  },

  // Order
  orderEnglishWords: true,
}

let displayState = {
  // Numbers
  playerNumbers: new Array(),
  selectedNumber: -1,

  // Order
  orderedSentences: new Array(),

  // Love
  loveLetters: new Array(),
  loveLetterId: -1,
  loveLettersSeen: 0,
}

let votesSets = {
  'leader': [
    'YenTing 妍婷',
    'HsinWei 忻薇',
    'DongDong 東東'
  ],
  'length': [
    'Long note 長音',
    'Short note 短音'
  ],
  'loudness': [
    'Strong 強',
    'Soft 弱'
  ],
  'pitch': [
    'High 高',
    'Low 低'
  ],
  'mood': [
    'Action 動',
    'Zen 靜'
  ]
};

for (let i = 0; i < pathWords.length; ++i) {
  state.choices.ChoicesPath.choices[i * 2] = 0;
  state.choices.ChoicesPath.choices[i * 2 + 1] = -1;
}

function resetState() {
  console.log('RESET');

  state.blankList = new Array(wordList.length)
  state.isLocked = false

  state.ravenState = 'intro'
  state.votesRaven = {
    Piano: 0,
    Guitar: 0,
    Bass: 0,
    Drums: 0,
  }

  state.votes = [];
  state.votesDisplay = [];
  state.votingState = 'intro';

  state.choices.ChoicesPath.choices = new Array(pathWords.length * 2);
  state.choices.ChoicesPath.openedBy = new Array(pathWords.length * 2);
  for (let i = 0; i < pathWords.length; ++i) {
    state.choices.ChoicesPath.choices[i * 2] = 0;
    state.choices.ChoicesPath.choices[i * 2 + 1] = -1;
  }
  state.pathState = 'half';

  // Display
  displayState.playerNumbers = new Array();
  displayState.selectedNumber = -1;

  displayState.orderedSentences = new Array();

  displayState.loveLetters = new Array();
  displayState.loveLetterId = -1;
  displayState.loveLettersSeen = 0;
}


let io = null;

module.exports = function(socketInstance) {
  io = socketInstance

  async function resetIfNoConnections() {
    const sockets = await io.fetchSockets();

    if (sockets.length == 0) {
      console.log("no sockets alive, resetting and sleeping...");
      resetState();

      // hard reset stuff
      state.game = 'YenTing';
      state.orderEnglishWords = true;
    }
  }

  socketInstance.on('connection', (socket) => {
    console.log('HELLO ', socket.id)

    function closeWordSelector() {
      let index = state.blankList.indexOf(socket.id)

      if (index === -1) {
        return
      }

      while (index !== -1) {
        state.blankList[index] = null
        index = state.blankList.indexOf(socket.id)
      }

      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    }

    function closeWordChoice() {
      let gameState = state.choices[state.game];
      if (gameState === undefined) {
        console.warn("closing a word choice on a game without choices");
        return;
      }
      let index = gameState.openedBy.indexOf(socket.id);

      if (index === -1)
        return;

      while (index !== -1) {
        gameState.openedBy[index] = null;
        index = gameState.openedBy.indexOf(socket.id);
      }

      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    }

    socket.on('join', () => {
      socket.emit('new state', state)
      if (socket.rooms.has('display channel'))
        socket.emit('new display state', displayState)
    })

    socket.on('report role', (role) => {
      if (role == 'mod' || role == 'screen' || role == 'musician')
        socket.join('display channel');
    })

    socket.on('send reset', () => {
      resetState();

      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
      io.to('display channel').emit('new display state', displayState)
      io.emit('reset local')
    })

    socket.on('change order language', () => {
      state.orderEnglishWords = !state.orderEnglishWords;
      
      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    })

    socket.on('allow new order', () => {
      socket.emit('allow new order');
      socket.broadcast.emit('allow new order');
    })

    socket.on('allow new letter', () => {
      socket.emit('allow new letter');
      socket.broadcast.emit('allow new letter');
    })

    socket.on('open word selector', (i) => {
      if (state.blankList.indexOf(socket.id) > -1) {
        closeWordSelector()
      }

      state.blankList[i] = socket.id

      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    })

    socket.on('close word selector', closeWordSelector)

    socket.on('open word choice', (i) => {
      let gameState = state.choices[state.game];
      if (gameState === undefined)
        return;

      if (gameState.openedBy.indexOf(socket.id) > -1)
        closeWordChoice();

      gameState.openedBy[i] = socket.id;

      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    });

    socket.on('close word choice', closeWordChoice);

    socket.on('send numbers', (n) => {
      let maxNumbers = 32;

      if (displayState.playerNumbers.length > maxNumbers)
        displayState.playerNumbers.shift();

      let id = socket.id + Date.now();

      displayState.playerNumbers.push([n, id]);
      
      io.to('display channel').emit('new display state', displayState);
    });

    socket.on("select number", (n) => {
      if (isNaN(displayState.selectedNumber))
        displayState.selectedNumber = -1;
      if (!isNaN(n))
        displayState.selectedNumber = n;

      io.to('display channel').emit('new display state', displayState);
    })

    socket.on('send order', (sentence) => {
      displayState.orderedSentences.push(sentence);
      
      io.to('display channel').emit('new display state', displayState);
    });

    socket.on('send letter', (sentence) => {
      displayState.loveLetters.push(sentence);
      
      io.to('display channel').emit('new display state', displayState);
    });
    
    socket.on('visualize letter', (id, seenCount) => {
      displayState.loveLetterId = id;
      displayState.loveLettersSeen = seenCount;

      io.to('display channel').emit('new display state', displayState);
    });

    socket.on('change game', (game) => {
      console.log('GAME  ', socket.id)
      state.game = game
      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    })

    socket.on('lock state', () => {
      console.log('LOCK  ', socket.id)
      state.isLocked = true
      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    })

    socket.on('unlock state', () => {
      console.log('UNLOCK ', socket.id)
      state.isLocked = false
      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
    })

    socket.on('submit word', function (to,from,indexOfBlank, callback) {
      //console.log('WORD  ', socket.id, ': ', indexOfBlank, to, from)

      const word = to

      // make sure word is an actual word
      if (wordList.indexOf(word) == -1) {
        const err = { err: $`word ${word} does not exist in word list` }
        console.error(err)
        return callback(err)
      }

      // make sure word isn't already used
      if (state.blankList.indexOf(word) > -1) {
        const err = { err: 'word already in use' }
        console.error(err)
        return callback(err)
      }

      if (state.blankList[indexOfBlank] != socket.id)
      {
        const err = { err: 'socket does has not locked index' }
        console.error(err)
        return callback(err)
      }


      // mark word as used
      state.blankList[indexOfBlank] = word

      // free up word we changed from if it was used already
      const fromIndex = state.blankList.indexOf(from)
      if (fromIndex > -1) {
        state.blankList[fromIndex] = null
      }

      // tell everybody about the new selected word
      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
      return callback()
    })

    socket.on('submit words mod', function(words) {
      state.blankList = words;
      socket.emit('new state', state);
      socket.broadcast.emit('new state', state);
    })

    socket.on('submit choice', function (to, from, index, callback) {
      //console.log(`CHOICE for ${state.game}, by ${socket.id}, [${index}]:${from} => ${to}`);

      state.choices[state.game].choices[index] = to;

      // tell everybody about the new selected word
      socket.emit('new state', state)
      socket.broadcast.emit('new state', state)
      return callback()
    })

    socket.on('end round', function () {
      state.ravenState = 'results'
      io.emit('new state', state)
    })

    socket.on('end game', function() {
      state.ravenState = 'end'
      io.emit('new state', state)
    })

    socket.on('start round', function () {
      state.votesRaven = {
        Piano: 0,
        Guitar: 0,
        Bass: 0,
        Drums: 0,
      }

      state.ravenState = 'voting'

      io.emit('new state', state)
    })

    socket.on('toggle path state', function() {
      state.pathState = state.pathState != 'half'? 'half' : 'full';

      if (state.pathState == 'full')
      {
        for (let i = 0; i < state.choices["ChoicesPath"].choices.length; ++i)
        {
          if (i%2==0) {
            state.choices["ChoicesPath"].choices[i] = -1;
          }
        }
      }

      io.emit('new state', state)
    });

    socket.on('send vote raven', function (instrument) {
      state.votesRaven[instrument] += 1
      io.emit('new state', state)
    })

    socket.on('start vote', function (voteKinds) {

      let votes = new Array();
      let displays = new Array();

      for (let i = 0; i < voteKinds.length; ++i)
      {
        if (Object.hasOwn(votesSets, voteKinds[i]))
        {
          // console.log("has", voteKinds[i])
          let d = votesSets[voteKinds[i]];
          let v = new Array();
          for (let j = 0; j < d.length; ++j)
            v.push(0);
          votes.push(v)
          displays.push(d);
        }
      }
      
      state.votes = votes;
      state.votesDisplay = displays;
      state.votingState = 'voting';

      // console.log(voteKinds, votes);

      io.emit('new state', state)
    })

    socket.on('end vote', function () {
      state.votingState = 'results'
      io.emit('new state', state)
    })

    socket.on('send vote', function (id, chosen) {
      if (id >= 0 && id < state.votes.length && chosen >= 0 && chosen < state.votes[id].length)
      {
        state.votes[id][chosen] += 1
        io.emit('new state', state)
      }
    })

    socket.on('disconnect', function (fn) {
      closeWordSelector()
      closeWordChoice();
      console.log('BYE!  ', socket.id)
      
      resetIfNoConnections();
    })
  })
}
