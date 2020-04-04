
const { MongoClient } = require('mongodb');
const RiTa = require('rita');
const RiTwit = require('ritwit');
const config = require('./config');
const stops = require('./stops');

let busy = true;

// listen for tweets
const rt = new RiTwit(config);
rt.onTweetMatching('Quarantine', processTweet);

(async function () {
    let client;
    try {
        const dbStr = 'mongodb://localhost:27017/haiqubot';
        const dbOpts = { useNewUrlParser: true, useUnifiedTopology: true };
        client = await MongoClient.connect(dbStr, dbOpts);
        const db = client.db('haiqubot');

        let ready = await db.collection('tweets').find({ selected: true, tweetedAt: -1 }).sort({ created_at: -1 }).toArray();
        if (!ready.length) {
            ready = await db.collection('tweets').find({ selected: false, tweetedAt: -1 }).sort({ created_at: -1 }).toArray();
        }
        console.log(ready.length);
    } catch (err) {
        console.log(err.stack);
    }

    client && client.close();
})();


function processTweet(tweet) {
    if (busy) {
        console.log('[BUSY]');
        return;
    }
    if (tweet.retweeted_status) return; // no retweets
    if (tweet.lang !== 'en') return; // only english
    let text = cleanTweet(tweet.text);  // cleaning
    let haiku = text && matchSyllables(text, [5, 7, 5]);
    if (haiku) {
        busy = true;
        tweet.haiku = haiku.join(' / ');
        tweet.selected = false;
        tweet.tweetedAt = -1;
        insert(db, tweet).then(() => {
            count(db).then(num => {
                console.log('INSERT', tweet._id, tweet.haiku, num < 1000 ? num + '/1000' : '');
                busy = false;
            }).catch((err) => {
                console.error('Count', err);
                busy = false;
            });
        }).catch((err) => {
            console.error('Insert', err);
            busy = false;
        });
    }
}