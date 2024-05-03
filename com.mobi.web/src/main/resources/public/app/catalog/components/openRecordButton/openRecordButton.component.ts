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
import { Component, Input } from '@angular/core';
import { find } from 'lodash';
import { Router } from '@angular/router';

import { RecordSelectFiltered } from '../../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { DATASET, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { getDctermsValue } from '../../../shared/utility';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';

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
        private toast: ToastService) {}

    openRecord(event: MouseEvent): void {
        if (this.stopProp) {
            event.stopPropagation();
        }
        switch (this.recordType) {
            case `${ONTOLOGYEDITOR}OntologyRecord`:
                this.openOntology();
                break;
            case `${DELIM}MappingRecord`:
                this.openMapping();
                break;
            case `${DATASET}DatasetRecord`:
                this.openDataset();
                break;
            case `${SHAPESGRAPHEDITOR}ShapesGraphRecord`:
                this.openShapesGraph();
                break;
            default:
                this.toast.createWarningToast('No module for record type ' + this.recordType);
        }
    }
    openOntology(): void {
        this.router.navigate(['/ontology-editor']);
        const listItem: OntologyListItem = find(this.os.list, {versionedRdfRecord: {recordId: this.record['@id']}});
        if (listItem) {
          this.os.listItem = listItem;
        } else {
          const recordSelect: RecordSelectFiltered = {
            recordId: this.record['@id'],
            title: getDctermsValue(this.record, 'title'),
            description: getDctermsValue(this.record, 'description'),
            identifierIRI: this.os.getIdentifierIRI(this.record)
          };
          this.os.open(recordSelect).subscribe(() => {}, error => this.toast.createErrorToast(error));
        }
    }
    openMapping(): void {
        this.ms.paginationConfig.searchText = getDctermsValue(this.record, 'title');
        this.router.navigate(['/mapper']);
    }
    openDataset(): void {
        this.router.navigate(['/datasets']);
    }
    openShapesGraph(): void {
        this.router.navigate(['/shapes-graph-editor']);
        const listItem: ShapesGraphListItem = find(this.sgs.list, { versionedRdfRecord: { recordId: this.record['@id'] } });
        if (listItem) {
            this.sgs.listItem = listItem;
        } else {
          const recordSelect: RecordSelectFiltered = {
            recordId: this.record['@id'],
            title: getDctermsValue(this.record, 'title'),
            description: getDctermsValue(this.record, 'description'),
            identifierIRI: this.sgs.getIdentifierIRI(this.record)
          };
          this.sgs.open(recordSelect).subscribe(() => {}, error => this.toast.createErrorToast(error));
        }
    }
    update(): void {
        this.recordType = this.cs.getRecordType(this.record);

        if (this.recordType === `${ONTOLOGYEDITOR}OntologyRecord`) {
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
