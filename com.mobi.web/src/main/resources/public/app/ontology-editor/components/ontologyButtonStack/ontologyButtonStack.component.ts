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
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CreateEntityModalComponent } from '../createEntityModal/createEntityModal.component';

/**
 * @class ontology-editor.OntologyButtonStackComponent
 *
 * A component that creates a button for {@link ontology-editor.CreateEntityModalComponent creating entities} in the
 * Ontology Editor against the current {@link shared.OntologyStateService#listItem selected ontology}.
 */
@Component({
    selector: 'ontology-button-stack',
    templateUrl: './ontologyButtonStack.component.html',
    styleUrls: ['./ontologyButtonStack.component.scss']
})
export class OntologyButtonStackComponent {

    constructor(public os: OntologyStateService, private dialog: MatDialog) {}

    showCreateEntityOverlay(): void {
        if (this.os.getActiveKey() !== 'project') {
            this.os.unSelectItem();
        }
        this.dialog.open(CreateEntityModalComponent);
    }
}
