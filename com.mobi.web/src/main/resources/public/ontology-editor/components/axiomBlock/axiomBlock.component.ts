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
import { includes } from 'lodash';

const template = require('./axiomBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:axiomBlock
 * @requires shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:propertyManagerService
 * @requires shared.service:modalService
 * @requires shared.service:prefixes
 *
 * @description
 * `axiomBlock` is a component that creates a section that displays the appropriate axioms on the
 * {@link shared.service:ontologyStateService selected entity} based on its type. The components used for display
 * are {@link ontology-editor.component:classAxioms}, {@link ontology-editor.component:objectPropertyAxioms}, and
 * {@link ontology-editor.component:datatypePropertyAxioms}. The section header contains a button for adding
 * an axiom. The component houses the methods for opening the modal for
 * {@link ontology-editor.component:axiomOverlay adding} and removing axioms. 
 */
const axiomBlockComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: axiomBlockComponentCtrl        
};

axiomBlockComponentCtrl.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService', 'prefixes'];

function axiomBlockComponentCtrl(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, propertyManagerService, modalService, prefixes) {
    var dvm = this;
    var pm = propertyManagerService;
    var ontoUtils = ontologyUtilsManagerService;
    dvm.om = ontologyManagerService;
    dvm.os = ontologyStateService;

    dvm.showAxiomOverlay = function() {
        if (dvm.om.isClass(dvm.os.listItem.selected)) {
            modalService.openModal('axiomOverlay', {axiomList: pm.classAxiomList}, dvm.updateClassHierarchy);
        } else if (dvm.om.isObjectProperty(dvm.os.listItem.selected)) {
            modalService.openModal('axiomOverlay', {axiomList: pm.objectAxiomList}, dvm.updateObjectPropHierarchy);
        } else if (dvm.om.isDataTypeProperty(dvm.os.listItem.selected)) {
            modalService.openModal('axiomOverlay', {axiomList: pm.datatypeAxiomList}, dvm.updateDataPropHierarchy);
        }
    }
    dvm.updateClassHierarchy = function(updatedAxiomObj) {
        if (updatedAxiomObj.axiom === prefixes.rdfs + 'subClassOf' && updatedAxiomObj.values.length) {
            ontoUtils.setSuperClasses(dvm.os.listItem.selected['@id'], updatedAxiomObj.values);
            if (includes(dvm.os.listItem.individualsParentPath, dvm.os.listItem.selected['@id'])) {
                ontoUtils.updateflatIndividualsHierarchy(updatedAxiomObj.values);
            }
            dvm.os.setVocabularyStuff();
        }
    }
    dvm.updateDataPropHierarchy = function(updatedAxiomObj) {
        if (updatedAxiomObj.axiom === prefixes.rdfs + 'subPropertyOf' && updatedAxiomObj.values.length) {
            ontoUtils.setSuperProperties(dvm.os.listItem.selected['@id'], updatedAxiomObj.values, 'dataProperties');
        } else if (updatedAxiomObj.axiom === prefixes.rdfs + 'domain' && updatedAxiomObj.values.length) {
            dvm.os.addPropertyToClasses(dvm.os.listItem.selected['@id'], updatedAxiomObj.values);
            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.listItem);
        }
    }
    dvm.updateObjectPropHierarchy = function(updatedAxiomObj) {
        if (updatedAxiomObj.axiom === prefixes.rdfs + 'subPropertyOf' && updatedAxiomObj.values.length) {
            ontoUtils.setSuperProperties(dvm.os.listItem.selected['@id'], updatedAxiomObj.values, 'objectProperties');
            if (ontoUtils.containsDerivedSemanticRelation(updatedAxiomObj.values)) {
                dvm.os.setVocabularyStuff();
            }
        } else if (updatedAxiomObj.axiom === prefixes.rdfs + 'domain' && updatedAxiomObj.values.length) {
            dvm.os.addPropertyToClasses(dvm.os.listItem.selected['@id'], updatedAxiomObj.values);
            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.listItem);
        }
    }
}

export default axiomBlockComponent;