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
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ChangeDetectorRef,
} from '@angular/core';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

import { Observable } from 'rxjs';

import { OntologyVisualizationService } from '../../services/ontologyVisualization.service';
import { VisualizationSidebarSearch } from '../visualizationSidebarSearch/visualizationSidebarSearch.component';
import { OnClassToggledEvent } from '../../interfaces/classList.interface';
import { ControlRecordI, ControlRecordSearchGroupedI, GroupedRecord } from '../../classes/controlRecords';
import { GraphState, SidebarState } from '../../classes';
import { SidePanelAction } from '../../classes/sidebarState';

/**
 * @class ontology-visualization.VisualizationSidebar
 * 
 * Enable understand a large ontology/an ontology with a lot of imports
 */
@Component({
    selector: 'visualization-sidebar',
    templateUrl: './visualizationSidebar.component.html',
    styleUrls: ['./visualizationSidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    providers:[
        { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, 
        { provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { color: 'accent', clickAction: 'noop'} }
    ]
})
export class VisualizationSidebar implements OnChanges {
    @Input() commitId;
    @ViewChild(VisualizationSidebarSearch) visualizationSidebarSearch: VisualizationSidebarSearch;

    constructor(private ovis: OntologyVisualizationService,
                private cf: ChangeDetectorRef) {}

    graphState: GraphState;
    sidebarState: SidebarState;
    ontologyPanelOpenState = false;
    toggled = true;
    selectedRecord$: Observable<string> = this.ovis.ontologyClassSelectedAction$;
    ontologyToggled: boolean;

    /**
     * ngOnChanges Lifecycle hook 
     * Occurs when: (commitId) is changed
     * - Switching between ontologies
     * @param changes SimpleChanges
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.commitId?.currentValue) {
            this.graphState = this.ovis.getGraphState(this.commitId);
            this.sidebarState = this.ovis.getSidebarState(this.commitId);
        }
    }
    /**
     * Used to show and hide filter sidebar
     */
    onToggledClick(): void{
        this.toggled = !this.toggled;
    }
    /**
     * Used to highlight node in visualization graph from sidebar
     * @param record ControlRecordI
     */
    onClickRecordSelect(record: ControlRecordI): void  {
        this.ovis.emitSelectAction({action: SidePanelAction.RECORD_SELECT, nodeId: record.id});
        this.ovis.emitSidePanelAction({action: SidePanelAction.RECORD_SELECT, controlRecord: record});
    }
    /**
     * Used to zoom to node in visualization graph from sidebar
     * @param record ControlRecordI
     * @returns boolean
     */
    onRightClickRecordSelect(record: ControlRecordI): void {
        this.ovis.emitSidePanelAction({action: SidePanelAction.RECORD_CENTER, controlRecord: record});
    }
    /**
     * Used to toggle class checkbox from sidebar. Hide and show node in visualization graph from sidebar
     * 
     * NOTE: Method is mutating data using object references 
     * 
     * @param controlRecordSearchGrouped controlRecordSearchGrouped
     * @param onClassToggledEvent OnClassToggledEvent
     */
    toggleClass(controlRecordSearchGrouped: ControlRecordSearchGroupedI, onClassToggledEvent: OnClassToggledEvent) : void {
        const { checked , record } = onClassToggledEvent;
        record.isChecked = checked;
        record.onGraph = record.isChecked;
        if (!checked) {
            record.inInitialGraph = false;
        }
        const allClassesAllOntologies = controlRecordSearchGrouped.allClassesAllOntologies;
        // Update disabled status
        const checkedRecords = allClassesAllOntologies.filter(currentRecord => currentRecord.isChecked);
        if (checkedRecords.length >= this.ovis.DEFAULT_NODE_LIMIT) {
            allClassesAllOntologies.forEach(currentRecord => {
                currentRecord.disabled = currentRecord.isChecked !== true;
            });
        } else {
            allClassesAllOntologies.forEach(currentRecord => {
                currentRecord.disabled = false;
            });
        }
        const currentOntologies = controlRecordSearchGrouped.records.filter(c => c.ontologyId === record.ontologyId);
        currentOntologies.forEach((currentOntology: GroupedRecord) => currentOntology.updateCheckedAttr());
        
        if (checked) {
            this.ovis.emitSidePanelAction({action: SidePanelAction.RECORD_CHECKED, controlRecord: record});
        } else {
            this.ovis.emitSidePanelAction({action: SidePanelAction.RECORD_UNCHECKED, controlRecord: record});
        }
        this.cf.markForCheck();
        this.cf.detectChanges(); // needed so that in when there are many ontologies, checkbox will be updated for ontology
    }
    /**
     * Track function
     * @param _index 
     * @param cName 
     * @returns id
     */
    trackByClassId(_index: number, cName: any): any {
        return cName.id;
    }
    /**
     * Handles Ontology On Click for Showing/Hiding ontology
     * 
     * Possible states for Checkbox: 
     * - checked 
     * - unchecked
     * - indeterminate
     * 
     * State Transitions:
     * - unchecked -> unchecked
     *   - Occurs allClassesAllOntologies.length >= nodeLimit
     * - unchecked -> checked
     *   - occurs when all classes are checked and ontology has not been in the graph yet
     * - unchecked -> indeterminate
     *   - occurs when node limit is being hit
     *   - ontology is being clicked again after unclicking (onInitial flag is set for node)
     * - indeterminate -> checked
     *   - occurs when some are selected and all classes onGraph is not over node limit
     * - checked -> unchecked
     *   - occures when all classes are checked, and unchecked, onInitial flag is set for node
     * 
     * NOTE: 
     *  - Method is mutating data using object references
     *  - SidePanelAction Event emitted when and ontology is checked/unchecked
     *  - graphState.isOverLimit is probably not correct
     * @param event https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
     * @param controlRecordSearchGrouped data
     * @param ontology ontology record
     */
    ontologyOnClick(event: PointerEvent, controlRecordSearchGrouped: ControlRecordSearchGroupedI, ontology: GroupedRecord): void{
        event.stopPropagation();
        const nodeLimit = this.ovis.DEFAULT_NODE_LIMIT;
        const currentChecked = ontology.allClassesChecked || false;
        const currentIndeterminate = ontology.someClassesChecked && !ontology.allClassesChecked;
        const allClassesAllOntologies = controlRecordSearchGrouped.allClassesAllOntologies;
        const checkedClassesAllOntologies = allClassesAllOntologies.filter(currentRecord => currentRecord.isChecked);
        const ontologyClasses = allClassesAllOntologies.filter(r => r.ontologyId === ontology.ontologyId);

        if (!currentChecked && !currentIndeterminate) { // case: unchecked -> (unchecked|indeterminate|checked)
            const overLimit = checkedClassesAllOntologies.length >= nodeLimit;
            if (overLimit) {
                // case: unchecked -> unchecked
                return;
            } else {
                // case: unchecked -> (indeterminate|checked)
                const ontologyClassesShallowCopy = [...ontologyClasses];
                ontologyClassesShallowCopy.sort((a: ControlRecordI, b: ControlRecordI) => {
                    let inInitialGraphOrder = 0;
                    if (a?.inInitialGraph && !b?.inInitialGraph) {
                        inInitialGraphOrder = -1;
                    } else if (!a?.inInitialGraph && b?.inInitialGraph) {
                        inInitialGraphOrder = 1;
                    }
                    return inInitialGraphOrder;
                });
                const currentCheckCount = checkedClassesAllOntologies.length;
                let checkedCount = 1;
                let hasInInitialGraphFlag = false;
                ontologyClassesShallowCopy.forEach(item => {
                    if (item.inInitialGraph) {
                        hasInInitialGraphFlag = true;
                    }
                    const classesCheckedCheckCount = currentCheckCount + checkedCount;
                    if (hasInInitialGraphFlag && item.inInitialGraph) {
                        item.isChecked = true;
                        item.onGraph = true;
                        checkedCount +=1;
                    } else if ( hasInInitialGraphFlag && !item.inInitialGraph ) {
                        item.isChecked = false;
                        item.onGraph = false;
                    } else if ( !hasInInitialGraphFlag && classesCheckedCheckCount > nodeLimit ) {
                        item.isChecked = false;
                        item.onGraph = false;
                    } else if (!hasInInitialGraphFlag) {
                        item.isChecked = true;
                        item.onGraph = true;
                        checkedCount +=1;
                    }
                    item.inInitialGraph = false;
                });
            }
        } else if (!currentChecked && currentIndeterminate) { // case: indeterminate -> unchecked|checked
            const uncheckedOntologyClasses = ontologyClasses.filter(currentRecord => !currentRecord.isChecked );
            const wouldBeCheckedNumber = checkedClassesAllOntologies.length + uncheckedOntologyClasses.length;
            const wouldBeCheckedOverLimit = wouldBeCheckedNumber > nodeLimit;
            if (wouldBeCheckedOverLimit) { // indeterminate -> unchecked
                ontologyClasses.forEach(item => {
                    item.inInitialGraph = false;
                    if (item.isChecked) {
                        item.inInitialGraph = true;
                    }
                    item.isChecked = false;
                    item.onGraph = false;
                });
            } else { // indeterminate -> checked
                ontologyClasses.forEach((record: ControlRecordI) => {
                    record.inInitialGraph = false;
                    record.isChecked = true;
                    record.onGraph = true;
                });
            }
        } else if (currentChecked && !currentIndeterminate) { // case: checked -> unchecked
            ontologyClasses.forEach(item => {
                item.inInitialGraph = false;
                if (item.isChecked) {
                    item.inInitialGraph = true;
                }
                item.isChecked = false;
                item.onGraph = false;
            });
        } else {
            throw Error('State Transition was not captured');
        }
        // Handle allClassesChecked and someClassesChecked
        ontology.allClassesChecked = ontologyClasses.every(item => item.isChecked);
        ontology.someClassesChecked = ontology.allClassesChecked === false && ontologyClasses.some(item => item.isChecked);
        // Handle disabing checkboxes 
        const afterAllClassesAllOntologiesChecked = allClassesAllOntologies.filter(currentRecord => currentRecord.isChecked);
        if (afterAllClassesAllOntologiesChecked.length >= nodeLimit) {
            allClassesAllOntologies.forEach((record: ControlRecordI) => {
                if (record.isChecked) {
                    record.disabled = false;
                } else {
                    record.disabled = true;
                }
            });
        } else {
            allClassesAllOntologies.forEach((record: ControlRecordI) => {
                record.disabled = false;
            });
        }
        const actionValue = (ontology.allClassesChecked || ontology.someClassesChecked) ? SidePanelAction.ONTOLOGY_CHECKED : SidePanelAction.ONTOLOGY_UNCHECKED;
        this.ovis.emitSidePanelAction({ action: actionValue, ontology: ontology});
        this.cf.markForCheck();
    }
    /**
     * Event emitted every time the AccordionItem is closed from mat-expansion-panel
     * mat-expansion-panel event for closing is EventEmitter<void>
     * @param ontologyId ontology that was closed
     */
    beforePanelClosed(ontologyId: string): void {
        this.ontologyPanelOpenState = false;
        this.sidebarState.selectedOntologyId = this.sidebarState.selectedOntologyId ? this.sidebarState.selectedOntologyId : ontologyId;
    }
    /**
     * Event emitted every time the AccordionItem is opened from mat-expansion-panel
     * mat-expansion-panel event for opening is EventEmitter<void>
     * @param ontologyId ontology that was opened
     */
    beforePanelOpened(ontologyId: string): void {
        this.ontologyPanelOpenState = true;
        this.sidebarState.selectedOntologyId = ontologyId;
    }
    loadMore(): void{
        this.visualizationSidebarSearch.loadMoreRecords();
    }
}
