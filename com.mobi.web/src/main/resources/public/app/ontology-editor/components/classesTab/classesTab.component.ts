/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { entityNameProps } from '../../../shared/utility';

/**
 * @class ontology-editor.ClassesTabComponent
 *
 * `classesTab` is a component that creates a page containing the
 * {@link ontology-editor.ClassHierarchyBlockComponent} of the current
 * {@link shared.OntologyStateService#listItem selected ontology} and information about a
 * selected class from that list. The selected class display includes a
 * {@link ontology-editor.SelectedDetailsComponent}, a button to delete the class, an
 * {@link ontology-editor.AnnotationBlockComponent}, an {@link ontology-editor.AxiomBlockComponent}, and a
 * {@link ontology-editor.UsagesBlockComponent}. The component houses the method for opening a modal for deleting
 * classes.
 */
@Component({
    selector: 'classes-tab',
    templateUrl: './classesTab.component.html'
})
export class ClassesTabComponent implements OnInit, OnDestroy {
    readonly entityNameProps = entityNameProps;
    @ViewChild('classesTab', { static: true }) classesTab: ElementRef;

    constructor(public os: OntologyStateService, public om: OntologyManagerService, private dialog: MatDialog) {}
    ngOnInit(): void {
        this.os.listItem.editorTabStates.classes.element = this.classesTab;
    }
    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.listItem.editorTabStates.classes.element = undefined;
        }
    }
    showDeleteConfirmation(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete <strong>${this.os.listItem.selected['@id']}</strong>?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.os.deleteClass();
            }
        });
    }
    seeHistory(): void {
        this.os.listItem.seeHistory = true;
    }
}
