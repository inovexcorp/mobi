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
import { DebugElement, SimpleChange } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { fakeAsync, TestBed, ComponentFixture } from '@angular/core/testing';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import {
    MatCheckbox,
    MatCheckboxModule,
} from '@angular/material/checkbox';

import { Observable, Subject } from 'rxjs';
import { MockComponent } from 'ng-mocks';

import { OntologyVisualizationService } from '../../services/ontologyVisualization.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { SpinnerComponent } from '../../../shared/components/progress-spinner/components/spinner/spinner.component';
import { VisualizationSidebar } from './visualizationSidebar.component';
import { VisualizationClassListComponent } from '../visualizationClassList/visualizationClassList.component';

import { MatListModule } from '@angular/material/list';
import { VisualizationSidebarSearch } from '../visualizationSidebarSearch/visualizationSidebarSearch.component';
import { ControlGroupRecordI, ControlRecordI, ControlRecordSearchGroupedI, ControlRecordSearchResultI, ControlRecordType, GroupedRecord } from '../../classes/controlRecords';
import { MockOntologyVisualizationService } from 'src/main/resources/public/test/ts/Shared';
import { SidePanelAction } from '../../classes/sidebarState';
import { MatSelectModule } from '@angular/material/select';
import { OnClassToggledEvent } from '../../interfaces/classList.interface';

