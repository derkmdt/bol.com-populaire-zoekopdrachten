;(function() {

  //var colors = ['#4285f4', '#db4437', '#f4b400', '#0f9d58'], //url.colors ? JSON.parse(url.colors) : ['#4285f4', '#db4437', '#f4b400', '#0f9d58'],
  var colors = ['#3366cc', '#99ccff', '#01a3a5', '#ea5518', '#9966cc','#6699ff'],
      transitions = {
        fromBottom: {
          before: [0, '100%'],
          after: [0, '-100%'],
          wrapper: [0, '4em']
        },
        fromTop: {
          before: [0, '-100%'],
          after: [0, '100%'],
          wrapper: [0, '-4em']
        },
        fromLeft: {
          before: ['-100%', 0],
          after: ['100%', 0],
          wrapper: ['-4em', 0]
        },
        fromRight: {
          before: ['100%', 0],
          after: ['-100%', 0],
          wrapper: ['4em', 0]
        }
      };

  var Wiper = function(container) {

    this.backgroundColors = _.shuffle(colors); //colors;

    this.container = container;

    this.a = new Pane();
    this.b = new Pane();

    this.pane = this.a;
    this.oldPane = this.b;
    
    this.typer = new Typer(_.bind(this.onCharacters, this));

    this.domElement = document.createElement('div');
    this.domElement.className = 'wiper';
    this.domElement.appendChild(this.a.domElement);
    this.domElement.appendChild(this.b.domElement);

    var _this = this;

    this.onTransitionEnd = function(e) {


      setOffset(_this.oldPane.domElement, 
                transitions[_this.transition].before[0], 
                transitions[_this.transition].before[1]);

      setOffset(_this.oldPane.wrapper, 
                transitions[_this.transition].wrapper[0], 
                transitions[_this.transition].wrapper[1]);

      _this.oldPane.wrapper.style.opacity = 0;

    };

    this.container.appendChild(this.domElement);
    this.onResize();

    this.shown = 0;
    this.selectRandomTransition();

  };


  Wiper.prototype.show = function(str, catx, onComplete) {

    onComplete = onComplete || _.identity;

    // bandaid for whiteflash
    this.container.style.backgroundColor = this.backgroundColors[this.shown%this.backgroundColors.length];

    this.shown++;

    var _this = this;

    if (this.pane == this.a) {
      this.pane = this.b;
      this.oldPane = this.a;
    } else {
      this.pane = this.a;
      this.oldPane = this.b;
    }

    // Check string for right-to-left characters
    this.pane.domElement.setAttribute('dir', 'ltr');
    for (var i = 0; i < str.length; i++) {
      if (isRTL(str.charCodeAt(i))) {
        this.pane.domElement.setAttribute('dir', 'rtl');
      }
    }

    this.oldPane.domElement.style.zIndex = 0;

    transitionOffset(this.oldPane.domElement, 
                     transitions[this.transition].after[0], 
                     transitions[this.transition].after[1], 
                     this.onTransitionEnd,
                     400);

    this.selectRandomTransition();

    this.pane.clear();
    this.pane.domElement.style.backgroundColor = this.backgroundColors[this.shown%this.backgroundColors.length];
    this.pane.domElement.style.zIndex = 1;
    this.pane.text.href = 'http://www.bol.com/nl/s/algemeen/zoekresultaten/Ntt/'+encodeURIComponent(str)+'/N/0/Nty/1/search/true/searchType/qck/sc/'+catx+'/index.html';

    transitionOffset(this.pane.domElement, 0, 0, undefined, 400);
    transitionOffset(this.pane.wrapper, 0, 0, undefined, 1150);

    var _this = this;

    this.pane.blinker.end();
    this.typer.start(str, function() {
      _this.pane.blinker.start();
      onComplete();
    });


  };

  Wiper.prototype.onCharacters = function(c) {
    this.pane.addCharacters(c);
  };

  Wiper.prototype.selectRandomTransition = function() {
    this.transition =_.first(_.shuffle(_.keys(transitions)));
  };

  Wiper.prototype.update = function(delta) {
    this.typer.update(delta);
  };

  Wiper.prototype.onResize = function() {
    this.domElement.style.fontSize = Math.round(Math.min(this.container.offsetWidth, this.container.offsetHeight) / 5.8) + 'px';
    this.pane.position();
  };

  var Pane = function() {
    
    this.domElement = document.createElement('div');
    this.domElement.classList.add('pane');

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('wrapper');

    // This is used to do vertical text centering.
    this.wrapper2 = document.createElement('div');
    this.wrapper2.classList.add('wrapper2');

    this.input = document.createElement('span');
    this.input.classList.add('input');

    this.text = document.createElement('a');
    this.text.target = '_blank';

    this.beam = document.createElement('span');
    this.beam.classList.add('beam');

    this.domElement.appendChild(this.wrapper);
    this.wrapper.appendChild(this.wrapper2);
    this.wrapper2.appendChild(this.input);

    this.input.appendChild(this.text);
    this.input.appendChild(this.beam);

    this.blinker = new Blinker(this.beam);

    this.isClear = true;
    this.centeringTransitionEnabled = true;

    this.lastCharacter = undefined;

    if (url.text) {
      this.text.style.color = url.text;
      this.beam.style.backgroundColor = url.text;
    }

  };

  Pane.prototype.addCharacters = function(c) {

    // Hack for this bug: http://returns.hawttrends.appspot.com/
    if (this.lastCharacter == ' ') {
      var _this = this;
      this.beam.style.display = 'none';
      _.defer(function() {
        _this.beam.style.display = 'inline-block';
      });
    }

    this.text.innerHTML += c;
    if (this.wrapper.style.opacity != 1) this.wrapper.style.opacity = 1;
    this.position();

    if (this.isClear) {
      this.isClear = false;
      this.enableCenteringTransition();
    }

    this.lastCharacter = c;

  };

  Pane.prototype.disableCenteringTransition = function() {
    this.centeringTransitionEnabled = false;
    this.wrapper2.classList.remove('transition');
  };

  Pane.prototype.enableCenteringTransition = function() {
    var _this = this;
    _.defer(function() {
      _this.centeringTransitionEnabled = true;
      _this.wrapper2.classList.add('transition');
    })
  };

  Pane.prototype.clear = function() {
    this.lastCharacter = undefined;
    this.text.innerHTML = '';
    this.disableCenteringTransition();
    this.isClear = true;
  };

  Pane.prototype.position = function() {
    var h = this.input.offsetHeight;
    if (h != this.lastInputHeight) {
      if (this.centeringTransitionEnabled) 
        transitionOffset(this.wrapper2, 0, -~~(h/2) + 'px', undefined, 400);
      else
        setOffset(this.wrapper2, 0, -~~(h/2) + 'px');
    }
    this.lastInputHeight = h;
  };

  window.Wiper = Wiper;

})();