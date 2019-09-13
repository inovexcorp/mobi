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
import { union, get, map, difference } from 'lodash';

const template = require('./topConceptOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:topConceptOverlay
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 *
 * @description
 * `topConceptOverlay` is a component that creates content for a modal that adds skos:hasTopConcept(s) to the
 * {@link shared.service:ontologyStateService selected concept scheme}. The form in the modal
 * contains a `ui-select` with all the concepts in the current
 * {@link shared.service:ontologyStateService selected ontology}. Meant to be used in conjunction with
 * the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const topConceptOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: topConceptOverlayComponentCtrl
};

topConceptOverlayComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'utilService'];

function topConceptOverlayComponentCtrl(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, utilService) {
    var dvm = this;
    var om = ontologyManagerService;
    var os = ontologyStateService;
    var axiom = prefixes.skos + 'hasTopConcept';
    dvm.ontoUtils = ontologyUtilsManagerService;
    dvm.util = utilService;
    dvm.values = [];

    var concepts = [];
    dvm.filteredConcepts = [];

    dvm.$onInit = function() {
        concepts = getConceptList();
        dvm.filteredConcepts = concepts;
    }
    dvm.addTopConcept = function() {
        os.listItem.selected[axiom] = union(get(os.listItem.selected, axiom, []), dvm.values);
        os.addToAdditions(os.listItem.ontologyRecord.recordId, {'@id': os.listItem.selected['@id'], [axiom]: dvm.values});
        dvm.ontoUtils.saveCurrentChanges();
        dvm.close({$value: {relationship: prefixes.skos + 'hasTopConcept', values: dvm.values}});
    }
    dvm.getConcepts = function(searchText) {
        dvm.filteredConcepts = dvm.ontoUtils.getSelectList(concepts, searchText);
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }

    function getConceptList() {
        var all = om.getConceptIRIs(os.getOntologiesArray(), os.listItem.derivedConcepts);
        var set = map(get(os.listItem.selected, axiom), '@id');
        return difference(all, set);
    }
}

export default topConceptOverlayComponent;