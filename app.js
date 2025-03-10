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


async function isCodeValid(code) {
    const forbidden_codes = ["console", "shorten", "checkCode", "delete", "update"];
    if (forbidden_codes.includes(code)) {
        return false;
    }
    if (!/^[a-zA-ZÀ-ù0-9_-]+$/.test(code)) {
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
    const codeValidity = await isCodeValid(shortUrl);
    if (!codeValidity) {
        console.log('Invalid or already used code');
        return res.status(400).json({ error: 'Invalid or already used code.' });
    }
    console.log("URL to shorten :", longUrl);
    console.log("Hash of the URL :", shortUrl);

    try {
        let urlDoc = await encodedUrl.findOne({ longUrl: longUrl });
        // Check if the exact URL/code already exists in the database
        if ((urlDoc != null) && (urlDoc.shortUrl == shortUrl)) { 
            console.log('URL already exists in the database');
            return res.json({ shortUrl: urlDoc.shortUrl });
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
        const codeValidity = await isCodeValid(code);
        if (!codeValidity) {
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
    if (credentials && (credentials.name === CREDENTIAL_NAME) && (credentials.pass === CREDENTIAL_PASS)) {
        next();
    } 
    else {
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
            return res.status(404).json({ error: 'URL not found.' });
        }
        await encodedUrl.deleteOne({ shortUrl: shortUrl });
        console.log(`URL deleted: ${shortUrl}`);
        res.redirect('/console');
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Unknown error while deleting URL.' });
    }
});


app.post('/update', async (req, res) => {
    const { oldShortUrl, newShortUrl } = req.body;
    try {
        const urlDoc = await encodedUrl.findOne({ shortUrl: oldShortUrl });
        if (!urlDoc) {
            return res.status(404).json({ error: 'Original URL not found.' });
        }
        // Check if code is already in use
        const codeValidity = await isCodeValid(newShortUrl);
        if (!codeValidity) {
            return res.status(400).json({ error: 'Invalid or already used code.' });
        }
        await encodedUrl.updateOne({ shortUrl: oldShortUrl }, { $set: { shortUrl: newShortUrl } });
        res.json({ message: 'URL successfully updated.' });
    } 
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Unknown error while updating URL.' });
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
