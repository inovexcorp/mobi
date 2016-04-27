(function() {
    'use strict';

    angular
        .module('filterList', ['catalogManager'])
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
                    results: '=',
                    filters: '='
                },
                controller: function() {
                    var dvm = this;

                    dvm.getCount = function(type, option) {
                        if (type === 'Resources') {
                            var counts = _.countBy(dvm.results.results, 'type');
                            return _.get(counts, option.value, 0);
                        }
                        return 0;
                    }
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
