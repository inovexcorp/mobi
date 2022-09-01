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
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import {OntologyManagerService} from "../../../shared/services/ontologyManager.service";

const template = require('./individualsTab.component.html');

/**
 * @ngdoc component
 * @class ontology-editor.IndividualsTabComponent
 * @requires shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `individualsTab` is a component that creates a page containing the
 * {@link ontology-editor.IndividualHierarchyBlockComponent} of the current
 * {@link shared.OntologyStateService#listItem selected ontology} and information about a selected
 * individual from that list. The selected individual display includes a
 * {@link ontology-editor.SelectedDetailsComponent}, a button to delete the individual, a
 * {@link ontology-editor.DatatypePropertyBlockComponent}, and a
 * {@link ontology-editor.ObjectPropertyBlockComponent}. The component houses the method for opening a
 * modal for deleting individuals.
 */
@Component({
    templateUrl: './individualsTab.component.html',
    selector: 'individuals-tab'
})
export class IndividualsTabComponent {
    constructor(public os:OntologyStateService,
                private dialog: MatDialog,
                public om: OntologyManagerService) {}

    showDeleteConfirmation(): void {
        this.dialog.open(ConfirmModalComponent,
            { data:
                    {  body:
                        '<p>Are you sure that you want to delete <strong>' + this.os.listItem.selected['@id'] + '</strong>?</p>',
                    }
        }).afterClosed().subscribe()
    }
    seeHistory(): void {
        this.os.listItem.seeHistory = true;
    }
}