
(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name home.component:homePage
     *
     * @description
     * `homePage` is a component which creates the main page of the Home module. The page contains a welcome banner image
     * along with a {@link home.component:quickActionGrid grid of quick actions} and a
     * {@link home.component:activityCard list of activities} within the Mobi instance.
     */
    const homePageComponent = {
        templateUrl: 'home/components/homePage/homePage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: homePageComponentCtrl
    };

    function homePageComponentCtrl() {
        var dvm = this;
    }

    angular.module('home')
        .component('homePage', homePageComponent);
})();