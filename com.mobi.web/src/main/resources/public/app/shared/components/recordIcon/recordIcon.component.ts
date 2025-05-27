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

import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { CatalogStateService } from '../../services/catalogState.service';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { getBeautifulIRI } from '../../utility';

/**
 * @class shared.RecordIconComponent
 *
 * A component that creates a Font Awesome Icon stack/ Material Icon for the provided catalog Record using the
 * {@link CatalogStateService}.
 *
 * @param {JSONLDObject} Record Catalog Record JSON-LD object
 */
@Component({
    selector: 'record-icon',
    templateUrl: './recordIcon.component.html',
    styleUrls: ['./recordIcon.component.scss']
})
export class RecordIconComponent {
    icon = '';
    isMaterial = false;
    title = '';

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        this._changeIcon(this.state.getRecordIcon(this._record));
        this.title = getBeautifulIRI(this.cm.getType(value));
    }

    get record(): JSONLDObject {
        return this._record;
    }

    @Input() set recordType(value: string) {
        this._record = { '@id': undefined, '@type': [value]};
        this._changeIcon(this.state.getRecordIcon(this._record));
    }

    @Input() stackIconSizeOverride?: string;

    constructor(public state: CatalogStateService, private cm: CatalogManagerService) {
    }

    private _changeIcon(recordIcon: string): void {
        if (recordIcon.startsWith('mat ')) {
            this.isMaterial = true;
            this.icon = recordIcon.substring(4);
        } else {
            this.icon = recordIcon;
        }
    }
}
