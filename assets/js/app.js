$(document).ready(function() {

  'use strict';

  // =====================
  // Koenig Gallery
  // =====================

  replaceAccented();

  function replaceAccented(){
  var e = document.getElementsByTagName('*'), l = e.length, i;
  if( typeof getComputedStyle == "undefined")
      getComputedStyle = function(e) {return e.currentStyle;};
  for( i=0; i<l; i++) {
      if( getComputedStyle(e[i]).textTransform == "uppercase") {
          // do stuff with e[i] here.
          e[i].innerHTML = greekReplaceAccented(e[i].innerHTML);
      }
    }
  }
  
  function greekReplaceAccented(str) {
      var charList = {'Ά':'Α','ά':'α','Έ':'Ε','έ':'ε','Ή':'Η','ή':'η','Ί':'Ι','ί':'ι','ΐ':'ϊ','Ό':'Ο'
                                  ,'ό':'ο','Ύ':'Υ','ύ':'υ','ΰ':'ϋ','Ώ':'Ω','ώ':'ω','ς':'Σ' 
      };
      return str.replace(/./g, function(c) {return c in charList? charList[c] : c}) ;
  }

  var gallery_images = document.querySelectorAll('.kg-gallery-image img');

  gallery_images.forEach(function (image) {
    var container = image.closest('.kg-gallery-image');
    var width = image.attributes.width.value;
    var height = image.attributes.height.value;
    var ratio = width / height;
    container.style.flex = ratio + ' 1 0%';
  });

  // =====================
  // Decode HTML entities returned by Ghost translations
  // Input: Plus d&#x27;articles
  // Output: Plus d'articles
  // =====================

  function decoding_translation_chars(string) {
    return $('<textarea/>').html(string).text();
  }

  // =====================
  // Off Canvas menu
  // =====================

  $('.js-off-canvas-toggle').click(function(e) {
    e.preventDefault();
    $('.js-off-canvas-content, .js-off-canvas-container').toggleClass('is-active');
  });

  // =====================
  // Responsive videos
  // =====================

  $('.c-content').fitVids({
    'customSelector': [ 'iframe[src*="ted.com"]'          ,
                        'iframe[src*="player.twitch.tv"]' ,
                        'iframe[src*="dailymotion.com"]'  ,
                        'iframe[src*="facebook.com"]'
                      ]
  });

  // =====================
  // Images zoom
  // =====================

  $('.c-post img').attr('data-action', 'zoom');

  // If the image is inside a link, remove zoom
  $('.c-post a img').removeAttr('data-action');

  // =====================
  // Clipboard URL Copy
  // =====================

  var clipboard = new ClipboardJS('.c-share__link--clipboard');

  clipboard.on('success', function(e) {
    var element = $(e.trigger);

    element.addClass('tooltipped tooltipped-s');
    element.attr('aria-label', clipboard_copied_text);

    element.mouseleave(function() {
      $(this).removeAttr('aria-label');
      $(this).removeClass('tooltipped tooltipped-s');
    });
  });

  // =====================
  // Search
  // =====================

  var search_field = $('.js-search-input'),
      search_results = $('.js-search-results'),
      toggle_search = $('.js-search-toggle'),
      search_result_template = "\
      <a href=${post.url} class='c-search-result'>\
        <div class='c-search-result__content'>\
          <h3 class='c-search-result__title'>${post.title}</h3>\
          <time class='c-search-result__date'>${post.published_at}</time>\
        </div>\
        <div class='c-search-result__media'>\
          <div class='c-search-result__image is-inview' style='background-image: url(${post.feature_image})'></div>\
        </div>\
      </a>";

  toggle_search.click(function(e) {
    e.preventDefault();
    $('.js-search').addClass('is-active');

    // If off-canvas is active, just disable it
    $('.js-off-canvas-container').removeClass('is-active');

    setTimeout(function() {
      search_field.focus();
    }, 500);
  });

  $('.c-search, .js-search-close, .js-search-close .icon').on('click keyup', function(event) {
    if (event.target == this || event.target.className == 'js-search-close' || event.target.className == 'icon' || event.keyCode == 27) {
      $('.c-search').removeClass('is-active');
    }
  });

  var searchinGhost = new SearchinGhost({
        key: '676f52b422b9ba6726c70ea1f6',
        inputId: ['search-form-input'],
        outputId: ['search-results'],
        searchOn: 'keyup',
        onSearchEnd: function() {
          search_results.fadeIn();
        },
        indexOptions: {
            split: /\s+/,
            encode: function(str) {
                var regexp_replacements = {
                    "a": /[àáâãäå]/g,
                    "e": /[èéêë]/g,
                    "i": /[ìíîï]/g,
                    "o": /[òóôõöő]/g,
                    "u": /[ùúûüű]/g,
                    "y": /[ýŷÿ]/g,
                    "n": /ñ/g,
                    "c": /[ç]/g,
                    "s": /ß/g,
                    " ": /[-/]/g,
                    "": /['!"#$%&\\()\*+,-./:;<=>?@[\]^_`{|}~]/g,
                    " ": /\s+/g,
                }
                str = str.toLowerCase();
                for (var key of Object.keys(regexp_replacements)) {
                    str = str.replace(regexp_replacements[key], key);
                }
                return str === " " ? "" : str;
            }
        },
        template: function(post) {
          return `<a href="${post.url}"" class='c-search-result'>\
        <div class='c-search-result__content'>\
          <h3 class='c-search-result__title'>${post.title}</h3>\
          <time class='c-search-result__date'>${post.published_at}</time>\
        </div>\
        <div class='c-search-result__media'>\
          <div class='c-search-result__image is-inview' style='background-image: url("${post.feature_image}")'></div>\
        </div>\
      </a>`;
        },
        outputChildsType: false,
        debug: true
  });

  // search_field.ghostHunter({
  //   results: search_results,
  //   onKeyUp         : true,
  //   result_template : search_result_template,
  //   zeroResultsInfo : false,
  //   displaySearchInfo: false,
  //   before: function() {
  //     search_results.fadeIn();
  //   }
  // });

  // =====================
  // Ajax Load More
  // =====================

  var pagination_next_url = $('link[rel=next]').attr('href'),
    $load_posts_button = $('.js-load-posts');

  $load_posts_button.click(function(e) {
    e.preventDefault();

    var request_next_link =
      pagination_next_url.split(/page/)[0] +
      'page/' +
      pagination_next_page_number +
      '/';

    $.ajax({
      url: request_next_link,
      beforeSend: function() {
        $load_posts_button.text(decoding_translation_chars(pagination_loading_text));
        $load_posts_button.addClass('c-btn--loading');
      }
    }).done(function(data) {
      var posts = $('.js-post-card-wrap', data);

      $('.js-grid').append(posts);

      $load_posts_button.text(decoding_translation_chars(pagination_more_posts_text));
      $load_posts_button.removeClass('c-btn--loading');

      pagination_next_page_number++;

      // If you are on the last pagination page, hide the load more button
      if (pagination_next_page_number > pagination_available_pages_number) {
        $load_posts_button.addClass('c-btn--disabled').attr('disabled', true);
      }
    });
  });
});