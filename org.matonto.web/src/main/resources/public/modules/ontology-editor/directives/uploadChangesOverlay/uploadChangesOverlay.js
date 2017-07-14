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
        .module('uploadChangesOverlay', [])
        .directive('uploadChangesOverlay', uploadChangesOverlay);

        uploadChangesOverlay.$inject = ['ontologyStateService'];

        function uploadChangesOverlay(ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/uploadChangesOverlay/uploadChangesOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.error = '';
                    dvm.os = ontologyStateService;

                    dvm.upload = function() {
                        if (dvm.os.hasInProgressCommit()) {
                            dvm.error = 'Unable to upload changes. Please either commit your current changes or discard them and try again.';
                        } else {
                            var ontRecord = dvm.os.listItem.ontologyRecord;
                            dvm.os.uploadChanges(dvm.file, ontRecord.recordId, ontRecord.branchId, ontRecord.commitId).then(() => {
                                dvm.os.getActivePage().active = false;
                                dvm.os.listItem.editorTabStates.savedChanges.active = true;
                                dvm.closeOverlay();
                            }, errorMessage => dvm.error = errorMessage);
                        }
                    };
                    
                    dvm.closeOverlay = function() {
                        dvm.os.showUploadChangesOverlay = false;
                        dvm.error = '';
                    };
                }
            };
        }
})();
