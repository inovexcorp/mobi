(function() {
    'use strict';

    materialTabset.$inject = ['$timeout'];

    function materialTabset($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/materialTabset/materialTabset.directive.html',
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.tabs = [];

                dvm.addTab = function(tab) {
                    dvm.tabs.push(tab);
                }
                dvm.removeTab = function(tab) {
                    _.pull(dvm.tabs, tab);
                }
                dvm.select = function(selectedTab) {
                    _.forEach(dvm.tabs, tab => {
                        if (tab.active && !_.isEqual(tab, selectedTab)) {
                            tab.active = false;
                        }
                    });
                    $timeout(function() {
                        selectedTab.onClick();
                        selectedTab.active = true;
                    });
                }
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name materialTabset
         *
         * @description
         * The `materialTabset` module provides the `materialTabset` directive which creates a container for
         * {@link materialTab.directive:materialTab tabs} and headers about the tabs.
         */
        .module('materialTabset', [])
        /**
         * @ngdoc directive
         * @name materialTabset.directive:materialTabset
         * @scope
         * @restrict E
         *
         * @description
         * `materialTabset` is a directive that creates a `div` containing
         * {@link materialTab.directive:materialTab tabs} and headers about the tabs displayed as `.nav-tabs`. The
         * tabs are transcluded into this directive and headers are generated for them. The directive is replaced
         * by the contents of its template.
         */
        .directive('materialTabset', materialTabset);
})();
