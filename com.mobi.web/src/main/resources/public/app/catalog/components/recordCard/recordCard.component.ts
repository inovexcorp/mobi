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
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { getDctermsValue } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ToastService } from '../../../shared/services/toast.service';

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
    @Output() viewRecord = new EventEmitter<JSONLDObject>();

    descriptionLimit = 200;
    title = '';
    description = '';
    modified: Date;

    constructor(private toast: ToastService, private clipboard: Clipboard) {}

    ngOnInit(): void {
        this.title = getDctermsValue(this.record, 'title');
        this.description = getDctermsValue(this.record, 'description') || '(No description)';
        this.modified = new Date(getDctermsValue(this.record, 'modified'));
    }
    handleClick(): void {
        this.viewRecord.emit(this.record);
    }
    copyIRI(): void {
        const copied = this.clipboard.copy(this.record['@id']);
        if (copied) {
            this.toast.createSuccessToast('Copied', {timeOut: 2000});
        } else {
            this.toast.createErrorToast('Failed to copy IRI', {timeOut: 2000});
        }
    }
}
