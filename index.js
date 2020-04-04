const { MongoClient } = require('mongodb');
const RiTa = require('rita');
const RiTwit = require('ritwit');
const config = require('./config');
const stops = require('./stops');
const { insert, list, mark, count } = require('./dbfun');

const DbStr = 'mongodb://localhost:27017/haiqubot';
const DbOpts = { useNewUrlParser: true, useUnifiedTopology: true };
// to create colllection via mongo shell
// db.createCollection("tweets", { capped : true, size : 10000000, max : 1000 } );

// to list tweets by newest first
// db.getCollection('tweets').find({}).sort({ _id: -1 })

// TODO:
// pick a 'selected' on a timer a tweet it
// end on a RiTa verb or noun

let busy = false;
const rt = new RiTwit(config);
const tweetInterval = 10000;

MongoClient.connect(DbStr, DbOpts, (e, client) => {
  if (e) throw err;
  const db = client.db('haiqubot');
  rt.onTweetMatching('Quarantine', function (tweet) {
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
        count().then(num => {
          console.log('INSERT', tweet._id, tweet.haiku, num < 1000 ? num + '/1000' : '');
        }).catch((err) => {
          console.warn('Count', err);
        });
        busy = false;
      }).catch((err) => {
        console.warn('Insert', err);
      });
    }
  });
});

function fetchTweets(tweet) {

}

function publishTweet(tweet) {
  busy = true;
  if (0) {
    rt.tweet(tweet.haiku, e => {
      if (e) console.error('Insert', e);
    });
  }
  else {
    console.log('SENDING', tweet.haiku);
    setTimeout(() => {
      console.log('SENT', tweet.haiku);
      busy = false;
    }, 2000);
  }
}

// Prepare tweet for busy if ok, otherwise false
function cleanTweet(tweet) {
  let result = [], words = RiTa.tokenize(tweet);
  for (let i = 0; i < words.length; i++) {
    if (words[i] === '@') { i++; continue; }
    if (words[i].match(/^[';.?!;,"]$/)) continue;
    if (!words[i].match(/^[A-z]+$/)) return false;
    result.push(words[i]);
  }
  return RiTa.untokenize(result);
}

function validate(lines) {
  let lastLine = lines[lines.length - 1];
  let lastWords = RiTa.tokenize(lastLine);
  let lastWord = lastWords[lastWords.length - 1];
  //console.log('CHECK: ' + lines.join(' / '), lastWord);
  if (stops.includes(lastWord.toLowerCase())) {
    return console.log('REJECT ------------------------ ' + lines.join(' / '));
  }
  return true;
}

// Returns lines if matching the pattern, otherwise false
function matchSyllables(tweet, syllablesPerLine) {
  let lines = [], words = RiTa.tokenize(tweet);
  let targets = syllablesPerLine || [5, 7, 5];
  let sylCount = 0, targetIdx = 0, sliceStart = 0;
  if (words[0].startsWith('@')) words = words.shift();
  for (let j = 0; j < words.length; j++) {
    sylCount += RiTa.getSyllables(words[j]).split('/').length;
    let line = RiTa.untokenize(words.slice(sliceStart, j + 1));
    if (sylCount === targets[targetIdx]) {
      sylCount = 0;
      if (targetIdx <= 2) {
        lines.push(line[0].toUpperCase() + line.substring(1));
        sliceStart = j + 1;
        if (++targetIdx === targets.length) {
          if (validate(lines)) return lines; // success
        }
        continue;
      }
    }
    if (sylCount > targets[targetIdx] || j === words.length - 1) break;
  }
  return false;
}
