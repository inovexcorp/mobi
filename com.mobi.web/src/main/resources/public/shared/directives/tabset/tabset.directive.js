(function() {
    'use strict';

    tabset.$inject = ['$timeout'];

    function tabset($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/tabset/tabset.directive.html',
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.tabs = [];

                dvm.addTab = function(tab) {
                    if (dvm.tabs.length && _.get(_.last(dvm.tabs), 'isLast')) {
                        dvm.tabs.splice(dvm.tabs.length - 1, 0, tab);
                    } else {
                        dvm.tabs.push(tab);
                    }
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
        .module('tabset', [])
        .directive('tabset', tabset);
})();
