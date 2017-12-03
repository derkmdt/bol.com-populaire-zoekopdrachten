// attempts to normalize offset (x,y) strategies across browsers
// translate3d, translate or left/top
;(function() {
  
  // http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
  var VENDOR_TRANSFORM = (function() {
    var el = document.createElement('p'), 
      transforms = {
        'webkitTransform':'-webkit-transform',
        // 'msTransform':'-ms-transform', // not using that because you don't have transitions ...
        // 'MozTransform':'-moz-transform', // doesn't honor their old prefixes ...
        // 'OTransform':'-o-transform', // doesn't honor their old prefixes ...
        'transform':'transform'
      };

    for (var t in transforms) {
      if (el.style[t] !== undefined) {
        return transforms[t];
      }
    }

  })();

  var setOffset = (function() {

    if (
      Modernizr.csstransitions && 
      Modernizr.csstransforms3d && 
      !url.boolean('forceSoftware', url.boolean('screensaver'))) {

      console.log('Using CSS 3D Transforms ' + VENDOR_TRANSFORM);

      return function(el, x, y) {
        el.style[VENDOR_TRANSFORM] = 'translate3d('+x+','+y+', 0)';
      }

    } else if (
      Modernizr.csstransitions && 
      Modernizr.csstransforms && 
      !url.boolean('forceSoftware', url.boolean('screensaver'))) { 

      console.log('Using CSS Transforms ' + VENDOR_TRANSFORM);

      return function(el, x, y) {
        el.style[VENDOR_TRANSFORM] = 'translate('+x+','+y+')';
      }

    } 

    console.log('Using left/top');

    return function(el, x, y) {
      el.style.left = x;
      el.style.top = y;
    }

  })();

  window.setOffset = setOffset;

})();