function createOscilloscope(audioCtx, canvas) {
    let oscilloscope = audioCtx.createAnalyser();
    oscilloscope.intervalId = undefined;

    oscilloscope.fftSize = 256;
    oscilloscope.buffer = oscilloscope.frequencyBinCount;
    oscilloscope.tabData = new Uint8Array(oscilloscope.buffer);

    oscilloscope.draw = function(canvas) {
        oscilloscope.getByteTimeDomainData(oscilloscope.tabData);

        let ctx = canvas.getContext('2D');
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.beginPath();

        let sliceW = canvas.width * 1.0 / oscilloscope.buffer;
        let x = 0;
        for(let i = 0; i < oscilloscope.buffer; i++){
            let value = oscilloscope.tabData[i] / 128.0;
            let y = value * canvas.height/2;

            if(i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
            x += sliceW;
        }
        ctx.lineTo(canvas.width, canvas.height/2);
        ctx.stroke();
    }

    oscilloscope.run = function() {
        oscilloscope.intervalId = setInterval(oscilloscope.draw, 100);
    }

    oscilloscope.stop = function() {
        oscilloscope.clearInterval(oscilloscope.intervalId);
        oscilloscope.intervalId = undefined;
    }
}