/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { cleanStylesFromDOM } from "../../../../../../test/ts/Shared";
import { CustomLabelComponent } from "./customLabel.component";
import { By } from "@angular/platform-browser";

describe('Custom Label component', function() {
    let component: CustomLabelComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CustomLabelComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                CustomLabelComponent
            ],
            providers: [],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CustomLabelComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct value for', function() {
        it('mutedText', function() {
            expect(component.mutedText).toBeUndefined();
            component.mutedText = 'Muted';
            fixture.detectChanges();
            expect(component.mutedText).toEqual('Muted');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('label')).length).toEqual(1);
            expect(element.queryAll(By.css('.control-label')).length).toEqual(1);
        });
        it('with small text if there is muted text', function() {
            expect(element.queryAll(By.css('small')).length).toBe(0);
            component.mutedText = 'Muted';
            fixture.detectChanges();
            expect(element.queryAll(By.css('small')).length).toBe(1);
        });
    });
});