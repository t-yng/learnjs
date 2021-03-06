'use strict';

(function(global){
  let learnjs = {
    poolId: 'ap-northeast-1:f5a1be1a-6696-44ac-99c3-4ef5f4d144ba',

    applyObject: (obj, view) => {
      for(const key in obj) {
        view.find(`[data-name="${key}"]`).text(obj[key]);
      }
    },

    addProfileLink: (profile) => {
      const link = learnjs.templates('profile-link');
      link.find('a').text(profile.email);
      $('.signin-bar').prepend(link);
    },

    problemView: (number) => {
      number = Number(number);
      let view = $('.templates .problem-view').clone();
      const problem = learnjs.problems[number-1];
      const title = `Problem #${number}`;
      const resultFlush = view.find('.result');
      const answer = view.find('.answer');

      const checkAnswer = () => {
        const test = problem.code.replace('__', answer.val()) + '; problem();';
        return eval(test);
      }

      const onClickCheckAnswer = () => {
        if(checkAnswer()) {
          const correctFlush = learnjs.buildCorrectFlush(number);
          learnjs.flushElement(resultFlush, correctFlush);
          learnjs.saveAnswer(number, answer.val());
        } else {
          learnjs.flushElement(resultFlush, 'Incorrect!');
        }

        return false;
      }

      learnjs.fetchAnswer(number).then(data => {
        if(data.Item) {
          answer.val(data.Item.answer);
        }
      });

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
        '#problem': learnjs.problemView,
        '#profile': learnjs.profileView
      }
      const hashParts = hash.split('-');
      const viewFnc = routes[hashParts[0]];
      if(viewFnc) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFnc(hashParts[1]));
      }
    },

    profileView: () => {
      const view = learnjs.templates('profile-view');
      learnjs.identity.done(identity => {
        view.find('.email').text(identity.email);
      });
    },

    appOnReady: () => {
      window.onhashchange = () => learnjs.showView(window.location.hash);
      learnjs.showView(window.location.hash);
      learnjs.identity.done(learnjs.addProfileLink);
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
    },

    awsRefresh: () => {
      const deferred = new $.Deferred();
      AWS.config.credentials.refresh(err => {
        if(err) {
          deferred.reject(err);
        } else {
          deferred.resolve(AWS.config.credentials.identityId);
        }
      });

      return deferred.promise();
    },

    sendDbRequest: (req, retry) => {
      const promise = new $.Deferred();
      req.on('error', error => {
        if(error.code === 'CredentialsError') {
          learnjs.identity.then( identity => {
            return identity.refresh().then(
              () => retry(), 
              (error) => promise.reject(error));
          });
        }
        else {
          promise.reject(error);
        }
      });

      req.on('success', res => promise.resolve(res.data));

      req.send();
      return promise;
    },

    saveAnswer: (problemId, answer) => {
      return learnjs.identity.then(identity => {
        const db = new AWS.DynamoDB.DocumentClient();
        const item = {
          TableName: 'learnjs',
          Item:{
            userId: identity.id,
            problemId: problemId,
            answer: answer
          }
        };
        return learnjs.sendDbRequest(db.put(item), () => {
          return learnjs.saveAnswer(problemId, answer);
        });
      });
    },

    fetchAnswer: problemId => {
      return learnjs.identity.then(identity => {
        const db = new AWS.DynamoDB.DocumentClient();
        const item = {
          TableName: 'learnjs',
          Key: {
            userId: identity.id,
            problemId: problemId
          }
        };
        return learnjs.sendDbRequest(db.get(item), () => {
          return learnjs.fetchAnswer(problemId);
        })
      })
    },

    countAnswer: problemId => {
      return learnjs.identity.then(identity => {
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
          TableName: 'learnjs',
          Select: 'COUNT',
          FilterExpression: 'problemId = :problemId',
          ExpressionAttributeValues: {':problemId': problemId}
        };

        return learnjs.sendDbRequest(db.scan(params), () => {
          return learnjs.countAnswer(problemId);
        });
      });
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

  learnjs.identity = new $.Deferred();

  const refresh = () => {
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    })
    .then(userUpdate => {
      const creds = AWS.cofig.credentials;
      const newToken = userUpdate.getAuthResponse().id_token;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh();
    });
  }

  global.learnjs = learnjs;
  global.googleSignIn = (googleUser) => {
    const id_token = googleUser.getAuthResponse().id_token;
    AWS.config.update({
      region: 'ap-northeast-1',
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: learnjs.poolId,
        Logins: {
          'accounts.google.com': id_token
        }
      })
    });

    learnjs.awsRefresh()
    .then(id => {
      learnjs.identity.resolve({
        id: id,
        email: googleUser.getBasicProfile().getEmail(),
        refresh: refresh
      });
    });
  }
})(this);