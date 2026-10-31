<template>
  <div>
    <canvas class="static" ref="canvas"></canvas>
    <h1 class="url">live.yentinglo.net</h1>


    <p id="mod-message" v-if="!isMod && message.length > 0">{{ message }}</p>
    
    <p id="welcome" v-else>Welcome! wait for YenTing...</p>

    <textarea v-if="isMod" v-model="message" placeholder="message" @change="setMessage()"></textarea>
  </div>
</template>

<script>
import socket from '@/socket.js'

export default {
  data() {
    return {
      socket: socket,
      canvas: null,
      ctx: null,
      width: null,
      height: null,
      isMod: this.$route.query.role === 'mod',
      message: "",
    }
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    
    this.socket.on('new state', this.setState)
    this.socket.emit('join',this.setState)

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
    setMessage()
    {
      if (this.isMod)
      {
        socket.emit('mod message', this.message);
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


.url {
    margin: 2em;
    text-align: center;
}

  #welcome {
    text-align: center;
    margin: 2em 0 2em 0;
  }
</style>
