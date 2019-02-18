(function () {
    'use strict';

    entityDescription.$inject = ['$filter', 'utilService'];

    function entityDescription($filter, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                limited: '<'
            },
            bindToController: {
                entity: '<'
            },
            link: function(scope, el, attrs) {
                scope.limited = attrs.limited !== undefined;
            },
            controller: function() {
                var dvm = this;
                dvm.util = utilService;
                dvm.descriptionLimit = 200;
                dvm.full = false;

                dvm.getLimitedDescription = function() {
                    var description = dvm.getDescription();
                    return dvm.full || description.length < dvm.descriptionLimit ? description : $filter('limitTo')(description, dvm.descriptionLimit) + '...';
                }
                dvm.getDescription = function() {
                    return dvm.util.getDctermsValue(dvm.entity, 'description');
                }
            },
            templateUrl: 'shared/directives/entityDescription/entityDescription.directive.html'
        };
    }

    angular
        /**
         * @ngdoc overview
         * @name entityDescription
         *
         * @description
         * The `entityDescription` module only provides the `entityDescription` directive which creates
         * a div with an optionally expandable display of the dcterms:description of an entity.
         */
        .module('entityDescription', [])
        /**
         * @ngdoc directive
         * @name entityDescription.directive:entityDescription
         * @scope
         * @restrict E
         * @requires $filter
         * @requires utilService.service:utilService
         *
         * @description
         * `entityDescription` is a directive which creates a div with a display of a JSON-LD object's
         * dcterms:description property value. Based on the limited variable, will optionally limit the
         * display to the first 200 characters and provide a button to toggle the full display. The
         * directive is replaced by the contents of its template.
         *
         * @param {boolean} limited Whether or not the display should be limited to the first 200 charaters
         * @param {Object} entity A JSON-LD object
         */
        .directive('entityDescription', entityDescription);
})();
