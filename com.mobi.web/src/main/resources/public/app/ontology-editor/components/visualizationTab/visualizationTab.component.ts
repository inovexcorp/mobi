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
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, DoCheck, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, OnInit
} from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';

import { isEqual } from 'lodash';

/**
 * @class ontology-editor.VisualizationTabComponent
 *
 * A component that creates a page containing an interactive visualization of the ontologies in the imports closure of
 * the currently {@link shared.OntologyStateService#listItem selected ontology}. This component renders a force-directed
 * graph using d3-force layout. The graph is generated by the data retrieved from {@link shared.OntologyStateService}
 * and {@link shared.OntologyManagerService}. The visualization has a limit of 500 nodes. InProgressCommits are not
 * displayed.
 */
@Component({
    templateUrl: './visualizationTab.component.html',
    selector: 'visualization-tab',
    styleUrls: ['./visualizationTab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualizationTabComponent implements OnInit, DoCheck {
    private _differ: KeyValueDiffer<string, any>;

    constructor(public os: OntologyStateService,
                private _differsService: KeyValueDiffers,
                private _cf: ChangeDetectorRef){
    }
    ngOnInit(): void {
        const currentValues = {
            ontologyId: undefined,
            commitId: undefined,
            branchId: undefined,
            inProgressCommit: undefined
        };
        this._differ = this._differsService.find(currentValues).create();
    }
    ngDoCheck(): void {
        if (this._differ) {
            const currentValues = {
                ontologyId: this.os.listItem.ontologyId,
                commitId: this.os.listItem.versionedRdfRecord.commitId,
                branchId: this.os.listItem.versionedRdfRecord.branchId,
                inProgressCommit: this.os.listItem.inProgressCommit // Object are reference types
            };
            const changes = this._differ.diff({...currentValues}); // Comparison occur by Object.is()
            if (changes) {
                let isDifferent = false;
                changes.forEachItem((changeRecord: KeyValueChangeRecord<string, any>) => {
                    const isValueEqual = isEqual(changeRecord.previousValue, changeRecord.currentValue);
                    if (!isValueEqual){
                        isDifferent = true;
                    }
                });
                if (isDifferent) {
                    this._cf.markForCheck();
                }
            }
        }
    }
}