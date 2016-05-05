(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name filterList
         * @requires catalogManager
         *
         * @description
         * The `filterList` module only provides the `filterList` directive which
         * creates a series of divs for result list filters with uls for the filter
         * options.
         */
        .module('filterList', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name filterList.directive:filterList
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `filterList` is a directive that creates a series of divs for the result list 
         * filters defined in {@link catalogManager.service:catalogManagerService catalogManagerService}
         * with uls for the filter options. The directive is replaced with the content of 
         * the template. Each filter option is clickable and depending on the filter type, 
         * other options will be hidden.
         *
         * @usage
         * <filter-list></filter-list>
         */
        .directive('filterList', filterList);

        filterList.$inject = ['catalogManagerService'];

        function filterList(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.catalog = catalogManagerService;

                    dvm.isHidden = function(type, option) {
                        var visible = false;
                        if (type === 'Resources' && !_.every(dvm.catalog.filters[type], ['applied', false]) && !option.applied) {
                            visible = true;
                        }
                        return visible;
                    }
                    dvm.applyFilter = function(type, option) {
                        if (type === 'Resources') {
                            dvm.catalog.currentPage = 0;
                            _.forEach(dvm.catalog.filters[type], function(opt) {
                                if (!angular.equals(opt, option)) {
                                    opt.applied = false;                                    
                                }
                            });
                        }
                        option.applied = !option.applied;
                        dvm.catalog.getResources();
                    }
                },
                templateUrl: 'modules/catalog/directives/filterList/filterList.html'
            }
        }
})();
