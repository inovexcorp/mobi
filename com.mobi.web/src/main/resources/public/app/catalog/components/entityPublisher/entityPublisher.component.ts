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
import { Component, Input } from '@angular/core';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { getDctermsId } from '../../../shared/utility';

/**
 * @class catalog.EntityPublisherComponent
 *
 * A component which creates a span with a display of a JSON-LD object's dcterms:publisher property value. Retrieves the
 * display name of the publisher using the {@link shared.UserManagerService}.
 *
 * @param {JSONLDObject} entity A JSON-LD object
 */
@Component({
    selector: 'entity-publisher',
    templateUrl: './entityPublisher.component.html'
})
export class EntityPublisherComponent {
    publisherName = '';
    publisherUsername = '';

    private _entity: JSONLDObject;

    @Input() set entity(value: JSONLDObject) {
        this._entity = value;
        this.setPublisherDetails(this._entity);
    }

    get entity(): JSONLDObject {
        return this._entity;
    }

    constructor(private _um: UserManagerService) {}

    setPublisherDetails(entity: JSONLDObject): void {
        const publisherId = getDctermsId(entity, 'publisher');
        if (publisherId) {
          const user = this._um.users.find(user => user.iri === publisherId);
          this.publisherUsername = user ? user.username : '[Not Available]';
          this.publisherName = user ? user.displayName : '[Not Available]';
        } else {
          this.publisherUsername = '[Not Available]';
          this.publisherName = '[Not Available]';
        }
    }
}
