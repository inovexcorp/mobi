(function () {
    'use strict';

    entityDates.$inject = ['$filter', 'utilService'];

    function entityDates($filter, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                entity: '<'
            },
            controller: function() {
                var dvm = this;

                dvm.getDate = function(entity, key) {
                    var dateStr = utilService.getDctermsValue(entity, key);
                    return utilService.getDate(dateStr, 'short');
                }
            },
            templateUrl: 'shared/directives/entityDates/entityDates.directive.html'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name entityDates
         *
         * @description
         * The `entityDates` module only provides the `entityDates` directive which creates a div
         * with displays for an entity's dcterms:issued and dcterms:modified date property values.
         */
        .module('entityDates', [])
        /**
         * @ngdoc directive
         * @name entityDates.directive:entityDates
         * @scope
         * @restrict E
         * @requires $filter
         * @requires util.service:utilService
         *
         * @description
         * `entityDates` is a directive which creates a div with displays for a JSON-LD object's
         * dcterms:issued and dcterms:modified property values. Displays the dates in "short" form.
         * If it can't find one of the dates, displays "(No Date Specified)". The directive is
         * replaced by the contents of its template.
         *
         * @param {Object} entity A JSON-LD object
         */
        .directive('entityDates', entityDates);
})();
