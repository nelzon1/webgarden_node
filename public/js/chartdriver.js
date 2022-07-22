const drawBackgroundColor = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'lightGreen';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

var globalOptions = {
    heartbeatOn : true,
    //graphSetting can be minute, hour or day
    graphSetting : "hour"
};

var targetFill = {
    target: { value: 24.5 },
    above: window.chartColors.orange, // Area will be red above the origin
    below: window.chartColors.blue // And blue below the origin
};

var config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature',
            lineTension: 0.3,
            backgroundColor: 'rgb(0, 0, 0)',
            borderColor: 'rgb(0, 0, 0)',
            pointRadius: 1,
            fill: targetFill
        }]
    },
    //plugins: [drawBackgroundColor],
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Grow Chamber Temperature',
                color: 'black'
            },
            legend: {
                display: false
            }
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time',
                    color: 'black'
                },
                grid: {
                    color: 'black'
                },
                ticks: {
                    color: 'black'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Temperature (C)',
                    color: 'black'
                },
                grid: {
                    color: 'black'
                },
                ticks: {
                    color: 'black'
                }
            }
        }
    }
};

function getMaxTemp(temperatures) {
    let curMax = 0;
    temperatures.forEach(temp => {
        if (Number(temp) > curMax) {
            curMax = Number(temp);
        }
    });
    return curMax;
}

function updateData() {

    var tempData = JSON.parse(document.getElementById('temps').innerText);
    var temps = [],
        times = [],
        maxTemps = [],
        minTemps = [];
    tempData.forEach(function(row) {
        temps.push(Number(row.Temperature));
        if (row.MaxTemperature) maxTemps.push(row.MaxTemperature);
        if (row.MinTemperature) minTemps.push(row.MinTemperature);
        if (row.Datetime.length === 10) {
            times.push(row.Datetime);
        }
        else {
            row.Datetime = row.Datetime.length === 13 ? row.Datetime += ":00:00" : row.Datetime;
            times.push( (new Date(Date.parse(row.Datetime))).toLocaleString('en-US', { hour12: false}) );
        }
    })
    temps.reverse();
    maxTemps.reverse();
    minTemps.reverse();
    times.reverse();
    config.data.datasets = [config.data.datasets[0]];
    config.data.datasets[0].fill = targetFill;
    config.data.datasets[0].data = temps;
    if (maxTemps.length > 0 && minTemps.length > 0) {
        config.data.datasets[0].fill = false;
        let maxLine = {
            label: "Max Temperature",
            data: maxTemps,
            lineTension: 0.3,
            fill: false,
            borderColor: 'red',
            fillColor: '#ff9999'
        };
        let minLine = {
            label: "Min Temperature",
            data: minTemps,
            lineTension: 0.3,
            fill: +1,
            borderColor: 'blue',
            fillColor: '#99b3ff'
        };
        config.data.datasets.push(maxLine);
        config.data.datasets.push(minLine);
    }
    config.data.labels = times;
    window.sessionStorage.curTemp = Number(temps.slice(-1)[0]).toFixed(2);
    window.sessionStorage.avgTemp = Number(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2);
    window.sessionStorage.maxTemp = maxTemps.length > 0 ? getMaxTemp(maxTemps).toFixed(2) : getMaxTemp(temps).toFixed(2);

}

function getLatestImage() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                document.getElementById("latestImage").src = xmlhttp.responseURL;
            } else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            } else {
                //alert('something else other than 200 was returned');
            }
        }
    };

    xmlhttp.open("GET", "/getImage/LatestImage", true);
    xmlhttp.send();
};

function loadTempData(config) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                document.getElementById("temps").innerHTML = xmlhttp.responseText;
                updateData();
                document.getElementById("curTemp").innerHTML = window.sessionStorage.curTemp + "&deg";
                document.getElementById("avgTemp").innerHTML = window.sessionStorage.avgTemp + "&deg";
                document.getElementById("maxTemp").innerHTML = window.sessionStorage.maxTemp + "&deg";
                window.myLine.update();
            } else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            } else {
                //alert('something else other than 200 was returned');
            }
        }
    };
    let query = "?graphSetting=" + globalOptions.graphSetting,      
        URL = config.count ? '/getTemps/' + config.count + query : '/getTemps/100' + query;
    xmlhttp.open('GET', URL, true);
    xmlhttp.send();
}


document.getElementById('buttonRefresh').addEventListener('click', function() {
    globalOptions.graphSetting = 'minute';
    globalOptions.heartbeatOn = true;
    loadTempData({days: 0, count: 6});
    window.sessionStorage.count = 0;
});

