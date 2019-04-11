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
     * @name ontology-editor.component:ontologyDownloadOverlay
     * @requires shared.service:ontologyStateService
     * @requires shared.service:ontologyManagerService
     *
     * @description
     * `ontologyDownloadOverlay` is a component that creates content for a modal that downloads the current
     * {@link shared.service:ontologyStateService selected ontology} as an RDF file. The form in the modal
     * contains a {@link serializationSelect.directive:serializationSelect} and text input for the file name. Meant
     * to be used in conjunction with the {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const ontologyDownloadOverlayComponent = {
        templateUrl: 'ontology-editor/components/ontologyDownloadOverlay/ontologyDownloadOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: ontologyDownloadOverlayComponentCtrl
    };

    ontologyDownloadOverlayComponentCtrl.$inject = ['$filter', 'REGEX', 'ontologyStateService', 'ontologyManagerService'];

    function ontologyDownloadOverlayComponentCtrl($filter, REGEX, ontologyStateService, ontologyManagerService) {
        var dvm = this;
        var om = ontologyManagerService;

        dvm.fileNamePattern = REGEX.FILENAME;
        dvm.os = ontologyStateService;
        dvm.fileName = $filter('splitIRI')(dvm.os.listItem.ontologyId).end;

        dvm.download = function() {
            om.downloadOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.serialization, dvm.fileName);
            dvm.close();
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular.module('ontology-editor')
        .component('ontologyDownloadOverlay', ontologyDownloadOverlayComponent);
})();
