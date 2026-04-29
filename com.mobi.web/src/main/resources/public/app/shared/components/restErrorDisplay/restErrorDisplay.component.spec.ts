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
import { By } from '@angular/platform-browser';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../errorDisplay/errorDisplay.component';
import { RestErrorDisplayComponent } from './restErrorDisplay.component';

describe('Rest Error Display component', function() {
    let component: RestErrorDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RestErrorDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                RestErrorDisplayComponent,
                ErrorDisplayComponent
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RestErrorDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('should not show error-display when error is undefined', function() {
            component.error = undefined;
            fixture.detectChanges();
            expect(element.query(By.css('error-display'))).toBeNull();
        });

        it('should show error-display with message when error is set', function() {
            component.error = {error: 'IllegalArgumentException', errorMessage: 'Test error', errorDetails: []};
            fixture.detectChanges();
            expect(element.query(By.css('error-display'))).toBeDefined();
            expect(element.nativeElement.textContent).toContain('Test error');
        });

        it('should show error details when present', function() {
            component.error = {
                error: 'IllegalArgumentException',
                errorMessage: 'Test error',
                errorDetails: ['Detail 1', 'Detail 2']
            };
            fixture.detectChanges();
            const listItems = element.queryAll(By.css('li'));
            expect(listItems.length).toBe(2);
            expect(listItems[0].nativeElement.textContent).toContain('Detail 1');
            expect(listItems[1].nativeElement.textContent).toContain('Detail 2');
        });

        it('should not show list items when errorDetails is empty', function() {
            component.error = {error: 'IllegalArgumentException', errorMessage: 'Test error', errorDetails: []};
            fixture.detectChanges();
            const listItems = element.queryAll(By.css('li'));
            expect(listItems.length).toBe(0);
        });

        it('should not show error-display when error is null', function() {
            component.error = null;
            fixture.detectChanges();
            expect(element.query(By.css('error-display'))).toBeNull();
        });

        it('should show error-display with empty errorMessage', function() {
            component.error = {error: 'SomeError', errorMessage: '', errorDetails: []};
            fixture.detectChanges();
            // errorMessage is falsy so *ngIf="error && error.errorMessage && error.errorDetails" hides it
            expect(element.query(By.css('error-display'))).toBeNull();
        });

        it('should handle error with populated errorDetails', function() {
            component.error = {
                error: 'IllegalArgumentException',
                errorMessage: 'Validation failed',
                errorDetails: ['Detail 1', 'Detail 2', 'Detail 3']
            };
            fixture.detectChanges();
            const listItems = element.queryAll(By.css('li'));
            expect(listItems.length).toBe(3);
            expect(listItems[0].nativeElement.textContent).toContain('Detail 1');
            expect(listItems[1].nativeElement.textContent).toContain('Detail 2');
            expect(listItems[2].nativeElement.textContent).toContain('Detail 3');
        });

        it('should handle errorMessage with special characters', function() {
            component.error = {
                error: 'IllegalArgumentException',
                errorMessage: '<script>alert("xss")</script>',
                errorDetails: []
            };
            fixture.detectChanges();
            const errorDisplay = element.query(By.css('error-display'));
            expect(errorDisplay).toBeDefined();
            // Angular interpolation escapes HTML — verify text content contains the raw string
            expect(errorDisplay.nativeElement.textContent).toContain('<script>alert("xss")</script>');
            // Verify it was not rendered as actual HTML
            expect(errorDisplay.nativeElement.querySelector('script')).toBeNull();
        });

        it('should render full error with message, details wrapper, and styled items', function() {
            component.error = {
                error: 'IllegalArgumentException',
                errorMessage: 'Full error message',
                errorDetails: ['First detail', 'Second detail']
            };
            fixture.detectChanges();

            // Verify error-display wrapper is present
            const errorDisplay = element.query(By.css('error-display'));
            expect(errorDisplay).toBeDefined();

            // Verify message text is displayed
            expect(errorDisplay.nativeElement.textContent).toContain('Full error message');

            // Verify ul with li items for each detail
            const ul = element.query(By.css('ul'));
            expect(ul).toBeDefined();
            const listItems = element.queryAll(By.css('li'));
            expect(listItems.length).toBe(2);
            expect(listItems[0].nativeElement.textContent).toContain('First detail');
            expect(listItems[1].nativeElement.textContent).toContain('Second detail');

            // Verify li items have text-danger class
            listItems.forEach(item => {
                expect(item.nativeElement.classList).toContain('text-danger');
            });
        });
    });
});
