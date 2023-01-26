
/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { LimitDescriptionComponent } from './limitDescription.component';

describe('Limit Description component', function() {
    let component: LimitDescriptionComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<LimitDescriptionComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                LimitDescriptionComponent
            ],
            providers: []
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(LimitDescriptionComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
   
        component.descriptionLimit = 10;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('should initialize correct on record change', function() {
        component.description = 'test';
        expect(component.full).toEqual(false);
        expect(component.display).toEqual('test');
    });
    describe('controller methods', function() {
        it('should toggle whether the full description should be shown', function() {
            const event = new MouseEvent('click');
            spyOn(event, 'stopPropagation');
            component.description = 'AAAAAAAAAAAAAAAAAAAA';
            component.full = true;
            component.toggleFull(event);
            expect(component.full).toEqual(false);
            expect(component.display).toEqual('AAAAAAA...');
            expect(event.stopPropagation).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('depending on whether there is a description', function() {
            component.description = '';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-description')).length).toEqual(1);
            expect(element.queryAll(By.css('.description')).length).toEqual(0);

            component.description = 'test';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.no-description')).length).toEqual(0);
            expect(element.queryAll(By.css('.description')).length).toEqual(1);
        });
    });
    it('should call toggleFull when the Show link is clicked', function() {
        component.description = 'AAAAAAAAAAAAAAAAAAAA';
        fixture.detectChanges();
        component.descriptionLimit = 10;
        fixture.detectChanges();
        spyOn(component, 'toggleFull');
        const event = new MouseEvent('click');
        const link = element.queryAll(By.css('.description a'))[0];
        link.triggerEventHandler('click', event);
        fixture.detectChanges();
        expect(component.toggleFull).toHaveBeenCalledWith(event);
    });
});
