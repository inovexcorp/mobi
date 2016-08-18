/*-
 * #%L
 * org.matonto.web
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
        .module('stringSelect', [])
        .directive('stringSelect', stringSelect);

        stringSelect.$inject = ['$filter', 'ontologyManagerService', 'prefixes'];

        function stringSelect($filter, ontologyManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/stringSelect/stringSelect.html',
                scope: {
                    onChange: '&',
                    displayText: '=',
                    selectList: '=',
                    mutedText: '=',
                    lockChoices: '='
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.om = ontologyManagerService;

                    dvm.getItemNamespace = function(item) {
                        var split = $filter('splitIRI')(item);
                        return split.begin + split.then;
                    }

                    dvm.disableChoice = function(item) {
                        if (_.isEqual(item, prefixes.owl + 'DataTypeProperty')) {
                            return _.indexOf(dvm.bindModel, prefixes.owl + 'ObjectProperty') !== -1;
                        } else if (_.isEqual(item, prefixes.owl + 'ObjectProperty')) {
                            return _.indexOf(dvm.bindModel, prefixes.owl + 'DataTypeProperty') !== -1;
                        }
                        return false;
                    }
                }
            }
        }
})();
