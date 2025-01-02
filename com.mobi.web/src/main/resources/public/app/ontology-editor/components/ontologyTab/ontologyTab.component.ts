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
import { Component, OnDestroy, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, TemplateRef, ViewEncapsulation } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';

/**
 * @class ontology-editor.OntologyTabComponent
 *
 * A component that creates a `div` containing all the components necessary for displaying an ontology. This includes a
 * {@link ontology-editor.OntologyButtonStackComponent} and a `mat-tab-group`. The `mat-tab-group` contains tabs for the
 * {@link ontology-editor.ProjectTabComponent}, {@link ontology-editor.OverviewTabComponent},
 * {@link ontology-editor.ClassesTabComponent}, {@link ontology-editor.PropertiesTabComponent},
 * {@link ontology-editor.IndividualsTabComponent}, {@link ontology-editor.ConceptSchemesTabComponent},
 * {@link ontology-editor.ConceptsTabComponent}, {@link ontology-editor.SearchTabComponent}, and
 * {@link ontology-editor.VisualizationTabComponent}.
 */
@Component({
    selector: 'ontology-tab',
    templateUrl: './ontologyTab.component.html',
    styleUrls: ['./ontologyTab.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OntologyTabComponent implements OnChanges, OnDestroy {
    @Input() isVocab: boolean;
    @ViewChild('outlet', { read: ViewContainerRef }) outletRef?: ViewContainerRef;
    @ViewChild('content', { read: TemplateRef }) contentRef: TemplateRef<any>;
    @ViewChild('tabsGroup') tabsGroup: MatTabGroup;

    constructor(public os: OntologyStateService) {}
    
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.isVocab && this.outletRef) {
            this.outletRef.clear();
            this.outletRef.createEmbeddedView(this.contentRef); // Force rerender of concept and schemes tabs when status as a vocab changes
        }
    }
    ngOnDestroy(): void {
        if (this.os.listItem && this.os.listItem.openSnackbar) {
            this.os.listItem.openSnackbar.dismiss();
        }
    }
    onTabChanged(event: MatTabChangeEvent): void {
        switch (event.index) {
            case OntologyListItem.PROJECT_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.project.entityIRI, false, this.os.listItem, this.os.listItem.editorTabStates.project.element).subscribe();
                break;
            case OntologyListItem.OVERVIEW_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.overview.entityIRI, true, this.os.listItem, this.os.listItem.editorTabStates.overview.element).subscribe();
                break;
            case OntologyListItem.CLASSES_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.classes.entityIRI, true, this.os.listItem, this.os.listItem.editorTabStates.classes.element).subscribe();
                break;
            case OntologyListItem.PROPERTIES_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.properties.entityIRI, true, this.os.listItem, this.os.listItem.editorTabStates.properties.element).subscribe();
                break;
            case OntologyListItem.INDIVIDUALS_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.individuals.entityIRI, false, this.os.listItem, this.os.listItem.editorTabStates.individuals.element).subscribe();
                break;
            case OntologyListItem.CONCEPTS_SCHEMES_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.schemes.entityIRI, false, this.os.listItem, this.os.listItem.editorTabStates.schemes.element).subscribe();
                break;
            case OntologyListItem.CONCEPTS_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.concepts.entityIRI, false, this.os.listItem, this.os.listItem.editorTabStates.concepts.element).subscribe();
                break;
            case OntologyListItem.SEARCH_TAB:
                this.os.setSelected(this.os.listItem.editorTabStates.search.entityIRI, false).subscribe();
                break;
            default:
        }
    }
    /**
     * Re-aligns the ink bar to the selected tab element
     */
    realignTabs(): void {
       this.tabsGroup.realignInkBar();
    }
}
