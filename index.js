var express = require('express');
var multer = require('multer');
var compression = require('compression');
const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");
var app = express();
const port = 3000;

let upload = multer({ dest: "./uploads/" });

var latestTemperature = null,
    lastTemperatureData = [];


function initialize() {
    getLatestTemperature(() => {});
    getTemperatureRange(60, () => {});
    getLatestImage();
    setTimeout(() => {
        getLatestTemperature(() => {});
    }, 6000);
}
initialize();
app.use(compression());

// Routes
// Homepage Dashboard
app.get('/', function(req, res) {
    const targetPath = path.join(__dirname, "public/html/home.html");
    res.sendFile(targetPath);
});

// Test
app.post('/test', function(req, res) {
    if (!req.body.datetime) {
        res.sendStatus(400);
    }
    console.log('ID is: ' + req.params.id);
    res.send('ID is: ' + req.params.id + '!');
})

// Upload temperature from Pi
app.post('/uploadTemp', express.json(), function(req, res) {
    if (!req.body.datetime) {
        res.sendStatus(400);
        return;
    }
    let dataDate;
    try {
        dataDate = new Date( Date.parse(req.body.datetime) );
    }
    catch (err) {
        res.status(400).send('Bad date format');
        console.log(err);
        return;
    }
    saveTemperature(req.body, function () {
        let logStr = 'Temp logged: ' + req.body.temperature + ' at ' + dataDate;
        res.text = logStr;
        res.body = logStr;
        res.status(200).send(logStr);
        console.log(logStr);
    }.bind(this),
    function (err) {
        res.status(400).send("Error saving temperature: " + '</br>' + err.message);
        console.log(err.message);
    })

})

// Upload image from Pi
app.post('/uploadImage', upload.single('image'), (req, res) => {
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "/uploads/" + req.file.originalname);
    if (path.extname(req.file.originalname).toLowerCase() === ".jpg") {
        fs.rename(tempPath, targetPath, err => {
            if (err) return handleError(err, res);
            res
                .status(200)
                .contentType("text/plain")
                .end("File uploaded!");
        });
    } else {
        fs.unlink(tempPath, err => {
            if (err) return handleError(err, res);
            res
                .status(403)
                .contentType("text/plain")
                .end("Only .jpg files are allowed!");
        });
    }
})

// Get image
app.get("/getImage/:fname", (req, res) => {
    filePath = path.join(__dirname, "uploads/", req.params.fname + ".jpg");
    try {
        res.sendFile(filePath);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Get list of images
app.get("/getImages", (req, res) => {
    let images = getListOfImages();
    res.send(JSON.stringify(images));
});

// Get latest temperature
app.get("/getTemp", (req, res) => {
    getLatestTemperature(() => {
        let results = latestTemperature ? latestTemperature : [{}];
        res.send(JSON.stringify(results));
    },
    function (err) {
        res.body = JSON.stringify(err);
        res.status(400).send(JSON.stringify(err));
    });

});

// Get latest temperature range
app.get("/getTemps/:range", (req, res) => {
    getTemperatureRange(req.params.range, function() {
        let results = lastTemperatureData ? lastTemperatureData : [{}];
        res.send(JSON.stringify(results));
    },
    function (err) {
        res.body = JSON.stringify(err);
        res.status(400).send(JSON.stringify(err));
    });

});

// Heartbeat
app.get("/heartbeat/:time", (req, res) => {
    let results = latestTemperature ? latestTemperature : [{}];
    res.send(JSON.stringify(results));
});

app.use("/static", express.static(path.join(__dirname, 'public')));

app.listen(port, function() {
    console.log(`App listening on port ${port}!`);
});

function getListOfImages() {
    let images = fs.readdirSync('./uploads/').map(file => (file));
    images.sort().reverse();
    return images;
}

function openDBConnection() {
    let conn = new sqlite3.Database('appDB.sqlite3');
    return conn;
}

function getLatestTemperature(successCallback, errorCallback = errorHandler) {
    let conn = openDBConnection(),
        sqlQuery = "SELECT Temperature, Datetime FROM Temperature ORDER BY TemperatureID DESC LIMIT 1;";
    conn.all(sqlQuery, (err, results) => {
        if (err) {
            errorCallback(err);
            return;
        }
        latestTemperature = results;
        successCallback();
    });
    conn.close();
}

function getTemperatureRange(range, successCallback, errorCallback = errorHandler) {
    let conn = openDBConnection(),
        sqlQuery;
    range = parseInt(range);
    if (range === -1){
        sqlQuery = "SELECT Temperature, Datetime FROM Temperature ORDER BY TemperatureID DESC;";
    }
    else {
        range = range > 2 ? range * 5 : 300;
        sqlQuery = `SELECT Temperature, Datetime FROM Temperature ORDER BY TemperatureID DESC LIMIT ${range};`
    } 
    conn.all(sqlQuery, function(err, results) {
            if (err) {
                errorCallback(err);
                return;
            }
            lastTemperatureData = results;
            successCallback();
        }.bind(this));
    conn.close();
}

function saveTemperature(temperature, successCallback, errorCallback = errorHandler) {
    let conn = openDBConnection();
    sqlQuery = `INSERT INTO Temperature (Temperature,Datetime) VALUES (${temperature.temperature},'${temperature.datetime}');`,
        conn.exec(sqlQuery, function(err, results) {
            if (err) {
                errorCallback(err);
                return;
            }
            latestTemperature = [{Temperature: temperature.temperature, Datetime: temperature.datetime}];
            successCallback();
        }.bind(this));
    conn.close();
}

function getLatestImage() {

}

function errorHandler(err) {
    console.log(err);
}