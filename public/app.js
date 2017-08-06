'use strict';

(function(global){
  let learnjs = {
    applyObject: (obj, view) => {
      for(const key in obj) {
        view.find(`[data-name="${key}"]`).text(obj[key]);
      }
    },

    problemView: (number) => {
      number = Number(number);
      let view = $('.templates .problem-view').clone();
      const problem = learnjs.problems[number-1];
      const title = `Problem #${number}`;
      const resultFlush = view.find('.result');

      const checkAnswer = () => {
        const answer = view.find('.answer').val();
        const test = problem.code.replace('__', answer) + '; problem();';
        return eval(test);
      }

      const onClickCheckAnswer = () => {
        if(checkAnswer()) {
          const correctFlush = learnjs.buildCorrectFlush(number);
          learnjs.flushElement(resultFlush, correctFlush);
        } else {
          learnjs.flushElement(resultFlush, 'Incorrect!');
        }

        return false;
      }

      view.find('.check-btn').on('click', onClickCheckAnswer);
      view.find('.title').text(title);
      learnjs.applyObject(problem, view);

      if(number < learnjs.problems.length) {
        const skipButton = learnjs.templates('skip-btn');
        skipButton.find('a').attr('href', `#problem-${number+1}`);
        $('.nav-list').append(skipButton);
        view.bind('removingView', () => skipButton.remove());
      }

      return view;
    },

    landingView: () => {
      return learnjs.templates('landing-view');      
    },

    showView: (hash) => {
      const routes = {
        '': learnjs.landingView,
        '#': learnjs.landingView,
        '#problem': learnjs.problemView
      }
      const hashParts = hash.split('-');
      const viewFnc = routes[hashParts[0]];
      if(viewFnc) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFnc(hashParts[1]));
      }
    },

    appOnReady: () => {
      window.onhashchange = () => learnjs.showView(window.location.hash);
      learnjs.showView(window.location.hash);
    },

    buildCorrectFlush: (problemNumber) => {
      const correctFlush = learnjs.templates('correct-flush');
      const link = correctFlush.find('a');
      if(problemNumber < learnjs.problems.length) {
        link.attr('href', `#problem-${problemNumber+1}`);
      } else {
        link.attr('href', '');
        link.text('You\'re Fnished!');
      }

      return correctFlush;
    },

    flushElement: (elem, content) => {
      elem.fadeOut('fast', () => {
        elem.html(content);
        elem.fadeIn();
      });
    },

    templates: name => {
      return $(`.templates .${name}`).clone();
    },

    triggerEvent: (event, args) => {
      $('.view-container>*').trigger(event, args);
    }
  }

  learnjs.problems = [
    {
      description: 'What is truth?',
      code: 'function problem() { return __; }'
    },
    {
      description: 'Simple Math?',
      code: 'function problem() { return 42 === 6 * __; }'
    }
  ];

  global.learnjs = learnjs;
})(this);