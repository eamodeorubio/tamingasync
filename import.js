"use strict";

var mongoClient = require('mongodb'),
    http = require('http'),
    fs = require('fs'),
    config = require('konphyg')(__dirname + '/../config')('settings'),
    Emitter = require('events').EventEmitter,
    uriPrefix = config.urlPrefix,
    dbConnectionString = config.dbString,
    port = config.port,
    delay = config.delay;

function download(src, name) {
  http.get(src,function (res) {
    res.pipe(fs.createWriteStream(__dirname + '/../db/pics/' + name));
  }).on('error', function (e) {
        console.log("Got error: " + e.message);
      });
}

mongoClient.connect('mongodb://localhost:27017/sample?w=1', function (err, localdb) {
  if (err) return console.log('Error connecting to local db', err);

  var items = localdb.collection('items');

  console.log('Openned connection to local');

  function saveToLocal(ev) {
    if (ev.type !== 'data')
      return;
    var data = ev.data;
    console.log('Saving ' + data.filename);
    items.update({
      filename: data.filename
    }, {
      filename: data.filename,
      description: data.description
    }, {
      upsert: true,
      w: 1,
      safe: true
    }, function (err) {
      if (err) return console.log('Error saving to db', data.filename, err);
      console.log('Saved to db', data.filename);
    });
    download(data.img, data.filename);
  }

  mongoClient.connect(dbConnectionString, function (err, db) {
    if (err) return console.log(dbConnectionString, err);

    var hhs = db.collection('hhs');

    console.log('Openned connection ', dbConnectionString);

    function openQuery(searchText) {
      var emitter = new Emitter(),
          keywords = searchText.split(/\b/),
          conditions = keywords.map(function (word) {
            return {
              description: {
                $regex: word.toLowerCase(),
                $options: 'i'
              }
            };
          }),
          stream,
          me;

      stream = hhs.find({
        $or: conditions
      }).stream();

      stream
          .on('data',function (item) {
            if (!stream)
              return;
            emitter.emit('message', {
              type: 'data',
              data: {
                filename: item.filename,
                img: uriPrefix + item.filename,
                description: item.description
              }
            });
          }).on('error',function (err) {
            if (!stream)
              return;
            console.log(err);
            emitter.emit('message', {
              type: 'error',
              data: err
            });
            emitter.emit('message', {
              type: 'end'
            });
          }).on('close', function () {
            emitter.emit('message', {
              type: 'end'
            });
            stream = null;
          })
          .on('end', function () {
            emitter.emit('message', {
              type: 'end'
            });
            stream = null;
          });

      return me = {
        onMessage: function (listener) {
          emitter.on('message', listener);
          return me;
        },
        abort: function () {
          if (stream) {
            stream.destroy();
            stream = null;
          }
        }
      };
    }

    var query = openQuery('red black bag shoe shirt umbrella hat ring')
        .onMessage(saveToLocal)
        .onMessage(function (ev) {
          if (ev.type === 'error') {
            console.log('Error', ev.data);
          }
        }).onMessage(function (ev) {
          if (ev.type === 'end') {
            console.log('END ++++++++++++++++++++++++++++++++++++++++++++++++++');
          }
        });
  });
});