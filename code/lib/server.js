"use strict";

var mongoClient = require('mongodb'),
    express = require('express'),
    config = require('konphyg')(__dirname + '/../config')('settings'),
    port = config.port,
    Emitter = require('events').EventEmitter,
    uriPrefix = 'http://localhost:' + port + '/pics/',
    dbConnectionString = config.dbString,

    delay = config.delay;

function sendToClient(res) {
  return function (ev) {
    res.write('event: ' + ev.type + '\n');
    if (!ev.data)
      ev.data = '';
    res.write('data: ' + JSON.stringify(ev.data) + '\n');
    res.write('\n\n');
  }
}

mongoClient.connect(dbConnectionString, function (err, db) {
  if (err) return console.log(dbConnectionString, err);

  var items = db.collection('items'),
      app = express();

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

    stream = items.find({
      $and: conditions
    }).stream();

    function resume() {
      if (stream)
        stream.resume();
    }

    stream
        .on('data',function (item) {
          if (!stream)
            return;
          emitter.emit('message', {
            type: 'data',
            data: {
              img: uriPrefix + item.filename,
              description: item.description
            }
          });
          stream.pause();
          setTimeout(resume, Math.round(Math.random() * delay));
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

  app
      .use(express.compress())
      .use(express.static(__dirname + "/www/"))
      .use(express.logger('dev'));

  app.get('/search', function (req, res) {
    var searchText = req.param('q');
    searchText = searchText ? searchText.trim() : '';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('\n');

    var query = openQuery(searchText)
        .onMessage(sendToClient(res));
    req
        .on('close', query.abort)
        .on('error', query.abort);
    res
        .on('close', query.abort)
        .on('error', query.abort);
  });

  app.listen(port, function (err) {
    if (err)
      return console.log(err);
    console.log('Ready at', port);
  });
});