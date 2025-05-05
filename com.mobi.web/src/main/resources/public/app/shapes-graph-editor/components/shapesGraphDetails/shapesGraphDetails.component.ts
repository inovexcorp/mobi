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
import { get, join, map, orderBy } from 'lodash';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OnEditEventI } from '../../../shared/models/onEditEvent.interface';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class shapes-graph-editor.SelectedDetailsComponent
 * @requires shared.OntologyManagerService
 * @requires shared.ShapesGraphStateService
 * @requires shared.PrefixationPipe
 *
 * `shapesGraphDetails` is a component that creates div with details about the entity representing 
 * the current shapesGraph. This includes the entity's name, a
 * {@link shapes-graph-editor.StaticIriLimitedComponent}, and a display of the types of the entity. The display is
 * `readOnly`.
 */
@Component({
    selector: 'shapes-graph-details',
    templateUrl: './shapesGraphDetails.component.html',
    styleUrls: ['./shapesGraphDetails.component.scss']
})
export class ShapesGraphDetailsComponent {

    constructor(public state: ShapesGraphStateService, public om: OntologyManagerService,
      private _prefixation: PrefixationPipe, private _toast: ToastService) {}

    getTypes(): string {
        return join(orderBy(
                map(get(this.state.listItem.metadata, '@type', []), t => { 
                    return this._prefixation.transform(t);
                })
        ), ', ');
    }

    onIriEdit(event: OnEditEventI): void {
      this.state.onIriEdit(event.value.iriBegin, event.value.iriThen, event.value.iriEnd)
        .subscribe(() => {
            this.state.saveCurrentChanges().subscribe();
        }, error => this._toast.createErrorToast(error));
    }
}
