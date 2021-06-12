///////////////////////////////////////////////////////////
//CANVAS
/*
    Liens vers les canvas oscilloscope et spectrum, et definition de leur fonction de dessin
*/
let oscCanvas = document.querySelector('#oscilloscope');
oscCanvas.ctx = oscCanvas.getContext('2d');

/*
RAPPEL:
oscilloscope.fftSize = 8192;  -> avec 8192 et un canvas de 150px, 40Hz affiche 4 ondes
oscilloscope.buffer = oscilloscope.frequencyBinCount;
oscilloscope.tabData = new Uint8Array(oscilloscope.buffer);
*/
/*
- needs:
    - oscilloscope pour recuperer les data de oscilloscope.getByteTimeDomainData(oscilloscope.tabData)
- calculs:
    - oscilloscope.tabData est un tab de (oscilloscope.fftSize/2) index (ou oscilloscope.buffer)
    - il contient des valeurs de 0 à (256?)
*/
// function getOneWave(oscilloscope) {
//     oscilloscope.getByteTimeDomainData(oscilloscope.tabData);

// }

oscCanvas.draw = function() {
    //on recupere les données en bytes du domaine temporel
    oscilloscope.getByteTimeDomainData(oscilloscope.tabData);
    //on peint l'ecran vide
    oscCanvas.ctx.fillStyle = "black";
    oscCanvas.ctx.fillRect(0, 0, oscCanvas.width, oscCanvas.height);
    //on choisi les options de dessins
    oscCanvas.ctx.strokeStyle = "green";
    oscCanvas.ctx.lineWidth = 2;
    oscCanvas.ctx.beginPath();


    let sliceW = oscCanvas.width / oscilloscope.buffer;
    let sliceH = oscCanvas.height / 256;
    let x = 0;
    for(let i = 0; i <= oscilloscope.buffer; i++){
        let value = oscilloscope.tabData[i];
        let y = value * sliceH;

        if(value == oscCanvas.width/2) {
            console.log("0 !")
        }
        oscCanvas.ctx.lineTo(x, y);
        x += sliceW;
    }

    // oscCanvas.ctx.lineTo(oscCanvas.width, oscCanvas.height/2);
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