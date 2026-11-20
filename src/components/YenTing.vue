<template>
  <div>
    <canvas class="static" ref="canvas"></canvas>
    <h1 class="title-h1" v-if="lang === 'zh'">羅妍婷的多重選擇</h1>
    <h1 :class="{'title-h1':true,'is-screen':isScreen}">YenTing & Your Choices</h1>


    <p id="mod-message" v-if="!isMod && message.length > 0">{{ message }}</p>
    
    <p id="welcome" v-else>Welcome! {{lang == "zh"? "請等待指令" : "Please wait"}}...</p>

    <textarea v-if="isMod" v-model="message" placeholder="message" @change="setMessage()"></textarea>
    <details v-if="isMod" class="details">
      <summary>QR transform</summary>
      <input v-model.number="qrTransform.scale" @change="sentQrTransform()"/>
      <br>
      <input v-model.number="qrTransform.translate.x" @change="sentQrTransform()" />
      <input v-model.number="qrTransform.translate.y" @change="sentQrTransform()"/>
    </details>
  </div>
</template>

<script>
import socket from '@/socket.js'

export default {
  props: ['isMod', 'lang', 'socket', 'isScreen'],
  data() {
    return {
      canvas: null,
      ctx: null,
      width: null,
      height: null,
      message: "",
      qrTransform: {
        translate: {x:0, y:0},
        scale: 1,
      }
    }
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    
    this.socket.on('new state', this.setState)
    this.socket.emit('join',this.setState)
    this.socket.on('new display state', this.setDisplayState)

    // this.ctx = this.canvas.getContext('2d');
    // this.ctx.fillStyle = "#e6e6e6"
    // this.ctx.fillRect(0, 0, this.width, this.height);
    // this.setSize(this.canvas)


    //this.draw()

    // window.addEventListener('resize', this.setSize)
    // window.requestAnimationFrame(this.draw)
  },
  methods: {
    setState(state) {
      this.message = state.welcomeMessage;
    },
    setDisplayState(display) {
      this.qrTransform.scale = display.transform.qr.scale;
      this.qrTransform.translate.x = display.transform.qr.translate.x;
      this.qrTransform.translate.y = display.transform.qr.translate.y;
    },
    setMessage()
    {
      if (this.isMod)
      {
        socket.emit('mod message', this.message);
      }
    },
    sentQrTransform()
    {
      if (this.isMod)
      {
        socket.emit('qr transform', this.qrTransform);
      }
    },
    draw() {
      //const imageData = this.ctx.getImageData(0, 0, this.width, this.height)
      //this.ctx.fillRect(0, 0, this.width, this.height);
      const imageData = this.ctx.getImageData(0, 0, this.width, this.height)
      const data = imageData.data

      const contrast = 0.07
      for (let i = 0; i < data.length;) {
        const c = 255*(1 - contrast) + Math.random()*255*contrast
        data[i]     = c;
        data[i + 1] = c;
        data[i + 2] = c;

        i += 4 * Math.round(Math.random()*128);
      }
      this.ctx.putImageData(imageData, 0, 0);

      window.requestAnimationFrame(this.draw)
    },
    setSize() {
      this.width = window.innerWidth *   0.125;
      this.height = window.innerHeight * 0.125;
      this.canvas.width = this.width
      this.canvas.height = this.height
      this.ctx.fillStyle = "#e6e6e6"
      this.ctx.fillRect(0, 0, this.width, this.height);
    },
  },
}
</script>

<style>
.static {
  position: absolute;
  left: 0;
  top: 0;
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
  display: block;
  line-height: 0;
  padding: 0;
  margin: 0;
  z-index: -1;
}

#mod-message {
  font-size: 1.5rem;
  margin: 2em 0 2em 0;
  text-align: center;
  white-space: pre-line;
}


.title-h1 {
    margin: 2em;
    text-align: center;
    margin-bottom: 0em;
    font-size: 2.5em;
    margin-top: 1em;
}

.title-h1.is-screen {
  margin-top: 0em;
    font-size: 4em;
    white-space: nowrap;
}

h1 {
  font-family: 'Dahlia';
}

h2 {
  text-align: center;
  margin-bottom: 1em;
  font-size: 1.75em;
}

  #welcome {
    text-align: center;
    margin: 1.5em 0 1em 0;
    font-size: 1.75rem;
  }

  .details {
    z-index: 10;
    position: relative;
    background-color: green;
    padding: 1rem;
  }
</style>
