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

var config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature',
            backgroundColor: 'rgb(0, 0, 0)',
            borderColor: 'rgb(0, 0, 0)',
            pointRadius: 1,
            fill: {
                target: { value: 24.5 },
                above: window.chartColors.orange, // Area will be red above the origin
                below: window.chartColors.blue // And blue below the origin
            }
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
    var temps = [];
    var times = [];
    tempData.forEach(function(row) {
        temps.push(Number(row.Temperature));
        times.push( (new Date(Date.parse(row.Datetime))).toLocaleString('en-US', { hour12: false}) );
    })
    temps.reverse();
    times.reverse();
    config.data.datasets[0].data = temps;
    config.data.labels = times;
    window.sessionStorage.curTemp = Number(temps.slice(-1)[0]).toFixed(2);
    window.sessionStorage.avgTemp = Number(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2);
    window.sessionStorage.maxTemp = getMaxTemp(temps).toFixed(2);

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
    let URL = config.count ? '/getTemps/' + config.count : '/getTemps/100'
    xmlhttp.open('GET', URL, true);
    xmlhttp.send();
}


document.getElementById('buttonRefresh').addEventListener('click', function() {
    loadTempData({});
    window.sessionStorage.count = 0;
});

document.getElementById('buttonRefresh24h').addEventListener('click', function() {
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 1);
    loadTempData({
        startDate: curDate,
        count: 288
    });
    window.sessionStorage.count = 1;
});
document.getElementById('buttonRefresh2d').addEventListener('click', function() {
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 2);
    loadTempData({
        startDate: curDate,
        count: 576
    });
    window.sessionStorage.count = 2;
});
document.getElementById('buttonRefresh7d').addEventListener('click', function() {
    let curDate = new Date();
    curDate.setDate(curDate.getDate() - 7);
    loadTempData({
        startDate: curDate,
        count: 1008
    });
    window.sessionStorage.count = 7;
});
document.getElementById('buttonRefreshAll').addEventListener('click', function() {
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