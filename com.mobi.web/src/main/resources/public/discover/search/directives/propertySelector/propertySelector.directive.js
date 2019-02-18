(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name propertySelector
         *
         * @description
         * The `propertySelector` module only provides the `propertySelector` directive which creates
         * the property selector.
         */
        .module('propertySelector', [])
        /**
         * @ngdoc directive
         * @name propertySelector.directive:propertySelector
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents for the property selector which provides the users an option to select a property and range
         * they want to add to their search.
         */
        .directive('propertySelector', propertySelector);

        propertySelector.$inject = ['$timeout', 'discoverStateService', 'ontologyManagerService', 'prefixes', 'utilService'];

        function propertySelector($timeout, discoverStateService, ontologyManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/search/directives/propertySelector/propertySelector.directive.html',
                replace: true,
                require: '^^propertyFilterOverlay',
                scope: {},
                bindToController: {
                    keys: '=',
                    property: '=',
                    range: '=',
                    rangeChangeEvent: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.om = ontologyManagerService;
                    dvm.propertySearch = '';
                    dvm.rangeSearch = '';
                    dvm.properties = dvm.ds.search.properties;
                    dvm.ranges = [];

                    dvm.getSelectedPropertyText = function() {
                        return dvm.property ? dvm.om.getEntityName(dvm.property) : '';
                    }

                    dvm.getSelectedRangeText = function() {
                        return dvm.range ? dvm.util.getBeautifulIRI(dvm.range) : '';
                    }

                    dvm.orderRange = function(range) {
                        return dvm.util.getBeautifulIRI(range['@id']);
                    }

                    dvm.shouldDisplayOptGroup = function(type) {
                        return _.some(dvm.ds.search.properties[type], dvm.checkEntityText);
                    }

                    dvm.propertyChanged = function() {
                        dvm.ranges = _.get(dvm.property, prefixes.rdfs + 'range', [{'@id': prefixes.xsd + 'string'}]);
                        if (dvm.ranges.length === 1) {
                            dvm.range = dvm.ranges[0]['@id'];
                            $timeout(() => dvm.rangeChangeEvent());
                        }
                    }

                    dvm.showNoDomains = function() {
                        var noDomains = _.get(dvm.ds.search, 'noDomains', []);
                        return noDomains.length && _.filter(noDomains, dvm.checkEntityText).length;
                    }

                    dvm.checkEntityText = function(entity) {
                        return _.includes(_.toLower(dvm.om.getEntityName(entity)), _.toLower(dvm.propertySearch));
                    }
                }
            }
        }
})();
