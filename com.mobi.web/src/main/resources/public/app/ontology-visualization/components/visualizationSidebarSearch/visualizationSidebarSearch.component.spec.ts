/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { SimpleChange } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { fakeAsync, TestBed, ComponentFixture } from '@angular/core/testing';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

import { VisualizationSidebarSearch } from './visualizationSidebarSearch.component';
import { ControlRecordUtilsService } from '../../services/controlRecordUtils.service';
import { GraphState } from '../../classes';
import { MatSelectModule } from '@angular/material/select';

describe('VisualizationSidebarSearch component', () => {
    let component: VisualizationSidebarSearch;
    let fixture: ComponentFixture<VisualizationSidebarSearch>;

    let graphStateStub: jasmine.SpyObj<GraphState>;
    let controlRecordUtilsService: ControlRecordUtilsService;
    let controlRecordUtilsServiceStub: Partial<ControlRecordUtilsService>;

    beforeEach(async () => {
        controlRecordUtilsServiceStub = {
            emitGraphData: jasmine.createSpy(),
            getControlRecordSearch: jasmine.createSpy()
        };
        graphStateStub = jasmine.createSpyObj('GraphState', {}, {
            searchForm: undefined, 
            nodeLimit: 100
        });
        await TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatCheckboxModule,
                MatFormFieldModule,
                MatOptionModule,
                MatSelectModule
            ],
            declarations: [
                VisualizationSidebarSearch,
            ],
            providers: [ 
                { provide: ControlRecordUtilsService, useValue: controlRecordUtilsServiceStub } 
            ]
        }).compileComponents();
        controlRecordUtilsService = TestBed.inject(ControlRecordUtilsService);
        fixture = TestBed.createComponent(VisualizationSidebarSearch);
        component = fixture.componentInstance;
        component.graphState = graphStateStub;
    });
    afterEach(() => {
        fixture = undefined;
        component = undefined;
        controlRecordUtilsServiceStub = undefined;
        controlRecordUtilsService = undefined;
        graphStateStub = undefined;
    });
    it('component to be defined', fakeAsync(() => {
        expect(fixture).toBeDefined();
        expect(component).toBeDefined();
        expect(controlRecordUtilsServiceStub).toBeDefined();
        expect(controlRecordUtilsService).toBeDefined();
        expect(graphStateStub).toBeDefined();
    }));
    describe('component html ', () => {
        describe('searchForm ', () => {
            it('default', (() => {
                const searchTextEl = fixture.debugElement.query(By.css('input.search-menu'));
                component.ngOnChanges({graphState: new SimpleChange(undefined, graphStateStub, true)});
                fixture.detectChanges();
                expect(searchTextEl.nativeElement.value).toEqual('');
                // expect(fixture.debugElement.query(By.css('mat-select')).nativeElement.value).toEqual('All'); // TODO
                component.searchForm.patchValue({'searchText': 'searchText1'});
                fixture.detectChanges();
                expect(searchTextEl.nativeElement.value).toEqual('searchText1');
            }));
        });
    });
    describe('component lifecycle should initialize with the right values', () => {
        it('ngOnChanges', fakeAsync(() => {
            component.graphState = jasmine.createSpyObj('GraphState', {}, {
                searchForm: undefined, 
                nodeLimit: 100
            });
            expect(component.limit).toEqual(0);
            component.ngOnChanges({graphState: new SimpleChange(undefined, graphStateStub, true)});
            expect(component.searchForm.valid).withContext('searchForm to be valid').toBeTruthy();
            expect(component.limit).toEqual(100);
        }));
        it('searchForm', fakeAsync(() => {
            component.ngOnChanges({graphState: new SimpleChange(undefined, graphStateStub, true)});
            expect(component.searchForm.valid).withContext('searchForm to be valid').toBeTruthy();
            component.searchForm.patchValue({});
            expect(component.searchForm.valid).withContext('searchForm to be invalid').toBeTruthy();
        }));
    });
    describe('component methods ', () => {
        describe('searchRecords ', () => {
            it('successfully', fakeAsync(() => {
                component.ngOnChanges({graphState: new SimpleChange(undefined, graphStateStub, true)});
                component.searchRecords();
                expect(controlRecordUtilsServiceStub.getControlRecordSearch).toHaveBeenCalledWith({ searchText: '', importOption: 'all' }, 100);
                expect(controlRecordUtilsServiceStub.emitGraphData).toHaveBeenCalled();
            }));
        });
        describe('loadMoreRecords ', () => {
            it('successfully', fakeAsync(() => {
                spyOn(component, 'searchRecords');
                component.ngOnChanges({graphState: new SimpleChange(undefined, graphStateStub, true)});
                expect(component.limit).toEqual(100);
                component.loadMoreRecords();
                expect(component.limit).toEqual(200);
                expect(component.searchRecords).toHaveBeenCalled();
            }));
        });
    });
});
