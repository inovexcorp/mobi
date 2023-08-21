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
import { join, orderBy, map, get } from 'lodash';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { IndividualTypesModalComponent } from '../individualTypesModal/individualTypesModal.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ManchesterConverterService } from '../../../shared/services/manchesterConverter.service';
import { isBlankNodeId } from '../../../shared/utility';

/**
 * @class ontology-editor.SelectedDetailsComponent
 *
 * A component that creates div with detailed about the currently selected entity in the active page
 * of the current {@link shared.OntologyStateService#listItem selected ontology}. This includes the entity's name, a
 * {@link ontology-editor.StaticIriComponent}, and a display of the types of the entity along with a button to
 * {@link ontology-editor.IndividualTypesModalComponent edit the individual types}. The display is optionally
 * `readOnly` and can optionally highlight text in the `staticIri` matching the provided `highlightText`.
 * 
 * @param {boolean} readOnly Whether the display should be read only
 * @param {string} highlightText Optional text to pass along to the `staticIri` for highlighting
 */
@Component({
    selector: 'selected-details',
    templateUrl: './selectedDetails.component.html',
    styleUrls: ['./selectedDetails.component.scss']
})
export class SelectedDetailsComponent {
    @Input() readOnly: boolean;
    @Input() highlightText: string;

    constructor(private prefixation: PrefixationPipe, private dialog: MatDialog, public om: OntologyManagerService, 
        public os: OntologyStateService, private mc: ManchesterConverterService, private toast: ToastService) {}

    isFromImportedOntology(): boolean {
        const entity = get(this.os.listItem.entityInfo, get(this.os.listItem.selected, '@id'));
        return get(entity, 'imported', false);
    }
    getImportedOntology(): string {
        const entity = get(this.os.listItem.entityInfo, get(this.os.listItem.selected, '@id'), {});
        return get(entity, 'ontologyId', '');
    }
    getTypes(): string {
        return join(orderBy(
                map(get(this.os.listItem.selected, '@type', []), t => { 
                    if (isBlankNodeId(t)) {
                        return this.mc.jsonldToManchester(t, this.os.listItem.selectedBlankNodes, this.os.getBnodeIndex(), true);
                    } else {
                        return this.prefixation.transform(t);
                    }
                })
        ), ', ');
    }
    onEdit(iriBegin: string, iriThen: string, iriEnd: string): void {
        this.os.onEdit(iriBegin, iriThen, iriEnd)
            .subscribe(() => {
                this.os.saveCurrentChanges().subscribe();
                this.os.updateLabel();
            }, error => this.toast.createErrorToast(error));
    }
    showTypesOverlay(): void {
        this.dialog.open(IndividualTypesModalComponent);
    }
}
