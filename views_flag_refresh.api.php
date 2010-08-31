<?php
// $Id$

/**
 * @file
 * Hooks defined by the Views Flag Refresh module.
 */

/**
 * Defines refresh widgets that are displayed when a view is being refreshed.
 *
 * @return
 *   An array of widget definitions.
 */
function hook_views_flag_refresh_widgets() {
  $widgets = array();

  $widgets['throbber'] = array(
    'title'       => t('Throbber image'),
    'theme hook'  => 'throbber',
    'description' => t('Test'),
    'js file'     => drupal_get_path('module', 'views_flag_refresh') .'/views_flag_refresh.js',
    'css file'    => drupal_get_path('module', 'views_flag_refresh') .'/views_flag_refresh.css',
  );

  return $widgets;
}

/**
 * Allows modules to alter widget definitions.
 *
 * @param &$widgets
 *   An array of widget definitions.
 */
function hook_views_flag_refresh_widgets_alter(&$widgets) {
  $widgets['throbber']['theme hook'] = 'betterThrobber';
  $widgets['throbber']['file'] = drupal_get_path('module', 'mymodule') .'/mymodule.js';
}
