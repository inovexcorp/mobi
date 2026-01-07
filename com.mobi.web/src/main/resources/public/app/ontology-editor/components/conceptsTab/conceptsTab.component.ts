/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { includes, concat, filter } from 'lodash';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { entityNameProps } from '../../../shared/utility';

/**
 * @class ontology-editor.ConceptsTabComponent
 *
 * A component that creates a page containing the {@link ontology-editor.ConceptHierarchyBlockComponent} of the current
 * {@link shared.OntologyStateService#listItem selected ontology/vocabulary} and information about a selected concept
 * from that list. The selected concept display includes a {@link ontology-editor.SelectedDetailsComponent}, a button to
 * delete the concept, an {@link ontology-editor.AnnotationBlockComponent}, and a
 * {@link ontology-editor.UsagesBlockComponent}. The component houses the method for opening a modal for deleting
 * concepts.
 */
@Component({
    selector: 'concepts-tab',
    templateUrl: './conceptsTab.component.html'
})
export class ConceptsTabComponent implements OnInit, OnDestroy {
    readonly entityNameProps = entityNameProps;
    @ViewChild('conceptsTab', { static: true }) conceptsTab: ElementRef;
    
    constructor(public os: OntologyStateService, public om: OntologyManagerService,
                public pm: PropertyManagerService, private dialog: MatDialog) {}

    relationshipList = [];

    ngOnInit(): void {
        const schemeRelationships = filter(this.pm.conceptSchemeRelationshipList, iri => includes(this.os.listItem.iriList, iri));
        this.relationshipList = concat(this.os.listItem.derivedSemanticRelations, schemeRelationships);
        this.os.listItem.editorTabStates.concepts.element = this.conceptsTab;
    }
    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.listItem.editorTabStates.concepts.element = undefined;
        }
    }
    showDeleteConfirmation(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure that you want to delete <strong>${this.os.listItem.selected['@id']}</strong>?</p>`
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.os.deleteConcept();
            }
        });
    }
    seeHistory(): void {
        this.os.listItem.seeHistory = true;
    }
}
