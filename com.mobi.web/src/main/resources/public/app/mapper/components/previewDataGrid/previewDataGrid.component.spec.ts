/*-
 * #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GridJsAngularComponent } from 'gridjs-angular';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { PreviewDataGridComponent } from './previewDataGrid.component';

describe('Preview Data Grid component', function() {
    let component: PreviewDataGridComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreviewDataGridComponent>;

    const rows = [['A'], ['data1'], ['data2']];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PreviewDataGridComponent,
                MockComponent(GridJsAngularComponent),
                MockComponent(InfoMessageComponent)
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PreviewDataGridComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('should initialize correctly if', function() {
        spyOn(component, 'setGridConfig');
        component.rows = rows;
        component.ngOnInit();
        expect(component.setGridConfig).toHaveBeenCalledWith(rows, component.containsHeaders);
    });
    describe('should handle updates to', function() {
        beforeEach(function() {
            spyOn(component, 'setGridConfig');
        });
        it('rows', function() {
            component.containsHeaders = true;
            const change = new SimpleChange(null, rows, false);
            component.ngOnChanges({rows: change});
            expect(component.setGridConfig).toHaveBeenCalledWith(rows, true);
        });
        it('containsHeaders', function() {
            component.rows = [];
            const change = new SimpleChange(null, true, false);
            component.ngOnChanges({containsHeaders: change});
            expect(component.setGridConfig).toHaveBeenCalledWith([], true);
        });
        it('highlightIndexes', function() {
            component.rows = [];
            component.containsHeaders = true;
            const change = new SimpleChange(null, [], false);
            component.ngOnChanges({highlightIndexes: change});
            expect(component.setGridConfig).toHaveBeenCalledWith([], true);
        });
    });
    describe('controller method', function() {
        describe('should set the grid config', function() {
            beforeEach(function() {
                spyOn(component, 'createColumns').and.callFake(a => a);
            });
            describe('if there is data', function() {
                it('the data has headers', function() {
                    component.setGridConfig(rows, true);
                    expect(component.gridConfig).toEqual({
                        columns: ['A'],
                        data: [['data1'], ['data2']]
                    });
                    expect(component.createColumns).toHaveBeenCalledWith(['A']);
                });
                it('the data does not have headers', function() {
                    component.setGridConfig(rows, false);
                    expect(component.gridConfig).toEqual({
                        columns: ['Column 0'],
                        data: [['A'], ['data1'], ['data2']]
                    });
                    expect(component.createColumns).toHaveBeenCalledWith(['Column 0']);
                });
            });
            it('if there is no data', function() {
                component.setGridConfig(undefined, true);
                expect(component.gridConfig).toEqual({
                    data: ['', '', '', '', '', '', '', '', '', '']
                });
                expect(component.createColumns).not.toHaveBeenCalled();
                component.setGridConfig([], true);
                expect(component.gridConfig).toEqual({
                    data: ['', '', '', '', '', '', '', '', '', '']
                });
                expect(component.createColumns).not.toHaveBeenCalled();
            });
        });
        describe('should create columns for the grid config', function() {
            it('if there are highlight indexes', function() {
                component.highlightIndexes = ['0'];
                expect(component.createColumns(['A', 'B'])).toEqual([
                    { name: 'A', attributes: jasmine.any(Function) },
                    { name: 'B' },
                ]);
            });
            it('if there are no highlight indexes', function() {
                expect(component.createColumns([''])).toEqual(['']);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.preview-data-grid')).length).toEqual(1);
        });
        it('with a grid', function() {
            fixture.detectChanges();
            component.displayGrid = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('gridjs-angular')).length).toEqual(1);
        });
    });
});
