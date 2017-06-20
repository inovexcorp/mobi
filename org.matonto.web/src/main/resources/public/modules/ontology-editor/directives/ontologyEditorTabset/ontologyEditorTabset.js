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
        .module('ontologyEditorTabset', [])
        .directive('ontologyEditorTabset', ontologyEditorTabset);

        ontologyEditorTabset.$inject = ['ontologyManagerService', 'ontologyStateService'];

        function ontologyEditorTabset(ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyEditorTabset/ontologyEditorTabset.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;

                    dvm.getTabTitle = function(recordId) {
                        return dvm.os.getState(recordId).record.recordTitle;
                    }

                    dvm.onClose = function(recordId) {
                        var ontology = dvm.os.getOntologyByRecordId(recordId);
                        if (dvm.os.hasChanges(recordId)) {
                            dvm.os.recordIdToClose = recordId;
                            dvm.os.showCloseOverlay = true;
                        } else {
                            dvm.os.deleteState(recordId);
                            dvm.os.closeOntology(recordId);
                        }
                    }
                }
            }
        }
})();
