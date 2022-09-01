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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    mockUtil,
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { CATALOG } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { SharedModule } from '../../../shared/shared.module';
import { CatalogRecordKeywordsComponent } from './catalogRecordKeywords.component';

describe('Catalog Record Keywords component', function() {
    let component: CatalogRecordKeywordsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CatalogRecordKeywordsComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const keywords = [{'@value': 'B'}, {'@value': 'A'}];

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                CatalogRecordKeywordsComponent
            ],
            providers: [
                MockProvider(CatalogManagerService),
                { provide: 'utilService', useClass: mockUtil },
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CatalogRecordKeywordsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get('utilService');

        utilStub.getPropertyId.and.callFake((obj, propId) => {
            if (propId === CATALOG + 'catalog') {
                return catalogId;
            }
            return '';
        });
        this.record = {
            '@id': recordId,
            '@type': [],
            [CATALOG + 'keyword']: keywords
        };
        catalogManagerStub.getRecord.and.returnValue(of(this.record));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('initializes correctly on record change', function() {
        it('with keywords', function() {
            component.record = this.record;
            expect(component.keywords).toEqual(['A', 'B']);
        });
    });
    describe('controller methods', function() {
        it('saveChanges saves the edited keywords', function() {
            spyOn(component.saveEvent, 'emit');
            component.record = this.record;
            component.edit = true;
            component.addKeywordsForm.controls.keywords.setValue(['C', 'D', 'E']);
            component.saveChanges();
            expect(component.saveEvent.emit).toHaveBeenCalledWith({
                '@id': recordId,
                '@type': [],
                [CATALOG + 'keyword']: [{'@value': 'C'}, {'@value': 'D'}, {'@value': 'E'}]
            });
        });
        it('cancelChanges should cancel the keyword edit', function() {
            component.edit = true;
            component.keywords = ['A', 'B'];
            component.editedKeywords = ['C', 'D', 'E'];
            component.cancelChanges();
            expect(component.editedKeywords).toEqual(['A', 'B']);
            expect(component.edit).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.catalog-record-keywords')).length).toEqual(1);
        });
        it('depending on the number of keywords', function() {
            component.keywords = ['A', 'B'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-chip')).length).toEqual(2);
        });
        it('when user is editing', function() {
            component.canEdit = true;
            component.edit = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.keyword-editor')).length).toEqual(1);
            expect(element.queryAll(By.css('.fa-save')).length).toEqual(1);
        });
        it('should set edit to true when clicked', function() {
            component.canEdit = true;
            fixture.detectChanges();
            expect(component.edit).toEqual(false);
            const editableArea = element.queryAll(By.css('.static-area'))[0];
            editableArea.triggerEventHandler('click', null);
            fixture.detectChanges();
            expect(component.edit).toEqual(true);
        });
    });
});