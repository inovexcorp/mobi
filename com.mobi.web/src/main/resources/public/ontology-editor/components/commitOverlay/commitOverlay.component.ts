/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { get, find } from 'lodash';
import { first } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

const template = require('./commitOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:commitOverlay
 * @requires shared.service:ontologyStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `commitOverlay` is a component that creates content for a modal to commit the changes to the
 * {@link shared.service:ontologyStateService selected ontology}. The form in the modal contains a
 * {@link shared.component:textArea} for the commit message. Meant to be used in conjunction with the
 * {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const commitOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: commitOverlayComponentCtrl
};

commitOverlayComponentCtrl.$inject = ['$q', 'ontologyStateService', 'catalogManagerService', 'utilService'];

function commitOverlayComponentCtrl($q, ontologyStateService: OntologyStateService, catalogManagerService: CatalogManagerService, utilService) {
    var dvm = this;
    var cm = catalogManagerService;
    var catalogId = get(cm.localCatalog, '@id', '');
    var util = utilService;

    dvm.os = ontologyStateService;
    dvm.error = '';

    dvm.commit = function() {
        if (dvm.os.listItem.upToDate) {
            createCommit(dvm.os.listItem.versionedRdfRecord.branchId);
        } else {
            var branch = find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.versionedRdfRecord.branchId});
            var branchConfig: any = {title: util.getDctermsValue(branch, 'title')};
            var description = util.getDctermsValue(branch, 'description');
            if (description) {
                branchConfig.description = description;
            }
            var branchId;
            cm.createRecordUserBranch(dvm.os.listItem.versionedRdfRecord.recordId, catalogId, branchConfig, dvm.os.listItem.versionedRdfRecord.commitId, dvm.os.listItem.versionedRdfRecord.branchId).pipe(first()).toPromise()
                .then((branchIri: string) => {
                    branchId = branchIri;
                    return cm.getRecordBranch(branchId, dvm.os.listItem.versionedRdfRecord.recordId, catalogId).pipe(first()).toPromise();
                }, $q.reject)
                .then(branch => {
                    dvm.os.listItem.branches.push(branch);
                    dvm.os.listItem.versionedRdfRecord.branchId = branch['@id'];
                    dvm.os.listItem.upToDate = true;
                    dvm.os.listItem.userBranch = true;
                    createCommit(branch['@id']);
                }, onError);
        }
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function onError(errorMessage) {
        dvm.error = errorMessage;
    }

    function createCommit(branchId) {
        var commitId;
        cm.createBranchCommit(branchId, dvm.os.listItem.versionedRdfRecord.recordId, catalogId, dvm.comment).pipe(first()).toPromise()
            .then((commitIri: string) => {
                commitId = commitIri;
                return dvm.os.updateState({recordId: dvm.os.listItem.versionedRdfRecord.recordId, commitId, branchId}).pipe(first()).toPromise();
            }, $q.reject)
            .then(() => {
                dvm.os.listItem.versionedRdfRecord.branchId = branchId;
                dvm.os.listItem.versionedRdfRecord.commitId = commitId;
                dvm.os.clearInProgressCommit();
                dvm.close();
            }, onError);
    }
}

export default commitOverlayComponent;
