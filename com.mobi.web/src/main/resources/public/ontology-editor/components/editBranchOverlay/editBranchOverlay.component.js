/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name ontology-editor.component:editBranchOverlay
     * @requires shared.service:catalogManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `editBranchOverlay` is a component that creates content for a modal that edits the provided branch in the
     * current {@link shared.service:ontologyStateService selected ontology}. The form in the modal contains
     * a {@link shared.component:textInput} for the branch title and a {@link shared.component:textArea} for
     * the branch description. Meant to be used in conjunction with the {@link shared.service:modalService}.
     *
     * @param {Object} resolve Information provided to the modal
     * @param {Object} resolve.branch The JSON-LD of the branch to be edited
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const editBranchOverlayComponent = {
        templateUrl: 'ontology-editor/components/editBranchOverlay/editBranchOverlay.component.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: editBranchOverlayComponentCtrl
    };

    editBranchOverlayComponentCtrl.$inject = ['catalogManagerService', 'ontologyStateService', 'prefixes', 'utilService'];

    function editBranchOverlayComponentCtrl(catalogManagerService, ontologyStateService, prefixes, utilService) {
        var dvm = this;
        var cm = catalogManagerService;
        var os = ontologyStateService;
        var util = utilService;
        var catalogId = '';
        dvm.error = '';

        dvm.$onInit = function() {
            catalogId = _.get(cm.localCatalog, '@id', '');
            dvm.branchTitle = util.getDctermsValue(dvm.resolve.branch, 'title');
            dvm.branchDescription = util.getDctermsValue(dvm.resolve.branch, 'description');
        }
        dvm.edit = function() {
            util.updateDctermsValue(dvm.resolve.branch, 'title', dvm.branchTitle);
            if (dvm.branchDescription === '') {
                _.unset(dvm.resolve.branch, prefixes.dcterms + 'description');
            } else {
                util.updateDctermsValue(dvm.resolve.branch, 'description', dvm.branchDescription);
            }
            cm.updateRecordBranch(dvm.resolve.branch['@id'], os.listItem.ontologyRecord.recordId, catalogId, dvm.resolve.branch)
                .then(() => {
                    dvm.close();
                }, errorMessage => dvm.error = errorMessage);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular.module('ontology-editor')
        .component('editBranchOverlay', editBranchOverlayComponent);
})();