document.getElementById('buttonRefresh24h').addEventListener('click', function() {
    globalOptions.graphSetting = 'minute';
    globalOptions.heartbeatOn = true;
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 1);
    loadTempData({
        days: 1,
        startDate: curDate,
        count: 24
    });
    window.sessionStorage.count = 1;
});
document.getElementById('buttonRefresh2d').addEventListener('click', function() {
    globalOptions.graphSetting = 'hour';
    globalOptions.heartbeatOn = false;
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 2);
    loadTempData({
        days: 2,
        startDate: curDate,
        count: 48
    });
    window.sessionStorage.count = 2;
});
document.getElementById('buttonRefresh7d').addEventListener('click', function() {
    globalOptions.graphSetting = 'hour';
    globalOptions.heartbeatOn = false;
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 7);
    loadTempData({
        days: 7,
        startDate: curDate,
        count: 168
    });
    window.sessionStorage.count = 7;
});
document.getElementById('buttonRefreshAll').addEventListener('click', function() {
    globalOptions.graphSetting = 'day';
    globalOptions.heartbeatOn = false;
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 1);
    loadTempData({
        startDate: curDate,
        count: -1
    });
    window.sessionStorage.count = -1;
});

function fetchImage() {
    let oldSelected = document.querySelector('ul.imageList li.active');
    if (oldSelected && !!oldSelected) {
        oldSelected.classList.remove('active');
    }
    // $('ul.imageList .active').forEach((el) => {
    //     el.removeClass('active');
    // })
    this.classList.add('active');
    filename = this.innerText
    showImgLoadingMsg();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                document.getElementById("latestImage").src = xmlhttp.responseURL;
                hideImgLoadingMsg();
            } else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            } else {
                //alert('something else other than 200 was returned');
            }
        }
    };
    if (filename === 'Quality Image') {
        filename = 'quality'
    }
    xmlhttp.open("GET", "/getImage/" + filename, true);
    xmlhttp.send();
}


function heartbeat() {
    if (!globalOptions.heartbeatOn) {
        return;
    }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                let currentData = JSON.parse(document.getElementById("temps").innerHTML.replace("/", ""));
                let newData = JSON.parse(xmlhttp.responseText);
                currentData.unshift(newData[0]);
                document.getElementById("temps").innerHTML = JSON.stringify(currentData);
                updateData();
                document.getElementById("curTemp").innerHTML = window.sessionStorage.curTemp + "&deg";
                document.getElementById("avgTemp").innerHTML = window.sessionStorage.avgTemp + "&deg";
                document.getElementById("maxTemp").innerHTML = window.sessionStorage.maxTemp + "&deg";
                window.myLine.update();
            } else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            } else {
                //alert('something else other than 200 was returned');
            }
        }
    };
    let URL = '/heartbeat/' + Date.now();
    xmlhttp.open('GET', URL, true);
    xmlhttp.send();
}

function initialize() {
    window.sessionStorage.curTemp = 0;
    window.sessionStorage.avgTemp = 0;
    window.sessionStorage.maxTemp = 0;
    loadImageList();

};

function showImgLoadingMsg() {
    let loadingWrapper = document.getElementById('loadingWrapper');
    let spinner = document.getElementById('spinner');
    loadingWrapper.style.display = '';
    spinner.style.display = '';
};

function hideImgLoadingMsg() {
    let loadingWrapper = document.getElementById('loadingWrapper');
    let spinner = document.getElementById('spinner');
    loadingWrapper.style.display = 'none';
    spinner.style.display = 'none';
};

function loadImageList() {
    let htmlText = "";
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                let images = JSON.parse(xmlhttp.responseText);
                images.forEach(function(imageName) {
                    imageName = imageName.length > 4 ? imageName.substring(0,imageName.length - 4) : "";
                    htmlText += `<li class="imageListItem list-group-item list-group-item-action">`
                    htmlText += "<div>" + imageName + "</div>";
                    htmlText += "</li>";
                })
                $('ul.imageList')[0].innerHTML = htmlText;
                document.querySelectorAll('.imageList li')
                .forEach(e => e.addEventListener("click", fetchImage));
                $('ul.imageList :nth-child(1)').addClass('active');
            } else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            } else {
                //alert('something else other than 200 was returned');
            }
        }
    };
    let URL = '/getImages';
    xmlhttp.open('GET', URL, true);
    xmlhttp.send();

    
}


window.onload = function() {
    window.sessionStorage.count = 0;
    globalOptions.graphSetting = 'minute';
    loadTempData({ count: window.sessionStorage.count });
    getLatestImage();
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);
    initialize();
};

function refreshData() {
    loadTempData({ count: window.sessionStorage.count })
}

setInterval(heartbeat, 60000);

//setInterval(getLatestImage, 60000 * 5);