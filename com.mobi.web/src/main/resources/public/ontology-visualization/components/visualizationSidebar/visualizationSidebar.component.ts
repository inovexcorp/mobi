/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FormBuilder, Validators } from '@angular/forms';

import { OntologyVisualizationService } from '../../services/ontologyVisualizaton.service';

import './visualizationSidebar.component.scss';

import { ControlRecordI, ControlRecordSearchI, GraphState, SidePanelAction } from '../../services/visualization.interfaces';

/**
 * @class VisualizationSidebar
 * Enable understand a large ontology/an ontology with a lot of imports
 */
@Component({
    selector: 'visualization-sidebar',
    templateUrl: './visualizationSidebar.component.html',
    animations: [
        trigger('slide', [
          state('up', style({ height: 0 })),
          state('down', style({ height: '*' })),
          transition('up <=> down', animate(200))
        ])
      ]
})
export class VisualizationSidebar implements OnInit, OnChanges {
    @Input() commitId;

    constructor(private ovis: OntologyVisualizationService, public fb: FormBuilder) {}

    toggled = true;
    importOptions = [
        {'value': 'all', 'text': 'All'},
        {'value': 'local', 'text': 'Local'},
        {'value': 'imported', 'text': 'Imported'}
    ];
    searchFormDefaults = { 
        searchText: '', 
        importOption: this.importOptions[0].value 
    }
    searchForm = this.fb.group({
        searchText: [''],
        importOption: ['', [Validators.required]]
    })

    graphState: GraphState;

    ngOnInit(): void {
        this.graphState = this.ovis.getGraphState(this.commitId);
        if (this.graphState.searchForm != undefined) {
            this.searchForm.patchValue(this.graphState.searchForm);
        } else {
            this.searchForm.patchValue(this.searchFormDefaults);
        }

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.commitId?.currentValue) {
            this.graphState = this.ovis.getGraphState(changes.commitId.currentValue);
            if (this.graphState.searchForm != undefined) {
                this.searchForm.patchValue(this.graphState.searchForm);
            } else {
                this.searchForm.patchValue(this.searchFormDefaults);
            }
        }
    }

    onToggledClick(): void{
        this.toggled = !this.toggled;
    }

    searchRecords(limit = 0): void {
        this.graphState.searchForm = this.searchForm.value;
        const controlRecordSearch = this.graphState.getControlRecordSearch(limit);
        this.graphState.emitGraphData(controlRecordSearch);
    }

    onClickRecordSelect(record: ControlRecordI) {
        this.ovis.sidePanelActionSubject$.next({action: SidePanelAction.RECORD_SELECT, controlRecord: record});
    }
    
    onRightClickRecordSelect(event, record: ControlRecordI) {
        event.preventDefault();
        this.ovis.sidePanelActionSubject$.next({action: SidePanelAction.RECORD_CENTER, controlRecord: record});
    }
}