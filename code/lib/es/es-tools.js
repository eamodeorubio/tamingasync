"use strict";

var es = require('event-stream');

// Error treatment omitted for brevity!!!

function filter(filterFn) {
  return es.map(function (value, ret) {
    if (filterFn(value))
      return ret(null, value);
    ret();
  });
}

function each(sideEffect) {
  return es.mapSync(function (value) {
    sideEffect(value);
    return value;
  });
}

function changes() {
  var lastEvent;
  return filter(function (event) {
    if (lastEvent !== event) {
      lastEvent = event;
      return true;
    }
  });
};

function limitThroughput(throughputLimit) {
  if (throughputLimit <= 0)
    return;
  var MIN_INTERVAL = Math.round(1000 / throughputLimit),
      me,
      waiting,
      queuedEvent,
      queuedRet,
      lastEventEmitTime;

  function emitEvent(event) {
    lastEventEmitTime = Date.now();
    me.emit('data', event);
  }

  function checkTimeAndEmitEvent() {
    if (!waiting)
      return;
    if (Date.now() >= (lastEventEmitTime + MIN_INTERVAL)) {
      waiting = false;
      emitEvent(queuedEvent, queuedRet);
      queuedEvent = null;
    } else
      process.nextTick(checkTimeAndEmitEvent);
  }

  function queueEvent(event, ret) {
    queuedEvent = event;
    queuedRet = ret;
    if (!waiting) {
      waiting = true;
      process.nextTick(checkTimeAndEmitEvent);
    }
  }

  me = es.through(function (event) {
    if (lastEventEmitTime === undefined)
      emitEvent(event);
    else
      queueEvent(event);
  });

  return me;
}

module.exports = {
  each:each,
  filter:filter,
  changes:changes,
  limitThroughput:limitThroughput
};