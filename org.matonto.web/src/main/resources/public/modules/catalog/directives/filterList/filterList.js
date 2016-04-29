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
         * `filterList` is a directive that creates a series of divs for the passed in
         * result list filters with uls for the filter options. The directive is replaced
         * with the content of the template. Each filter option is clickable and depending 
         * on the filter type, other options will be hidden.
         *
         * @param {function} clickFilter The function to be called when a filter option 
         * is clicked.
         * @param {Object} filters An object with keys for every filter title and values
         * of string arrays containing that filter's options
         *
         * @usage
         * <filter-list filters="{'Resources': ['Ontology']}" click-filter="console.log('Filter clicked!')"></filter-list>
         */
        .directive('filterList', filterList);

        filterList.$inject = ['catalogManagerService'];

        function filterList(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    clickFilter: '&'
                },
                bindToController: {
                    filters: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getAppliedFilters = function() {
                        return _.mapValues(dvm.filters, function(options) {
                            return _.map(_.filter(options, 'applied'), 'value');
                        });
                    }
                    dvm.isHidden = function(type, option) {
                        var visible = false;
                        if (type === 'Resources' && !_.every(dvm.filters[type], ['applied', false]) && !option.applied) {
                            visible = true;
                        }
                        return visible;
                    }
                    dvm.updateApplied = function(type, option) {
                        if (type === 'Resources') {
                            _.forEach(dvm.filters[type], function(opt) {
                                if (!angular.equals(opt, option)) {
                                    opt.applied = false;                                    
                                }
                            });
                        }
                        option.applied = !option.applied;
                    }
                },
                templateUrl: 'modules/catalog/directives/filterList/filterList.html'
            }
        }
})();
