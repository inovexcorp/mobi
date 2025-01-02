/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MockComponent } from 'ng-mocks';
import { ShowdownComponent } from 'ngx-showdown';
import { cloneDeep } from 'lodash';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { MarkdownEditorComponent } from '../../../shared/components/markdownEditor/markdownEditor.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DCTERMS } from '../../../prefixes';
import { RecordMarkdownComponent } from './recordMarkdown.component';

describe('Record Markdown component', function() {
    let component: RecordMarkdownComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordMarkdownComponent>;

    const recordId = 'recordId';
    const abstract = '#Test';
    const record: JSONLDObject = {
      '@id': recordId,
      '@type': [],
      [`${DCTERMS}abstract`]: [{ '@value': abstract }]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
            ],
            declarations: [
                RecordMarkdownComponent,
                MockComponent(ShowdownComponent),
                MockComponent(MarkdownEditorComponent)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RecordMarkdownComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('initializes correctly on record change', function() {
        component.record = record;
        expect(component.text).toEqual(abstract);
    });
    describe('controller methods', function() {
        describe('should show the markdown editor', function() {
            beforeEach(function() {
                component.record = record;
            });
            it('if the record can be edited', function() {
                component.canEdit = true;
                component.showEdit();
                expect(component.edit).toEqual(true);
                expect(component.editMarkdown).toEqual(abstract);
            });
            it('unless the record cannot be edited', function() {
                component.showEdit();
                expect(component.edit).toEqual(false);
                expect(component.editMarkdown).toEqual('');
            });
        });
        describe('should save the markdown edit', function() {
            beforeEach(function() {
                component.record = cloneDeep(record);
                component.edit = true;
                spyOn(component.updateRecord, 'emit');
            });
            describe('if the edited value is different than the original value', function() {
                it('if the new value is empty', function() {
                    const expectedRecord = cloneDeep(record);
                    delete expectedRecord[`${DCTERMS}abstract`];
                    component.editMarkdown = '';
                    component.saveEdit();
                    expect(component.updateRecord.emit).toHaveBeenCalledWith(expectedRecord);
                    expect(component.edit).toEqual(false);
                    expect(component.editMarkdown).toEqual('');
                });
                it('if the new value is not empty', function() {
                    const expectedRecord = cloneDeep(record);
                    expectedRecord[`${DCTERMS}abstract`] = [{ '@value': 'Test' }];
                    component.editMarkdown = 'Test';
                    component.saveEdit();
                    expect(component.updateRecord.emit).toHaveBeenCalledWith(expectedRecord);
                    expect(component.edit).toEqual(false);
                    expect(component.editMarkdown).toEqual('');
                });
            });
            it('unless the edited value is the same as the original value', function() {
                component.editMarkdown = abstract;
                component.saveEdit();
                expect(component.updateRecord.emit).not.toHaveBeenCalled();
                expect(component.edit).toEqual(false);
                expect(component.editMarkdown).toEqual('');
            });
        });
        it('should cancel the markdown edit', function() {
            component.cancelEdit();
            expect(component.edit).toEqual(false);
            expect(component.editMarkdown).toEqual('');
            expect(component.showPreview).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-markdown')).length).toEqual(1);
        });
        it('depending on whether the user can edit the record', function() {
            fixture.detectChanges();
            const div = element.queryAll(By.css('.view-record-markdown'))[0];
            expect(div.classes['hover-area']).toBeFalsy();

            component.canEdit = true;
            fixture.detectChanges();
            expect(div.classes['hover-area']).toBeTruthy();
        });
        it('depending on whether the markdown is being edited', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.view-record-markdown')).length).toEqual(1);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(0);

            component.edit = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.view-record-markdown')).length).toEqual(0);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(1);
        });
        it('depending on whether there is any markdown', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.view-record-markdown showdown')).length).toEqual(0);
            expect(element.queryAll(By.css('.view-record-markdown .text-muted')).length).toEqual(1);
            
            component.text = 'Test';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.view-record-markdown showdown')).length).toEqual(1);
            expect(element.queryAll(By.css('.view-record-markdown .text-muted')).length).toEqual(0);
        });
    });
    it('should call showEdit when the markdown display is clicked', function() {
        fixture.detectChanges();
        spyOn(component, 'showEdit');
        const div = element.queryAll(By.css('.view-record-markdown'))[0];
        div.triggerEventHandler('click', null);
        expect(component.showEdit).toHaveBeenCalledWith();
    });
});
