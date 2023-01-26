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
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';

import * as YATE from 'perfectkb-yate';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { YateComponent } from './yate.component';

describe('Yate component', function() {
    let component: YateComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<YateComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
            ],
            declarations: [
                YateComponent
            ],
            providers: [
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(YateComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize the yate editor with content', function() {
        it('successfully', fakeAsync(function() {
            component.content = 'content to display';
            fixture.autoDetectChanges();
            fixture.whenStable();
            jasmine.createSpy(YATE.getPrefixesFromDocument).and.returnValue(Promise.resolve());
            const nativeEle = fixture.elementRef.nativeElement.querySelectorAll('.yate');

            expect(nativeEle.length).toEqual(1);
            flush();
        }));
    });
});
