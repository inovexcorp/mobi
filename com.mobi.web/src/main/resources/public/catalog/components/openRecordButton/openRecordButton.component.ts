/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { find, noop, isEmpty } from 'lodash';
import { Router } from '@angular/router';

import { RecordSelectFiltered } from '../../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { DATASET, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../shared/services/util.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';

/**
 * @class catalog.OpenRecordButtonComponent
 *
 * A component which creates an Open Record button that will open the provided record in the appropriate module.
 * 
 * @param {JSONLDObject} record The record to open
 * @param {boolean} flat Whether the button should be flat
 * @param {boolean} stopProp Whether propagation should be stopped on click event
 */
@Component({
    selector: 'open-record-button',
    templateUrl: './openRecordButton.component.html'
})
export class OpenRecordButtonComponent {
    recordType = '';
    showButton = false;

    private _record;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        this.update();
    }

    get record(): JSONLDObject {
        return this._record;
    }

    @Input() flat: boolean;
    @Input() stopProp: boolean;

    constructor(public router: Router, public cs: CatalogStateService, public ms: MapperStateService,
        public os: OntologyStateService, public pep: PolicyEnforcementService,
        public pm: PolicyManagerService, public sgs: ShapesGraphStateService,
        public util: UtilService) {}

    openRecord(event: MouseEvent): void {
        if (this.stopProp) {
            event.stopPropagation();
        }
        switch (this.recordType) {
            case ONTOLOGYEDITOR + 'OntologyRecord':
                this.openOntology();
                break;
            case DELIM + 'MappingRecord':
                this.openMapping();
                break;
            case DATASET + 'DatasetRecord':
                this.openDataset();
                break;
            case SHAPESGRAPHEDITOR + 'ShapesGraphRecord':
                this.openShapesGraph();
                break;
            default:
                this.util.createWarningToast('No module for record type ' + this.recordType);
        }
    }
    openOntology(): void {
        this.router.navigate(['/ontology-editor']);
        if (!isEmpty(this.os.listItem)) {
            this.os.listItem.active = false;
        }
        const listItem: OntologyListItem = find(this.os.list, {versionedRdfRecord: {recordId: this.record['@id']}});
        if (listItem) {
            this.os.listItem = listItem;
            this.os.listItem.active = true;
        } else {
            this.os.openOntology(this.record['@id'], this.util.getDctermsValue(this.record, 'title'))
                .subscribe(noop, this.util.createErrorToast);
        }
    }
    openMapping(): void {
        this.ms.paginationConfig.searchText = this.util.getDctermsValue(this.record, 'title');
        this.router.navigate(['/mapper']);
    }
    openDataset(): void {
        this.router.navigate(['/datasets']);
    }
    openShapesGraph(): void {
        const recordSelect: RecordSelectFiltered = {
            recordId: this.record['@id'],
            title: this.util.getDctermsValue(this.record, 'title'),
            description: this.util.getDctermsValue(this.record, 'description')
        };
        this.router.navigate(['/shapes-graph-editor']);
        this.sgs.openShapesGraph(recordSelect).then(noop, this.util.createErrorToast);
    }
    update(): void {
        this.recordType = this.cs.getRecordType(this.record);

        if (this.recordType === ONTOLOGYEDITOR + 'OntologyRecord') {
            const request = {
                resourceId: this.record['@id'],
                actionId: this.pm.actionRead
            };
            this.pep.evaluateRequest(request).subscribe(decision => {
                this.showButton = decision !== this.pep.deny;
            });
        } else {
            this.showButton = true;
        }
    }
}
