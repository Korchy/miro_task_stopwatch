var timerId2;
var idle2 = new Date().getTime();
// style for stop
let style_stop = {
    fillColor: '#FAC710',
    borderColor: '#FFFFFF',
    borderOpacity: 0.0,
    color: '#FFFFFF'
};
// style for run
let style_run = {
    fillColor: '#F24726',
    borderColor: '#FFFFFF',
    borderOpacity: 0.0,
    color: '#FFFFFF'
};

const { board } = window.miro;

async function init() {
    await board.ui.on("icon:click", async () => {
        // show stopwatch panel
        await board.ui.openPanel({
            url: 'https://interplanety.org/miro/taskstopwatch2panel.html',
            height: 360, //438
        });
    });
    // start timer
    startTimer();
}

function updateStopwatchWidgets() {
    // Update Stopwatch widgets
    board.get(
        {
            type: 'shape'
        }
    ).then(function(items) {
        // count idle time
        let now = new Date().getTime();
        let delta = now - idle2; // delta in mikroseconds
        let delta_modulo = delta % 1000;
        delta -= delta_modulo;
        delta /= 1000;  // delta in seconds
        let hours = Math.floor(delta / 60 / 60);
        let minutes = Math.floor(delta / 60) - (hours * 60);
        let seconds = delta % 60;
        // update stopwatchers
        items.forEach((item) => {
            item.getMetadata('stopwatch').then(function(metadata) {
                // get only items with the "stopwatch" metadata
                if(metadata) {
                    if(metadata.running) {
                        // update time on widget
                        item.content = incrementTime(item.content, hours, minutes, seconds);
                        // check style for repair issue when sync() here executes before sync() in changeMode
                        if(item.style.fillColor != style_run.fillColor) item.style = style_run;
                        item.sync();
                    } else {
                        // check style for repair issue when sync() here executes before sync() in changeMode
                        if(item.style.fillColor != style_stop.fillColor) {
                            item.style = style_stop;
                            item.sync();
                        }
                    }
                }
            });
        });
        // change idle
        idle2 = now - delta_modulo;
    });
}

function incrementTime(timeStr, hours, minutes, seconds) {
    // increment time to 1 sec
    if(timeStr == '') {
        timeStr = '00:00:00';
    }
    let currentTimeArr = timeStr.replace(/(<([^>]+)>)/gi, '').split(':');
    let newHours = Number(currentTimeArr[0]) + hours;
    let newMinutes = Number(currentTimeArr[1]) + minutes;
    let newSeconds = Number(currentTimeArr[2]) + seconds;
    // seconds += 1;
    if(newSeconds >= 60) {
        newSeconds -= 60;
        newMinutes += 1;
    }
    if(newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
    }
    let secondsTxt = newSeconds < 10 ? '0' + newSeconds.toString() : newSeconds.toString();
    let minutesTxt = newMinutes < 10 ? '0' + newMinutes.toString() : newMinutes.toString();
    let hoursTxt = newHours < 10 ? '0' + newHours.toString() : newHours.toString();
    return hoursTxt + ':' + minutesTxt + ':' + secondsTxt;
}

function startTimer() {
    // Start timer loop
    timerId2 = setInterval(updateStopwatchWidgets, 10000);
}

function stopTimer() {
    // Stop timer loop
    if(timerId2) {
        clearInterval(timerId2);
    }
}

init();
