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
import { find, difference, includes, get} from 'lodash';

import { CATALOG } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { UtilService } from '../../../shared/services/util.service';

/**
 * @class catalog.RecordTypeComponent
 *
 * A component that creates a span with the main type of the provided catalog Record. This type is determined by
 * removing the core Record types from the full list of Record types supported from the
 * {@link shared.CatalogManagerService} and finding the first one of those types that is present on the provided Record
 * JSON-LD object.
 *
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 */
@Component({
    selector: 'record-type',
    templateUrl: './recordType.component.html'
})
export class RecordTypeComponent {
    type = '';

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        this.type = this.getTypeDisplay(this._record);
    }

    get record(): JSONLDObject {
        return this._record;
    }

    constructor(public cm: CatalogManagerService, public util: UtilService) {}

    getTypeDisplay(record: JSONLDObject): string {
        const type = find(difference(this.cm.recordTypes, this.cm.coreRecordTypes), type => includes(get(record, '@type', []), type));
        return this.util.getBeautifulIRI(type || CATALOG + 'Record');
    }
}
