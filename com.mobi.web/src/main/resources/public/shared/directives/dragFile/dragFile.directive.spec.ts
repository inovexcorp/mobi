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
/* eslint-disable no-cond-assign */
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { DragFileDirective } from './dragFile.directive';

// TODO: The component decorator is causing this error. Circle back later
/* Error: Module build failed: Module failed because of a eslint error.
  
  /Users/meganmercer/matonto/com.mobi.web/src/main/resources/public/shared/directives/dragFile/dragFile.directive.spec.ts
    5:63  error  Expected a conditional expression and instead saw an assignment  no-cond-assign */
// @Component({
//     template: `<div dragFile="files" (fileDropped)="fileDropped($event)"></div>`
// })
// class TestComponent {
//     files = [];

//     fileDropped(files: FileList) {
//         if (files) {
//             this.files = Array.from(files);
//         }
//     }
// }

describe('Drag File directive', function() {
    // let component: TestComponent;
    // let element: DebugElement;
    // let fixture: ComponentFixture<TestComponent>;

    // configureTestSuite(function() {
    //     TestBed.configureTestingModule({
    //         declarations: [
    //             TestComponent,
    //             DragFileDirective
    //         ]
    //     });
    // });

    // beforeEach(function() {
    //     fixture = TestBed.createComponent(TestComponent);
    //     component = fixture.componentInstance;
    //     element = fixture.debugElement;
    // });

    // beforeEach(function helpers() {
    //     this.createEvent = function(type) {
    //         const event = new Event(type);
    //         spyOn(event, 'preventDefault').and.callThrough();
    //         spyOn(event, 'stopPropagation').and.callThrough();
    //         return event;
    //     };
    // });

    // afterEach(function() {
    //     cleanStylesFromDOM();
    //     component = null;
    //     element = null;
    //     fixture = null;
    // });

    // it('adds the correct html', function() {
    //     expect(element.classes['test-drag-file']).toBeTruthy();
    //     expect(element.classes['drag-file-container']).toBeTruthy();
    //     const hoverArea = element.queryAll(By.css('.drag-file'));
    //     expect(hoverArea.length).toBe(1);
    //     expect(hoverArea[0].classes['fade-out']).toBeTruthy();
    //     expect(element.queryAll(By.css('.drag-file-info')).length).toBe(1);
    //     expect(element.queryAll(By.css('.fa-cloud-upload')).length).toBe(1);
    // });
    // it('dragover should call correct method', function() {
    //     const event = this.createEvent('dragover');
    //     element.triggerEventHandler('dragover', event);
    //     expect(event.preventDefault).toHaveBeenCalledWith();
    //     expect(event.stopPropagation).toHaveBeenCalledWith();
    //     const hoverArea = element.queryAll(By.css('.drag-file'));
    //     expect(hoverArea.length).toBe(1);
    //     expect(hoverArea[0].classes['fade-out']).toBeFalsy();
    //     expect(hoverArea[0].classes['fade-in']).toBeTruthy();
    // });
    // it('drop should remove class and call correct methods', function() {
    //     this.compile();
    //     var event = this.createEvent('drop');
    //     event.dataTransfer = { files: [{}] };
    //     element.addClass('hover');
    //     element.triggerHandler(event);
    //     expect(event.preventDefault).toHaveBeenCalled();
    //     expect(element.hasClass('hover')).toBe(false);
    //     expect(scope.files).toEqual([{}]);
    //     expect(scope.onDrop).toHaveBeenCalled();
    // });
    // it('dragleave should remove the hover class', function() {
    //     element.classes['fade-in'];
    //     const event = this.createEvent('dragleave');
    //     element.triggerHandler('dragleave');
    //     expect(element.hasClass('hover')).toBe(false);
    // });
});
