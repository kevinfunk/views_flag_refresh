<?php

/**
 * @file
 * Contains request event subscriber.
 */

namespace Drupal\views_flag_refresh\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Drupal\views_flag_refresh\Ajax\ViewsFlagRefreshCommand;
use Symfony\Component\HttpKernel\KernelEvents;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\flag\FlagInterface;


/**
 * Request event subscriber.
 */
class RequestSubscriber implements EventSubscriberInterface {

  /**
   * The route match.
   *
   * @var \Drupal\Core\Routing\RouteMatchInterface
   */
  protected $routeMatch;

  /**
   * RequestSubscriber constructor.
   *
   * @param \Drupal\Core\Routing\RouteMatchInterface $route_match
   *   The route match.
   */
  public function __construct(RouteMatchInterface $route_match) {
    $this->routeMatch = $route_match;
  }

  /**
   * Handles response event.
   *
   * @param \Symfony\Component\HttpKernel\Event\FilterResponseEvent $event
   *   The event to process.
   */
  public function onResponse(FilterResponseEvent $event) {
    $flag_link_routes = ['flag.action_link_flag', 'flag.action_link_unflag'];
    $response = $event->getResponse();

    // Check flag/unflag route with AJAX response.
    if (in_array($this->routeMatch->getRouteName(), $flag_link_routes) && $response instanceof AjaxResponse) {
      if (($flag = $this->routeMatch->getParameter('flag')) instanceof FlagInterface) {
        $command = new ViewsFlagRefreshCommand($flag);
        $response->addCommand($command);
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    $events[KernelEvents::RESPONSE][] = ['onResponse'];
    return $events;
  }

}
