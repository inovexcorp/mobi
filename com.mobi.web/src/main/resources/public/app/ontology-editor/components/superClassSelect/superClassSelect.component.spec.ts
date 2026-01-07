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

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { OntologyClassSelectComponent } from '../ontologyClassSelect/ontologyClassSelect.component';
import { SuperClassSelectComponent } from './superClassSelect.component';

describe('Super Class Select component', function() {
    let component: SuperClassSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SuperClassSelectComponent>;
    
    const classId = 'classId';
    const idObj: JSONLDId = {'@id': classId};
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatIconModule,
                MatButtonModule
            ],
            declarations: [
                SuperClassSelectComponent,
                MockComponent(OntologyClassSelectComponent)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SuperClassSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        spyOn(component.selectedChange, 'emit');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('should handle changes correctly', function() {
        component.selected = [idObj];
        component.ngOnChanges();
        expect(component.iris).toEqual([classId]);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.super-class-select')).length).toEqual(1);
        });
        it('for correct links', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.btn-show .fa-plus')).length).toEqual(1);
            expect(element.queryAll(By.css('.btn-hide .fa-times')).length).toEqual(0);

            component.isShown = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.btn-show .fa-plus')).length).toEqual(0);
            expect(element.queryAll(By.css('.btn-hide .fa-times')).length).toEqual(1);
        });
        it('with an ontology-class-select', function() {
            expect(element.queryAll(By.css('ontology-class-select')).length).toEqual(0);

            component.isShown = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('ontology-class-select')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            component.show();
            expect(component.isShown).toEqual(true);
        });
        it('hide sets the proper variables', function() {
            component.hide();
            expect(component.isShown).toEqual(false);
            expect(component.selected).toEqual([]);
            expect(component.iris).toEqual([]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
        });
        it('onChange handles changes to the iris list', function() {
            component.onChange([classId]);
            expect(component.iris).toEqual([classId]);
            expect(component.selected).toEqual([idObj]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([idObj]);
        });
    });
});
