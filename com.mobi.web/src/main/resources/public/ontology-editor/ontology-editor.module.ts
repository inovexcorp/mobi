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
import { NgModule } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { SharedModule } from '../shared/shared.module';

import { AdvancedLanguageSelectComponent } from './components/advancedLanguageSelect/advancedLanguageSelect.component';
import { AnnotationBlockComponent } from './components/annotationBlock/annotationBlock.component';
import { AnnotationOverlayComponent } from './components/annotationOverlay/annotationOverlay.component';
import { AssociationBlockComponent } from './components/associationBlock/associationBlock.component';
import { AxiomBlockComponent } from './components/axiomBlock/axiomBlock.component';
import { AxiomOverlayComponent } from './components/axiomOverlay/axiomOverlay.component';
import { CharacteristicsBlockComponent } from './components/characteristicsBlock/characteristicsBlock.component';
import { CharacteristicsRowComponent } from './components/characteristicsRow/characteristicsRow.component';
import { ClassAxiomsComponent } from './components/classAxioms/classAxioms.component';
import { ClassHierarchyBlockComponent } from './components/classHierarchyBlock/classHierarchyBlock.component';
import { ClassesTabComponent } from './components/classesTab/classesTab.component';
import { CommitOverlayComponent } from './components/commitOverlay/commitOverlay.component';
import { CommitsTabComponent } from './components/commitsTab/commitsTab.component';
import { ConceptHierarchyBlockComponent } from './components/conceptHierarchyBlock/conceptHierarchyBlock.component';
import { ConceptSchemeHierarchyBlockComponent } from './components/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.component';
import { ConceptSchemesTabComponent } from './components/conceptSchemesTab/conceptSchemesTab.component';
import { ConceptsTabComponent } from './components/conceptsTab/conceptsTab.component';
import { CreateAnnotationPropertyOverlayComponent } from './components/createAnnotationPropertyOverlay/createAnnotationPropertyOverlay.component';
import { CreateBranchOverlayComponent } from './components/createBranchOverlay/createBranchOverlay.component';
import { CreateClassOverlayComponent } from './components/createClassOverlay/createClassOverlay.component';
import { CreateConceptOverlayComponent } from './components/createConceptOverlay/createConceptOverlay.component';
import { CreateConceptSchemeOverlayComponent }  from './components/createConceptSchemeOverlay/createConceptSchemeOverlay.component';
import { CreateDataPropertyOverlayComponent }  from './components/createDataPropertyOverlay/createDataPropertyOverlay.component';
import { CreateEntityModalComponent } from './components/createEntityModal/createEntityModal.component';
import { CreateIndividualOverlayComponent } from './components/createIndividualOverlay/createIndividualOverlay.component';
import { CreateObjectPropertyOverlayComponent } from './components/createObjectPropertyOverlay/createObjectPropertyOverlay.component';
import { CreateTagOverlayComponent } from './components/createTagOverlay/createTagOverlay.component';
import { DatatypePropertyAxiomsComponent } from './components/datatypePropertyAxioms/datatypePropertyAxioms.component';
import { DatatypePropertyBlockComponent } from './components/datatypePropertyBlock/datatypePropertyBlock.component';
import { DatatypePropertyOverlayComponent } from './components/datatypePropertyOverlay/datatypePropertyOverlay.component';
import { EditBranchOverlayComponent } from './components/editBranchOverlay/editBranchOverlay.component';
import { EverythingTreeComponent } from './components/everythingTree/everythingTree.component';
import { HierarchyFilterComponent } from './components/hierarchyFilter/hierarchyFilter.component';
import { HierarchyTreeComponent } from './components/hierarchyTree/hierarchyTree.component';
import { ImportsBlockComponent } from './components/importsBlock/importsBlock.component';
import { ImportsOverlayComponent } from './components/importsOverlay/importsOverlay.component';
import { IndividualsTabComponent } from './components/individualsTab/individualsTab.component';
import { IndividualHierarchyBlockComponent } from './components/individualHierarchyBlock/individualHierarchyBlock.component';
import { IndividualTypesModalComponent } from './components/individualTypesModal/individualTypesModal.component';
import { IndividualTreeComponent } from './components/individualTree/individualTree.component';
import { IriSelectOntologyComponent } from './components/iriSelectOntology/iriSelectOntology.component';
import { NewOntologyOverlayComponent } from './components/newOntologyOverlay/newOntologyOverlay.component';
import { ObjectPropertyAxiomsComponent } from './components/objectPropertyAxioms/objectPropertyAxioms.component';
import { ObjectPropertyBlockComponent } from './components/objectPropertyBlock/objectPropertyBlock.component';
import { ObjectPropertyOverlayComponent } from './components/objectPropertyOverlay/objectPropertyOverlay.component';
import { OntologyButtonStackComponent } from './components/ontologyButtonStack/ontologyButtonStack.component';
import { OntologyClassSelectComponent } from './components/ontologyClassSelect/ontologyClassSelect.component';
import { OntologyCloseOverlayComponent } from './components/ontologyCloseOverlay/ontologyCloseOverlay.component';
import { OntologyEditorPageComponent } from './components/ontologyEditorPage/ontologyEditorPage.component';
import { OntologyPropertiesBlockComponent } from './components/ontologyPropertiesBlock/ontologyPropertiesBlock.component';
import { OntologyPropertyOverlayComponent } from './components/ontologyPropertyOverlay/ontologyPropertyOverlay.component';
import { OntologySidebarComponent } from './components/ontologySidebar/ontologySidebar.component';
import { OntologyTabComponent } from './components/ontologyTab/ontologyTab.component';
import { OpenOntologySelectComponent } from './components/openOntologySelect/openOntologySelect.component';
import { OpenOntologyTabComponent } from './components/openOntologyTab/openOntologyTab.component';
import { OverviewTabComponent } from './components/overviewTab/overviewTab.component';
import { PreviewBlockComponent } from './components/previewBlock/previewBlock.component';
import { ProjectTabComponent } from './components/projectTab/projectTab.component';
import { PropertiesTabComponent } from './components/propertiesTab/propertiesTab.component';
import { PropertyHierarchyBlockComponent } from './components/propertyHierarchyBlock/propertyHierarchyBlock.component';
import { PropertyTreeComponent } from './components/propertyTree/propertyTree.component';
import { PropertyValuesComponent } from './components/propertyValues/propertyValues.component';
import { SavedChangesTabComponent } from './components/savedChangesTab/savedChangesTab.component';
import { SearchTabComponent } from './components/searchTab/searchTab.component';
import { SeeHistoryComponent } from './components/seeHistory/seeHistory.component';
import { SelectedDetailsComponent } from './components/selectedDetails/selectedDetails.component';
import { SerializationSelectComponent } from './components/serializationSelect/serializationSelect.component';
import { StaticIriComponent } from './components/staticIri/staticIri.component';
import { SuperClassSelectComponent } from './components/superClassSelect/superClassSelect.component';
import { SuperPropertySelectComponent } from './components/superPropertySelect/superPropertySelect.component';
import { TreeItemComponent } from './components/treeItem/treeItem.component';
import { UploadChangesOverlayComponent } from './components/uploadChangesOverlay/uploadChangesOverlay.component';
import { UploadErrorsOverlayComponent } from './components/uploadErrorsOverlay/uploadErrorsOverlay.component';
import { UploadOntologyOverlayComponent } from './components/uploadOntologyOverlay/uploadOntologyOverlay.component';
import { UploadSnackbarComponent } from './components/uploadSnackbar/uploadSnackbar.component';
import { UsagesBlockComponent } from './components/usagesBlock/usagesBlock.component';
import { VisualizationTabComponent } from './components/visualizationTab/visualizationTab.component';

