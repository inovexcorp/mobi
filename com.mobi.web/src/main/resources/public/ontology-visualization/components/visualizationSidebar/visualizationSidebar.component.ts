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
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormBuilder, Validators } from '@angular/forms';

import { ControlRecordI, SidePanelAction } from '../../interfaces/visualization.interfaces';
import { GraphState } from '../../classes';
import { OntologyVisualizationService } from '../../services/ontologyVisualizaton.service';

import './visualizationSidebar.component.scss';

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
      ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualizationSidebar implements OnInit, OnChanges {
    @Input() commitId;
    constructor(private ovis: OntologyVisualizationService, public fb: FormBuilder) {}

    OntologyPanelOpenState = false;
    sidebarState = null;
    toggled = true;
    selectedRecord$ = this.ovis.ontologyClassSelectedAction$;
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
        this.sidebarState = this.ovis.getSidebarState(this.commitId);
        if (this.graphState.searchForm !== undefined) {
            this.searchForm.patchValue(this.graphState.searchForm);
        } else {
            this.searchForm.patchValue(this.searchFormDefaults);
        }

    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.commitId?.currentValue) {
            this.graphState = this.ovis.getGraphState(changes.commitId.currentValue);
            if (this.graphState.searchForm !== undefined) {
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
        this.ovis.emitSelectAction({action: SidePanelAction.RECORD_SELECT, nodeId: record.id});
        this.ovis.emitSidePanelAction({action: SidePanelAction.RECORD_SELECT, controlRecord: record});
    }
    
    onRightClickRecordSelect(event, record: ControlRecordI) {
        event.preventDefault();
        this.ovis.emitSidePanelAction({action: SidePanelAction.RECORD_CENTER, controlRecord: record});
    }

    toggleClass(event:MouseEvent | TouchEvent, record: ControlRecordI) {
        event.preventDefault();
    }

    beforePanelClosed(event, ontologyId, isOpended: boolean): void {
        this.OntologyPanelOpenState = true;
        this.sidebarState.selectedOntologyId = false;
    }

    beforePanelOpened(event, ontologyId, isClosed: boolean): void {
        this.OntologyPanelOpenState = true;
        this.sidebarState.selectedOntologyId = ontologyId;
    }
}
