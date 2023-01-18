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

function addStopwatch(running = false) {
    // add new counter widget with mode from parameter
    board.viewport.get().then(function(response) {
        let centeredX = response.x + response.width / 2;
        let centeredY = response.y + response.height / 2;
        board.createShape({
            content: '00:00:00',
            shape: 'round_rectangle',
            x: centeredX,
            y: centeredY,
            width: 100,
            height: 24,
            style: (running ? style_run : style_stop),
        }).then(function(response) {
            // set metadata
            response.setMetadata('stopwatch', {
                // subtype: 'STOPWATCH',
                running: running,
            }).then(function(response2) {
                console.log('Added Stopwatch Widget');
            });
        });
    });
}

function startStopwatch() {
    changeMode(true);
}

function stopStopwatch() {
    changeMode(false);
}

function changeMode(mode) {
    // change mode - pressed 'start' or 'stop' buttons on the panel by the user
    board.getSelection().then(function(items) {
        if(items.length > 0) {
            // if selection - only for selection
            items.forEach((item) => {
                item.getMetadata('stopwatch').then(function(metadata) {
                    // get only items with the "stopwatch" metadata && !mode
                    if(metadata && metadata.running != mode) {
                        item.setMetadata('stopwatch', {
                            running: mode,
                        }).then(function() {
                            item.style = (mode ? style_run : style_stop);
                            item.sync();
                        });
                    };
                });
            });
        } else {
            // if no selection - add new || stop all
            if(mode) {
                // start with no selection - add new counter in run mode
                addStopwatch(true);
            } else {
                // stop with no selection - stop all running widgets
                stopAll();
            }
        }
    });
}

async function stopAll() {
    // stop all running widgets
    let items = await board.get(
        {
            type: 'shape'
        }
    );
    items.forEach(function(item) {
        item.getMetadata('stopwatch').then(function(metadata) {
            if(metadata && metadata.running == true) {
                // all running widgets
                item.setMetadata('stopwatch', {
                    running: false,
                }).then(function() {
                    item.style = style_stop;
                    item.sync();
                });
            };
        });
    });
}

async function stopwatchStatistic() {
    // create statistic table
    let row = 0;
    let viewport = await board.viewport.get();
    let centeredX = viewport.x + viewport.width / 2;
    let centeredY = viewport.y + viewport.height / 2;
    let summ = '00:00:00';
    let frameIds = [];
    // all stopwatches
    let items = await board.get(
        {
            type: 'shape'
        }
    );
    let processed = 0;
    let to_process = items.length;
    items.forEach(function(item) {
        item.getMetadata('stopwatch').then(function(metadata) {
            if(metadata) {
                // this is counter
                let connected = false;
                // get connectors
                board.get(
                    {
                        type: 'connector'
                    }
                ).then(function(connectors) {
                    connectors.forEach(function(connector) {
                        // if this connector is for widget
                        if(connector.end && connector.end.item == item.id) {
                            connected = true;
                            // get source item
                            board.getById(connector.start.item).then(function(start_item) {
                                // have item and start item - create text items for statistic table
                                board.createText({
                                    content: start_item.content,
                                    x: centeredX - 50,
                                    y: centeredY + 25 * row,
                                    width: 200
                                }).then(function(text_item) {
                                    frameIds.push(text_item.id);
                                });
                                board.createText({
                                    content: item.content,
                                    x: centeredX + 160,
                                    y: centeredY + 25 * row,
                                    width: 100
                                }).then(function(text_item) {
                                    frameIds.push(text_item.id);
                                });
                                // increse row
                                row += 1;
                                // summing for all time
                                let cAdd = item.content.replace(/(<([^>]+)>)/gi, '').split(':');
                                summ = incrementSummTime(summ, Number(cAdd[0]), Number(cAdd[1]), Number(cAdd[2]));
                                // processed
                                processed += 1;
                                if(processed == to_process) stopwatchStatisticTotal(summ, row, centeredX, centeredY, frameIds);
                            });
                        }
                    });
                    if(!connected) {
                        // not connected - skipping
                        processed += 1;
                        // but controlling to be last processed
                        if(processed == to_process) stopwatchStatisticTotal(summ, row, centeredX, centeredY), frameIds;
                    }
                });
            } else {
                // not a widject - skipping
                processed += 1;
                // but controlling to be last processed
                if(processed == to_process) stopwatchStatisticTotal(summ, row, centeredX, centeredY, frameIds);
            }
        });
    });
}

function stopwatchStatisticTotal(summ, row, centeredX, centeredY, frameIds) {
    // add total to statistic
    // add total text item
    board.createText({
        content: summ,
        x: centeredX + 160,
        y: centeredY + 25 * row,
        width: 100
    }).then(function(text_item) {
        frameIds.push(text_item.id);
        // add frame
        board.createFrame({
            title: 'Timede Statistic',
            style: {
                fillColor: '#ffffff',
            },
            x: centeredX,
            y: centeredY + (25 * row + 50)/2 - 25,
            width: 350,
            height: 25 * row + 50,
            // childrenIds: frameIds    // doesn't work (why ?)
        }).then(function(frame) {
            frame.childrenIds = frameIds
            frame.sync()
        });
    });
}

function incrementSummTime(timeStr, hours, minutes, seconds) {
    // increment time to 1 sec
    let currentTimeArr = timeStr.split(':');
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
