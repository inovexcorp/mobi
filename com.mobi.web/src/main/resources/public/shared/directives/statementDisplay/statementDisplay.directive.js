(function() {
    'use strict';

    statementDisplay.$inject = ['$filter'];

    function statementDisplay($filter) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: '^^statementContainer',
            templateUrl: 'shared/directives/statementDisplay/statementDisplay.directive.html',
            scope: {
                predicate: '<'
            },
            bindToController: {
                object: '<'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.$onInit = function () {
                    if (_.has(dvm.object, '@id')) {
                        dvm.fullObject = dvm.object['@id'];
                        dvm.o = $filter('splitIRI')(dvm.fullObject).end || dvm.fullObject;
                    } else {
                        dvm.o = _.get(dvm.object, '@value', dvm.object)
                            + (_.has(dvm.object, '@language') ? ' [language: ' + dvm.object['@language'] + ']' : '')
                            + (_.has(dvm.object, '@type') ? ' [type: ' + $filter('prefixation')(dvm.object['@type']) + ']' : '');
                        dvm.fullObject = dvm.o;
                    }
                }
            },
            link: function(scope, element, attrs) {
                scope.isAddition = 'addition' in attrs;
                scope.isDeletion = 'deletion' in attrs;
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name statementDisplay
         *
         */
        .module('statementDisplay', [])
        /**
         * @ngdoc directive
         * @name statementDisplay.directive:statementDisplay
         * @scope
         * @restrict E
         *
         */
        .directive('statementDisplay', statementDisplay);
})();
