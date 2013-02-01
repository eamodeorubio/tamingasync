var liveSearch = liveSearch || {};

(function (app, undefined) {
  "use strict";

  // Custom app logic
  function trimmedEventTargetText(event) {
    return event.target.value.trim();
  }

  function searchTextShorterThan(minLength) {
    return function (searchText) {
      return searchText && searchText.length >= minLength;
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

    var searchTermObservable = ui
        .searchInputText()
        .keyupAsObservable()
        .select(trimmedEventTargetText)
        .distinctUntilChanged()
        .sample(500)
        .doAction(abortSearchAndClearUIIfQueryBecameShorterThan(3))
        .where(searchTextShorterThan(3));

    var searchResults = searchTermObservable
        .doAction(abortCurrentSearch)
        .doAction(ui.clearResults.bind(ui))
        .doAction(ui.startSearching.bind(ui))
        .select(searchForSearchTerm)
        .doAction(rememberCurrentSearch)
        .doAction(function (search) {
          search.on('data', ui.appendResult.bind(ui));
        })
        .doAction(function (search) {
          search.on('end', ui.endSearching.bind(ui));
        });

    searchResults.subscribe();
  }
}(liveSearch));