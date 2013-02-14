var fpToolkit = fpToolkit || {};

(function (ns, undefined) {
  "use strict";
  // Error treatment omitted for brevity!!!

  var identity = ns.identity = function (event, ret) {
    ret(event);
  };

  var compose = ns.compose = function (fn1, fn2) {
    if (fn1 === identity)
      return fn2;
    if (fn2 === identity)
      return fn1;
    return function (event, ret) {
      return fn1(event, function (resultingEv) {
        return fn2(resultingEv, ret);
      });
    };
  };

  var pipe = ns.pipe = function (fns) {
    if (!fns || fns.length == 0)
      return;
    if (fns.length == 1)
      return fns[0];
    return fns.reduce(compose);
  };

  var map = ns.map = function (fn, mapperFn) {
    if (arguments.length === 1) {
      mapperFn = fn;
      fn = identity;
    }
    return compose(fn, function (event, ret) {
      return ret(mapperFn(event));
    });
  };

  var filter = ns.filter = function (fn, filterFn) {
    if (arguments.length === 1) {
      filterFn = fn;
      fn = identity;
    }
    return compose(fn, function (event, ret) {
      if (filterFn(event))
        ret(event);
    });
  };

  var each = ns.each = function (fn, sideEffect) {
    if (arguments.length === 1) {
      sideEffect = fn;
      fn = identity;
    }
    return compose(fn, function (event, ret) {
      try {
        sideEffect(event);
      } finally {
        if (ret)
          ret(event);
      }
    });
  };

  var changes = ns.changes = function (fn) {
    if (!fn)
      fn = identity;
    var lastEvent;
    return filter(fn, function (event) {
      if (lastEvent !== event) {
        lastEvent = event;
        return true;
      }
    });
  };

  var limitThroughput = ns.limitThroughput = function (fn, throughputLimit) {
    if (arguments.length === 1) {
      throughputLimit = fn;
      fn = identity;
    }
    if (throughputLimit <= 0)
      return;
    var MIN_INTERVAL = Math.round(1000 / throughputLimit),
        timeout,
        queuedEvent,
        queuedRet,
        lastEventEmitTime;

    function emitEvent(event, ret) {
      lastEventEmitTime = Date.now();
      ret(event);
    }

    function checkTimeAndEmitEvent() {
      if (Date.now() >= (lastEventEmitTime + MIN_INTERVAL)) {
        emitEvent(queuedEvent, queuedRet);
        timeout = null;
        queuedEvent = null;
      } else
        timeout = window.setTimeout(checkTimeAndEmitEvent, 0);
    }

    function queueEvent(event, ret) {
      queuedEvent = event;
      queuedRet = ret;
      if (!timeout)
        timeout = window.setTimeout(checkTimeAndEmitEvent, 0);
    }

    return compose(fn, function (event, ret) {
      if (lastEventEmitTime === undefined)
        emitEvent(event, ret);
      else
        queueEvent(event, ret);
    });
  };
}(fpToolkit));