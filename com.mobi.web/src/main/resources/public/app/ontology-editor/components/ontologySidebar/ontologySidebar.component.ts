/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { isEmpty } from 'lodash';

import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyCloseOverlayComponent } from '../ontologyCloseOverlay/ontologyCloseOverlay.component';

/**
 * @class ontology-editor.OntologySidebarComponent
 *
 * A component that creates a `div` containing a button to
 * {@link ontology-editor.component:ontologyTab open ontologies} and a `nav` of the
 * {@link shared.OntologyStateService opened ontologies}. The currently selected
 * {@link shared.OntologyStateService listItem} will have a
 * {@link ontology-editor.OpenOntologySelectComponent} displayed underneath and a link to
 * {@link ontology-editor.OntologyCloseOverlayComponent close the ontology}. 
 */
@Component({
    selector: 'ontology-sidebar',
    templateUrl: './ontologySidebar.component.html',
    styleUrls: ['./ontologySidebar.component.scss']
})
export class OntologySidebarComponent {
    @Input() list: OntologyListItem[];

    constructor(private dialog: MatDialog, public os: OntologyStateService) {}

    onClose(listItem: OntologyListItem): void {
        if (listItem.openSnackbar) {
            listItem.openSnackbar.dismiss();
        }
        if (this.os.hasChanges(listItem)) {
            this.dialog.open(OntologyCloseOverlayComponent, {
                data: { listItem }
            });
        } else {
            this.os.closeOntology(listItem.versionedRdfRecord.recordId);
        }
    }
    onClick(listItem?: OntologyListItem): void {
        const previousListItem = this.os.listItem;
        if (previousListItem) {
            previousListItem.active = false;
            Object.keys(previousListItem.editorTabStates).forEach(tab => {
                if (previousListItem.editorTabStates[tab].element) {
                    previousListItem.editorTabStates[tab].element = undefined;
                }
            });
            if (previousListItem.openSnackbar) {
                previousListItem.openSnackbar.dismiss();
            }
        }
        if (listItem && !isEmpty(listItem)) {
            listItem.active = true;
            this.os.listItem = listItem;
        } else {
            this.os.listItem = undefined;
        }
    }
}
