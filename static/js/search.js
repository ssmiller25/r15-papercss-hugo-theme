// search.js - Fuzzy search logic for Hugo site
// Uses Fuse.js for fuzzy searching

// Load Fuse.js from CDN
(function loadFuseJs() {
  if (!window.Fuse) {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.min.js';
    script.onload = initSearch;
    document.head.appendChild(script);
  } else {
    initSearch();
  }
})();

function initSearch() {
  var searchInput = document.getElementById('search-box');
  var resultsDiv = document.getElementById('search-results');
  if (!searchInput || !resultsDiv) return;
  // Hide results box initially
  resultsDiv.classList.add('is-hidden');

  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      var fuse = new Fuse(data, {
        keys: ['title', 'summary'],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2
      });

      searchInput.addEventListener('input', function() {
        var query = searchInput.value.trim();
        if (!query) {
          resultsDiv.innerHTML = '';
          resultsDiv.classList.add('is-hidden');
          return;
        }
        var results = fuse.search(query);
        resultsDiv.classList.remove('is-hidden');
        resultsDiv.innerHTML = '';
        if (results.length === 0) {
          var empty = document.createElement('p');
          empty.textContent = 'No results found.';
          resultsDiv.appendChild(empty);
          return;
        }
        results.forEach(function(result) {
          var item = result.item;
          var entry = document.createElement('div');
          entry.className = 'search-result';

          var link = document.createElement('a');
          link.href = item.url;
          var strong = document.createElement('strong');
          strong.textContent = item.title;
          link.appendChild(strong);

          var summary = document.createElement('span');
          summary.textContent = item.summary;

          entry.appendChild(link);
          entry.appendChild(document.createElement('br'));
          entry.appendChild(summary);
          resultsDiv.appendChild(entry);
        });
      });
    })
    .catch(function(err) {
      resultsDiv.classList.remove('is-hidden');
      resultsDiv.innerHTML = '';
      var error = document.createElement('p');
      error.textContent = 'Error loading search index.';
      resultsDiv.appendChild(error);
    });
}
