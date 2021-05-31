let iconAdd ='<svg width="24" height="24" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000" stroke-miterlimit="3.95" stroke-width="2"><ellipse cx="11.985" cy="11.985" rx="10.604" ry="10.604" opacity=".996" stroke-dashoffset="4.1575" stroke-linejoin="round"/><path d="m12.124 3.522v9.2094h5.1073" stroke-linecap="round" stroke-linejoin="bevel"/></g></svg>';
let iconRun = '<svg width="24" height="24" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000" stroke-miterlimit="3.95" stroke-width="2"><ellipse cx="11.985" cy="11.985" rx="10.604" ry="10.604" opacity=".996" stroke-dashoffset="4.1575" stroke-linejoin="round"/></g><path d="m19.826 11.963-6.1634 3.3911-6.0185 3.6421 0.14493-7.0332-0.14493-7.0332 6.0185 3.6421z" fill="none" opacity=".996" stroke="#000" stroke-dashoffset="4.1575" stroke-linecap="round" stroke-linejoin="bevel" stroke-miterlimit="3.95" stroke-width="2"/></svg>';
let iconStop = '<svg width="24" height="24" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000" stroke-miterlimit="3.95" stroke-width="2"><ellipse cx="11.985" cy="11.985" rx="10.604" ry="10.604" opacity=".996" stroke-dashoffset="4.1575" stroke-linejoin="round"/></g><rect x="6.0413" y="6.1851" width="11.902" height="11.902" ry="0" opacity=".996" stroke="#000" stroke-dashoffset="4.1575" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2"/></svg>';
let iconStat = '<svg width="24" height="24" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.58612 0 0 .58612 .73285 .67533)" fill="none" stroke="#000" stroke-miterlimit="3.95" stroke-width="3.4122"><circle cx="11.985" cy="11.985" r="10.604" opacity=".996" stroke-dashoffset="4.1575" stroke-linejoin="round"/><path d="m12.124 5.1411v7.5903h5.1073" stroke-linecap="round" stroke-linejoin="bevel"/></g><path d="m16.471 10.33h5.9785" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/><path d="m16.471 14.235h5.9785" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/><path d="m2.4809 17.936h19.969" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/><path d="m2.4809 21.759h19.969" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/></svg>';
let appId = '_YOUR_APP_ID_'; // specify the ID here
let timerId;
let idle = new Date().getTime();
// style for stop
let style_stop = {
    shapeType: 7,
    backgroundColor: '#8FD14F',
    borderColor: '#FFFFFF',
    textColor: '#FFFFFF'
};
// style for run
let style_run = {
    shapeType: 7,
    backgroundColor: '#FAC710',
    borderColor: '#FFFFFF',
    textColor: '#FFFFFF'
};


miro.onReady(
    () => {
        miro.initialize(
            {
                extensionPoints: {
                    bottomBar: {
                        title: 'Add Stopwatch',
                        svgIcon: iconAdd,
                        onClick: addStopwatch
                    },
                    getWidgetMenuItems: (widgets) => {
                        if(widgets[0].type == 'SHAPE' && widgets[0].metadata[appId] != undefined && widgets[0].metadata[appId].subtype == 'STOPWATCH') {
                            return Promise.resolve(
                                [{
                                    tooltip: 'RUN STOPWATCH',
                                    svgIcon: iconRun,
                                    onClick: () => {
                                        changeMode(widgets, true);
                                    }
                                },
                                {
                                    tooltip: 'STOP STOPWATCH',
                                    svgIcon: iconStop,
                                    onClick: () => {
                                        changeMode(widgets, false);
                                    }
                                }]
                            );
                        }
                        return Promise.resolve({});
                    }
                },
            }
        ).then(onMiroInitialize);
    });

function onMiroInitialize() {
    // On miro initialize
    startTimer();
}

function addStopwatch() {
    miro.board.viewport.get().then(function(response) {
        let centeredX = response.x + response.width / 2;
        let centeredY = response.y + response.height / 2;
        miro.board.widgets.create([
            {
                type: 'shape',
                text: '00:00:00',
                x: centeredX,
                y: centeredY,
                width: 100,
                height: 24,
                style: style_stop,
                metadata: {
                    [appId]: {
                        subtype: 'STOPWATCH',
                        running: false
                    }
                },
            }
        ]).then(function(response) {
            console.log('Added Stopwatch Widget');
        });
    });
}

function changeMode(response, mode) {
    // Change Stopwatch widget mode (RUN / STOP)
    // style for stop
    let style = mode ? style_run : style_stop;
    response.forEach(function(item) {
        miro.board.widgets.update(
            {
                id: item.id,
                metadata: {
                    [appId]: {
                        subtype: 'STOPWATCH',
                        running: mode
                    }
                },
                style: style
            }
        );
    });
}

function updateStopwatchWidgets() {
    // Update Stopwatch widgets
    miro.board.widgets.get(
        {
            type: 'shape',
            metadata: {
                [appId]: {
                    subtype: 'STOPWATCH',
                    running: true
                }
            }
        }
    ).then(function(response) {
        // count idle time
        let now = new Date().getTime();
        let delta = now - idle; // delta in mikroseconds
        let delta_modulo = delta % 1000;
        delta -= delta_modulo;
        delta /= 1000;  // delta in seconds
        let hours = Math.floor(delta / 60 / 60);
        let minutes = Math.floor(delta / 60) - (hours * 60);
        let seconds = delta % 60;
        // update stopwatchers
        let forUpdate = [];
        response.forEach(function(item) {
            let timeTxt = incrementTime(item.text, hours, minutes, seconds);
            forUpdate.push(
                {
                    id: item.id,
                    text: timeTxt
                }
            );
        });
        miro.board.widgets.update(
            forUpdate
        ).then(function() {
            // change idle only if widget updation is successful
            idle = now - delta_modulo;
        });
    });
}

function incrementTime(timeStr, hours, minutes, seconds) {
    // increment time to 1 sec
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
    timerId = setInterval(updateStopwatchWidgets, 1000);
}

function stopTimer() {
    // Stop timer loop
    if(timerId) {
        clearInterval(timerId);
    }
}

function addStatistic() {
    miro.board.viewport.get().then(function(response) {
        let centeredX = response.x + response.width / 2;
        let centeredY = response.y + response.height / 2;
        
        
        miro.board.widgets.create([
            {
                type: 'shape',
                text: '00:00:00',
                x: centeredX,
                y: centeredY,
                width: 100,
                height: 24,
                style: {
                    shapeType: 7
                },
                metadata: {
                    [appId]: {
                        subtype: 'STOPWATCH',
                        running: false
                    }
                }
            }
        ]).then(function(response) {
            console.log('Added Stopwatch Widget');
        });
    });
}
