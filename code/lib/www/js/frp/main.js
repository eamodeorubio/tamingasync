var liveSearch = liveSearch || {};

(function (app, undefined) {
  "use strict";

  // Custom app logic
  function trimText(text) {
    return text.trim();
  }

  function shorterThan(minLength) {
    return function (text) {
      return text && text.length >= minLength;
    };
  }

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
    // < If an 'end' event show the user the search is finished

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

    function searchForSearchTerm(searchTerm) {
      return app.search(searchTerm);
    }

    function abortCurrentSearch() {
      if (currentSearch) {
        currentSearch.abort();
        currentSearch = null;
      }
    }

    var searchTerms = ui
        .searchInputText()
        .asEventStream('keyup')
        .map(".target.value")
        .map(trimText)
        .toProperty()
        .sample(500)
        .skipDuplicates()
        .doAction(abortSearchAndClearUIIfQueryBecameShorterThan(3))
        .filter(shorterThan(3));

    var searchResults = searchTerms
        .doAction(abortCurrentSearch)
        .doAction(ui.clearResults.bind(ui))
        .doAction(ui.startSearching.bind(ui))
        .map(searchForSearchTerm)
        .doAction(rememberCurrentSearch)
        .onValue(function (search) {
          search.on('data', ui.appendResult.bind(ui));
          search.on('end', ui.endSearching.bind(ui));
        });
  }
}(liveSearch));