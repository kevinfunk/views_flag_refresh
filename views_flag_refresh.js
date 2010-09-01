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
 * Returns a key / value pair to be uses as settings by the ajax methods.
 * 
 * @param target
 *   A jQuery object pointing to the element being refreshed via AJAX.
 * @param view
 *   A jQuery object pointing to the view.
 * @param themeElement
 *   A jQuery object containing any elements added to the DOM by the theme.
 * @param settings
 *   The view's AJAX settings passed through Drupal.settings.views.ajaxViews.
 * @return
 *   The AJAX settings.
 */
viewsFlagRefresh.ajaxSettings = function(target, view, settings, themeElement) {
  return {
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
          eval(callback)(target, response);
        });
      }
    },
    error: function() {
      // Cleans up any elements left over from theming.
      if (themeElement) {
        $(themeElement).remove();
      }
      // Handles errors gracefully.
      Drupal.Views.Ajax.handleErrors(xhr, viewsFlagRefresh.ajaxPath());
    },
    dataType: 'json'
  };
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
    
    // Gets AJAX settings, either refreshes the view or submits the exposed
    // filter form. This latter refreshes the view and maintains the filters.
    var ajaxSettings = viewsFlagRefresh.ajaxSettings(target, view, settings, themeElement);
    var exposedForm = $('form#views-exposed-form-' + settings.view_name.replace(/_/g, '-') + '-' + settings.view_display_id.replace(/_/g, '-'));
    if (exposedForm.size()) {
      $(exposedForm).ajaxSubmit(ajaxSettings);
    }
    else {
      $.ajax(ajaxSettings);
    }
  });
}

/**
 * Class method that invokes the theme hook.
 * 
 * @param themeHook
 *   The theme hook being invoked.
 * @param target
 *   A jQuery object containing the view being refreshed.
 * @return
 *   Invokes the theme hook, returns any elements that need to be removed prior
 *   to the view content being reloaded. 
 */
viewsFlagRefresh.themeHookInvoke = function(themeHook, target) {
  var theme = new viewsFlagRefresh.theme();
  if (themeHook in theme) {
    return theme[themeHook](target);
  }
  return false;
}

/**
 * Contructor for our pseudo theme system class.
 */
viewsFlagRefresh.theme = function() {
  // Nothing to be done here.
}

/**
 * Adds a throbber image to the view content while it is being refreshed.
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
  var throbber = $('<img src="' + Drupal.settings.viewsFlagRefresh.imagePath + '/throbber.gif" class="views_flag_refresh-throbber" />')
    .css('left', pos.left + ($(container).outerWidth() / 2) - 16)
    .css('top', pos.top + ($(container).outerHeight() / 2) - 16)
    .insertAfter(target);
  
  // Returns the element we added for cleanup.
  return throbber;
}
