/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';

/**
 * @class ontology-editor.OverviewTabComponent
 *
 * A component that creates a page containing the
 * {@link ontology-editor.AssociationBlockComponent class and property list} of the current
 * {@link shared.OntologyStateService#listItem selected ontology} and information about a selected item from that list.
 * The selected entity display includes a {@link ontology-editor.SelectedDetailsComponent}, a button to delete the
 * entity, an {@link ontology-editor.AnnotationBlockComponent}, an {@link ontology-editor.AxiomBlockComponent}, and a
 * {@link ontology-editor.UsagesBlockComponent}. If the selected entity is a property, a
 * {@link ontology-editor.CharacteristicsRowComponent} is also displayed. The component houses the method for opening
 * the modal to delete an entity.
 */
@Component({
    selector: 'overview-tab',
    templateUrl: './overviewTab.component.html'
})
export class OverviewTabComponent implements OnInit, OnDestroy {
    highlightText = '';
    @ViewChild('overviewTab', { static: true }) overviewTab: ElementRef;
    
    constructor(public os: OntologyStateService, public om: OntologyManagerService, private dialog: MatDialog) {}
    
    ngOnInit(): void {
        this.os.listItem.editorTabStates.overview.element = this.overviewTab;
        this.highlightText = this.os.listItem.editorTabStates.overview.searchText;
    }
    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.listItem.editorTabStates.overview.element = undefined;
        }
    }
    showDeleteConfirmation(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure that you want to delete <strong>${this.os.listItem.selected['@id']}</strong>?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.deleteEntity();
            }
        });
    }
    deleteEntity(): void {
        if (this.om.isClass(this.os.listItem.selected)) {
            this.os.deleteClass();
        } else if (this.om.isObjectProperty(this.os.listItem.selected)) {
            this.os.deleteObjectProperty();
        } else if (this.om.isDataTypeProperty(this.os.listItem.selected)) {
            this.os.deleteDataTypeProperty();
        }
    }
    seeHistory(): void {
        this.os.listItem.seeHistory = true;
    }
}
