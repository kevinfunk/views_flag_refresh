// $Id$

/**
 * Event handler that refreshes selected views.
 */
$(document).bind('flagGlobalAfterLinkUpdate', function(event, data) {
    
  // Captures the Views AJAX path.
  var ajax_path = Drupal.settings.views.ajax_path;
  if (ajax_path.constructor.toString().indexOf("Array") != -1) {
    ajax_path = ajax_path[0];
  }
  
  // Iterates over views, refreshes if selected.
  $.each(Drupal.settings.views.ajaxViews, function(index, settings) {
    $.each(Drupal.settings.viewsFlagRefresh, function(flagName, flagViews) {
      
      functionName = settings.view_name + '-' + settings.view_display_id;
      if (flagName == data.flagName && functionName in flagViews) {
        // Calculates selector tor view.
        var view = '.view-dom-id-' + settings.view_dom_id;
        if (!$(view).size()) {
          view = '.view-id-' + settings.view_name + '.view-display-id-' + settings.view_display_id;
        }
          
        $(view).filter(function() {
          return !$(this).parents('.view').size();
        })
        .each(function() {
          var target = this;
          
          // Add test that shows the view is refreshing.
          var old_width  = $(target).css('width');
          var old_height = $(target).css('height');
          
          $(target).css('width', $(target).width());
          $(target).css('height', $(target).height());
          $(target).text(Drupal.t('Refreshing...'));
          
          // Refresh the view.
          $.ajax({
            url: ajax_path,
            type: 'GET',
            data: settings,
            success: function(response) {
              if (response.__callbacks) {
                $.each(response.__callbacks, function(i, callback) {
                 // Temporary remove the ajax-form class to avoid behavior to be attached twice (or the form would be sent twice).
                 $('.ajax-form').removeClass('ajax-form').addClass('ajax-form-temp');
                  eval(callback)(target, response);
                  $('.ajax-form-temp').addClass('ajax-form');
                });
              }
            },
            error: function() { alert(Drupal.t("An error occurred at @path.", {'@path': ajax_path})); },
            dataType: 'json'
          });
        });
      }
      
    });
    
  });
});
