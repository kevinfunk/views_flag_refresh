// $Id$

/**
 * Event handler that listens for flags selected by the user.
 */
$(document).bind('flagGlobalAfterLinkUpdate', function(event, data) {
  var refresh = new viewsFlagRefresh(data.flagName);
  $.each(Drupal.settings.views.ajaxViews, function(index, settings) {
    refresh.ajax(settings);
  });
});

/**
 * Constructor for the viewsFlagRefresh object, sets the name of the flag that
 * was selected.
 * 
 * @param flagName
 *   The name of the flag selected by the user.
 */
function viewsFlagRefresh(flagName) {
  this.flagName = flagName;
}

/**
 * Class method that returns the Views module's AJAX path.
 * 
 * @reutrn
 *   The Views module's AJAX path.
 */
viewsFlagRefresh.ajaxPath = function() {
  var ajaxPath = Drupal.settings.views.ajax_path;
  if (ajaxPath.constructor.toString().indexOf("Array") != -1) {
    ajaxPath = ajaxPath[0];
  }
  return ajaxPath;
}

/**
 * Checks if the view is configured to refresh when the this.flagName flag has
 * been selected.
 * 
 * @param viewName
 *   The name of the view we are running the check against.
 * @param viewDisplayId
 *   The display ID of the view we are running the check against.
 * @return
 *   A string containing the theme hook used to theme the view as it is being
 *   refreshed, a boolean false if the view should not be refreshed at all.
 */
viewsFlagRefresh.prototype.refresh = function(viewName, viewDisplayId) {
  var settings = Drupal.settings.viewsFlagRefresh.flags;
  for (var flagName in settings) {
    functionName = viewName + '-' + viewDisplayId;
    if (flagName == this.flagName && functionName in settings[flagName]) {
      return settings[flagName][functionName];
    }
  }
  return false;
}

/**
 * Refreshes a view via AJAX if it is configured to do so.
 * 
 * @param settings
 *   The view's AJAX settings passed through Drupal.settings.views.ajaxViews.
 */
viewsFlagRefresh.prototype.ajax = function(settings) {
  // Bails if the view shouldn't be refreshed when this flag is selected.
  var themeHook = this.refresh(settings.view_name, settings.view_display_id);
  if (!themeHook) {
    return;
  }

  // Calculates the selector for the view.
  var view = '.view-dom-id-' + settings.view_dom_id;
  if (!$(view).size()) {
    view = '.view-id-' + settings.view_name + '.view-display-id-' + settings.view_display_id;
  }
  
  // Locates the view, AJAX refreshes the content.
  $(view).filter(function() { return !$(this).parents('.view').size(); }).each(function() {
    var target = this;
    
    // Invokes the theme hook that calls the refresh widget, captures any
    // elements added by the widget for cleanup.
    var themeElement = viewsFlagRefresh.themeHookInvoke(themeHook, target);
    
    // Refreshes view via AJAX.
    $.ajax({
      url: viewsFlagRefresh.ajaxPath(),
      type: 'GET',
      data: settings,
      success: function(response) {
        // Cleans up any elements left over from theming.
        if (themeElement) {
          $(themeElement).remove();
        }
        // Adds content retrieved from call.
        if (response.__callbacks) {
          $.each(response.__callbacks, function(i, callback) {
           // Temporary remove the ajax-form class to avoid behavior to be
           // attached twice (or the form would be sent twice).
           $('.ajax-form').removeClass('ajax-form').addClass('ajax-form-temp');
            eval(callback)(target, response);
            $('.ajax-form-temp').addClass('ajax-form');
          });
        }
      },
      error: function() {
        // Cleans up any elements left over from theming.
        if (themeElement) {
          $(themeElement).remove();
        }
        alert(Drupal.t("An error occurred at @path.", {'@path': viewsFlagRefresh.ajaxPath()}));
      },
      dataType: 'json'
    });
    
  });
}

/**
 * Class method that invokes the theme hook.
 * 
 * @param themeHook
 *   The theme hook being invoked.
 * @param target
 *   A jQuery object containing the view being refreshed. 
 */
viewsFlagRefresh.themeHookInvoke = function(themeHook, target) {
  var theme = new viewsFlagRefresh.theme();
  if (themeHook in theme) {
    return theme[themeHook](target);
  }
  return false;
}

/**
 * Contructor for our pseudo theme system.
 */
viewsFlagRefresh.theme = function() {
  // Nothing to be done here.
}

/**
 * Adds a 
 * 
 * @param target
 *   A jQuery object containing the view being refreshed.
 */
viewsFlagRefresh.theme.prototype.throbber = function(target) {
  // Hide the content of the view.
  $(target).css('visibility', 'hidden');
  
  // Captures parent, as the view is usually in something such as a block.
  var container = $(target).parent();
  
  // Adds our throbber to the middle of the view.
  // NOTE: The throbber image is 32px wide.
  var pos = $(container).position();
  var throbber = $('<img src="' + Drupal.settings.viewsFlagRefresh.imagePath + '/throbber.gif" />')
    .css('position', 'absolute')
    .css('margin', '0')
    .css('padding', '0')
    .css('z-index', '1000')
    .css('left', pos.left + ($(container).outerWidth() / 2) - 16)
    .css('top', pos.top + ($(container).outerHeight() / 2) - 16)
    .insertAfter(target);
  
  // Returns the element we added for cleanup.
  return throbber;
}
