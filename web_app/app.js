const express = require("express");
const mysql = require("mysql2");
const ejs = require("ejs");
const crypto = require('crypto');

let app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const db = mysql.createConnection({
    database : "rossify",
    host: '10.211.55.3',
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

    let email = getEmailFromCookie(req);

    if(email) {
        db.query("SELECT * FROM utenti WHERE email = ?", [ email ],
        (err, results) => {
            if(err) {
                console.log(err);
            } else {
                const nomeUtente = results[0].nome + " " + results[0].cognome;
                res.render('home', { nomeUtente: nomeUtente } );
            }
        });
    } else {
        res.render('home', { nomeUtente: "" } );
    }
});

app.get('/cantanti', (req, res) => {

    const sql = "SELECT * FROM cantanti";
    db.query(sql, (err, results) => {
        res.render('cantanti', { cantanti: results });
    });
});

app.get('/albums', (req, res) => {
    const sql = "SELECT * FROM album";
    db.query(sql, (err, results) => {
        res.render('albums', { album: results });
    });
});

app.get('/new-album', (req, res) => {

    let email = getEmailFromCookie(req);

    if(email) {
        db.query("SELECT * FROM utenti WHERE email = ?", [ email ],
        (err, results) => {
            if(err) {
                console.log(err);
            } else {
                const nomeUtente = results[0].nome + " " + results[0].cognome;
                res.render('albums_add', { nomeUtente: nomeUtente } );
            }
        });
    }
});

app.get('/login', async (req, res) => {
    res.render('login', { } );
});

let sessions = {};

function authMiddleware(req, res, next) {

    if(getEmailFromCookie(req)){
        next();
    } else {
        res.status(401).send("User not logged");
    }
}

function getEmailFromCookie(req) {

    let cookie = req.headers.cookie;
    if(!cookie) return "";
    let cookiArr = cookie.split("=");
    let email = sessions[cookiArr[1]];

    return email;
}

app.get('/protected', authMiddleware, (req, res) => {

    db.query("SELECT * FROM utenti WHERE email = ?", [ getEmailFromCookie(req) ],
    (err, results) => {
        if(err) {
            console.log(err);
        } else {
            const nomeUtente = results[0].nome + " " + results[0].cognome;
            res.render('protected', { nomeUtente: nomeUtente } );
        }
    });
});

app.post('/login', (req, res) => {

    const email = req.body.email;
    const password = req.body.password;

    let params = [ email, password ];

    const sql = "SELECT * FROM utenti WHERE email = ? AND password = password(?)";
    db.query(sql, params, (err, results) => {

        if(err) {
            console.log(err);
        } else {
            if(results.length > 0) {

                let token;
                do{
                    token = crypto.randomBytes(16).toString('hex');
                } while(sessions[token] != undefined);

                sessions[token] = email;

                res.setHeader('Set-Cookie', 'sessionId=' + token + '; HttpOnly');
            }

            res.redirect('/home');
        }
    });
});

app.get('/logout', (req, res) => {

    let cookie = req.headers.cookie;
    let cookiArr = cookie.split("=");

    delete sessions[cookiArr[1]];

    res.redirect('/login');
});

app.post('/new-album', (req, res) => {

    const titolo = req.body.titolo;
    const anno = parseInt(req.body.anno);
    const genere = req.body.genere;
    const cantante = parseInt(req.body.cantante);

    let sql = "INSERT INTO album VALUES(null, ?, ?, ?, ?)";

    let params = [titolo, anno, genere, cantante];

    db.query(sql, params, (err, results) => {

        if(err){
            console.log(err);
        } else {
            res.render('albums_add', { } );
        }
    });
});

app.get('/stats', (req, res) => {
    
    const sql = "SELECT count(*) as conta FROM cantanti";
    db.query(sql, (err, results) => {

        const cantantiTot = results[0].conta;

        db.query("SELECT count(*) as conta FROM cantanti where genere = 'F'", (err, results) => {

            const cantantiF = results[0].conta;

            db.query("SELECT avg(numero_like) as media FROM canzoni", (err, results) => {

                const mediaLike = results[0].media;
    
                db.query("SELECT titolo FROM canzoni ORDER BY numero_like DESC LIMIT 1", (err, results) => {

                    const titoloLikeMaggiore = results[0].titolo;
        
                    db.query("SELECT count(*) as conta FROM canzoni where titolo like '%od%'", (err, results) => {

                        const canzoniOD = results[0].conta;
            
                        res.render('stats', { cantantiTot: cantantiTot,
                            cantantiF: cantantiF,
                            mediaLike: parseInt(mediaLike),
                            titoloLikeMaggiore: titoloLikeMaggiore,
                            canzoniOD: canzoniOD
                        });
                    });
                });
            });
        });
    });
});

app.listen(portNumber, ipAddress, () => {
    console.log(`Server avviato su http://${ipAddress}:${portNumber}/`);
});