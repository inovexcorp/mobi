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
     * @name ontology-editor.component:relationshipOverlay
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:utilService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     * @requires shared.service:propertyManagerService
     *
     * @description
     * `axiomOverlay` is a component that creates content for a modal that adds a SKOS relationship to the
     * {@link shared.service:ontologyStateService selected concept}. The form in the modal contains a
     * `ui-select` of the provided relationships and a `ui-select` of the appropriate values for the selected
     * relationship (concepts or concept schemes). Meant to be used in conjunction with the
     * {@link shared.service:modalService}.
     *
     * @param {Object} resolve Information provided to the modal
     * @param {Object[]} resolve.relationshipList The list of relationships available to add to the selected concept
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const relationshipOverlayComponent = {
        templateUrl: 'ontology-editor/components/relationshipOverlay/relationshipOverlay.component.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: relationshipOverlayComponentCtrl
    };

    relationshipOverlayComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'propertyManagerService'];

    function relationshipOverlayComponentCtrl(ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, propertyManagerService) {
        var dvm = this;
        var pm = propertyManagerService;
        var om = ontologyManagerService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.os = ontologyStateService;
        dvm.util = utilService;
        dvm.array = [];
        dvm.conceptList = [];
        dvm.schemeList = [];
        dvm.values = [];

        dvm.$onInit = function() {
            dvm.conceptList = _.without(om.getConceptIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConcepts), dvm.os.listItem.selected['@id']);
            dvm.schemeList = _.without(om.getConceptSchemeIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConceptSchemes), dvm.os.listItem.selected['@id']);
        }
        dvm.addRelationship = function() {
            var addedValues = _.filter(dvm.values, value => pm.addId(dvm.os.listItem.selected, dvm.relationship, value));
            if (addedValues.length !== dvm.values.length) {
                dvm.util.createWarningToast('Duplicate property values not allowed');
            }
            if (addedValues.length) {
                var addedValueObjs = _.map(addedValues, value => ({'@id': value}));
                dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': dvm.os.listItem.selected['@id'], [dvm.relationship]: addedValueObjs});
                dvm.ontoUtils.saveCurrentChanges()
                    .then(() => {
                        dvm.close({$value: {relationship: dvm.relationship, values: addedValueObjs}})
                    });
            } else {
                dvm.close();
            }
        }
        dvm.getValues = function(searchText) {
            var isSchemeRelationship = _.includes(pm.conceptSchemeRelationshipList, dvm.relationship);
            var isSemanticRelation = _.includes(dvm.os.listItem.derivedSemanticRelations, dvm.relationship);
            var list = [];
            if (!isSchemeRelationship && !isSemanticRelation) {
                dvm.array = [];
                return;
            } else if (isSchemeRelationship) {
                list = dvm.schemeList;
            } else {
                list = dvm.conceptList;
            }

            dvm.array = dvm.ontoUtils.getSelectList(list, searchText);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular.module('ontology-editor')
        .component('relationshipOverlay', relationshipOverlayComponent);
})();
