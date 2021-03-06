/**
 * Timeago is a jQuery plugin that makes it easy to support automatically
 * updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
 *
 * @name timeago
 * @version 0.11
 * @requires jQuery v1.2.3+
 * @author Ryan McGeary
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://timeago.yarp.com/
 *
 * Copyright (c) 2008-2011, Ryan McGeary (ryanonjavascript -[at]- mcgeary [*dot*] org)
 */
(function($) {
  $.timeago = function(timestamp) {
    if (timestamp instanceof Date) {
      return inWords(timestamp);
    } else if (typeof timestamp === "string") {
      return inWords($.timeago.parse(timestamp));
    } else {
      return inWords($.timeago.datetime(timestamp));
    }
  };
  var $t = $.timeago;

  $.extend($.timeago, {
    settings: {
      refreshMillis: 60000,
      allowFuture: false,
      strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: "ago",
        suffixFromNow: "from now",
        seconds: "less than a minute",
        minute: "1 minute",
        minutes: "%d minutes", 
        hour: "1 hour",
        hours: "%d hours",
        day: "a day",
        days: "%d days",
        month: "a month",
        months: "%d months",
        year: "a year",
        years: "%d years",
        timeSeparator: "and",
        wordSeparator: " ",
        numbers: []
      },   
    },
    inWords: function(distanceMillis) {
      var $l = this.settings.strings;
      var prefix = $l.prefixAgo;
      var suffix = $l.suffixAgo;
      if (this.settings.allowFuture) {
        if (distanceMillis < 0) {
          prefix = $l.prefixFromNow;
          suffix = $l.suffixFromNow;
        }
      }

      var seconds = Math.abs(distanceMillis) / 1000;
      var minutes = seconds / 60;
      var hours = minutes / 60;
      var remainingMinutes = minutes % 60;
      var days = hours / 24;
      var years = days / 365;

      function substitute(stringOrFunction, number) {
        var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
        var value = ($l.numbers && $l.numbers[number]) || number;
        return string.replace(/%d/i, value);
      }

      function remainderInWords(singular, plural, remainder){
        if(remainder === 0){
          return ''; 
        }
        var words = remainder === 1 ? substitute(singular, remainder) : substitute(plural, remainder);
        return $l.wordSeparator + $l.timeSeparator + $l.wordSeparator + words;
      }

      var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
        seconds < 90 && substitute($l.minute, 1) ||
        minutes < 60 && substitute($l.minutes, Math.round(minutes)) ||
        minutes < 120 && substitute($l.hour, 1) + remainderInWords($l.minute , $l.minutes, Math.round(remainingMinutes))  ||       
        hours < 24 && substitute($l.hours, Math.round(hours)) + remainderInWords($l.minute , $l.minutes, Math.round(remainingMinutes)) ||
        hours < 42 && substitute($l.day, 1) ||
        days < 30 && substitute($l.days, Math.round(days)) ||
        days < 45 && substitute($l.month, 1) ||
        days < 365 && substitute($l.months, Math.round(days / 30)) ||
        years < 1.5 && substitute($l.year, 1) ||
        substitute($l.years, Math.round(years));

      return $.trim([prefix, words, suffix].join($l.wordSeparator));
    },
    parse: function(iso8601) {
      var s = $.trim(iso8601);
      s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
      s = s.replace(/-/,"/").replace(/-/,"/");
      s = s.replace(/T/," ").replace(/Z/," UTC");
      s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
      return new Date(s);
    },
    datetime: function(elem) {
      // jQuery's `is()` doesn't play well with HTML5 in IE
      var isTime = $(elem).get(0).tagName.toLowerCase() === "time"; // $(elem).is("time");
      var iso8601 = isTime ? $(elem).attr("datetime") : $(elem).attr("title");
      return $t.parse(iso8601);
    },
    clearServerTime: function(){      
      $t.serverTime = null;
    },
    collection: null
  });

  $.fn.timeago = function(startTimestamp) {
    var $s = $t.settings;
    // This persists a timestamp even when timeago is rerun on a page.     
    if (!$t.serverTime && typeof startTimestamp === "string") {
      $t.serverTime = $t.parse(startTimestamp);        
    } else if (!$t.serverTime && !startTimestamp) {       
      $t.serverTime = new Date();     
    }
    $t.collection = this;
    $t.collection.each(refresh);
    
    if ($s.refreshMillis > 0 && !$t.tick) {
      $t.tick = setInterval(updateDates, $s.refreshMillis);
    }
    return $t.collection;
  };

  function updateDates() { 
    var newTime = $t.serverTime.getTime() + $t.settings.refreshMillis;
    $t.serverTime = new Date(newTime);   
    $t.collection.each(refresh);    
  }
 
  function refresh() {   
    var data = prepareData(this);  

    if (!isNaN(data.datetime)) {
      $(this).text(inWords(data.datetime));
    }
    return this;
  }

  function prepareData(element) {
    varelement = $(element);
    if (!element.data("timeago")) {
      element.data("timeago", { datetime: $t.datetime(element) });
      var text = $.trim(element.text());
      if (text.length > 0) {
        element.attr("title", text);
      }
    }
    return element.data("timeago");
  }

  function inWords(date) {
    return $t.inWords(distance(date));
  }

  function distance(date) {
    return $t.serverTime.getTime() - date.getTime();
  }

  function clearServerTime() {
    return $t.clearServerTime();    
  }

  // fix for IE6 suckage
  document.createElement("abbr");
  document.createElement("time");
}(jQuery));
