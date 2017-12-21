var fftSize = Math.pow(2, 10);
var bufferData = new Uint8Array(fftSize);
var WIDTH = 0;
var HEIGHT = 200;

function loadRes(res, cb) {
  var request = new XMLHttpRequest();

  request.open('GET', res);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    if (cb) cb(request.response)
  }
  // onerror
  request.send();

}

var app = new Vue({
  el: '#app',
  data: {
    canvasCtx: null,
    audioCtx: null,
    audioAnalyser: null,
    audioGainNode: null,
    audioSource: null,
    average: 0,
    audioDuraiton: 0,
    startTimeAt: 0,
    playText: '播放',
    volume: 40,
    isPlaying: false,
    audioBufferArray: null,
    seen: false,
    res: 'res/huashi.mp3',
    status: 'ready',
    currentTime: 0,
    resList: [{
      name: '功夫',
      src: 'res/kungfu.mp3'
    }, {
      name: '枫叶城',
      src: 'res/fengyecheng.mp3'
    }, {
      name: '花市',
      src: 'res/huashi.mp3'
    }, {
      name: '未闻花名',
      src: 'res/wwhm.mp3'
    }]
  },
  computed: {
    progress: function() {
      return this.currentTime / this.audioDuraiton * 100;
    }
  },
  filters: {
    fixed(val, num) {
      var val2 = parseFloat(val);
      var num = typeof num != "undefined" ? num : 2;

      if (val != NaN) {
        return val2.toFixed(num);
      } else {
        return 0;
      }
    }
  },
  methods: {
    init() {
      this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
      this.audioAnalyser = this.audioCtx.createAnalyser();
      this.audioGainNode = this.audioCtx.createGain();

      this.audioAnalyser.fftSize = fftSize;
      var canvas = document.querySelector('#canvas');
      this.canvasCtx = canvas.getContext("2d");
      resize();
    },
    setRes(res) {
      if (!this.isPlaying) {
        this.res = res;
        this.play();
      }
    },
    load(event, cb) {
      var self = this;
      self.seen = false;
      self.currentTime = 0;
      self.audioSource = self.audioCtx.createBufferSource();
      loadRes(self.res, function(audioData) {
        self.audioCtx.decodeAudioData(audioData, function(buffer) {
          self.audioSource.buffer = buffer;
          self.status = 'loaded';
          self.seen = true;

          self.audioDuraiton = buffer.duration;
          if (cb) cb();
          // TODO: onerror
        })
      })
    },
    play() {
      function _play(vm) {
        vm.status = 'playing'
        vm.isPlaying = true;
        vm.audioSource.connect(vm.audioGainNode)
        vm.audioGainNode.connect(vm.audioCtx.destination);

        vm.audioSource.connect(vm.audioAnalyser);
        vm.audioAnalyser.connect(vm.audioCtx.destination);

        if (vm.startTimeAt) {
          vm.startTimeAt = vm.audioCtx.currentTime - vm.startTimeAt;
        } else {
          vm.startTimeAt = vm.audioCtx.currentTime;
        }

        vm.audioSource.start(vm.startTimeAt);
        vm.process();
      }

      var vm = this;
      this.load(null, function() {
        _play(vm);
      });
    },
    process() {
      this.currentTime = this.audioCtx.currentTime - this.startTimeAt;

      if (this.currentTime > this.audioDuraiton) {
        this.isPlaying = false;
        this.status = 'end'
        this.currentTime = 0;
        this.startTimeAt = 0;
      }

      if (this.isPlaying) {
        this.audioGainNode.gain.value = this.volume / 100;
        this.audioAnalyser.getByteTimeDomainData(bufferData)
        this.draw();
        requestAnimationFrame(this.process)
      }
    },
    draw() {
      var canvasCtx = this.canvasCtx;

      canvasCtx.fillStyle = 'rgb(33, 33,33)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var sliceWidth = WIDTH * 1.0 / fftSize;
      var x = 0;
      var sum = 0;
      var average = 0;
      canvasCtx.beginPath();
      for (var i = 0; i < fftSize; i++) {
        var v = bufferData[i] / 128.0;
        var y = v * HEIGHT / 2;

        sum += bufferData[i];

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
          /**
          var circle = new Path2D();
          circle.moveTo(0, 0);
          canvasCtx.fillStyle = `rgb(255,255,255)`;
          circle.arc(x,y, y/64, 0, 2 * Math.PI);
          canvasCtx.fill(circle);
          /**/

        }

        x += sliceWidth;
      }
      /**/
      average = sum / fftSize;
      this.average = average;
      canvasCtx.strokeStyle = `rgb(255,255,255)`;
      canvasCtx.lineWidth = average / 64;
      canvasCtx.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx.stroke();
      /**/

    }
  },
  created: function() {
    this.init();
  }
})

window.onresize = resize;

function resize() {
  var canvas = document.querySelector('#canvas');

  var width = document.body.clientWidth;
  canvas.width = WIDTH = width;
  canvas.height = HEIGHT;
}
