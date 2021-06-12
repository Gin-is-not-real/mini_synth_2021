//instanciation du context audio
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/*
    creation des audio nodes
    - un gain general pour y relier toutes les voies
    - un oscillateur
    - un gain 'amp' qui sera le volume de l'oscillateur
*/
let amp = audioCtx.createGain();
amp.gain.value = 0.5;
amp.gain.lastValue = 0.5;

let osc = audioCtx.createOscillator();

let generalGain = audioCtx.createGain();
generalGain.gain.value = 0;
generalGain.gain.lastValue = 0.2;

/*
    creation des analyser nodes
    * TODO reflechir et definir une structure (node - canvas, function ?)
    - un oscilloscope, un spectrometre.
        - ils ont une fonction run() qui creer un setInterval ou est appelée la fonction du canvas associé (*je ne trouve pas ça pratique), et stop() pour clear l'interval
*/

/*
    oscilloscope
*/
let oscilloscope = audioCtx.createAnalyser();
oscilloscope.intervalId = undefined;
oscilloscope.fftSize = 256;

oscilloscope.buffer = oscilloscope.frequencyBinCount;
oscilloscope.tabData = new Uint8Array(oscilloscope.buffer);

oscilloscope.run = function() {
    oscilloscope.intervalId = setInterval(oscCanvas.draw, 100);
}
oscilloscope.stop = function() {
    clearInterval(oscilloscope.intervalId);
    oscilloscope.intervalId = undefined;
}

/*
    spectrum
*/
let spectrum = audioCtx.createAnalyser();
spectrum.intervalId = undefined;
spectrum.fftSize = 256;
spectrum.buffer = spectrum.frequencyBinCount;
spectrum.tabData = new Uint8Array(spectrum.buffer);

spectrum.run = function() {
    spectrum.intervalId = setInterval(specCanvas.draw, 100);
}
spectrum.stop = function() {
    clearInterval(spectrum.intervalId);
    spectrum.intervalId = undefined;
}

/*
    on connecte les nodes les uns aux autres: 
        oscillateur->oscillator.amp->visualisers->generalGain->sortie
*/

osc.connect(amp);
amp.connect(oscilloscope);
oscilloscope.connect(spectrum);
spectrum.connect(generalGain);
generalGain.connect(audioCtx.destination);

osc.start();

/////////////////////////////////////////////////////////////////////
//DOM
/*
    recuperation des controlleurs, assign d'un parametre cible, ajout event listener 
*/
/*
    le trigger declenche le son quand il on clic dessus et le stop quand on relache
*/
let btnTrigOn = document.getElementById('btn-trig-on');
btnTrigOn.target = generalGain.gain;
btnTrigOn.addEventListener("mousedown", function() {
        let valToSend = this.target.lastValue != undefined ? this.target.lastValue : 1;
        sendValue(valToSend, this.target);
        oscilloscope.run();
        spectrum.run();
})
btnTrigOn.addEventListener("mouseup", function() {
    this.value = 'off';
    sendValue(0, this.target);
    oscilloscope.stop();
    spectrum.stop();
})

/*
    le btn lock pour maintenir le son ouvert
*/
let btnLockOn = document.getElementById('btn-lock-on');
btnLockOn.target = generalGain.gain;
btnLockOn.addEventListener("click", function() {
    if(this.value == 'off') {
        this.value = 'on';
        let valToSend = this.target.lastValue != undefined ? this.target.lastValue : 1;
        sendValue(valToSend, this.target);
        oscilloscope.run();
        spectrum.run();
    }
    else {
        this.value = 'off';
        sendValue(0, this.target);
        oscilloscope.stop();
        spectrum.stop();
    }
})

/*
    les inputs 
*/
let rngGeneralAmp = document.getElementById('amp-general');
rngGeneralAmp.target = generalGain.gain;
rngGeneralAmp.value = rngGeneralAmp.target.lastValue;
rngGeneralAmp.addEventListener("input", function() {
    this.target.lastValue = this.value;

    if(btnLockOn.value =='on') {
        sendValue(this.value, this.target);
    }
})

let rngOscAmp = document.getElementById('amp-osc');
rngOscAmp.target = amp.gain;
rngOscAmp.value = rngOscAmp.target.lastValue;
rngOscAmp.addEventListener("input", function() {
    this.target.lastValue = this.value;

    if(btnLockOn.value =='on') {
        sendValue(this.value, this.target);
    }
})

let rngFrequency = document.getElementById('frequency');
let labFrequency = document.getElementById('lab-frequency');
rngFrequency.target = osc.frequency;
rngFrequency.value = rngFrequency.target.value;
rngFrequency.addEventListener('input', function() {
    sendValue(this.value, this.target);
    labFrequency.textContent = 'Frequence ' + this.value + ' Hz';
})

///////////////////////////////////////////////////////////
/*
    appelée par les controlleurs
*/
function sendValue(value, param) {
    console.log('send ' + value + ' to ' + param);
    param.value = value;
}

///////////////////////////////////////////////////////////
//CANVAS
/*
    Liens vers les canvas oscilloscope et spectrum, et definition de leur fonction de dessin
*/
let oscCanvas = document.querySelector('#oscilloscope');
oscCanvas.ctx = oscCanvas.getContext('2d');

oscCanvas.draw = function() {
    oscilloscope.getByteTimeDomainData(oscilloscope.tabData);
    oscCanvas.ctx.fillStyle = "black";
    oscCanvas.ctx.fillRect(0, 0, oscCanvas.width, oscCanvas.height);

    oscCanvas.ctx.strokeStyle = "green";
    oscCanvas.ctx.lineWidth = 2;
    oscCanvas.ctx.beginPath();

    let sliceW = oscCanvas.width * 1.0 / oscilloscope.buffer;
    let x = 0;
    for(let i = 0; i < oscilloscope.buffer; i++){
        let value = oscilloscope.tabData[i] / 128.0;
        let y = value * oscCanvas.height/2;

        if(i === 0) {
            oscCanvas.ctx.moveTo(x, y);
        }
        else {
            oscCanvas.ctx.lineTo(x, y);
        }
        x += sliceW;
    }
    oscCanvas.ctx.lineTo(oscCanvas.width, oscCanvas.height/2);
    oscCanvas.ctx.stroke();
}
// oscCanvas.draw();

let specCanvas = document.querySelector('#spectrum');
specCanvas.ctx = specCanvas.getContext('2d');
specCanvas.draw = function() {
    spectrum.getByteFrequencyData(spectrum.tabData);
    specCanvas.ctx.fillStyle = "black";
    specCanvas.ctx.fillRect(0, 0, specCanvas.width, specCanvas.height);

    /*
        on defini les longueurs et largeur des bandes en fonction des dimensions du canvas
    */
    let unityHeight = specCanvas.height /255 ;
    let barHeight;
    let barWidth = specCanvas.width /(spectrum.buffer/10);

    let x = 0;
    let r, g, b;
    for(let i = 0; i < spectrum.buffer; i++) {
        /*
            a chaque entrée du buffer on defini une hauteur de bande en fontion de la data du buffer
        */
        barHeight = (spectrum.tabData[i] * unityHeight) ;
        /*
            on genere une couleur en fonction de la longueur de barre (donc de la data)
        */
        r = barHeight +100,
        g = barHeight -30,
        b = 0;
        specCanvas.ctx.fillStyle = 'rgb(' + r + ", " + g+ ", " + b + ")";            
        specCanvas.ctx.fillRect(x, (specCanvas.height - barHeight) , barWidth, barHeight);

        x += barWidth + 1;
    }
}