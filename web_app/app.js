const express = require("express");
const mysql = require("mysql2");
const ejs = require("ejs");

let app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const db = mysql.createConnection({
    database : "rossify",
    host: '10.211.55.3',
    //host: '127.0.0.1',
    user: 'root',
    password: ''
});

db.connect((err) => {
    if (err) {
        console.error('Errore di connessione al database:', err);
        return;
    }
    console.log('Connesso al database MySQL!');
});

const portNumber = 3000;
const ipAddress = "127.0.0.1";

app.get(['/', '/home'], (req, res) => {
    res.render('home', { } );
});

app.get('/cantanti', (req, res) => {

    const sql = "SELECT * FROM cantanti";
    db.query(sql, (err, results) => {

        console.log(results);

        res.render('cantanti', { cantanti: results });
    });
});

app.get('/albums', (req, res) => {
    res.render('albums', { } );
});

app.get('/stats', (req, res) => {
    res.render('stats', { } );
});

app.listen(portNumber, ipAddress, () => {
    console.log(`Server avviato su http://${ipAddress}:${portNumber}/`);
});

//res.setHeader('Set-Cookie',`sessionId=${sessionId}; HttpOnly`);
//token = crypto.randomBytes(16).toString('hex');