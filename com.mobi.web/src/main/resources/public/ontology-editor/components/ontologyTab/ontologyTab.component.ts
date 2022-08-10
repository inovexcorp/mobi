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
import { find, get } from 'lodash';
import { first } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';

import './ontologyTab.component.scss';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { noop } from 'rxjs';

const template = require('./ontologyTab.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:ontologyTab
 * @requires shared.service:ontologyStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `ontologyTab` is a component that creates a `div` containing all the components necessary for
 * displaying an ontology. This includes a {@link ontology-editor.component:mergeTab},
 * {@link ontology-editor.component:ontologyButtonStack}, and
 * {@link shared.component:materialTabset}. The `materialTabset` contains tabs for the
 * {@link ontology-editor.component:projectTab}, {@link ontology-editor.component:overviewTab},
 * {@link ontology-editor.component:classesTab}, {@link ontology-editor.component:propertiesTab},
 * {@link ontology-editor.component:individualsTab}, {@link ontology-editor.component:conceptSchemesTab},
 * {@link ontology-editor.component:conceptsTab}, {@link ontology-editor.component:searchTab},
 * {@link ontology-editor.component:savedChangesTab}, and {@link ontology-editor.component:commitsTab}.
 */
const ontologyTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: ontologyTabComponentCtrl
};

ontologyTabComponentCtrl.$inject = ['$q', 'ontologyStateService', 'catalogManagerService', 'utilService', 'prefixes'];

function ontologyTabComponentCtrl($q, ontologyStateService: OntologyStateService, catalogManagerService: CatalogManagerService, utilService, prefixes) {
    var dvm = this;
    var cm = catalogManagerService;
    var util = utilService;

    dvm.os = ontologyStateService;
    dvm.savedChanges = '<i class="fa fa-exclamation-triangle"></i> Changes';

    dvm.$onInit = function() {
        checkBranchExists();
    }

    dvm.setSelected = function(entityIRI, getUsages = true) { // TODO: Remove this and call the os.setSelected method directly in html using async pipe once component gets upgraded
        dvm.os.setSelected(entityIRI, getUsages).toPromise();
    }

    function checkBranchExists() {
        if (dvm.os.listItem.versionedRdfRecord.branchId && !find(dvm.os.listItem.branches, {'@id': dvm.os.listItem.versionedRdfRecord.branchId})) {
            var catalogId = get(cm.localCatalog, '@id', '');
            var masterBranch = find(dvm.os.listItem.branches, branch => util.getDctermsValue(branch, 'title') === 'MASTER')['@id'];
            var state = dvm.os.getStateByRecordId(dvm.os.listItem.versionedRdfRecord.recordId);
            var commitId = util.getPropertyId(find(state.model, {[prefixes.ontologyState + 'branch']: [{'@id': masterBranch}]}), prefixes.ontologyState + 'commit');
            cm.getBranchHeadCommit(masterBranch, dvm.os.listItem.versionedRdfRecord.recordId, catalogId).pipe(first()).toPromise()
                .then(headCommit => {
                    var headCommitId = get(headCommit, "commit['@id']", '');
                    if (!commitId) {
                        commitId = headCommitId;
                    }
                    return dvm.os.updateOntology(dvm.os.listItem.versionedRdfRecord.recordId, masterBranch, commitId, commitId === headCommitId).pipe(first()).toPromise();
                }, $q.reject)
                .then(() => dvm.os.resetStateTabs(), util.createErrorToast);
        }
    }
}

export default ontologyTabComponent;
