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
     * @name ontology-editor.component:createBranchOverlay
     * @requires shared.service:catalogManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:prefixes
     *
     * @description
     * `createBranchOverlay` is a component that creates content for a modal that creates a branch in the current
     * {@link shared.service:ontologyStateService selected ontology}. The form in the modal contains a
     * {@link shared.component:textInput} for the branch title and a {@link shared.component:textArea} for the
     * branch description. Meant to be used in conjunction with the {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const createBranchOverlayComponent = {
        templateUrl: 'ontology-editor/components/createBranchOverlay/createBranchOverlay.component.html',
        bindings: {
            dismiss: '&',
            close: '&'
        },
        controllerAs: 'dvm',
        controller: createBranchOverlayComponentCtrl
    };

    createBranchOverlayComponentCtrl.$inject = ['$q', 'catalogManagerService', 'ontologyStateService', 'prefixes'];

    function createBranchOverlayComponentCtrl($q, catalogManagerService, ontologyStateService, prefixes) {
        var dvm = this;
        var cm = catalogManagerService;
        var catalogId = _.get(cm.localCatalog, '@id', '');

        dvm.os = ontologyStateService;
        dvm.error = '';
        dvm.branchConfig = {
            title: '',
            description: ''
        };

        dvm.create = function() {
            if (dvm.branchConfig.description === '') {
                _.unset(dvm.branchConfig, 'description');
            }
            var commitId;
            cm.createRecordBranch(dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.branchConfig, dvm.os.listItem.ontologyRecord.commitId)
            .then(branchId => cm.getRecordBranch(branchId, dvm.os.listItem.ontologyRecord.recordId, catalogId), $q.reject)
            .then(branch => {
                dvm.os.listItem.branches.push(branch);
                dvm.os.listItem.ontologyRecord.branchId = branch['@id'];
                commitId = branch[prefixes.catalog + 'head'][0]['@id'];
                dvm.os.listItem.upToDate = true;
                return dvm.os.updateOntologyState({recordId: dvm.os.listItem.ontologyRecord.recordId, commitId, branchId: dvm.os.listItem.ontologyRecord.branchId});
            }, $q.reject)
            .then(() => {
                dvm.close();
                dvm.os.resetStateTabs();
            }, onError);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }

        function onError(errorMessage) {
            dvm.error = errorMessage;
        }
    }

    angular.module('ontology-editor')
        .component('createBranchOverlay', createBranchOverlayComponent);
})();
