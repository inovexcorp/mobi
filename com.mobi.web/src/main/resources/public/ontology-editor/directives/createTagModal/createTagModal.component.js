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

    angular
        /**
         * @ngdoc overview
         * @name createTagModal
         *
         * @description
         * The `createTagModal` module only provides the `createTagModal` component which creates content for a modal to
         * create a tag on an ontology.
         */
        .module('createTagModal', [])
        /**
         * @ngdoc component
         * @name createTagModal.component:createTagModal
         * @requires shared.service:catalogManagerService
         * @requires shared.service:ontologyStateService
         *
         * @description
         * `createTagModal` is a component that creates content for a modal that creates a tag on the current
         * {@link shared.service:ontologyStateService selected ontology} on the commit that is currently being
         * viewed. The form in the modal contains two {@link shared.directive:textInput}s for the tag IRI and the
         * title of the tag. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('createTagModal', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: CreateTagModalCtrl,
            templateUrl: 'ontology-editor/directives/createTagModal/createTagModal.component.html',
        });

    CreateTagModalCtrl.$inject = ['$q', '$filter', 'REGEX', 'catalogManagerService', 'ontologyStateService'];

    function CreateTagModalCtrl($q, $filter, REGEX, catalogManagerService, ontologyStateService) {
        var dvm = this;
        var cm = catalogManagerService;
        var catalogId = _.get(cm.localCatalog, '@id', '');
        var now = new Date();

        dvm.iriPattern = REGEX.IRI;
        dvm.os = ontologyStateService;
        dvm.error = '';
        dvm.tagConfig = {};

        dvm.$onInit = function() {
            var tagIRI = dvm.os.listItem.ontologyId
            var endChar = dvm.os.listItem.ontologyId.slice(-1);
            if (endChar != '/' && endChar != '#' && endChar != ':') {
                tagIRI += '/';
            }
            dvm.tagConfig = {
                iri: tagIRI,
                title: '',
                commitId: dvm.os.listItem.ontologyRecord.commitId
            };
        }

        dvm.nameChanged = function() {
            if (!dvm.iriHasChanged) {
                var split = $filter('splitIRI')(dvm.tagConfig.iri);
                dvm.tagConfig.iri = split.begin + split.then + $filter('camelCase')(dvm.tagConfig.title, 'class');
            }
        }
        dvm.create = function() {
            cm.createRecordTag(dvm.os.listItem.ontologyRecord.recordId, catalogId, dvm.tagConfig)
                .then(() => cm.getRecordVersion(dvm.tagConfig.iri, dvm.os.listItem.ontologyRecord.recordId, catalogId), $q.reject)
                .then(tag => {
                    dvm.os.listItem.tags.push(tag);
                    dvm.os.listItem.ontologyRecord.branchId = '';
                    return dvm.os.updateOntologyState({recordId: dvm.os.listItem.ontologyRecord.recordId, commitId: dvm.tagConfig.commitId, tagId: tag['@id']})
                }, $q.reject)
                .then(() => {
                    dvm.close();
                }, onError);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }

        function onError(errorMessage) {
            dvm.error = errorMessage;
        }
    }
})();
