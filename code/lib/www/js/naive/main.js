var liveSearch = liveSearch || {};

(function (app, undefined) {
  "use strict";

  // Custom app logic

  app.boot = function () {
    // > Map keyup to text
    // > Trim search text
    // > Filter keyups that don't change the text
    // > Limit text changes rate to 2 changes/sec
    // > If the text becomes short, then clear UI
    // > If the text becomes short, then abort query
    // > Filter short queries
    // > Abort current search
    // > Clear the current results
    // > Clear any error message
    // > Show the user we are searching
    // > Launch a new search
    // < If a 'data' event append received result to UI
    // < If an 'end' event show the user the sea

    var ui = app.ui(),
        currentSearch,
        MIN_INTERVAL = 500,
        timeout,
        queuedEvent,
        lastEventEmitTime,
        lastText,
        currentSearchText;

    function limitThroughput(data, ret) {
      function emitEvent(event) {
        lastEventEmitTime = Date.now();
        ret(event);
      }

      function checkTimeAndEmitEvent() {
        if (Date.now() >= (lastEventEmitTime + MIN_INTERVAL)) {
          emitEvent(queuedEvent);
          timeout = null;
          queuedEvent = null;
        } else
          timeout = window.setTimeout(checkTimeAndEmitEvent, 0);
      }

      function queueEvent(event) {
        queuedEvent = event;
        if (!timeout)
          timeout = window.setTimeout(checkTimeAndEmitEvent, 0);
      }

      if (lastEventEmitTime === undefined)
        emitEvent(data);
      else
        queueEvent(data);
    }

    ui.searchInputText().keyup(function (event) {
      var text = event.target.value.trim();
      if (lastText !== text) {
        lastText = text;
        limitThroughput(text, function (searchTerm) {
          if (currentSearchText && currentSearchText.length >= 3) {
            if (!searchTerm || searchTerm.length < 3) {
              if (currentSearch) {
                currentSearch.abort();
                currentSearch = null;
              }
              ui.clearResults();
              ui.endSearching();
            }
          }
          currentSearchText = searchTerm;
          if (searchTerm && searchTerm.length >= 3) {
            ui.clearResults();
            ui.startSearching();
            currentSearch = app.search(searchTerm)
                .on('data', ui.appendResult.bind(ui))
                .on('end', ui.endSearching.bind(ui));
          }
        });
      }
    });
  }
}(liveSearch));