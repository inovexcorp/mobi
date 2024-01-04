/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, OnDestroy } from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.OntologyEditorPageComponent
 *
 * A component that creates a `div` containing the main components of the Ontology Editor.
 * These components are {@link ontology-editor.OntologySidebarComponent}, {@link ontology-editor.OntologyTabComponent} 
 * with the {@link shared.OntologyStateService#listItem currently selected open ontology}, and
 * {@link ontology-editor.OpenOntologyTabComponent}.
 */
@Component({
    selector: 'ontology-editor-page',
    templateUrl: './ontologyEditorPage.component.html',
    styleUrls: ['./ontologyEditorPage.component.scss']
})
export class OntologyEditorPageComponent implements OnDestroy {
    constructor(public os: OntologyStateService) {}
    ngOnDestroy(): void {
        this.os.toast.clearToast();
        this.os.snackBar.dismiss();
    }
}
