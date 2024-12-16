/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';

import { CatalogRecordKeywordsComponent } from '../catalogRecordKeywords/catalogRecordKeywords.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DCTERMS } from '../../../prefixes';
import { EntityPublisherComponent } from '../entityPublisher/entityPublisher.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OpenRecordButtonComponent } from '../openRecordButton/openRecordButton.component';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { RecordTypeComponent } from '../recordType/recordType.component';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordCardComponent } from './recordCard.component';

describe('Record Card component', function() {
    let component: RecordCardComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordCardComponent>;
    let nativeElement: HTMLElement;

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
                MatIconModule
            ],
            declarations: [
                RecordCardComponent,
                MockComponent(RecordIconComponent),
                MockComponent(RecordTypeComponent),
                MockComponent(CatalogRecordKeywordsComponent),
                MockComponent(EntityPublisherComponent),
                MockComponent(OpenRecordButtonComponent),
            ],
            providers: [
                MockProvider(ToastService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RecordCardComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        nativeElement = element.nativeElement as HTMLElement;
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
    it('should call viewRecord when the view button is clicked', function() {
        component.record = record;
        spyOn(component.viewRecord, 'emit');

        const button: HTMLElement = nativeElement.querySelector('.view-button');
        button.click();
        expect(component.viewRecord.emit).toHaveBeenCalledWith(record);
    });
});
