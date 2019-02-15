/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
        .module('blankNodeValueDisplay', [])
        .directive('blankNodeValueDisplay', blankNodeValueDisplay);

        blankNodeValueDisplay.$inject = ['ontologyUtilsManagerService'];

        function blankNodeValueDisplay(ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/blankNodeValueDisplay/blankNodeValueDisplay.directive.html',
                scope: {
                    nodeId: '<'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.editorOptions = {
                        mode: 'text/omn',
                        indentUnit: 4,
                        lineWrapping: true,
                        readOnly: true,
                        cursorBlinkRate: -1,
                        height: 'dynamic',
                        scrollbarStyle: 'null',
                        viewportMargin: Infinity
                    };
                    dvm.value = '';
                    $scope.$watch('nodeId', newValue => {
                        dvm.value = dvm.ontoUtils.getBlankNodeValue(newValue);
                    });
                }]
            }
        }
})();
