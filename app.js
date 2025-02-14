const express = require('express');
const mongoose = require('mongoose');
const auth = require('basic-auth');
const shortener = require('./backend/shortener');
const encodedUrl = require('./backend/config');
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const CREDENTIAL_NAME = process.env.CREDENTIAL_NAME;
const CREDENTIAL_PASS = process.env.CREDENTIAL_PASS;
mongoose.connect(
    MONGO_URI,
);

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());




app.get('/', async (req, res) => {
    res.render('index');
});


async function checkIfCodeValid(code) {
    const forbidden_codes = ["console", "shorten", "checkCode", "delete", "update"];
    if (forbidden_codes.includes(code)) {
        return false;
    }
    // Check if core are only composed of letters and numbers
    if (!/^[a-zA-Z0-9]+$/.test(code)) {
        return false;
    }
    const urlDoc = await encodedUrl.findOne({ shortUrl: code });
    if (urlDoc != null) {
        return false;
    }

    return true;
}


app.post('/shorten', async (req, res) => {
    const longUrl = req.body.longUrl;
    const code = req.body.code;
    let shortUrl = shortener.ShortenUrl(longUrl);
    if (code != "") {
        shortUrl = code;
    }
    if (!checkIfCodeValid(shortUrl)) {
        return res.status(400).send('Invalid code');
    }
    console.log("URL to shorten :", longUrl);
    console.log("Hash of the URL :", shortUrl);

    try {
        // Check if URL already exists
        let urlDoc = await encodedUrl.findOne({ longUrl: longUrl });
        if (urlDoc != null) {
            console.log('URL déjà raccourcie');
            return res.json({ shortUrl: shortUrl });
        }
        await encodedUrl.create({
            longUrl: longUrl,
            shortUrl: shortUrl,
            IpAdress: req.ip,
            formatedDate: shortener.formateDate(Date.now()),
        });
        console.log('URL registered to the database');
        res.json({ shortUrl: shortUrl });
    }
    catch (err) {
        console.log(err);
    }
});




app.post('/checkCode', async (req, res) => {
    const code = req.body.code;

    try {
        // Check if code already exists
        if (!checkIfCodeValid(code)) {
            return res.json({ codeExists: true });
        }
        console.log('Code available');
        res.json({ codeExists: false });
    }
    catch (err) {
        console.log(err);
    }
});


const authMiddleware = (req, res, next) => {
    const credentials = auth(req);
    if (credentials && credentials.name === CREDENTIAL_NAME && credentials.pass === CREDENTIAL_PASS) {
        next();
    } else {
        res.status(401);
        res.setHeader('WWW-Authenticate', 'Basic realm="Console"');
        res.end('Acces denied');
    }
};


app.use('/console', authMiddleware);
app.get('/console', async (req, res) => {
    const allDocs = await encodedUrl.find()
        .sort({ timestamp: -1 })
        .limit(100);
    res.render('console.ejs', { allDocs: allDocs });
});


app.post('/delete/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;

    try {
        const urlDoc = await encodedUrl.findOne({ shortUrl: shortUrl });
        if (!urlDoc) {
            return res.status(404).send('URL not found.');
        }
        await encodedUrl.deleteOne({ shortUrl: shortUrl });
        console.log(`URL deleted: ${shortUrl}`);
        res.redirect('/console');
    }
    catch (err) {
        console.log(err);
        res.status(500).send('Error while deleting URL.');
    }
});


app.post('/update', async (req, res) => {
    const { oldShortUrl, newShortUrl } = req.body;
    try {
        const urlDoc = await encodedUrl.findOne({ shortUrl: oldShortUrl });
        if (!urlDoc) {
            return res.status(404).send('Original URL not found.');
        }
        // Check if code is already in use
        if (!checkIfCodeValid(newShortUrl)) {
            return res.status(400).send('Invalid code');
        }
        await encodedUrl.updateOne({ shortUrl: oldShortUrl }, { $set: { shortUrl: newShortUrl } });
        res.json({ message: 'URL successfully updated.' });
    } catch (err) {
        console.log(err);
        res.status(500).send('Error while updating URL.');
    }
});


app.get('/:shortCode', async (req, res) => {
    const shortCode = (req.params.shortCode).toLowerCase();

    // Check if shortCode exists in the database
    const urlDoc = await encodedUrl.findOne({ shortUrl: shortCode });

    if (urlDoc != null) {
        urlDoc.visits++;
        urlDoc.save();
        const redirectUrl = /^https?:\/\//i.test(urlDoc.longUrl) ? urlDoc.longUrl : `https://${urlDoc.longUrl}`;
        res.redirect(redirectUrl);
    }
    else {
        console.log(`URL ${shortCode} not found in the database`);
        return res.status(404)
            .sendFile(__dirname + '/views/404.html');
    }
});




app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}\n`);
});