;(function() {

  var MAX_COLS = 5,
      FADE_DELAY = 10000,
      FADE_DUR = 500,
      WIPE_DELAY = Math.max(url.int('delay', 3000), 3000),
      wipers = [],
      termsByRegion,
      terms,
	  activeCategory,
      termIndex = 0,
      now,
	  first,
      lastUpdate,
      idleTimeout,
      matrixInitialized = false,
      matrix,
      matrixSelect,
      rows,
      cols,
      idleMouseTimer,
	  forceMouseHide = false,
	  cats = new Array("media_all","books_nl","books_en","music_all","dvd_all","toys_all","games_all","s_elec_all","computer_all","baby_all","kth_all","bph_all","garden_all","tools_all","pet_all","las_all","sto_all");

  init();

  function getTerms(p, callback) {
        var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var suggestions = [];
        var increment = 0;
        function addRequest(x) {
            var searchurl = "https://zoeksuggesties.s-bol.com/extern/qs/OpenSearchJSCB/search_suggestions_callback/"+cats[p]+"/";
            searchurl += str.charAt(x);
            $.ajax({
                async: true,
                type: "GET",
                dataType: 'jsonp',
                contentType: "application/json",
                success: callSuccess,
                error: function(e) {
                   console.log(e.message);
                },
                jsonpCallback: 'search_suggestions_callback',
                url: searchurl
            });
        }
        function callSuccess(data) {
            console.log(p);
            console.log('callSuccess',data[1]);
            suggestions.push(data[1][0]);
            increment++;
            if(increment != str.length) {
                addRequest(increment);
            } else {
                callback({ 0: suggestions });
            }
        }
        addRequest(0);
        function search_suggestions_callback(data) {
        }

  }

  function initializeMatrix() {

    matrix = generateMatrix(MAX_COLS, MAX_COLS);
    matrix.id = 'matrix';
    document.getElementById('matrix-container').appendChild(matrix);

    $(matrix).find('.cell').each(function() {
      wipers.push(new Wiper(this));
    });

    setMatrix(url.int('r', 1)-1, url.int('c', 1)-1);
	activeCategory = url.int('p', 0);
    setCategory();

  }

  function startLoop(wiper) {

    var delayedNext = function() {
		wiper.timeout = setTimeout(wiper.next, WIPE_DELAY);
    };

    wiper.next = function() {
		clearTimeout(wiper.timeout);
		wiper.show(terms[++termIndex%terms.length], cats[activeCategory], delayedNext);
    };

    wiper.next();
  }

  function forceNext() {
    _.each(wipers, function(w) {
      if (w.next) w.next();
    });
  }

  function update() {
    requestAnimationFrame(update);
    now = (+new Date());
    _.each(wipers, updateWiper);
    lastUpdate = now;
  }

  function updateWiper(w) {
    if (!w.disabled) w.update(now - lastUpdate);
  }

  function generateMatrix(rows, cols) {
    var m = document.createElement('div');
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = document.createElement('div');
        cell.classList.add('cell');
        m.appendChild(cell);
      }
    }
    return m;
  }

  function setMatrix(r, c) {

    rows = Math.max(Math.min(r, MAX_COLS-1), 0);
    cols = Math.max(Math.min(c, MAX_COLS-1), 0);

    $(matrix).find('.cell').each(function(k, v) {

      var col = Math.floor(k / MAX_COLS);
      var row = k % MAX_COLS;

      if (row > rows || col > cols) {

        wipers[k].disabled = true;
        v.style.display = 'none';

      } else {
        if (wipers[k].disabled) wipers[k].onTransitionEnd();

        wipers[k].disabled = false;
        v.style.top = (row) / (rows+1) * 100 + '%';
        v.style.left = (col) / (cols+1) * 100 + '%';
        v.style.width = 1 / (cols+1) * 101 + '%'; // hack for 1px line that shows up
        v.style.height = 1 / (rows+1) * 101 + '%';
        v.style.display = 'block';
      }
    });

    onResize();
    highlightRows(rows, cols, 'select');
  }

  function setCategory() {
	getTerms(activeCategory, function(t) {
		termsByRegion = t;
		setCategoryTerms(termsByRegion);

		lastUpdate = (+new Date());

		_.each(wipers, startLoop);

		update();
	});
  }
  function setCategoryTerms(termsByRegion) {
  	var termsRaw;
	// all regions
	if (activeCategory == 0 || !(activeCategory in termsByRegion)) {
	  termsRaw = _.flatten(termsByRegion);
	} else {
	  termsRaw = termsByRegion;
	}

	terms = _.shuffle(_.uniq(termsRaw));

	// Update display

	$selected = $("#category-select option[value='"+activeCategory+"']");
	$("#category-select").val(activeCategory);
	$("#category span").html($selected.html());

	$("#category-select").width($("#region span").width());

	forceNext();
	}

  function init() {

    if (!matrixInitialized) {
      matrixInitialized = true;
      initializeMatrix();
    }

    // Global resize
    $(window).bind('resize', _.debounce(onResize, 100));

    // Idle fade
    resetIdleTimeout();
    $(document.body).mousemove(function() {
      $('.idleable').fadeIn();
      resetIdleTimeout();
    });

    // Matrix selector
    matrixSelect = generateTable(MAX_COLS, MAX_COLS);
    matrixSelect.id = 'matrix-select';

    var matrixSelectShowing = false;
    var $matrixSelectContainer = $('#matrix-select-container');

    $matrixSelectContainer.prepend(matrixSelect);

    $(matrixSelect).find('td').each(function(k, v) {

      var col = Math.floor(k / MAX_COLS);
      var row = k % MAX_COLS;

      // Hover highlight
      $(this).bind('mousemove', function(e) {
        e.preventDefault();
        highlightRows(col, row, 'highlight');
        return false;
      });

      // Set matrix
      $(this).bind('click', function(e) {
        e.preventDefault();
        setMatrix(col, row);

        updateURL();

        matrixSelectShowing = false;
        $matrixSelectContainer.removeClass('showing');
        resetIdleTimeout();
        return false;
      });

    });


    var openMatrixSelect = function() {
      clearTimeout(idleTimeout);
      highlightRows(0, 0, 'highlight');
      matrixSelectShowing = true;
      $matrixSelectContainer.addClass('showing');
    };

    $('#matrix-button').bind('click', openMatrixSelect)
    if (!Modernizr.touch) {
      $('#matrix-button').bind('mouseenter', openMatrixSelect)
    }

    $matrixSelectContainer.bind('mouseleave', function() {
      matrixSelectShowing = false;
      $matrixSelectContainer.removeClass('showing');
    });

    var $categorySelect = $('#category-select');
    $('#category').prepend($categorySelect);

    // Alphabetize select.
    var items = $categorySelect.children('option.sort').get();
    items.sort(function(a, b) {
      var compA = $(a).text().toUpperCase();
      var compB = $(b).text().toUpperCase();
      return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
    });
    $.each(items, function(k, v) { $categorySelect.append(v); });

    $categorySelect.change(function() {
		activeCategory = $(this).val();
		setCategory();
		console.log('select');
		updateURL();
    });

    function resetIdleTimeout() {

      if (Modernizr.touch) return;

      clearTimeout(idleTimeout);

      idleTimeout = setTimeout(function() {
        $('.idleable').fadeOut(FADE_DUR);
      }, FADE_DELAY);

    }

    // if (url.boolean('neat')) {

      // $('body *:not(#matrix-container)').remove();
      // $('#matrix-container *:not(#matrix)').remove();

    // }

  }

  function generateTable(rows, cols) {

    var table = document.createElement('table');

    for (var r = 0; r < rows; r++) {
      var row = document.createElement('tr');
      table.appendChild(row);
      for (var c = 0; c < cols; c++) {

        var cell = document.createElement('td');
        row.appendChild(cell);

      }
    }

    return table;

  }

  function updateURL() {

    var args = {};
    if (rows != 0) args.r = rows+1;
    if (cols != 0) args.c = cols+1;
    if (activeCategory != 0) args.p = activeCategory;
    if (url.hl) args.hl = url.hl;

    var str = [];
    _.each(args, function(v, k) {
      str.push(k +'=' + v);
    })

    str = str.join('&');

    if (Modernizr.history) {
      history.replaceState({}, '', '?' + str);
    } else {
      window.location = '?' + str;
    }

    if (parent && parent.postMessage) {
      parent.postMessage('?' + str, "*");
    }

    // if (parent.document.updateUrl) {
    //   parent.document.updateUrl(rows+1, cols+1, activeCategory)
    // }

  }

  function onResize() {

    _.each(wipers, function(w) {
      w.onResize();
    });

  }


  function highlightRows(cols, rows, className) {

    $(matrixSelect).find('td').each(function(k, v) {

      var col = Math.floor(k / MAX_COLS);
      var row = k % MAX_COLS;

      if (col <= cols && row <= rows) {
        $(this).addClass(className);
      } else {
        $(this).removeClass(className);
      }

    });

  }

    $("body").mousemove(function(ev) {
            if(!forceMouseHide) {
                    $("body").css('cursor', '');

                    clearTimeout(idleMouseTimer);

                    idleMouseTimer = setTimeout(function() {
                            $("body").css('cursor', 'none');

                            forceMouseHide = true;
                            setTimeout(function() {
                                    forceMouseHide = false;
                            }, 200);
                    }, 1000);
            }
    });

})();
