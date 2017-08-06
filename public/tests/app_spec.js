describe('LearnJS', () => {
  it('can show a problem view', () => {
    learnjs.showView('#problem-1');
    expect($('.view-container .problem-view').length).toEqual(1);
  });

  it('shows the landing page view when there is no hash', () => {
    learnjs.showView('');
    expect($('.view-container .landing-view').length).toEqual(1);
  });

  it('passes the hash view parameter to the view function', () => {
    spyOn(learnjs, 'problemView');
    learnjs.showView('#problem-42');
    expect(learnjs.problemView).toHaveBeenCalledWith('42');
  });

  it('invokes the router when loaded', () => {
    spyOn(learnjs, 'showView');
    learnjs.appOnReady();
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('subscribes to the hash change event', () => {
    learnjs.appOnReady();
    spyOn(learnjs, 'showView');
    $(window).trigger('hashchange');
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('invisible skip button in landing page', () => {
    const view = learnjs.landingView();
    expect($('.nav-container .skip-btn').length).toEqual(0);
  });

  describe('problem view', () => {

    beforeEach(() => {
      this.view = learnjs.problemView('1');
    })

    it('has a title that includes the problem number', () => {
      expect(view.find('.title').text()).toEqual('Problem #1');
    });

    it('show the description', () => {
      expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
    });

    it('show the problem code', () => {
      expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
    });

    it('show the skip button', () => {
      expect($('.nav-container .skip-btn').length).toEqual(1);
    });
  });

  describe('answer section', () => {
    beforeEach(() => {
      this.view = learnjs.problemView('1');
      this.answerCorrect = () => {
        view.find('.answer').val('true');
        view.find('.check-btn').click();
      }
    });

    it('can check a correct answer by hitting a button', () => {
      answerCorrect();
      expect(view.find('.correct-flush a').length).toEqual(1);
    });

    it('can move next problem after answer correct', () => {
      const correctFlush = learnjs.buildCorrectFlush(1);
      const link = correctFlush.find('a');
      expect(link.attr('href')).toEqual('#problem-2');
    });

    it('move landing page after answer last problem', () => {
      const correctFlush = learnjs.buildCorrectFlush(learnjs.problems.length);
      const link = correctFlush.find('a');
      expect(link.attr('href')).toEqual('');
    });

    it('rejects an incorrect answer', () => {
      view.find('.answer').val('false');
      view.find('.check-btn').click();
      expect(view.find('.result').text()).toEqual('Incorrect!');
    });
  });
});