describe('Visualization sidebar component', () => {
    let component: VisualizationSidebar;
    let element: DebugElement;
    let fixture: ComponentFixture<VisualizationSidebar>;
    let serviceStub: OntologyVisualizationService;
    let controlRecords: ControlRecordI[];
    let singleControlRecord: ControlRecordI;
    let controlGroupRecords: ControlGroupRecordI;
    let localNodeLimit;
    let subject;
    let groupedOntologies;
    let checkboxDebugElement;
    let checkboxNativeElement: HTMLElement;
    let checkboxInstance: MatCheckbox;
    let inputElement: HTMLInputElement;
    
    beforeEach(async() => {
        await TestBed.configureTestingModule({
            declarations: [
                VisualizationSidebar,
                MockComponent(SpinnerComponent),
                MockComponent(InfoMessageComponent),
                MockComponent(VisualizationClassListComponent),
                MockComponent(VisualizationSidebarSearch)
            ],
            imports: [
                FormsModule,
                ReactiveFormsModule,
                BrowserAnimationsModule,
                MatSelectModule,
                MatExpansionModule,
                MatCheckboxModule,
                MatListModule
            ],
            providers: [
                { provide: OntologyVisualizationService, useClass: MockOntologyVisualizationService },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(VisualizationSidebar);
        localNodeLimit = 500;
        component = fixture.componentInstance;
        subject = new Subject<any>();
        controlRecords = [
            {
                type: ControlRecordType.NODE,
                id: 'record1', name: 'label1', ontologyId: 'ont1', isImported: false, onGraph: true, isChecked: true, disabled: false
            },
            {
                type: ControlRecordType.NODE,
                id: 'record2', name: 'label2', ontologyId: 'ont2', isImported: false, onGraph: true, isChecked: false, disabled: false
            }
        ];
        controlGroupRecords = {
            ontologyId: 'ont1',
            classes: [...controlRecords],
            allClasses: [...controlRecords],
            ontologyColor: '#46799d',
            name: 'Test',
            isImported: false,
            allClassesChecked: true,
            someClassesChecked: false
        };
        groupedOntologies =  new Array(controlGroupRecords);
        singleControlRecord = {
            type: ControlRecordType.ONTOLOGY,
            id: null,
            name: controlGroupRecords.name,
            isImported: controlGroupRecords.isImported,
            ontologyId: controlGroupRecords.ontologyId,
            onGraph: null,
            ontologyColor: controlGroupRecords.ontologyColor,
            disabled: false
        };
        component.graphState = jasmine.createSpyObj('graphState', ['emitGraphData', 'getControlRecordSearch'], { 
            nodeLimit: localNodeLimit,
            controlRecordObservable$: new Observable<ControlRecordSearchResultI>(subscriber => {
                subscriber.next({
                    limit: 500,
                    count: 1,
                    records: groupedOntologies,
                    recordsOverLimit:[]
                });
            })
        });
        component.visualizationSidebarSearch = jasmine.createSpyObj('visualizationSidebarSearch', {
            loadMoreRecords: jasmine.createSpy()
        });
        element = fixture.debugElement;
        serviceStub = TestBed.get(OntologyVisualizationService);
        serviceStub.getGraphState = jasmine.createSpy('getGraphState').and.returnValue(component.graphState);
        serviceStub.getSidebarState = jasmine.createSpy('getSidebarState').and.returnValue({
            commitId: 'commitId1',
            recordId: 'recordId1',
            selectedOntologyId: 'ont1'
        });
        serviceStub.emitSidePanelAction = jasmine.createSpy('emitSidePanelAction').and.callFake(() => {});
        serviceStub.emitSelectAction = jasmine.createSpy('emitSelectAction').and.callFake(() => {});
    });
    afterEach(() => {
        element = null;
        fixture = null;
        component = null;
        serviceStub = null;
        controlRecords = [];
    });
    describe('component lifecycle should initialize with the right values', () => {
        it('ngOnInit', fakeAsync(() => {
            component.commitId = 'commitId1';
            component.ngOnChanges({commitId: new SimpleChange(undefined, 'commitId1', true)});
            expect(serviceStub.getGraphState).toHaveBeenCalledWith('commitId1');
            expect(serviceStub.getSidebarState).toHaveBeenCalledWith('commitId1');
        }));
    });
    describe('component method', () => {
        describe('onToggledClick', () => {
            it('toggles correctly', () => {
                expect(component.toggled).toEqual(true);
                component.onToggledClick();
                expect(component.toggled).toEqual(false);
                component.onToggledClick();
                expect(component.toggled).toEqual(true);
            });
        });
        describe('onClickRecordSelect', () => {
            it('emits correctly', fakeAsync(() => {
                component.onClickRecordSelect(controlRecords[0]);
                expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({action: SidePanelAction.RECORD_SELECT, controlRecord: controlRecords[0]});
                expect(serviceStub.emitSelectAction).toHaveBeenCalledWith({ action: SidePanelAction.RECORD_SELECT, nodeId: controlRecords[0].id});
            }));
        });
        describe('onRightClickRecordSelect', () => {
            it('emits correctly', fakeAsync(() => {
                const event = jasmine.createSpyObj('event', ['preventDefault']);
                component.onRightClickRecordSelect(controlRecords[0]);
                expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({action: SidePanelAction.RECORD_CENTER, controlRecord: controlRecords[0]});
            }));
        });
        describe('toggleClass', () => {
            it('emits correctly', fakeAsync(() => {
                const base = { type: ControlRecordType.NODE, isImported: false, ontologyId: 'ontologyId'};
                const records = [
                    { ...base, id: '0.0', name: '1',  onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '0.1', name: '2', onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '1.1', name: '3', onGraph: true, disabled: true, isChecked: true},
                    { ...base, id: '2.1', name: '4', onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '2.2', name: '5',  onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '4.1', name: '6',  onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '4.10', name: '7',  onGraph: true, disabled: false, isChecked: true}
                ];
                const recordsOverLimit = [
                    { ...base, id: '1.0.0', name: '1',  onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.0.1', name: '2', onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.1.1', name: '3', onGraph: false, disabled: true, isChecked: false},
                    { ...base, id: '1.2.1', name: '4', onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.2.2', name: '5',  onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.4.1', name: '6',  onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.4.10', name: '7',  onGraph: false, disabled: false, isChecked: false}
                ];
                const groupedRecord1 = new GroupedRecord({
                    ontologyId: 'ontologyId',
                    classes: records,
                    allClasses: records.concat(recordsOverLimit),
                    isImported: false,
                    name: 'name',
                    ontologyColor: 'blue',
                });
                const controlRecordSearchGroupedI: ControlRecordSearchGroupedI = {
                    records: [groupedRecord1],
                    allClassesAllOntologies: records.concat(recordsOverLimit),
                    limit: 100,
                    count: 100
                };
                const onClassToggledEvent: OnClassToggledEvent = {ontology: undefined, checked: false, record: records[0]};
                component.toggleClass(controlRecordSearchGroupedI, onClassToggledEvent);
                expect(records[0].isChecked).toBeFalsy();
                expect(records[0].onGraph).toBeFalsy();
                // expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({action: SidePanelAction.RECORD_SELECT, controlRecord: records[0]});
                const onClassToggledEvent2: OnClassToggledEvent = {ontology: undefined, checked: true, record: records[0]};
                component.toggleClass(controlRecordSearchGroupedI, onClassToggledEvent2);
                expect(records[0].isChecked).toBeTruthy();
                expect(records[0].onGraph).toBeTruthy();
            }));
        });
        describe('ontologyOnClick', () => {
            it('emits correctly', fakeAsync(() => {
                const event = jasmine.createSpyObj('PointerEvent', ['stopPropagation']);
                const base = { type: ControlRecordType.NODE, isImported: false, ontologyId: 'ontologyId'};
                const records = [
                    { ...base, id: '0.0', name: '1',  onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '0.1', name: '2', onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '1.1', name: '3', onGraph: true, disabled: true, isChecked: true},
                    { ...base, id: '2.1', name: '4', onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '2.2', name: '5',  onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '4.1', name: '6',  onGraph: true, disabled: false, isChecked: true},
                    { ...base, id: '4.10', name: '7',  onGraph: true, disabled: false, isChecked: true}
                ];
                const recordsOverLimit = [
                    { ...base, id: '1.0.0', name: '1',  onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.0.1', name: '2', onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.1.1', name: '3', onGraph: false, disabled: true, isChecked: false},
                    { ...base, id: '1.2.1', name: '4', onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.2.2', name: '5',  onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.4.1', name: '6',  onGraph: false, disabled: false, isChecked: false},
                    { ...base, id: '1.4.10', name: '7',  onGraph: false, disabled: false, isChecked: false}
                ];
                const groupedRecord1 = new GroupedRecord({
                    ontologyId: 'ontologyId',
                    classes: records,
                    allClasses: records.concat(recordsOverLimit),
                    isImported: false,
                    name: 'name',
                    ontologyColor: 'blue',
                });
                const ontologyId1Base = { type: ControlRecordType.NODE, isImported: false, ontologyId: 'ontologyId1'};
                const ontologyId1records = [
                    { ...ontologyId1Base, id: '0.0', name: '1',  onGraph: true, disabled: false, isChecked: true},
                    { ...ontologyId1Base, id: '0.1', name: '2', onGraph: true, disabled: false, isChecked: true},
                    { ...ontologyId1Base, id: '1.1', name: '3', onGraph: true, disabled: true, isChecked: true},
                    { ...ontologyId1Base, id: '2.1', name: '4', onGraph: true, disabled: false, isChecked: true},
                    { ...ontologyId1Base, id: '2.2', name: '5',  onGraph: true, disabled: false, isChecked: true},
                    { ...ontologyId1Base, id: '4.1', name: '6',  onGraph: true, disabled: false, isChecked: true},
                    { ...ontologyId1Base, id: '4.10', name: '7',  onGraph: true, disabled: false, isChecked: true}
                ];
                const ontologyId1recordsOverLimit = [
                    { ...ontologyId1Base, id: '1.0.0', name: '1',  onGraph: false, disabled: false, isChecked: false},
                    { ...ontologyId1Base, id: '1.0.1', name: '2', onGraph: false, disabled: false, isChecked: false},
                    { ...ontologyId1Base, id: '1.1.1', name: '3', onGraph: false, disabled: true, isChecked: false},
                    { ...ontologyId1Base, id: '1.2.1', name: '4', onGraph: false, disabled: false, isChecked: false},
                    { ...ontologyId1Base, id: '1.2.2', name: '5',  onGraph: false, disabled: false, isChecked: false},
                    { ...ontologyId1Base, id: '1.4.1', name: '6',  onGraph: false, disabled: false, isChecked: false},
                    { ...ontologyId1Base, id: '1.4.10', name: '7',  onGraph: false, disabled: false, isChecked: false}
                ];
                const ontologyId1GroupedRecord= new GroupedRecord({
                    ontologyId: 'ontologyId',
                    classes: ontologyId1records,
                    allClasses: ontologyId1records.concat(ontologyId1recordsOverLimit),
                    isImported: false,
                    name: 'name',
                    ontologyColor: 'blue',
                });
                groupedRecord1.updateCheckedAttr();
                expect(groupedRecord1.allClassesChecked).toBeFalsy();
                expect(groupedRecord1.someClassesChecked).toBeTruthy();

                const controlRecordSearchGroupedI: ControlRecordSearchGroupedI = {
                    records: [groupedRecord1, ontologyId1GroupedRecord],
                    allClassesAllOntologies: groupedRecord1.allClasses.concat(ontologyId1GroupedRecord.allClasses),
                    limit: 100,
                    count: 100
                };
                component.ontologyOnClick(event, controlRecordSearchGroupedI, groupedRecord1); // indeterminate -> checked
                
                expect(event.stopPropagation).toHaveBeenCalled();
                groupedRecord1.allClasses.forEach(r => {
                    expect(r.isChecked).toBeTruthy();
                    expect(r.onGraph).toBeTruthy();
                    expect(r.disabled).toBeFalsy();
                });

                component.ontologyOnClick(event, controlRecordSearchGroupedI, groupedRecord1); // checked -> unchecked

                groupedRecord1.allClasses.forEach(r => {
                    expect(r.isChecked).toBeFalsy();
                    expect(r.onGraph).toBeFalsy();
                    expect(r.disabled).toBeFalsy();
                });

                component.ontologyOnClick(event, controlRecordSearchGroupedI, groupedRecord1); // unchecked -> checked
                groupedRecord1.allClasses.forEach(r => {
                    expect(r.isChecked).toBeTruthy();
                    expect(r.onGraph).toBeTruthy();
                    expect(r.disabled).toBeFalsy();
                });
            }));
        });
        
        describe('beforePanelClosed', () => {
            it('emits correctly', fakeAsync(() => {
                component.sidebarState = jasmine.createSpyObj('sidebarState', {}, {selectedOntologyId: undefined});
                component.ontologyPanelOpenState = true;
                component.beforePanelClosed('ontologyId');
                expect(component.ontologyPanelOpenState).toBeFalsy();
            }));
        });
        describe('beforePanelOpened', () => {
            it('correctly', fakeAsync(() => {
                component.sidebarState = jasmine.createSpyObj('sidebarState', {}, {selectedOntologyId: undefined});
                component.ontologyPanelOpenState = false;
                component.beforePanelOpened('ontologyId');
                expect(component.ontologyPanelOpenState).toBeTruthy();
            }));
        });
        describe('loadMore', () => {
            it('to have been called ', fakeAsync(() => {
                component.loadMore();
                expect(component.visualizationSidebarSearch.loadMoreRecords).toHaveBeenCalled();
            }));
        });
    });
    describe('contains the correct html', () => {
        beforeEach(() => {
            component.ngOnChanges({commitId: new SimpleChange(undefined, 'commitId1', true)});
            fixture.detectChanges();
        });
        it('for wrapping containers', () => {
            expect(element.query(By.css('.visualization-sidebar'))).toBeTruthy();
        });
        it('sidebar hiding toggle works', () => {
            expect(element.query(By.css('.sidebar-wrapper'))).toBeTruthy();
            component.onToggledClick();
            fixture.detectChanges();
            expect(element.query(By.css('.sidebar-wrapper'))).toBeTruthy();
        });
    });
    describe('toggleOntology', () => {
        beforeEach(() => {
            component.ngOnChanges({commitId: new SimpleChange(undefined, 'commitId1', true)});
            fixture.detectChanges();
            checkboxDebugElement = element.query(By.css('.ontology__check'));
            checkboxNativeElement = checkboxDebugElement.nativeElement;
            checkboxInstance = checkboxDebugElement.componentInstance;
            inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
            // let labelElement = <HTMLLabelElement>checkboxNativeElement.querySelector('label');
        });
        it('emits correctly when ontology is Unchecked & checked', fakeAsync(() => {
            expect(checkboxInstance.checked).toBe(true);
            expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');
            expect(inputElement.checked).toBe(true);
            inputElement.click();
            fixture.detectChanges();
            // expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked'); // TODO FIX
            // expect(inputElement.checked).toBe(false);
            // groupedOntologies[0].classes.forEach(item => {
            //     expect(item.isChecked).withContext(`${item.id}.isChecked should be falsy`).toBeFalsy();
            // });
            //@todo fix
            // expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({action: SidePanelAction.ONTOLOGY_UNCHECKED, controlRecord: singleControlRecord});
            // inputElement.click();
            // fixture.detectChanges();
            // expect(checkboxInstance.checked).toBe(true);
            // expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');
            // // groupedOntologies[0].classes.forEach(item => {
            // //     expect(item.isChecked).toBeTruthy();
            // // });
            // expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({ action: SidePanelAction.ONTOLOGY_UNCHECKED, controlRecord: singleControlRecord });
            // flush();
        }));
    });
    describe('ontology class emit a value', () => {
        beforeEach(() => {
            component.ngOnChanges({commitId: new SimpleChange(undefined, 'commitId1', true)});
            fixture.detectChanges();
        });
        it('on click', async () => {
            spyOn(component,'beforePanelOpened');
            const panel = fixture.debugElement.query(By.directive(MatExpansionPanel));
            await fixture.whenStable();
            await fixture.detectChanges();
            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(1);
            await panel.componentInstance.open();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(component.sidebarState.selectedOntologyId).toBe('ont1');
            //flush();
        });
    });
});
