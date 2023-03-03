/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
 * @class ontology-editor.PropertiesTabComponent
 *
 * A component that creates a page containing the {@link ontology-editor.PropertyHierarchyBlockComponent} of the current
 * {@link shared.OntologyStateService#listItem selected ontology} and information about a selected property from that
 * list. The selected property display includes a {@link ontology-editor.SelectedDetailsComponent}, a button to delete
 * the property, an {@link ontology-editor.AnnotationBlockComponent}, an {@link ontology-editor.AxiomBlockComponent}, a
 * {@link ontology-editor.CharacteristicsRowComponent}, and a {@link ontology-editor.UsagesBlockComponent}. The
 * component houses the method for opening a modal for deleting properties.
 */
@Component({
    selector: 'properties-tab',
    templateUrl: './propertiesTab.component.html'
})

export class PropertiesTabComponent implements OnInit, OnDestroy {
    highlightText = '';
    @ViewChild('propertiesTab', { static: true }) propertiesTab: ElementRef;

    constructor(public os: OntologyStateService, public om: OntologyManagerService, private dialog: MatDialog) {}
    
    ngOnInit(): void {
        this.os.listItem.editorTabStates.properties.element = this.propertiesTab;
        this.highlightText = this.os.listItem.editorTabStates.properties.searchText;
    }
    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.listItem.editorTabStates.properties.element = undefined;
        }
    }
    showDeleteConfirmation(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: '<p>Are you sure that you want to delete <strong>' + this.os.listItem.selected['@id'] + '</strong>?</p>'
            }
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.deleteProperty();
            }
        });
    }
    deleteProperty(): void {
        if (this.om.isObjectProperty(this.os.listItem.selected)) {
            this.os.deleteObjectProperty();
        } else if (this.om.isDataTypeProperty(this.os.listItem.selected)) {
            this.os.deleteDataTypeProperty();
        } else if (this.om.isAnnotation(this.os.listItem.selected)) {
            this.os.deleteAnnotationProperty();
        }
    }
    seeHistory(): void {
        this.os.listItem.seeHistory = true;
    }
}
