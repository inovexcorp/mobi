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
import { map, get, concat, reject, includes, findIndex, some, sortBy, pick } from 'lodash';

import './importsBlock.component.scss';

const template = require('./importsBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:importsBlock
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 * @requires shared.service:propertyManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `importsBlock` is a component that creates a section that displays the imports on the ontology represented by
 * the provided {@link shared.service:ontologyStateService list item}. The section contains buttons for adding an
 * import and reloading the imports. Each import is displayed as its IRI and with a remove button. The component
 * houses the methods for opening the modal for {@link ontology-editor.component:importsOverlay adding} and removing
 * imports.
 * 
 * @param {Object} listItem An object representing an ontology as defined by the
 * {@link shared.service:ontologyStateService ontologyStateService}.
 */
const importsBlockComponent = {
    template,
    bindings: {
        listItem: '<'
    },
    controllerAs: 'dvm',
    controller: importsBlockComponentCtrl
};

importsBlockComponentCtrl.$inject = ['$q', '$timeout', 'ontologyStateService', 'prefixes', 'utilService', 'propertyManagerService', 'modalService'];

function importsBlockComponentCtrl($q, $timeout, ontologyStateService, prefixes, utilService, propertyManagerService, modalService) {
    var dvm = this;
    var util = utilService;
    var pm = propertyManagerService;
    dvm.prefixes = prefixes;
    dvm.os = ontologyStateService;
    dvm.showRemoveOverlay = false;
    dvm.indirectImports = [];

    dvm.$onChanges = function() {
        dvm.setIndirectImports();
    }
    dvm.setupRemove = function(url) {
        dvm.url = url;
        dvm.showRemoveOverlay = true;
        var msg = '';
        if (dvm.os.hasChanges(dvm.listItem)) {
            msg = '<p><strong>NOTE: You have some unsaved changes.</strong></p><p>Would you like to save those changes and remove the import: <strong>' + url + '</strong>?</p>';
        } else {
            msg = '<p>Are you sure you want to remove the import: <strong>' + url + '</strong>?</p>';
        }
        modalService.openConfirmModal(msg, dvm.remove);
    }
    dvm.remove = function() {
        var importsIRI = dvm.prefixes.owl + 'imports';
        dvm.os.addToDeletions(dvm.listItem.ontologyRecord.recordId, util.createJson(dvm.listItem.selected['@id'], importsIRI, {'@id': dvm.url}));
        pm.remove(dvm.listItem.selected, importsIRI, findIndex(dvm.listItem.selected[importsIRI], {'@id': dvm.url}));
        dvm.os.saveChanges(dvm.listItem.ontologyRecord.recordId, {additions: dvm.listItem.additions, deletions: dvm.listItem.deletions})
            .then(() => dvm.os.afterSave(), $q.reject)
            .then(() => dvm.os.updateOntology(dvm.listItem.ontologyRecord.recordId, dvm.listItem.ontologyRecord.branchId, dvm.listItem.ontologyRecord.commitId, dvm.listItem.upToDate, dvm.listItem.inProgressCommit), $q.reject)
            .then(() => {
                dvm.os.updateIsSaved();
                // dvm.os.listItem.isSaved = dvm.os.isCommittable(dvm.os.listItem);
                dvm.setIndirectImports();
            }, util.createErrorToast);
    }
    dvm.get = function(obj) {
        return get(obj, '@id');
    }
    dvm.failed = function(iri) {
        return includes(dvm.listItem.failedImports, iri);
    }
    dvm.refresh = function() {
        dvm.os.updateOntology(dvm.listItem.ontologyRecord.recordId, dvm.listItem.ontologyRecord.branchId, dvm.listItem.ontologyRecord.commitId, dvm.listItem.upToDate, dvm.listItem.inProgressCommit, true)
            .then(response => {
                dvm.os.listItem.hasPendingRefresh = true;
                dvm.setIndirectImports();
                util.createSuccessToast('');
            }, util.createErrorToast);
    }
    dvm.setIndirectImports = function() {
        var directImports = map(get(dvm.listItem.selected, prefixes.owl + 'imports'), '@id');
        var goodImports = map(dvm.listItem.importedOntologies, item => pick(item, 'id', 'ontologyId'));
        var failedImports = map(dvm.listItem.failedImports, iri => ({ id: iri, ontologyId: iri }));
        var allImports = concat(goodImports, failedImports);
        var filtered = reject(allImports, item => includes(directImports, item.id) || includes(directImports, item.ontologyId));
        // TODO: currently a new filter was added in order to support situations where the back-end cannot set an ontologyIRI to ontologyID. Long term, changes will be made on the backend to properly support these scenarios.
        dvm.indirectImports = sortBy(map(filtered, item => item.ontologyId || item.id));
    }
    dvm.showNewOverlay = function() {
        modalService.openModal('importsOverlay', {}, dvm.setIndirectImports);
    }
}

export default importsBlockComponent;
