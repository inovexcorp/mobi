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
import * as angular from 'angular';

import advancedLanguageSelectComponent from './components/advancedLanguageSelect/advancedLanguageSelect.component';
import annotationBlockComponent from './components/annotationBlock/annotationBlock.component';
import annotationOverlayComponent from './components/annotationOverlay/annotationOverlay.component';
import associationBlockComponent from './components/associationBlock/associationBlock.component';
import axiomBlockComponent from './components/axiomBlock/axiomBlock.component';
import axiomOverlayComponent from './components/axiomOverlay/axiomOverlay.component';
import characteristicsBlockComponent from './components/characteristicsBlock/characteristicsBlock.component';
import characteristicsRowComponent from './components/characteristicsRow/characteristicsRow.component';
import classAxiomsComponent from './components/classAxioms/classAxioms.component';
import classesTabComponent from './components/classesTab/classesTab.component';
import classHierarchyBlockComponent from './components/classHierarchyBlock/classHierarchyBlock.component';
import commitOverlayComponent from './components/commitOverlay/commitOverlay.component';
import commitsTabComponent from './components/commitsTab/commitsTab.component';
import conceptHierarchyBlockComponent from './components/conceptHierarchyBlock/conceptHierarchyBlock.component';
import conceptSchemeHierarchyBlockComponent from './components/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.component';
import conceptSchemesTabComponent from './components/conceptSchemesTab/conceptSchemesTab.component';
import conceptsTabComponent from './components/conceptsTab/conceptsTab.component';
import createAnnotationPropertyOverlayComponent from './components/createAnnotationPropertyOverlay/createAnnotationPropertyOverlay.component';
import createBranchOverlayComponent from './components/createBranchOverlay/createBranchOverlay.component';
import createClassOverlayComponent from './components/createClassOverlay/createClassOverlay.component';
import createConceptOverlayComponent from './components/createConceptOverlay/createConceptOverlay.component';
import createConceptSchemeOverlayComponent from './components/createConceptSchemeOverlay/createConceptSchemeOverlay.component';
import createDataPropertyOverlayComponent from './components/createDataPropertyOverlay/createDataPropertyOverlay.component';
import createEntityModalComponent from './components/createEntityModal/createEntityModal.component';
import createIndividualOverlayComponent from './components/createIndividualOverlay/createIndividualOverlay.component';
import createObjectPropertyOverlayComponent from './components/createObjectPropertyOverlay/createObjectPropertyOverlay.component';
import createTagModalComponentAjs from './components/createTagModal/createTagModal.component.ajs';
import datatypePropertyAxiomsComponent from './components/datatypePropertyAxioms/datatypePropertyAxioms.component';
import datatypePropertyBlockComponent from './components/datatypePropertyBlock/datatypePropertyBlock.component';
import datatypePropertyOverlayComponent from './components/datatypePropertyOverlay/datatypePropertyOverlay.component';
import editBranchOverlayComponent from './components/editBranchOverlay/editBranchOverlay.component';
import everythingTreeComponent from './components/everythingTree/everythingTree.component';
import hierarchyFilterComponent from './components/hierarchyFilter/hierarchyFilter.component';
import hierarchyTreeComponent from './components/hierarchyTree/hierarchyTree.component';
import importsBlockComponent from './components/importsBlock/importsBlock.component';
import importsOverlayComponent from './components/importsOverlay/importsOverlay.component';
import individualHierarchyBlockComponent from './components/individualHierarchyBlock/individualHierarchyBlock.component';
import individualsTabComponent from './components/individualsTab/individualsTab.component';
import individualTreeComponent from './components/individualTree/individualTree.component';
import individualTypesModalComponent from './components/individualTypesModal/individualTypesModal.component';
import iriSelectOntologyComponent from './components/iriSelectOntology/iriSelectOntology.component';
import mergeBlockComponent from './components/mergeBlock/mergeBlock.component';
import mergeTabComponent from './components/mergeTab/mergeTab.component';
import newOntologyOverlayComponent from './components/newOntologyOverlay/newOntologyOverlay.component';
import objectPropertyAxiomsComponent from './components/objectPropertyAxioms/objectPropertyAxioms.component';
import objectPropertyBlockComponent from './components/objectPropertyBlock/objectPropertyBlock.component';
import objectPropertyOverlayComponent from './components/objectPropertyOverlay/objectPropertyOverlay.component';
import ontologyButtonStackComponent from './components/ontologyButtonStack/ontologyButtonStack.component';
import ontologyClassSelectComponent from './components/ontologyClassSelect/ontologyClassSelect.component';
import ontologyCloseOverlayComponent from './components/ontologyCloseOverlay/ontologyCloseOverlay.component';
import ontologyEditorPageComponent from './components/ontologyEditorPage/ontologyEditorPage.component';
import ontologyPropertiesBlockComponent from './components/ontologyPropertiesBlock/ontologyPropertiesBlock.component';
import ontologyPropertyOverlayComponent from './components/ontologyPropertyOverlay/ontologyPropertyOverlay.component';
import ontologySidebarComponent from './components/ontologySidebar/ontologySidebar.component';
import ontologyTabComponent from './components/ontologyTab/ontologyTab.component';
import openEntitySnackbarComponent from './components/openEntitySnackbar/openEntitySnackbar.component';
import openOntologySelectComponent from './components/openOntologySelect/openOntologySelect.component';
import openOntologyTabComponent from './components/openOntologyTab/openOntologyTab.component';
import overviewTabComponent from './components/overviewTab/overviewTab.component';
import previewBlockComponent from './components/previewBlock/previewBlock.component';
import projectTabComponent from './components/projectTab/projectTab.component';
import propertiesTabComponent from './components/propertiesTab/propertiesTab.component';
import propertyHierarchyBlockComponent from './components/propertyHierarchyBlock/propertyHierarchyBlock.component';
import propertyTreeComponent from './components/propertyTree/propertyTree.component';
import propertyValuesComponent from './components/propertyValues/propertyValues.component';
import recordAccessOverlayComponent from './components/recordAccessOverlay/recordAccessOverlay.component';
import savedChangesTabComponent from './components/savedChangesTab/savedChangesTab.component';
import searchTabComponent from './components/searchTab/searchTab.component';
import seeHistoryComponent from './components/seeHistory/seeHistory.component';
import selectedDetailsComponent from './components/selectedDetails/selectedDetails.component';
import serializationSelectComponent from './components/serializationSelect/serializationSelect.component';
import staticIriComponent from './components/staticIri/staticIri.component';
import superClassSelectComponent from './components/superClassSelect/superClassSelect.component';
import superPropertySelectComponent from './components/superPropertySelect/superPropertySelect.component';
import treeItemComponent from './components/treeItem/treeItem.component';
import uploadChangesOverlayComponent from './components/uploadChangesOverlay/uploadChangesOverlay.component';
import uploadOntologyOverlayComponent from './components/uploadOntologyOverlay/uploadOntologyOverlay.component';
import uploadErrorsOverlayComponent from './components/uploadErrorsOverlay/uploadErrorsOverlay.component';
import uploadSnackbarComponent from './components/uploadSnackbar/uploadSnackbar.component';
import usagesBlockComponent from './components/usagesBlock/usagesBlock.component';
import visualizationTabComponent from './components/visualizationTab/visualizationTab.component';

