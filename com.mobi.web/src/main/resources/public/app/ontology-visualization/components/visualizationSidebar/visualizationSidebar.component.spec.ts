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
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { fakeAsync, TestBed, ComponentFixture, flush } from '@angular/core/testing';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';

import {Observable, Subject} from 'rxjs';
import { MockComponent } from 'ng-mocks';

import { OntologyVisualizationService } from '../../services/ontologyVisualizaton.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { SpinnerComponent } from '../../../shared/components/progress-spinner/components/spinner/spinner.component';
import { MockOntologyVisualizationService } from '../../../../../public/test/ts/Shared';
import { VisualizationSidebar } from './visualizationSidebar.component';
import {
    ControlRecordI,
    ControlRecordSearchI,
    ControlRecordSearchResultI,
    ControlRecordType,
    SidePanelAction
} from '../../interfaces/visualization.interfaces';

describe('Visualization sidebar component', () => {
    let component: VisualizationSidebar;
    let element: DebugElement;
    let fixture: ComponentFixture<VisualizationSidebar>;
    let serviceStub: OntologyVisualizationService;
    let controlRecords: ControlRecordI[];
    let localNodeLimit;
    let subject;
    let groupedOntologies;
    
    beforeEach(async () =>  {
        await TestBed.configureTestingModule({
            declarations: [
                VisualizationSidebar,
                MockComponent(SpinnerComponent),
                MockComponent(InfoMessageComponent)
            ],
            imports: [
                FormsModule,
                ReactiveFormsModule,
                BrowserAnimationsModule,
                MatSelectModule,
                MatExpansionModule
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
                id: 'record1', name: 'label1', ontologyId: 'ont1', isImported: false, onGraph: true
            },
            {
                type: ControlRecordType.NODE,
                id: 'record2', name: 'label2', ontologyId: 'ont2', isImported: false, onGraph: false
            }
        ];
        groupedOntologies =  [{
            'ontologyId': 'ont1',
            'classes': [
                {
                    type: ControlRecordType.NODE,
                    id: 'record1', name: 'label1', ontologyId: 'ont1', isImported: false, onGraph: true
                },
                {
                    type: ControlRecordType.NODE,
                    id: 'record2', name: 'label2', ontologyId: 'ont2', isImported: false, onGraph: false
                }
            ]
        }];
        component.graphState = jasmine.createSpyObj('graphState', ['emitGraphData', 'getControlRecordSearch'], { 
            nodeLimit: localNodeLimit,
            controlRecordObservable$: new Observable<ControlRecordSearchResultI>(subscriber => {
                subscriber.next({
                    limit: 500,
                    count: 1,
                    records: groupedOntologies
                });
            })
        });
        element = fixture.debugElement;
        serviceStub = TestBed.inject(OntologyVisualizationService) as jasmine.SpyObj<OntologyVisualizationService>;
        serviceStub.getGraphState = jasmine.createSpy('getGraphState').and.returnValue(component.graphState);
        serviceStub.getSidebarState = jasmine.createSpy('getSidebarState').and.returnValue({
            commitId: 'commitId1',
            recordId: 'recordId1'
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
            component.ngOnInit();
            expect(serviceStub.getGraphState).toHaveBeenCalledWith('commitId1');
            expect(serviceStub.getSidebarState).toHaveBeenCalledWith('commitId1');
        }));
    });
    describe('component onToggledClick method', () => {
        it('toggles correctly', () => {
            expect(component.toggled).toEqual(true);
            component.onToggledClick();
            expect(component.toggled).toEqual(false);
            component.onToggledClick();
            expect(component.toggled).toEqual(true);
        });
    });
    describe('component onClickRecordSelect method', () => {
        it('emits correctly', fakeAsync(() => {
            component.onClickRecordSelect(controlRecords[0]);
            expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({action: SidePanelAction.RECORD_SELECT, controlRecord: controlRecords[0]});
            expect(serviceStub.emitSelectAction).toHaveBeenCalledWith({ action: SidePanelAction.RECORD_SELECT, nodeId: controlRecords[0].id});
        }));
    });
    describe('component onRightClickRecordSelect method', () => {
        it('emits correctly', fakeAsync(() => {
            const event = jasmine.createSpyObj('event', ['preventDefault']);
            component.onRightClickRecordSelect(event, controlRecords[0]);
            expect(serviceStub.emitSidePanelAction).toHaveBeenCalledWith({action: SidePanelAction.RECORD_CENTER, controlRecord: controlRecords[0]});
            expect(event.preventDefault).toHaveBeenCalled();
        }));
    });

    describe('component searchRecords method', () => {
        it('emits emitGraphData correctly', () => {
            const controlRecordSearch: ControlRecordSearchI = { 
                name: 'searchText1',
                isImported: false
            };
            component.commitId = 'commitId124';
            component.searchForm.patchValue({'searchText': 'searchText1', 'importOption': 'local'});
            component.graphState.getControlRecordSearch = () => controlRecordSearch;
            component.searchRecords();
            expect(component.graphState.emitGraphData).toHaveBeenCalledWith(controlRecordSearch);
        });
        it('with limit emits emitGraphData correctly', () => {
            const controlRecordSearch: ControlRecordSearchI = { 
                name: 'searchText1',
                limit: localNodeLimit + 1,
                isImported: true
            };
            component.commitId = 'commitId124';
            component.searchForm.get('searchText').setValue('searchText1');
            component.searchForm.get('importOption').setValue('imported');
            component.graphState.getControlRecordSearch = () => controlRecordSearch;
            component.searchRecords(1);
            expect(component.graphState.emitGraphData).toHaveBeenCalledWith(controlRecordSearch);
        });
    });
    describe('contains the correct html', () => {
        beforeEach(() => {
            component.ngOnInit();
            fixture.detectChanges(); // initial binding
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
    it('ontology class emit a value on click', fakeAsync(() => {
        // trigger the click
        fixture.detectChanges();
        const panel = fixture.debugElement.nativeElement.querySelector('mat-expansion-panel-header');
        fixture.detectChanges();
        expect(panel).toBeTruthy();
        panel.click();
        flush();
        fixture.detectChanges();
        expect(component.sidebarState.selectedOntologyId).toBe('ont1');
    }));
});
