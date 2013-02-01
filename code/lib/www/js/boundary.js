var liveSearch = liveSearch || {};

(function (ns, $, undefined) {
  "use strict";
  ns.search = function (text) {
    var dataSource = new EventSource('search?q=' + text);
    dataSource.addEventListener('end', function () {
      dataSource.close();
    });

    return {
      on:function (event, listener) {
        if (event === 'data') {
          dataSource.addEventListener(event, function (event) {
            listener(JSON.parse(event.data));
          });
        } else if (event === 'error' || event === 'end')
          dataSource.addEventListener(event, listener);
        return this;
      },
      abort:function () {
        if (dataSource) {
          dataSource.close();
          dataSource = null;
        }
      }
    };
  };
  ns.ui = function () {
    return {
      searchInputText:function () {
        return $('.search-box input');
      },
      startSearching:function () {
        $('.search-progress').show();
        return this;
      },
      endSearching:function () {
        $('.search-progress').hide('fast');
        return this;
      },
      clearResults:function () {
        $('.result-box .result-item')
            .not('.search-progress')
            .remove();
        return this;
      },
      appendResult:function (data) {
        $('.result-box .search-progress')
            .before(
            '<figure class="result-item">' +
                '<div><img src="' + data.img + '"></div>' +
                '<figcaption>' + data.description + '</figcaption>' +
                '</figure>');
        return this;
      }
    };
  };
}(liveSearch, window.Zepto || window.jQuery));