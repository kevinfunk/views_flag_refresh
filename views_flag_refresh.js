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
 *   A boolean flagging whether the view is configured to be refreshed.
 */
viewsFlagRefresh.prototype.refresh = function(viewName, viewDisplayId) {
  for (var flagName in Drupal.settings.viewsFlagRefresh) {
    functionName = viewName + '-' + viewDisplayId;
    if (flagName == this.flagName && functionName in Drupal.settings.viewsFlagRefresh[flagName]) {
      return true;
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
  if (!this.refresh(settings.view_name, settings.view_display_id)) {
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
    $.ajax({
      url: viewsFlagRefresh.ajaxPath(),
      type: 'GET',
      data: settings,
      success: function(response) {
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
      error: function() { alert(Drupal.t("An error occurred at @path.", {'@path': viewsFlagRefresh.ajaxPath()})); },
      dataType: 'json'
    });
  });
}