/**
 * @ngdoc overview
 * @name ontology-editor
 *
 * @description
 * The `ontology-editor` module provides components and services that make up the Ontology Editor page of Mobi for
 * creating, editing, and managing ontologies/vocabularies.
 */
angular.module('ontology-editor', [])
    .component('advancedLanguageSelect', advancedLanguageSelectComponent)
    .component('annotationBlock', annotationBlockComponent)
    .component('annotationOverlay', annotationOverlayComponent)
    .component('associationBlock', associationBlockComponent)
    .component('axiomBlock', axiomBlockComponent)
    .component('axiomOverlay', axiomOverlayComponent)
    .component('characteristicsBlock', characteristicsBlockComponent)
    .component('characteristicsRow', characteristicsRowComponent)
    .component('classAxioms', classAxiomsComponent)
    .component('classesTab', classesTabComponent)
    .component('classHierarchyBlock', classHierarchyBlockComponent)
    .component('commitOverlay', commitOverlayComponent)
    .component('commitsTab', commitsTabComponent)
    .component('conceptHierarchyBlock', conceptHierarchyBlockComponent)
    .component('conceptSchemeHierarchyBlock', conceptSchemeHierarchyBlockComponent)
    .component('conceptSchemesTab', conceptSchemesTabComponent)
    .component('conceptsTab', conceptsTabComponent)
    .component('createAnnotationPropertyOverlay', createAnnotationPropertyOverlayComponent)
    .component('createBranchOverlay', createBranchOverlayComponent)
    .component('createClassOverlay', createClassOverlayComponent)
    .component('createConceptOverlay', createConceptOverlayComponent)
    .component('createConceptSchemeOverlay', createConceptSchemeOverlayComponent)
    .component('createDataPropertyOverlay', createDataPropertyOverlayComponent)
    .component('createEntityModal', createEntityModalComponent)
    .component('createIndividualOverlay', createIndividualOverlayComponent)
    .component('createObjectPropertyOverlay', createObjectPropertyOverlayComponent)
    .component('createTagModalAjs', createTagModalComponentAjs)
    .component('datatypePropertyAxioms', datatypePropertyAxiomsComponent)
    .component('datatypePropertyBlock', datatypePropertyBlockComponent)
    .component('datatypePropertyOverlay', datatypePropertyOverlayComponent)
    .component('editBranchOverlay', editBranchOverlayComponent)
    .component('everythingTree', everythingTreeComponent)
    .component('hierarchyFilter', hierarchyFilterComponent)
    .component('hierarchyTree', hierarchyTreeComponent)
    .component('importsBlock', importsBlockComponent)
    .component('importsOverlay', importsOverlayComponent)
    .component('individualHierarchyBlock', individualHierarchyBlockComponent)
    .component('individualsTab', individualsTabComponent)
    .component('individualTree', individualTreeComponent)
    .component('individualTypesModal', individualTypesModalComponent)
    .component('iriSelectOntology', iriSelectOntologyComponent)
    .component('mergeBlock', mergeBlockComponent)
    .component('mergeTab', mergeTabComponent)
    .component('newOntologyOverlay', newOntologyOverlayComponent)
    .component('objectPropertyAxioms', objectPropertyAxiomsComponent)
    .component('objectPropertyBlock', objectPropertyBlockComponent)
    .component('objectPropertyOverlay', objectPropertyOverlayComponent)
    .component('ontologyButtonStack', ontologyButtonStackComponent)
    .component('ontologyClassSelect', ontologyClassSelectComponent)
    .component('ontologyCloseOverlay', ontologyCloseOverlayComponent)
    .component('ontologyEditorPage', ontologyEditorPageComponent)
    .component('ontologyPropertiesBlock', ontologyPropertiesBlockComponent)
    .component('ontologyPropertyOverlay', ontologyPropertyOverlayComponent)
    .component('ontologySidebar', ontologySidebarComponent)
    .component('ontologyTab', ontologyTabComponent)
    .component('openEntitySnackbar', openEntitySnackbarComponent)
    .component('openOntologySelect', openOntologySelectComponent)
    .component('openOntologyTab', openOntologyTabComponent)
    .component('overviewTab', overviewTabComponent)
    .component('previewBlock', previewBlockComponent)
    .component('projectTab', projectTabComponent)
    .component('propertiesTab', propertiesTabComponent)
    .component('propertyHierarchyBlock', propertyHierarchyBlockComponent)
    .component('propertyTree', propertyTreeComponent)
    .component('propertyValues', propertyValuesComponent)
    .component('recordAccessOverlay', recordAccessOverlayComponent)
    .component('savedChangesTab', savedChangesTabComponent)
    .component('searchTab', searchTabComponent)
    .component('seeHistory', seeHistoryComponent)
    .component('selectedDetails', selectedDetailsComponent)
    .component('serializationSelect', serializationSelectComponent)
    .component('staticIri', staticIriComponent)
    .component('superClassSelect', superClassSelectComponent)
    .component('superPropertySelect', superPropertySelectComponent)
    .component('treeItem', treeItemComponent)
    .component('uploadChangesOverlay', uploadChangesOverlayComponent)
    .component('uploadErrorsOverlay', uploadErrorsOverlayComponent)
    .component('uploadOntologyOverlay', uploadOntologyOverlayComponent)
    .component('uploadSnackbar', uploadSnackbarComponent)
    .component('usagesBlock', usagesBlockComponent)
    .component('visualizationTab', visualizationTabComponent);
