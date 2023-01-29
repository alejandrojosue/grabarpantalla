const xhr = new XMLHttpRequest();
const navInfo = window.navigator.appVersion.toLowerCase();

const empezar = document.querySelector('.empezar');
const detener = document.querySelector('.detener');
const tiempo = document.querySelector('#tiempo');
const liveToast = document.querySelector('#liveToast');
const progresoDescarga = document.querySelector('#progresoDescarga');
const valorDescarga = document.querySelector('#valorDescarga');

const btnDescargar = document.createElement('a');

let tiempoInicio, duracion, isRecording = false,
    so = 'Sistema Operativo';

// DETERMINAR EL SISTEMA OP
function retornarSO() {
    if (navInfo.indexOf('win') != -1) {
        so = 'Windows';
    } else if (navInfo.indexOf('linux') != -1) {
        so = 'Linux';
    } else if (navInfo.indexOf('mac') != -1) {
        so = 'Macintosh';
    }
    return so
}

function getMobileOperatingSystem() {
    let userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Windows Phone debe ir primero porque su UA tambien contiene "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }
    return "desconocido";
}

// Tiempo transcurrido de grabación
const segundosATiempo = numeroDeSegundos => {
    let horas = Math.floor(numeroDeSegundos / 60 / 60);
    numeroDeSegundos -= horas * 60 * 60;
    let minutos = Math.floor(numeroDeSegundos / 60);
    numeroDeSegundos -= minutos * 60;
    numeroDeSegundos = parseInt(numeroDeSegundos);
    if (horas < 10) horas = "0" + horas;
    if (minutos < 10) minutos = "0" + minutos;
    if (numeroDeSegundos < 10) numeroDeSegundos = "0" + numeroDeSegundos;

    tiempo.innerHTML = `${horas}:${minutos}:${numeroDeSegundos}`;
};

// Ayudante para la duración; no ayuda en nada pero muestra algo informativo
const comenzarAContar = async() => {
    tiempoInicio = Date.now();
    setInterval(refrescar, 500);
};

const refrescar = () => {
        segundosATiempo((Date.now() - tiempoInicio) / 1000);
    }
    // ===Fin de tiempo transcurrido de grabacion===

//progress on transfers from the server to the client (downloads)
const updateProgress = (event) => {
    if (event.lengthComputable) {
        const percentComplete = parseInt((event.loaded / event.total) * 1000) / 10;
        progresoDescarga.value = percentComplete;
        valorDescarga.innerHTML = percentComplete + '%';
    } else {
        // Unable to compute progress information since the total size is unknown
    }
}

const transferComplete = () => {
    alert('Descargado!')
    clearInterval();
    liveToast.style.display = 'none';
}

const transferFailed = () => {
    console.warn("An error occurred while transferring the file.");
}

const transferCanceled = () => {
    console.warn("The transfer has been canceled by the user.");
}

xhr.addEventListener("progress", updateProgress);
xhr.addEventListener("load", transferComplete);
xhr.addEventListener("error", transferFailed);
xhr.addEventListener("abort", transferCanceled);

if (getMobileOperatingSystem() != 'desconocido') {
    detener.classList.add('ocultar');
    empezar.classList.add('ocultar');
    document.querySelector('.info').style.display = 'block';
    // if ('serviceWorker' in navigator);
} else {

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
        isRecording = true;
        window.grabadora = new MediaRecorder(bundleStream, { mimeType: 'video/webm; codecs=vp8,opus' });
        window.grabadora.ondataavailable = (e) => blobs.push(e.data);
        window.grabadora.start();
        window.grabadora.onstop = async() => {
            const blob = new Blob(blobs, { type: 'video/MP4' });
            const url = window.URL.createObjectURL(blob);
            xhr.open('get', url, true);
            xhr.send();
            btnDescargar.href = url;
            btnDescargar.download = `GRABACION_${new Date().getTime()}.mp4`;
            btnDescargar.click();
            btnDescargar.remove();
        };
        empezar.style.left = '-400px';
        comenzarAContar()
    }

    // evitar recargar sin guardar
    window.addEventListener('beforeunload', (e) => {
        if (isRecording) {
            e.preventDefault();
            e.returnValue = 'cualquier texto';
        }
    })

    empezar.addEventListener('click', empezarGrabacion);


    detener.addEventListener('click', () => {
        isRecording = false;
        liveToast.style.display = 'block';
        grabadora.stop()
    });

    if ('serviceWorker' in navigator) {

        navigator.serviceWorker.register('./sw.js')
            // .then(reg => console.log('Registro de SW exitoso', reg))
            .catch(err => console.warn('Error al tratar de registrar el sw', err))
    }
}