/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

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

        statementDisplay.$inject = ['$filter'];

        function statementDisplay($filter) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                require: '^^statementContainer',
                templateUrl: 'directives/statementDisplay/statementDisplay.html',
                scope: {
                    predicate: '<'
                },
                bindToController: {
                    object: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    if (_.has(dvm.object, '@id')) {
                        dvm.fullObject = dvm.object['@id'];
                        dvm.o = $filter('splitIRI')(dvm.fullObject).end || dvm.fullObject;
                    } else {
                        dvm.o = _.get(dvm.object, '@value', dvm.object) + (_.has(dvm.object, '@language') ? ' [language: ' + dvm.object['@language'] + ']' : '');
                        dvm.fullObject = dvm.o;
                    }
                },
                link: function(scope, element, attrs) {
                    scope.isAddition = 'addition' in attrs;
                    scope.isDeletion = 'deletion' in attrs;
                }
            }
        }
})();
