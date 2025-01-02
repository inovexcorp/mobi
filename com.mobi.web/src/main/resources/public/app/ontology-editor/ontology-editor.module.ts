/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { NgModule } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { SharedModule } from '../shared/shared.module';

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
import { ConceptHierarchyBlockComponent } from './components/conceptHierarchyBlock/conceptHierarchyBlock.component';
import { ConceptSchemeHierarchyBlockComponent } from './components/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.component';
import { ConceptSchemesTabComponent } from './components/conceptSchemesTab/conceptSchemesTab.component';
import { ConceptsTabComponent } from './components/conceptsTab/conceptsTab.component';
import { CreateAnnotationPropertyOverlayComponent } from './components/createAnnotationPropertyOverlay/createAnnotationPropertyOverlay.component';
import { CreateClassOverlayComponent } from './components/createClassOverlay/createClassOverlay.component';
import { CreateConceptOverlayComponent } from './components/createConceptOverlay/createConceptOverlay.component';
import { CreateConceptSchemeOverlayComponent }  from './components/createConceptSchemeOverlay/createConceptSchemeOverlay.component';
import { CreateDataPropertyOverlayComponent }  from './components/createDataPropertyOverlay/createDataPropertyOverlay.component';
import { CreateEntityModalComponent } from './components/createEntityModal/createEntityModal.component';
import { CreateIndividualOverlayComponent } from './components/createIndividualOverlay/createIndividualOverlay.component';
import { CreateObjectPropertyOverlayComponent } from './components/createObjectPropertyOverlay/createObjectPropertyOverlay.component';
import { DatatypePropertyAxiomsComponent } from './components/datatypePropertyAxioms/datatypePropertyAxioms.component';
import { DatatypePropertyBlockComponent } from './components/datatypePropertyBlock/datatypePropertyBlock.component';
import { DatatypePropertyOverlayComponent } from './components/datatypePropertyOverlay/datatypePropertyOverlay.component';
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
import { FindViewComponent } from './components/find-view/find-view.component';
import { ObjectPropertyAxiomsComponent } from './components/objectPropertyAxioms/objectPropertyAxioms.component';
import { ObjectPropertyBlockComponent } from './components/objectPropertyBlock/objectPropertyBlock.component';
import { ObjectPropertyOverlayComponent } from './components/objectPropertyOverlay/objectPropertyOverlay.component';
import { OntologyButtonStackComponent } from './components/ontologyButtonStack/ontologyButtonStack.component';
import { OntologyClassSelectComponent } from './components/ontologyClassSelect/ontologyClassSelect.component';
import { OntologyEditorPageComponent } from './components/ontologyEditorPage/ontologyEditorPage.component';
import { OntologyPropertiesBlockComponent } from './components/ontologyPropertiesBlock/ontologyPropertiesBlock.component';
import { OntologyPropertyOverlayComponent } from './components/ontologyPropertyOverlay/ontologyPropertyOverlay.component';
import { OntologyTabComponent } from './components/ontologyTab/ontologyTab.component';
import { OverviewTabComponent } from './components/overviewTab/overviewTab.component';
import { PreviewBlockComponent } from './components/previewBlock/previewBlock.component';
import { ProjectTabComponent } from './components/projectTab/projectTab.component';
import { PropertiesTabComponent } from './components/propertiesTab/propertiesTab.component';
import { PropertyHierarchyBlockComponent } from './components/propertyHierarchyBlock/propertyHierarchyBlock.component';
import { PropertyTreeComponent } from './components/propertyTree/propertyTree.component';
import { PropertyValuesComponent } from './components/propertyValues/propertyValues.component';
import { QueryViewComponent } from './components/query-view/query-view.component';
import { SearchTabComponent } from './components/searchTab/searchTab.component';
import { SeeHistoryComponent } from './components/seeHistory/seeHistory.component';
import { SelectedDetailsComponent } from './components/selectedDetails/selectedDetails.component';
import { StaticIriComponent } from './components/staticIri/staticIri.component';
import { SuperClassSelectComponent } from './components/superClassSelect/superClassSelect.component';
import { SuperPropertySelectComponent } from './components/superPropertySelect/superPropertySelect.component';
import { TreeItemComponent } from './components/treeItem/treeItem.component';
import { UsagesBlockComponent } from './components/usagesBlock/usagesBlock.component';
import { VisualizationTabComponent } from './components/visualizationTab/visualizationTab.component';

import { OntologyVisualizationModule } from '../ontology-visualization/ontologyVisualization.module';
import { VersionedRdfRecordEditorModule } from '../versioned-rdf-record-editor/versioned-rdf-record-editor.module';

/**
 * @namespace ontology-editor
 *
 * The `ontology-editor` module provides components and services that make up the Ontology Editor page of Mobi for
 * creating, editing, and managing ontologies/vocabularies.
 */
@NgModule({
    imports: [
        SharedModule,
        VersionedRdfRecordEditorModule,
        OntologyVisualizationModule,
        ScrollingModule,
    ],
    declarations: [
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
        ConceptHierarchyBlockComponent,
        ConceptSchemeHierarchyBlockComponent,
        ConceptSchemesTabComponent,
        ConceptsTabComponent,
        CreateAnnotationPropertyOverlayComponent,
        CreateClassOverlayComponent,
        CreateConceptOverlayComponent,
        CreateConceptSchemeOverlayComponent,
        CreateDataPropertyOverlayComponent,
        CreateEntityModalComponent,
        CreateIndividualOverlayComponent,
        CreateObjectPropertyOverlayComponent,
        DatatypePropertyAxiomsComponent,
        DatatypePropertyOverlayComponent,
        DatatypePropertyBlockComponent,
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
        FindViewComponent,
        ObjectPropertyAxiomsComponent,
        ObjectPropertyBlockComponent,
        ObjectPropertyOverlayComponent,
        OntologyButtonStackComponent,
        OntologyClassSelectComponent,
        OntologyEditorPageComponent,
        OntologyPropertiesBlockComponent,
        OntologyPropertyOverlayComponent,
        OntologyTabComponent,
        OverviewTabComponent,
        PreviewBlockComponent,
        ProjectTabComponent,
        PropertiesTabComponent,
        PropertyHierarchyBlockComponent,
        PropertyTreeComponent,
        PropertyValuesComponent,
        QueryViewComponent,
        SearchTabComponent,
        SeeHistoryComponent,
        SelectedDetailsComponent,
        StaticIriComponent,
        SuperClassSelectComponent,
        SuperPropertySelectComponent,
        TreeItemComponent,
        UsagesBlockComponent,
        VisualizationTabComponent,
    ]
})
export class OntologyEditorModule {}
