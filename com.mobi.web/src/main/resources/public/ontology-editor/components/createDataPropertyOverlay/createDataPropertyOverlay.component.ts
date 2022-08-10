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
import { unset, forEach, map } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';

const template = require('./createDataPropertyOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:createDataPropertyOverlay
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:prefixes
 *
 * @description
 * `createDataPropertyOverlay` is a component that creates content for a modal that creates a data property in the
 * current {@link shared.service:ontologyStateService selected ontology}. The form in the modal contains a text
 * input for the property name (which populates the {@link ontology-editor.component:staticIri IRI}), a
 * {@link shared.component:textArea} for the property description, an
 * {@link ontology-editor.component:advancedLanguageSelect},
 * {@link shared.component:checkbox checkboxes} for the property characteristics, an
 * {@link ontology-editor.component:iriSelectOntology} for the domain, an
 * {@link ontology-editor.component:iriSelectOntology} for the range, and a
 * {@link ontology-editor.component:superPropertySelect}. Meant to be used in conjunction with the
 * {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const createDataPropertyOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: createDataPropertyOverlayComponentCtrl
}

createDataPropertyOverlayComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'prefixes'];

function createDataPropertyOverlayComponentCtrl($filter, ontologyStateService: OntologyStateService, prefixes) {
    var dvm = this;
    dvm.characteristics = [
        {
            checked: false,
            typeIRI: prefixes.owl + 'FunctionalProperty',
            displayText: 'Functional Property',
        }
    ];
    dvm.prefixes = prefixes;
    dvm.os = ontologyStateService;
    dvm.prefix = dvm.os.getDefaultPrefix();
    dvm.values = [];
    dvm.duplicateCheck = true;
    dvm.property = {
        '@id': dvm.prefix,
        '@type': [dvm.prefixes.owl + 'DatatypeProperty'],
        [prefixes.dcterms + 'title']: [{
            '@value': ''
        }],
        [prefixes.dcterms + 'description']: [{
            '@value': ''
        }]
    };
    dvm.domains = [];
    dvm.ranges = [];

    dvm.nameChanged = function() {
        if (!dvm.iriHasChanged) {
            dvm.property['@id'] = dvm.prefix + $filter('camelCase')(dvm.property[prefixes.dcterms + 'title'][0]['@value'], 'property');
        }
    }
    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
        dvm.iriHasChanged = true;
        dvm.property['@id'] = iriBegin + iriThen + iriEnd;
        dvm.os.setCommonIriParts(iriBegin, iriThen);
    }
    dvm.create = function() {
        dvm.duplicateCheck = false;
        if (dvm.property[prefixes.dcterms + 'description'][0]['@value'] === '') {
            unset(dvm.property, prefixes.dcterms + 'description');
        }
        forEach(dvm.characteristics, (obj, key) => {
            if (obj.checked) {
                dvm.property['@type'].push(obj.typeIRI);
            }
        });
        if (dvm.domains.length) {
            dvm.property[prefixes.rdfs + 'domain'] = map(dvm.domains, iri => ({'@id': iri}));
        }
        if (dvm.ranges.length) {
            dvm.property[prefixes.rdfs + 'range'] = map(dvm.ranges, iri => ({'@id': iri}));
        }
        dvm.os.addLanguageToNewEntity(dvm.property, dvm.language);
        dvm.os.updatePropertyIcon(dvm.property);
        ontologyStateService.handleNewProperty(dvm.property);
        // add the entity to the ontology
        ontologyStateService.addEntity(dvm.property);
        // update lists
        updateLists();
        dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.listItem);
        // Update InProgressCommit
        dvm.os.addToAdditions(dvm.os.listItem.versionedRdfRecord.recordId, dvm.property);
        // Save the changes to the ontology
        dvm.os.saveCurrentChanges().subscribe();
        // Open snackbar
        dvm.os.listItem.goTo.entityIRI = dvm.property['@id'];
        dvm.os.listItem.goTo.active = true;
        // hide the overlay
        dvm.close();
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function updateLists() {
        dvm.os.listItem.dataProperties.iris[dvm.property['@id']] = dvm.os.listItem.ontologyId;
        if (dvm.values.length) {
            dvm.property[prefixes.rdfs + 'subPropertyOf'] = dvm.values;
            dvm.os.setSuperProperties(dvm.property['@id'], map(dvm.values, '@id'), 'dataProperties');
        } else {
            dvm.os.listItem.dataProperties.flat = dvm.os.flattenHierarchy(dvm.os.listItem.dataProperties);
        }
    }
}

export default createDataPropertyOverlayComponent;
