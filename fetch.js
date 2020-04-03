let RiTa = require('rita');
let RiTwit = require('ritwit');
let config = require('./config');

let rt = new RiTwit(config);

// Listen for tweets matching keyword
rt.onTweetMatching('Quarantine', function (tweet) {
  if (tweet.retweeted_status) return; // no retweets
  if (tweet.lang !== 'en') return; // only english
  let text = cleanTweet(tweet.text);  // cleaning
  let haiku = text && matchSyllables(text, [5, 7, 5]);
  if (haiku) console.log('\n' + haiku.join('\n'));
});

// Prepare tweet for processing if ok, otherwise false
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
        if (++targetIdx === targets.length) return lines; // success
        continue;
      }
    }
    if (sylCount > targets[targetIdx] || j === words.length - 1) break;
  }
  return false;
}

