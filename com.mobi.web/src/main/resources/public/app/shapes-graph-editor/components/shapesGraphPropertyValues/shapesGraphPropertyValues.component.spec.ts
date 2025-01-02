/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
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
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MockComponent } from 'ng-mocks';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ValueDisplayComponent } from '../../../shared/components/valueDisplay/valueDisplay.component';
import { ShapesGraphPropertyValuesComponent } from './shapesGraphPropertyValues.component';

describe('Shapes Graph Property Values component', function() {
    let component: ShapesGraphPropertyValuesComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphPropertyValuesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ShapesGraphPropertyValuesComponent,
                MockComponent(ValueDisplayComponent),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ShapesGraphPropertyValuesComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.entity = {'@id': 'shapesGraph', 'prop': [{'@id': 'value1'}, {'@id': '_:genid0'}]};
        component.property = 'prop';

        fixture.detectChanges();
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('sets the property display correctly', function() {
        expect(component.propertyDisplay).toEqual('Prop');
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.shapes-graph-property-values')).length).toEqual(1);
            expect(element.queryAll(By.css('.prop-header')).length).toEqual(1);
        });
        it('based on the number of values', function() {
            const values = element.queryAll(By.css('.prop-value-container'));
            expect(values.length).toEqual(2);
        });
    });
});
