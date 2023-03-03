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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { UtilService } from '../../../shared/services/util.service';

/**
 * @class catalog.RecordCardComponent
 *
 * A component which creates a Material `card` div with information about the provided catalog Record. This information
 * includes its title, limited description, {@link catalog.RecordTypeComponent type} with its associated
 * {@link catalog.RecordIconComponent icon}, modified date, {@link catalog.CatalogRecordKeywordsComponent keywords}, and
 * {@link catalog.EntityPublisherComponent publisher}. An optional function can be passed in that will be called when
 * the whole card is clicked.
 * 
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 * @param {Function} clickCard An optional function that will be called when the whole card is clicked
 */
@Component({
    selector: 'record-card',
    templateUrl: './recordCard.component.html',
    styleUrls: ['./recordCard.component.scss']
})
export class RecordCardComponent implements OnInit {
    @Input() record: JSONLDObject;
    @Output() clickCard = new EventEmitter<JSONLDObject>();

    descriptionLimit = 200;
    title = '';
    description = '';
    modified = '';

    constructor(public util: UtilService) {}

    ngOnInit(): void {
        this.title = this.util.getDctermsValue(this.record, 'title');
        this.description = this.util.getDctermsValue(this.record, 'description') || '(No description)';
        this.modified = this.util.getDate(this.util.getDctermsValue(this.record, 'modified'), 'short');
    }
    handleClick(): void {
        this.clickCard.emit(this.record);
    }
}
