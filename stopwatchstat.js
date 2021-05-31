let iconStat = '<svg width="24" height="24" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.58612 0 0 .58612 .73285 .67533)" fill="none" stroke="#000" stroke-miterlimit="3.95" stroke-width="3.4122"><circle cx="11.985" cy="11.985" r="10.604" opacity=".996" stroke-dashoffset="4.1575" stroke-linejoin="round"/><path d="m12.124 5.1411v7.5903h5.1073" stroke-linecap="round" stroke-linejoin="bevel"/></g><path d="m16.471 10.33h5.9785" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/><path d="m16.471 14.235h5.9785" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/><path d="m2.4809 17.936h19.969" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/><path d="m2.4809 21.759h19.969" fill="none" stroke="#000" stroke-linecap="round" stroke-width="2"/></svg>';
let stopwatchAppId = '3074457358189783211';

miro.onReady(
    () => {
        miro.initialize(
            {
                extensionPoints: {
                    bottomBar: {
                        title: 'Stopwatch Statistic',
                        svgIcon: iconStat,
                        onClick: stopwatchStatistic
                    }
                }
            }
        );
    });

function stopwatchStatistic() {
    // all lines to stopwatches
    // all stopwatches
    miro.board.widgets.get(
        {
            type: 'shape',
            metadata: {
                [stopwatchAppId]: {
                    subtype: 'STOPWATCH'
                }
            }
        }
    ).then(function(response) {
        // stopwatchers ids
        let stopwatchersId = new Map();
        response.forEach(function(item) {
            stopwatchersId.set(item.id, {id: item.id, text: item.text, taskId: 0});
        });
        // all items on the board
        miro.board.widgets.get(
            // {
            //     type: 'LINE',
            // }
        ).then(function(response) {
            // all lines to stopwatches
            let tasksId = [];
            response.forEach(function(item) {
                if(item.type == 'LINE' && stopwatchersId.has(item.endWidgetId) && item.startWidgetId != undefined) {
                    tasksId.push(item.startWidgetId);
                    stopwatchersId.get(item.endWidgetId).taskId = item.startWidgetId;
                }
            });
            // all taskwidgets (widgets connected by lines to stopwatches)
            let taskWidgets = new Map();
            response.forEach(function(item) {
                if((item.hasOwnProperty('text') || item.hasOwnProperty('title')) && tasksId.includes(item.id)) {
                    let itemText = item.hasOwnProperty('text') ? item.text : item.title;
                    taskWidgets.set(item.id,  {id: item.id, text: itemText});
                }
            });
            // connect stopwatches and tasks
            let connected = [];
            for(let [key, value] of stopwatchersId) {
                if(taskWidgets.get(value.taskId)) {
                    connected.push([taskWidgets.get(value.taskId).text, value.text]);
                }
            }
            // make result texts
            showStatistic(connected);
        });
    });
}

function showStatistic(data) {
    // create text widgets by data ['text', '00:00:00']
    miro.board.viewport.get().then(function(response) {
        let centeredX = response.x + response.width / 2;
        let centeredY = response.y + response.height / 2;
        let items = [];
        let row = 0;
        let summ = '00:00:00';
        data.forEach(function(item) {
            items.push(
                {
                    type: 'text',
                    text: item[0],
                    x: centeredX,
                    y: centeredY + 25 * row,
                    width: 200,
                }
            );
            items.push(
                {
                    type: 'text',
                    text: item[1],
                    x: centeredX + 210,
                    y: centeredY + 25 * row,
                    width: 100,
                }
            );
            row += 1;
            // summing for all time
            let cAdd = item[1].replace(/(<([^>]+)>)/gi, '').split(':');
            summ = incrementTime(summ, Number(cAdd[0]), Number(cAdd[1]), Number(cAdd[2]));
        });
        // add summ for vidgets
        items.push(
            {
                type: 'text',
                text: summ,
                x: centeredX + 210,
                y: centeredY + 25 * row,
                width: 100,
            }
        );
        // add frame
        miro.board.widgets.create(
            {
                type: 'FRAME',
                title: 'Stopwatch Statistic',
                x: centeredX,
                y: centeredY,
                width: 350,
                height: 25 * row + 50
            }
        ).then(function(response) {
            // correct widgets coordinates by frame (bcause they added by roordinates of their centers)
            items.forEach(function(item) {
                item.x -= response[0].width / 2 - 120;
                item.y -= response[0].height / 2 - 30;
            });
            // add text widgets
            miro.board.widgets.create(
                items
            ).then(function(response) {
                console.log('Added Stopwatch Statistic');
            });
        });

    });
}

function incrementTime(timeStr, hours, minutes, seconds) {
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
