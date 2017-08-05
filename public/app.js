'use strict';

let learnjs = (() => {
  return {
    problemView: (number) => {
      const title = `Problem #${number} Coming soon!`;
      return $('<div class="problem-view">').text(title);
    },
    showView: (hash) => {
      const routes = {
        '#problem': learnjs.problemView
      }
      const hashParts = hash.split('-');
      const viewFnc = routes[hashParts[0]];
      if(viewFnc) {
        $('.view-container').empty().append(viewFnc(hashParts[1]));
      }
    },
    appOnReady: () => {
      window.onhashchange = () => learnjs.showView(window.location.hash);
      learnjs.showView(window.location.hash);
    }
  }
})();