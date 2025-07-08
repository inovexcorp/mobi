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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';

/**
 * @class ontology-editor.ConceptSchemesTabComponent
 *
 * A component that creates a page containing the
 * {@link ontology-editor.ConceptSchemeHierarchyBlockComponent} of the current
 * {@link shared.OntologyStateService#listItem selected ontology/vocabulary} and information about a
 * selected entity from that list. The selected entity display includes a
 * {@link ontology-editor.SelectedDetailsComponent}, a button to delete the entity, an
 * {@link ontology-editor.AnnotationBlockComponent}, a {@link ontology-editor.DatatypePropertyBlockComponent},
 * and a {@link ontology-editor.UsagesBlockComponent}. The component houses the method for opening a modal for
 * deleting concepts or concept schemes.
 */
@Component({
    selector: 'concept-schemes-tab',
    templateUrl: './conceptSchemesTab.component.html'
})

export class ConceptSchemesTabComponent implements OnInit, OnDestroy {
    @ViewChild('conceptSchemesTab', { static: true }) conceptSchemesTab: ElementRef;

    constructor(public os: OntologyStateService, public om: OntologyManagerService, private dialog: MatDialog){}

    ngOnInit(): void {
        this.os.listItem.editorTabStates.schemes.element = this.conceptSchemesTab;
    }
    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.listItem.editorTabStates.schemes.element = undefined;
        }
    }
    showDeleteConfirmation(): void {
        this.dialog.open(ConfirmModalComponent,{
            data: {
                content: `<p>Are you sure that you want to delete <strong>${this.os.listItem.selected['@id']}</strong>?</p>`
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.deleteEntity();
            }
        });
    }
    deleteEntity(): void {
        if (this.om.isConcept(this.os.listItem.selected, this.os.listItem.derivedConcepts)) {
            this.os.deleteConcept();
        } else if (this.om.isConceptScheme(this.os.listItem.selected, this.os.listItem.derivedConceptSchemes)) {
            this.os.deleteConceptScheme();
        }
    }
    seeHistory(): void {
        this.os.listItem.seeHistory = true;
    }
}
