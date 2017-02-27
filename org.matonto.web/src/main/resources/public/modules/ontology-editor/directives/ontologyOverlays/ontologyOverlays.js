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
        .module('ontologyOverlays', [])
        .directive('ontologyOverlays', ontologyOverlays);

        ontologyOverlays.$inject = ['$q', 'ontologyStateService', 'ontologyManagerService'];

        function ontologyOverlays($q, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyOverlays/ontologyOverlays.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.save = function() {
                        dvm.om.saveChanges(dvm.sm.listItem.recordId, {additions: dvm.sm.listItem.additions, deletions: dvm.sm.listItem.deletions})
                            .then(() => dvm.sm.afterSave(), $q.reject)
                            .then(() => {
                                var entityIRI = dvm.sm.getActiveEntityIRI();
                                if (dvm.sm.getActiveKey() !== 'project' && entityIRI) {
                                    dvm.sm.setEntityUsages(entityIRI);
                                }
                                dvm.sm.showSaveOverlay = false;
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();
