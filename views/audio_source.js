export async function getMicrophone(audioTag) {
  if (!navigator.mediaDevices) {
    throw new Error("web rtc not available");
  }
  try {
    var stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true },
    });

    return stream;
  } catch (e) {
    throw e;
  }
}
export async function getCam(videoTag, withVideo, withAudio) {
  if (!navigator.mediaDevices) {
    throw new Error("web rtc not available");
  }
  try {
    var stream = await navigator.mediaDevices.getUserMedia({
      video: withVideo,
      audio: withAudio,
    });
    videoTag.srcObject = stream;
    videoTag.oncanplay = (e) => {
      videoTag.controls = true;
      videoTag.autoplay = true;
      videoTag.muted = true;
      videoTag.play();
    };
    return stream;
  } catch (e) {
    throw e;
  }
}

export function random_noise(audioCtx) {
  // Create an empty three-second stereo buffer at the sample rate of the AudioContext
  var myArrayBuffer = audioCtx.createBuffer(
    2,
    audioCtx.sampleRate * 1,
    audioCtx.sampleRate
  );
  // Fill the buffer with white noise;
  //just random values between -1.0 and 1.0
  let m = 0;

  for (var channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
    // This gives us the actual ArrayBuffer that contains the data
    var nowBuffering = myArrayBuffer.getChannelData(channel);
    for (var i = 0; i < myArrayBuffer.length; i++) {
      if (i < 100) {
        m = i / 100;
      } else if (i < 111) {
        m = 1 - (0.2 * (111 - i)) / 111;
      } else {
        m = 0.8 - i / myArrayBuffer.length;
      }

      if (m > 1) throw new Exception("ssss");
      // Math.random() is in [0; 1.0]
      // audio needs to be in [-1.0; 1.0]
      if (~~(i / 2000) % 2 === 0 && channel == 0) nowBuffering[i] = 0;
      else nowBuffering[i] = Math.random() * m;
    }
  }
  var source = audioCtx.createBufferSource();
  source.start();
  source.loop = true;
  // set the buffer in the AudioBufferSourceNode
  source.buffer = myArrayBuffer;
  source.connect(audioCtx.destination);
  var streamer = audioCtx.createMediaStreamDestination();
  source.connect(streamer);
  return streamer.stream;
  //return source;
}
