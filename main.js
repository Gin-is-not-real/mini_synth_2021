//instanciation du contexte audio
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

let generalAmp = audioCtx.createGain();
generalAmp.gain.value = 0;
generalAmp.gain.lastValue = 0.2;

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

// oscilloscope.fftSize = 8192;
//Must be a power of 2 between 252^5 and 2152^15, so one of: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768. Defaults to 2048
oscilloscope.setFftSize = function(size) {
    oscilloscope.fftSize = size;
    oscilloscope.buffer = oscilloscope.frequencyBinCount;
    oscilloscope.tabData = new Uint8Array(oscilloscope.buffer);//nombre d'index = fttSize/2
    console.log(oscilloscope.tabData);
}
oscilloscope.setFftSize(1024);
//#TEST 
// let tabData = oscilloscope.tabData.slice();
// tabData.sort(function(a, b) {
//     return a - b;
// });
// console.log(tabData);

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
        oscillateur->oscillator.amp->visualisers->generalAmp->sortie
*/

osc.connect(amp);
amp.connect(oscilloscope);
oscilloscope.connect(spectrum);
spectrum.connect(generalAmp);
generalAmp.connect(audioCtx.destination);

osc.start();

/////////////////////////////////////////////////////////////////////
//DOM
/*
    recuperation des controlleurs, assign d'un parametre cible, ajout event listener 
*/
/*
    le btn lock pour maintenir le son ouvert
*/
let btnLockOn = document.getElementById('btn-lock-on');
btnLockOn.target = generalAmp.gain;
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
    le trigger declenche le son quand il on clic dessus et le stop quand on relache
    si le bouton maintient est déja allumé ->
*/
let btnTrigOn = document.getElementById('btn-trig-on');
btnTrigOn.target = generalAmp.gain;
btnTrigOn.addEventListener("mousedown", function() {
    this.value = 'on';
    let valToSend = this.target.lastValue != undefined ? this.target.lastValue : 1;
    sendValue(valToSend, this.target);
    oscilloscope.run();
    spectrum.run();
})
btnTrigOn.addEventListener("mouseup", function() {
    this.value = 'off';

    if(btnLockOn.value != 'on') {
        sendValue(0, this.target);
        oscilloscope.stop();
        spectrum.stop();
    }

})



/*
    les inputs 
*/
let rngGeneralAmp = document.getElementById('amp-general');
rngGeneralAmp.target = generalAmp.gain;
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


/*
    lorsqu'on modifie la valeur de la fftSize, on doit reinitialiser le buffer
*/
let selFftSize = document.querySelector('#fftSize');
selFftSize.target = oscilloscope.fftSize;
selFftSize.addEventListener('input', function() {
    console.log(this.value);
    oscilloscope.setFftSize(this.value);

    if(btnLockOn.value =='on') {
        oscilloscope.stop();
        oscilloscope.run();
    }
})

///////////////////////////////////////////////////////////
/*
    appelée par les controlleurs
*/
function sendValue(value, param) {
    console.log('send ' + value + ' to ' + param);
    param.value = value;
}

