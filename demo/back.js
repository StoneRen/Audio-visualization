var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");
var WIDTH = 1200;
HEIGHT = 200;

var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();
var source = audioCtx.createBufferSource();

function load(res, cb) {
  var request = new XMLHttpRequest();

  request.open('GET', res);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    var data = request.response;

    // 下面这句话还会浪费比较多的时间
    audioCtx.decodeAudioData(data, function(buffer) {
      source.buffer = buffer;

      if (cb) cb()
    })

  }

  request.send();
}

/**
load(res, function() {
  source.connect(analyser)
  analyser.connect(audioCtx.destination)
  source.start();
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  //draw();
  //drawAlt();
})
/*/

// https://segmentfault.com/a/1190000003115198
// https://developer.mozilla.org/zh-CN/docs/Web/API/AnalyserNode
// 一个无符号长整形(unsigned long)的值, 用于确定频域的 FFT (快速傅里叶变换) 的大小.
analyser.fftSize = 2048;
var bufferLength = analyser.fftSize;
var dataArray = new Uint8Array(bufferLength);

function draw() {
  analyser.getByteTimeDomainData(dataArray);

  canvasCtx.fillStyle = 'rgb(200, 200, 200)';
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

  var sliceWidth = WIDTH * 1.0 / bufferLength;
  var x = 0;
  var sum = 0;
  var average = 0;
  canvasCtx.beginPath();
  for (var i = 0; i < bufferLength; i++) {
    var v = dataArray[i] / 128.0;
    var y = v * HEIGHT / 2;

    sum += dataArray[i];

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }
  average = sum / bufferLength;
  canvasCtx.lineWidth = average / 64;

  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();

  if (source.buffer && audioCtx.currentTime < source.buffer.duration + 3) {
    drawVisual = requestAnimationFrame(draw);
  }
};
