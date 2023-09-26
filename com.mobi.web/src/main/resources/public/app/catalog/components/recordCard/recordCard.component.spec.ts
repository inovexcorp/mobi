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
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockDirective } from 'ng-mocks';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CopyClipboardDirective } from '../../../shared/directives/copyClipboard/copyClipboard.directive';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DCTERMS } from '../../../prefixes';
import { CatalogRecordKeywordsComponent } from '../catalogRecordKeywords/catalogRecordKeywords.component';
import { EntityPublisherComponent } from '../entityPublisher/entityPublisher.component';
import { OpenRecordButtonComponent } from '../openRecordButton/openRecordButton.component';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { RecordTypeComponent } from '../recordType/recordType.component';
import { RecordCardComponent } from './recordCard.component';

describe('Record Card component', function() {
    let component: RecordCardComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordCardComponent>;

    const dateStr = '2020-01-01';
    const record: JSONLDObject = {
        '@id': '',
        '@type': [],
        [`${DCTERMS}title`]: [{ '@value': 'title' }],
        [`${DCTERMS}description`]: [{ '@value': 'description' }],
        [`${DCTERMS}modified`]: [{ '@value': dateStr }],
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatCardModule,
                MatTooltipModule,
                MatDividerModule,
            ],
            declarations: [
                RecordCardComponent,
                MockComponent(RecordIconComponent),
                MockComponent(RecordTypeComponent),
                MockComponent(CatalogRecordKeywordsComponent),
                MockComponent(EntityPublisherComponent),
                MockComponent(OpenRecordButtonComponent),
                MockDirective(CopyClipboardDirective)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RecordCardComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize', function() {
        it('with a title, description, and modified date', function() {
            component.record = record;
            component.ngOnInit();
            expect(component.title).toEqual('title');
            expect(component.description).toEqual('description');
            expect(component.modified.getTime()).toEqual(new Date(dateStr).getTime());
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-card')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-card-title')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-card-subtitle')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-card-content')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-card-actions')).length).toEqual(1);
        });
        ['record-icon', 'record-type', 'entity-publisher', 'catalog-record-keywords'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
    });
    it('should call clickCard when the card is clicked', function() {
        component.record = record;
        spyOn(component.clickCard, 'emit');
        const card = element.queryAll(By.css('mat-card'))[0];
        card.triggerEventHandler('click', null);
        expect(component.clickCard.emit).toHaveBeenCalledWith(record);
    });
});
