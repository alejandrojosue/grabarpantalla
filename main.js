let empezar = document.querySelector('.empezar');
let detener = document.querySelector('.detener');

const empezarGrabacion = async() => {

    const pantallaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    const usuarioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    if (pantallaStream.getAudioTracks().length) {
        console.log(pantallaStream.getAudioTracks().length);
        const fuente1 = context.createMediaStreamSource(pantallaStream);
        const f1Gain = context.createGain();
        f1Gain.gain.value = 1;
        fuente1.connect(f1Gain).connect(destination);
    }
    if (usuarioStream.getAudioTracks().length) {
        const fuente2 = context.createMediaStreamSource(usuarioStream)
        const f2Gain = context.createGain();
        f2Gain.gain.value = 1;
        fuente2.connect(f2Gain).connect(destination);
    }
    const tracks = [
        ...pantallaStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
    ];
    const bundleStream = new MediaStream(tracks);
    let blobs = []
    window.grabadora = new MediaRecorder(bundleStream, { mimeType: 'video/webm; codecs=vp8,opus' });
    window.grabadora.ondataavailable = (e) => blobs.push(e.data);
    window.grabadora.start();
    /* 2.6 */
    window.grabadora.onstop = async() => {
        const blob = new Blob(blobs, { type: 'video/MP4' });
        const btnDescargar = document.createElement('a');
        btnDescargar.href = window.URL.createObjectURL(blob);
        btnDescargar.download = `GRABACION_${new Date().getTime()}.mp4`;
        btnDescargar.click()
    };
    empezar.style.left = '-400px';
}

empezar.addEventListener('click', empezarGrabacion);


detener.addEventListener('click', () => {
    grabadora.stop()
});
