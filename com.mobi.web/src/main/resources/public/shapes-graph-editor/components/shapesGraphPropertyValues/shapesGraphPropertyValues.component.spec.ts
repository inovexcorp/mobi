import { ShapesGraphPropertyValuesComponent } from "./shapesGraphPropertyValues.component";
import { cleanStylesFromDOM, mockUtil } from "../../../../../../test/ts/Shared";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { DebugElement } from "@angular/core";
import { MockComponent } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { ValueDisplayComponent } from "../../../shared/components/valueDisplay/valueDisplay.component";

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

describe('Shapes Graph Property Values component', function() {
    let component: ShapesGraphPropertyValuesComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphPropertyValuesComponent>;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                ShapesGraphPropertyValuesComponent,
                MockComponent(ValueDisplayComponent),
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphPropertyValuesComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get('utilService');

        component.entity = {'prop': [{'@id': 'value1'}, {'@id': '_:genid0'}]};
        component.property = 'prop';

        fixture.detectChanges();
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.shapes-graph-property-values')).length).toEqual(1);
            expect(element.queryAll(By.css('.prop-header')).length).toEqual(1);
        });
        it('based on the number of values', function() {
            var values = element.queryAll(By.css('.prop-value-container'));
            expect(values.length).toEqual(2);
        });
    });
});
