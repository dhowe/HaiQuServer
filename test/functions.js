let { expect } = require('chai');
const { MongoClient } = require('mongodb');
let { insert, list, mark, count } = require('../dbfun');

describe('Db', () => {
    const DbStr = 'mongodb://localhost:27017/haiqubot';
    const DbOpts = { useNewUrlParser: true, useUnifiedTopology: true };
    MongoClient.connect(DbStr, DbOpts, (e, client) => {
        console.log('connected');

        const db = client.db('haiqubot');
        console.log('db');
        it('Should eval simple expressions', (done) => {
            console.log('in it()');
            list(db).then((num) => {
                console.log('Found ' + num);
                expect(num).gte(0);
                done();
            });
        });
    });
});