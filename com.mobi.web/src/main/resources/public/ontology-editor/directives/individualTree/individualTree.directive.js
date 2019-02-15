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
        .module('individualTree', [])
        .config(ignoreUnhandledRejectionsConfig)
        .directive('individualTree', individualTree);

        individualTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'INDENT'];

        function individualTree(ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, INDENT) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/individualTree/individualTree.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.indent = INDENT;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;

                    dvm.isShown = function(node) {
                        return (node.indent > 0 && dvm.os.areParentsOpen(node, dvm.os.getOpened)) || (node.indent === 0 && _.get(node, 'path', []).length === 2);
                    }

                    dvm.isImported = function(entityIRI) {
                        return !_.has(dvm.os.listItem.index, entityIRI);
                    }
                }
            }
        }
})();