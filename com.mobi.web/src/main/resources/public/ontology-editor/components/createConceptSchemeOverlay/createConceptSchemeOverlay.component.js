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
     * @name ontology-editor.component:createConceptSchemeOverlay
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:prefixes
     * @requires shared.service:utilService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     *
     * @description
     * `createConceptSchemeOverlay` is a component that creates content for a modal that creates a concept scheme
     * in the current {@link shared.service:ontologyStateService selected ontology/vocabulary}. The form in
     * the modal contains a text input for the concept scheme name (which populates the
     * {@link staticIri.directive:staticIri IRI}),
     * an {@link advancedLanguageSelect.directive:advancedLanguageSelect}, and a `ui-select` for the top concepts.
     * Meant to be used in conjunction with the {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const createConceptSchemeOverlayComponent = {
        templateUrl: 'ontology-editor/components/createConceptSchemeOverlay/createConceptSchemeOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: createConceptSchemeOverlayComponentCtrl
    };

    createConceptSchemeOverlayComponentCtrl.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService'];

    function createConceptSchemeOverlayComponentCtrl($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService) {
        var dvm = this;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.prefixes = prefixes;
        dvm.om = ontologyManagerService;
        dvm.os = ontologyStateService;
        dvm.util = utilService;
        dvm.conceptIRIs = dvm.om.getConceptIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConcepts);
        dvm.concepts = [];
        dvm.selectedConcepts = [];
        dvm.prefix = dvm.os.getDefaultPrefix();
        dvm.scheme = {
            '@id': dvm.prefix,
            '@type': [prefixes.owl + 'NamedIndividual', prefixes.skos + 'ConceptScheme'],
            [prefixes.dcterms + 'title']: [{
                '@value': ''
            }]
        }

        dvm.nameChanged = function() {
            if (!dvm.iriHasChanged) {
                dvm.scheme['@id'] = dvm.prefix + $filter('camelCase')(
                    dvm.scheme[prefixes.dcterms + 'title'][0]['@value'], 'class');
            }
        }
        dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
            dvm.iriHasChanged = true;
            dvm.scheme['@id'] = iriBegin + iriThen + iriEnd;
            dvm.os.setCommonIriParts(iriBegin, iriThen);
        }
        dvm.create = function() {
            if (dvm.selectedConcepts.length) {
                dvm.scheme[prefixes.skos + 'hasTopConcept'] = dvm.selectedConcepts;
            }
            dvm.ontoUtils.addLanguageToNewEntity(dvm.scheme, dvm.language);
            // add the entity to the ontology
            dvm.os.addEntity(dvm.os.listItem, dvm.scheme);
            // update relevant lists
            dvm.os.listItem.conceptSchemes.iris[dvm.scheme['@id']] = dvm.os.listItem.ontologyId;
            // Add top concepts to hierarchy if they exist
            _.forEach(dvm.selectedConcepts, concept => {
                dvm.os.addEntityToHierarchy(dvm.os.listItem.conceptSchemes, concept['@id'], dvm.scheme['@id']);
            });
            dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.conceptSchemes);
            // Update additions
            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.scheme);
            // Update individual hierarchy
            dvm.ontoUtils.addIndividual(dvm.scheme);
            // Save the changes to the ontology
            dvm.ontoUtils.saveCurrentChanges();
            // Open snackbar
            dvm.os.listItem.goTo.entityIRI = dvm.scheme['@id'];
            dvm.os.listItem.goTo.active = true;
            // hide the overlay
            dvm.close();
        }
        dvm.getConcepts = function(searchText) {
            dvm.concepts = dvm.ontoUtils.getSelectList(dvm.conceptIRIs, searchText);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular.module('ontology-editor')
        .component('createConceptSchemeOverlay', createConceptSchemeOverlayComponent);
})();
