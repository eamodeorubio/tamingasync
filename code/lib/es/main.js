"use strict";

// Core Event-Stream
var es = require('event-stream'),
    domstream = require('domnode-dom'),
    pipe = es.pipeline,
    map = es.mapSync;

// Generic but useful tools not included in the core of
var tools = require('./es-tools'),
    forEach = tools.each,
    filter = tools.filter,
    changes = tools.changes,
    limitThroughput = tools.limitThroughput;

// Custom application logic
// > Map keyup to text
// > Trim search text
// > Filter keyups that don't change the text
// > Limit text changes rate to 2 changes/sec
// > If the text becomes short, then clear UI
// > If the text becomes short, then abort query
// > Filter short queries
// > Abort current search
// > Clear the current results
// > Show the user we are searching
// > Launch a new search
// < If a 'data' event append received result to UI
// < If an 'end' event show the user the search is finished

function searchTextShorterThan(minLength) {
  return function (searchText) {
    return searchText && searchText.length >= minLength;
  };
}

function boot(app) {
  var ui = app.ui(),
      currentSearch;

  function abortSearchAndClearUIIfQueryBecameShorterThan(minLength) {
    var currentText;
    return function (searchText) {
      if (currentText && currentText.length >= minLength) {
        if (!searchText || searchText.length < minLength) {
          abortCurrentSearch();
          ui.clearResults();
          ui.endSearching();
        }
      }
      currentText = searchText;
    }
  }

  function rememberCurrentSearch(search) {
    currentSearch = search;
  }

  function searchTermsToSearches(searchTerm) {
    return app.search(searchTerm);
  }

  function abortCurrentSearch() {
    if (currentSearch) {
      currentSearch.abort();
      currentSearch = null;
    }
  }

  var searchTermStreams =
      pipe(
          domstream.createReadStream(ui.searchInputText()[0], 'keyup'),
          changes(),
          limitThroughput(2),
          forEach(abortSearchAndClearUIIfQueryBecameShorterThan(3)),
          filter(searchTextShorterThan(3))
      );

  pipe(
      searchTermStreams,
      forEach(abortCurrentSearch),
      forEach(ui.clearResults.bind(ui)),
      forEach(ui.startSearching.bind(ui)),
      map(searchTermsToSearches),
      forEach(rememberCurrentSearch),
      forEach(function (search) {
        search.on('data', ui.appendResult.bind(ui));
      }),
      forEach(function (search) {
        search.on('end', ui.endSearching.bind(ui));
      })
  );
}

$(function () {
  boot(liveSearch);
});