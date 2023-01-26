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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatMarkdownEditorComponent } from 'mat-markdown-editor';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { MarkdownEditorComponent } from './markdownEditor.component';

describe('Markdown Editor component', function() {
    let component: MarkdownEditorComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MarkdownEditorComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                MarkdownEditorComponent,
                MockComponent(MatMarkdownEditorComponent),
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MarkdownEditorComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize properly', function() {
        it('if a height was provided', function() {
            component.height = 100;
            component.ngOnInit();
            expect(component.markdownOptions.height).toEqual('100px');
        });
        it('if a height was not provided', function() {
            component.ngOnInit();
            expect(component.markdownOptions.height).toEqual('500px');
        });
    });
    describe('controller methods', function() {
        it('should save the markdown', function() {
            spyOn(component.saveEvent, 'emit');
            spyOn(component.markdownChange, 'emit');
            component.save();
            expect(component.saveEvent.emit).toHaveBeenCalledWith();
            expect(component.markdownChange.emit).toHaveBeenCalledWith(component.markdown);
        });
        it('should cancel the markdown editor', function() {
            spyOn(component.cancelEvent, 'emit');
            component.cancel();
            expect(component.cancelEvent.emit).toHaveBeenCalledWith();
        });
        it('should open a help URL in a new tab', function() {
            spyOn(window, 'open');
            component.openHelp();
            expect(window.open).toHaveBeenCalledWith(jasmine.any(String), '_blank');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.markdown-editor')).length).toEqual(1);
        });
        it('with a mat-markdown-editor', function() {
            expect(element.queryAll(By.css('mat-markdown-editor')).length).toEqual(1);
        });
        it('with a button to submit', function() {
            const button = element.queryAll(By.css('button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.nativeElement.innerHTML).toContain('Save');
        });
        it('with a button for help', function() {
            const button = element.queryAll(By.css('button.mat-icon-button'))[0];
            expect(button).not.toBeNull();
        });
        it('depending on whether the editor is cancellable', function() {
            expect(element.queryAll(By.css('button:not([color="primary"]):not(.mat-icon-button)')).length).toBe(0);
            
            component.cancellable = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('button:not([color="primary"]):not(.mat-icon-button)')).length).toBe(1);
        });
    });
    it('should call save when the button is clicked', function() {
        spyOn(component, 'save');
        const button = element.queryAll(By.css('button[color="primary"]'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.save).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        component.cancellable = true;
        fixture.detectChanges();
        spyOn(component, 'cancel');
        const button = element.queryAll(By.css('button:not([color="primary"]):not(.mat-icon-button)'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.cancel).toHaveBeenCalledWith();
    });
    it('should call openHelp when the button is clicked', function() {
        spyOn(component, 'openHelp');
        const button = element.queryAll(By.css('button.mat-icon-button'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(component.openHelp).toHaveBeenCalledWith();
    });
});
