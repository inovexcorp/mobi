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
        .module('ontologyButtonStack', [])
        .directive('ontologyButtonStack', ontologyButtonStack);

        ontologyButtonStack.$inject = ['$q', '$filter', '$http', 'ontologyStateService', 'ontologyManagerService',
            'catalogManagerService', 'utilService', 'updateRefsService'];

        function ontologyButtonStack($q, $filter, $http, ontologyStateService, ontologyManagerService,
            catalogManagerService, utilService, updateRefsService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyButtonStack/ontologyButtonStack.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var cm = catalogManagerService;
                    var util = utilService;
                    var update = updateRefsService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.showDeleteOverlay = false;
                    dvm.error = '';

                    dvm.delete = function() {
                        cm.deleteInProgressCommit(dvm.os.listItem.recordId, catalogId)
                            .then(() => {
                                om.updateOntology(dvm.os.listItem.recordId, dvm.os.listItem.branchId,
                                    dvm.os.listItem.commitId, dvm.os.state.type).then(() => {
                                        dvm.os.clearInProgressCommit();
                                        dvm.showDeleteOverlay = false;
                                    }, errorMessage => dvm.error = errorMessage);
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();
