const btnEmpezar = document.querySelector('.btnEmpezar')
const btnDetener = document.querySelector('.btnDetener')
const tiempo = document.querySelector('#tiempo')
const textLoader = document.querySelector('.textLoader')
const navInfo = window.navigator.appVersion.toLowerCase()
const ANCHO_PANTALLA = screen.width,
    ALTO_PANTALLA = screen.height,
    TIEMPO_DESCARGANDO_MS = 9000

let tiempoInicio,
    duracion,
    isRecording = false


let so = 'Sistema Operativo'

function retornarSO() {
    if (navInfo.indexOf('win') != -1) {
        so = 'Windows'
    } else if (navInfo.indexOf('linux') != -1) {
        so = 'Linux'
    } else if (navInfo.indexOf('mac') != -1) {
        so = 'Macintosh'
    }
    return so
}

function getMobileOperatingSystem() {
    let userAgent = navigator.userAgent || navigator.vendor || window.opera

    // Windows Phone debe ir primero porque su UA tambien contiene "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone"
    }

    if (/android/i.test(userAgent)) {
        return "Android"
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS"
    }
    return "desconocido"
}

const segundosATiempo = numeroDeSegundos => {
    let horas = Math.floor(numeroDeSegundos / 60 / 60)
    numeroDeSegundos -= horas * 60 * 60
    let minutos = Math.floor(numeroDeSegundos / 60)
    numeroDeSegundos -= minutos * 60
    numeroDeSegundos = parseInt(numeroDeSegundos)
    if (horas < 10) horas = "0" + horas
    if (minutos < 10) minutos = "0" + minutos
    if (numeroDeSegundos < 10) numeroDeSegundos = "0" + numeroDeSegundos

    tiempo.innerHTML = `${horas}:${minutos}:${numeroDeSegundos}`
}

// Ayudante para la duración no ayuda en nada pero muestra algo informativo
const comenzarAContar = () => {
    tiempoInicio = Date.now()
    setInterval(refrescar, 500)
}

const refrescar = () => segundosATiempo((Date.now() - tiempoInicio) / 1000)

if (getMobileOperatingSystem() != 'desconocido') {
    //alert('mi sistema es>>' + getMobileOperatingSystem())
    btnDetener.classList.add('ocultar')
    btnEmpezar.classList.add('ocultar')
    document.querySelector('.info').style.display = 'block'
} else {

    //if (retornarSO() != 'Sistema Operativo') {

    const empezarGrabacion = async () => {

        const pantallaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        const usuarioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        const context = new AudioContext()
        const destination = context.createMediaStreamDestination()
        if (pantallaStream.getAudioTracks().length) {
            // console.log(pantallaStream.getAudioTracks().length)
            const fuente1 = context.createMediaStreamSource(pantallaStream)
            const f1Gain = context.createGain()
            f1Gain.gain.value = 1
            fuente1.connect(f1Gain).connect(destination)
        }
        if (usuarioStream.getAudioTracks().length) {
            const fuente2 = context.createMediaStreamSource(usuarioStream)
            const f2Gain = context.createGain()
            f2Gain.gain.value = 1
            fuente2.connect(f2Gain).connect(destination)
        }
        const tracks = [
            ...pantallaStream.getVideoTracks(),
            ...destination.stream.getAudioTracks()
        ]
        const bundleStream = new MediaStream(tracks)
        let blobs = []
        isRecording = true
        window.grabadora = new MediaRecorder(bundleStream, { mimeType: 'video/webm' })
        window.grabadora.ondataavailable = e => blobs.push(e.data)
        window.grabadora.start()
        /* 2.6 */
        window.grabadora.onstop = async () => {
            document.querySelector('.downloading').style.display = 'flex'
            textLoader.innerHTML = 'Convirtiendo vídeo para descarga'
            setInterval(() => {
                const blob = new Blob(blobs, { type: 'video/MP4' })
                clearInterval()
                textLoader.innerHTML = 'Preparando vídeo para descarga'
                setInterval(() => {
                    const btnDescargar = document.createElement('a')
                    btnDescargar.href = window.URL.createObjectURL(blob)
                    btnDescargar.download = `GRABACION_${new Date().getTime()}.mp4`
                    textLoader.innerHTML = 'Descargando vídeo'
                    clearInterval()
                    setInterval(() => {
                        btnDescargar.click()
                        clearInterval()
                    }, TIEMPO_DESCARGANDO_MS / 3)
                }, TIEMPO_DESCARGANDO_MS / 3)
            }, TIEMPO_DESCARGANDO_MS / 3)

        }
        btnEmpezar.style.left = '-400px';
        comenzarAContar()
    }

    window.addEventListener('beforeunload', e => {
        if (isRecording) {
            e.preventDefault()
            e.returnValue = 'cualquier texto'
        }
    })

    btnEmpezar.addEventListener('click', empezarGrabacion)

    btnDetener.addEventListener('click', () => {
        if (confirm('¿Seguro que desea detener y descargar la grabación?')) {
            isRecording = false
            grabadora.stop()
            setInterval(() =>
                location.reload(), TIEMPO_DESCARGANDO_MS
            )
        }
    })

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Registro de SW exitoso', reg))
            .catch(err => console.warn('Error al tratar de registrar el sw', err))
    }
    //}
}