// attempts to normalize transition strategies across browsers
// css3 transitions vs. $.animate
;(function() {
  
  // http://stackoverflow.com/questions/5023514/how-do-i-normalize-css3-transition-functions-across-browsers
  var VENDOR_TRANSITION_END = (function() {
    
    var el = document.createElement('fakeelement');
    var transitions = {
      'transition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd'
    };

    for (var t in transitions) {
      if (el.style[t] !== undefined) {
        return transitions[t];
      }
    }

  })();


  var transitionOffset = (function() {

    if (Modernizr.csstransitions && 
      !url.boolean('forceSoftware', url.boolean('screensaver'))) {

      console.log('Using CSS Transitions ' + VENDOR_TRANSITION_END);

      return function(el, x, y, callback) {

        if (callback) {

          var _callback = function() {
            callback.call(el);
            el.removeEventListener(VENDOR_TRANSITION_END, _callback, false);
          };

          el.addEventListener(VENDOR_TRANSITION_END, _callback, false);

        }

        // If CSS transitions are on, just set the offset.
        setOffset(el, x, y);

      }

    } else { 

      console.log('Using $.animate');

      return function(el, x, y, callback, dur) {

        $(el).stop().animate({
          left: x,
          top: y
        }, dur, 'easeOutExpo', callback);

      }

    }

  })();

  window.transitionOffset = transitionOffset;

})();