import { OntologyVisualizationModule } from '../ontology-visualization/ontologyVisualization.module';
import { MergeBlockComponent } from './components/mergeBlock/mergeBlock.component';
import { MergeTabComponent } from './components/mergeTab/mergeTab.component';

/**
 * @namespace ontology-editor
 *
 * The `ontology-editor` module provides components and services that make up the Ontology Editor page of Mobi for
 * creating, editing, and managing ontologies/vocabularies.
 */
@NgModule({
    imports: [
        SharedModule,
        OntologyVisualizationModule,
    ],
    declarations: [
        AdvancedLanguageSelectComponent,
        AnnotationBlockComponent,
        AnnotationOverlayComponent,
        AssociationBlockComponent,
        AxiomBlockComponent,
        AxiomOverlayComponent,
        CharacteristicsBlockComponent,
        CharacteristicsRowComponent,
        ClassAxiomsComponent,
        ClassHierarchyBlockComponent,
        ClassesTabComponent,
        CommitOverlayComponent,
        CommitsTabComponent,
        ConceptHierarchyBlockComponent,
        ConceptSchemeHierarchyBlockComponent,
        ConceptSchemesTabComponent,
        ConceptsTabComponent,
        CreateAnnotationPropertyOverlayComponent,
        CreateBranchOverlayComponent,
        CreateClassOverlayComponent,
        CreateConceptOverlayComponent,
        CreateConceptSchemeOverlayComponent,
        CreateDataPropertyOverlayComponent,
        CreateEntityModalComponent,
        CreateIndividualOverlayComponent,
        CreateObjectPropertyOverlayComponent,
        CreateTagOverlayComponent,
        DatatypePropertyAxiomsComponent,
        DatatypePropertyOverlayComponent,
        DatatypePropertyBlockComponent,
        EditBranchOverlayComponent,
        EverythingTreeComponent,
        HierarchyFilterComponent,
        HierarchyTreeComponent,
        ImportsBlockComponent,
        ImportsOverlayComponent,
        IndividualHierarchyBlockComponent,
        IndividualsTabComponent,
        IndividualTypesModalComponent,
        IndividualTreeComponent,
        IriSelectOntologyComponent,
        MergeBlockComponent,
        MergeTabComponent,
        NewOntologyOverlayComponent,
        ObjectPropertyAxiomsComponent,
        ObjectPropertyBlockComponent,
        ObjectPropertyOverlayComponent,
        OntologyButtonStackComponent,
        OntologyClassSelectComponent,
        OntologyCloseOverlayComponent,
        OntologyEditorPageComponent,
        OntologyPropertiesBlockComponent,
        OntologyPropertyOverlayComponent,
        OntologyTabComponent,
        OntologySidebarComponent,
        OpenOntologySelectComponent,
        OpenOntologyTabComponent,
        OverviewTabComponent,
        PreviewBlockComponent,
        ProjectTabComponent,
        PropertiesTabComponent,
        PropertyHierarchyBlockComponent,
        PropertyTreeComponent,
        PropertyValuesComponent,
        SavedChangesTabComponent,
        SearchTabComponent,
        SeeHistoryComponent,
        SelectedDetailsComponent,
        SerializationSelectComponent,
        StaticIriComponent,
        SuperClassSelectComponent,
        SuperPropertySelectComponent,
        TreeItemComponent,
        UploadChangesOverlayComponent,
        UploadErrorsOverlayComponent,
        UploadOntologyOverlayComponent,
        UploadSnackbarComponent,
        UsagesBlockComponent,
        VisualizationTabComponent,
    ],
    entryComponents: [
        AnnotationOverlayComponent,
        AxiomOverlayComponent,
        CommitOverlayComponent,
        ClassesTabComponent,
        ClassHierarchyBlockComponent,
        CommitOverlayComponent,
        CreateAnnotationPropertyOverlayComponent,
        CreateBranchOverlayComponent,
        CreateClassOverlayComponent,
        CreateConceptOverlayComponent,
        CreateConceptSchemeOverlayComponent,
        CreateDataPropertyOverlayComponent,
        CreateEntityModalComponent,
        CreateIndividualOverlayComponent,
        CreateObjectPropertyOverlayComponent,
        CreateTagOverlayComponent,
        DatatypePropertyOverlayComponent,
        EditBranchOverlayComponent,
        ImportsOverlayComponent,
        IndividualTypesModalComponent,
        MergeBlockComponent,
        MergeTabComponent,
        NewOntologyOverlayComponent,
        ObjectPropertyOverlayComponent,
        OntologyButtonStackComponent,
        OntologyCloseOverlayComponent,
        OntologyEditorPageComponent,
        OntologyPropertyOverlayComponent,
        UploadChangesOverlayComponent,
        UploadErrorsOverlayComponent,
        UploadOntologyOverlayComponent,
        UploadSnackbarComponent,
    ]
})
export class OntologyEditorModule {}

