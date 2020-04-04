function insert(db, tweet) {
    db.collection('tweets').insertOne(tweet);
}

function list(db, isSelected) {
    db.collection('tweets')
        .find({
            selected: iisSelected || false,
            tweetedAt: -1
        })
        .sort({ createdAt: -1 })
        .toArray();
}

function mark(db, tid) {
    db.collection('tweets').updateOne
        ({ _id: ObjectId(tid) }, { tweetedAt: new Date() });
}
function count(db) {
    db.collection('tweets').countDocuments();
}

module.exports = { insert, list, mark, count };