angular.module('ontology-editor', [])
    .directive('advancedLanguageSelect', downgradeComponent({component: AdvancedLanguageSelectComponent}) as angular.IDirectiveFactory)
    .directive('annotationBlock', downgradeComponent({component: AnnotationBlockComponent}) as angular.IDirectiveFactory)
    .directive('annotationOverlay', downgradeComponent({component: AnnotationOverlayComponent}) as angular.IDirectiveFactory)
    .directive('associationBlock',downgradeComponent({component: AssociationBlockComponent}) as angular.IDirectiveFactory)
    .directive('axiomBlock', downgradeComponent({component: AxiomBlockComponent}) as angular.IDirectiveFactory)
    .directive('axiomOverlay', downgradeComponent({component: AxiomOverlayComponent}) as angular.IDirectiveFactory)
    .directive('characteristicsBlock', downgradeComponent({component: CharacteristicsBlockComponent}) as angular.IDirectiveFactory)
    .directive('characteristicsRow', downgradeComponent({component: CharacteristicsRowComponent}) as angular.IDirectiveFactory)
    .directive('classAxioms', downgradeComponent({component: ClassAxiomsComponent}) as angular.IDirectiveFactory)
    .directive('classHierarchyBlock', downgradeComponent({component: ClassHierarchyBlockComponent}) as angular.IDirectiveFactory)
    .directive('classesTab', downgradeComponent({component: ClassesTabComponent}) as angular.IDirectiveFactory)
    .directive('commitOverlay', downgradeComponent({component: CommitOverlayComponent}) as angular.IDirectiveFactory)
    .directive('commitsTab', downgradeComponent({component: CommitsTabComponent}) as angular.IDirectiveFactory)
    .directive('conceptHierarchyBlock', downgradeComponent({component: ConceptHierarchyBlockComponent}) as angular.IDirectiveFactory)
    .directive('conceptSchemeHierarchyBlock', downgradeComponent({component: ConceptSchemeHierarchyBlockComponent}) as angular.IDirectiveFactory)
    .directive('conceptSchemesTab', downgradeComponent({component: ConceptSchemesTabComponent}) as angular.IDirectiveFactory)
    .directive('conceptsTab', downgradeComponent({component: ConceptsTabComponent}) as angular.IDirectiveFactory)
    .directive('createAnnotationPropertyOverlay', downgradeComponent({component: CreateAnnotationPropertyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createBranchOverlay', downgradeComponent({component: CreateBranchOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createClassOverlay', downgradeComponent({component: CreateClassOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createConceptOverlay', downgradeComponent({component: CreateConceptOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createConceptSchemeOverlay', downgradeComponent({component: CreateConceptSchemeOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createDataPropertyOverlay', downgradeComponent({component: CreateDataPropertyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createEntityModal', downgradeComponent({component: CreateEntityModalComponent}) as angular.IDirectiveFactory)
    .directive('createIndividualOverlay', downgradeComponent({component: CreateIndividualOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createObjectPropertyOverlay', downgradeComponent({component: CreateObjectPropertyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('createTagOverlay', downgradeComponent({component: CreateTagOverlayComponent}) as angular.IDirectiveFactory)
    .directive('datatypePropertyAxioms', downgradeComponent({component: DatatypePropertyAxiomsComponent}) as angular.IDirectiveFactory)
    .directive('datatypePropertyBlock', downgradeComponent({component: DatatypePropertyBlockComponent}) as angular.IDirectiveFactory)
    .directive('datatypePropertyOverlay', downgradeComponent({component: DatatypePropertyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('editBranchOverlay', downgradeComponent({component: EditBranchOverlayComponent}) as angular.IDirectiveFactory)
    .directive('everythingTree', downgradeComponent({component: EverythingTreeComponent}) as angular.IDirectiveFactory)
    .directive('hierarchyTree', downgradeComponent({component: HierarchyTreeComponent}) as angular.IDirectiveFactory)
    .directive('hierarchyFilter', downgradeComponent({component: HierarchyFilterComponent}) as angular.IDirectiveFactory)
    .directive('importsBlock', downgradeComponent({component: ImportsBlockComponent}) as angular.IDirectiveFactory)
    .directive('importsOverlay', downgradeComponent({component: ImportsOverlayComponent}) as angular.IDirectiveFactory)
    .component('individualHierarchyBlock', downgradeComponent({component: IndividualHierarchyBlockComponent}) as angular.IDirectiveFactory)
    .component('individualsTab',  IndividualsTabComponent,downgradeComponent({component: IndividualsTabComponent}) as angular.IDirectiveFactory)
    .component('individualTree',  IndividualTreeComponent,downgradeComponent({component: IndividualsTabComponent}) as angular.IDirectiveFactory)
    .directive('individualTypesModal', downgradeComponent({component: IndividualTypesModalComponent}) as angular.IDirectiveFactory)
    .directive('iriSelectOntology', downgradeComponent({component: IriSelectOntologyComponent}) as angular.IDirectiveFactory)
    .directive('mergeBlock', downgradeComponent({component: MergeBlockComponent}) as angular.IDirectiveFactory)
    .directive('mergeTab', downgradeComponent({component: MergeTabComponent}) as angular.IDirectiveFactory)
    .directive('newOntologyOverlay', downgradeComponent({component: NewOntologyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('objectPropertyAxioms', downgradeComponent({component: ObjectPropertyAxiomsComponent}) as angular.IDirectiveFactory)
    .directive('objectPropertyBlock', downgradeComponent({component: ObjectPropertyBlockComponent}) as angular.IDirectiveFactory)
    .directive('objectPropertyOverlay', downgradeComponent({component: ObjectPropertyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('ontologyButtonStack', downgradeComponent({component: OntologyButtonStackComponent}) as angular.IDirectiveFactory)
    .directive('ontologyClassSelect', downgradeComponent({component: OntologyClassSelectComponent}) as angular.IDirectiveFactory)
    .directive('ontologyCloseOverlay', downgradeComponent({component: OntologyCloseOverlayComponent}) as angular.IDirectiveFactory)
    .directive('ontologyEditorPage', downgradeComponent({component: OntologyEditorPageComponent}) as angular.IDirectiveFactory)
    .directive('ontologyPropertiesBlock', downgradeComponent({component: OntologyPropertiesBlockComponent}) as angular.IDirectiveFactory)
    .directive('ontologyPropertyOverlay', downgradeComponent({component: OntologyPropertyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('ontologySidebar', downgradeComponent({component: OntologySidebarComponent}) as angular.IDirectiveFactory)
    .directive('ontologyTab', downgradeComponent({component: OntologyTabComponent}) as angular.IDirectiveFactory)
    .directive('openOntologySelect', downgradeComponent({component: OpenOntologySelectComponent}) as angular.IDirectiveFactory)
    .directive('openOntologyTab', downgradeComponent({component: OpenOntologyTabComponent}) as angular.IDirectiveFactory)
    .directive('overviewTab', downgradeComponent({component: OverviewTabComponent}) as angular.IDirectiveFactory)
    .directive('previewBlock', downgradeComponent({component: PreviewBlockComponent}) as angular.IDirectiveFactory)
    .directive('projectTab', downgradeComponent({component: ProjectTabComponent}) as angular.IDirectiveFactory)
    .directive('propertiesTab', downgradeComponent({component: PropertiesTabComponent}) as angular.IDirectiveFactory)
    .directive('propertyHierarchyBlock', downgradeComponent({component: PropertyHierarchyBlockComponent}) as angular.IDirectiveFactory)
    .directive('propertyTree', downgradeComponent({component: PropertyTreeComponent}) as angular.IDirectiveFactory)
    .directive('propertyValues', downgradeComponent({component: PropertyValuesComponent}) as angular.IDirectiveFactory)
    .directive('searchTab', downgradeComponent({component: SearchTabComponent}) as angular.IDirectiveFactory)
    .directive('savedChangesTab', downgradeComponent({component: SavedChangesTabComponent}) as angular.IDirectiveFactory)
    .directive('seeHistory', downgradeComponent({component: SeeHistoryComponent}) as angular.IDirectiveFactory)
    .directive('selectedDetails', downgradeComponent({component: SelectedDetailsComponent}) as angular.IDirectiveFactory)
    .directive('serializationSelect', downgradeComponent({component: SerializationSelectComponent}) as angular.IDirectiveFactory)
    .directive('staticIri', downgradeComponent({component: StaticIriComponent}) as angular.IDirectiveFactory)
    .directive('superClassSelect', downgradeComponent({component: SuperClassSelectComponent}) as angular.IDirectiveFactory)
    .directive('superPropertySelect', downgradeComponent({component: SuperPropertySelectComponent}) as angular.IDirectiveFactory)
    .directive('treeItem', downgradeComponent({component: TreeItemComponent}) as angular.IDirectiveFactory)
    .directive('uploadChangesOverlay', downgradeComponent({component: UploadChangesOverlayComponent}) as angular.IDirectiveFactory)
    .directive('uploadErrorsOverlay', downgradeComponent({component: UploadErrorsOverlayComponent}) as angular.IDirectiveFactory)
    .directive('uploadOntologyOverlay', downgradeComponent({component: UploadOntologyOverlayComponent}) as angular.IDirectiveFactory)
    .directive('uploadSnackbar', downgradeComponent({component: UploadSnackbarComponent}) as angular.IDirectiveFactory)
    .directive('usagesBlock', downgradeComponent({component: UsagesBlockComponent}) as angular.IDirectiveFactory)
    .directive('visualizationTab', downgradeComponent({component: VisualizationTabComponent}) as angular.IDirectiveFactory);