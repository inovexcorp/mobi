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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockUtil
} from '../../../../../../test/ts/Shared';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { RecordFiltersComponent } from './recordFilters.component';

describe('Record Filters component', function() {
    let component: RecordFiltersComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordFiltersComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

    const catalogId = 'catalogId';
    const keywordObject = function(keyword, count): KeywordCount {
        return { 'http://mobi.com/ontologies/catalog#keyword': keyword, 'count': count };
    };
    const totalSize = 10;
    const headers = {'x-total-count': '' + totalSize};
    
    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                RecordFiltersComponent
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(CatalogStateService),
                { provide: 'utilService', useClass: mockUtil },
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RecordFiltersComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.get(CatalogManagerService);

        this.records = [keywordObject('keyword1', 6)];

        catalogManagerStub.recordTypes = ['test1', 'test2'];
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
        catalogManagerStub.getKeywords.and.returnValue(of(new HttpResponse<KeywordCount[]>({body: this.records, headers: new HttpHeaders(headers)})));

        component.catalogId = catalogId;
        component.recordType = 'test1';
        component.keywordFilterList = ['keyword1'];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
    });

    describe('initializes correctly', function() {
        beforeEach(function() {
            component.ngOnInit();
        });
        it('with recordTypeFilter', function() {
            const recordTypeFilter = component.filters[0];
            const expectedFilterItems = [
                {value: 'test1', checked: true},
                {value: 'test2', checked: false}
            ];
            expect(recordTypeFilter.title).toEqual('Record Type');
            expect(recordTypeFilter.filterItems).toEqual(expectedFilterItems);
        });
        it('with keywordsFilter', function() {
            const keywordsFilter = component.filters[1];
            const expectedFilterItems = [
                {value: keywordObject('keyword1', 6), checked: true}
            ];
            expect(keywordsFilter.title).toEqual('Keywords');
            expect(keywordsFilter.filterItems).toEqual(expectedFilterItems);
        });
    });
    describe('filter methods', function() {
        beforeEach(function() {
            component.ngOnInit();
            this.firstRecordFilterItem = {value: 'test1', checked: true};
            this.secondRecordFilterItem = {value: 'test2', checked: true};
            this.recordTypeFilter = component.filters[0];
            this.recordTypeFilter.filterItems = [this.firstRecordFilterItem, this.secondRecordFilterItem];

            this.firstFilterItem = {value: keywordObject('keyword1', 6), checked: true};
            this.secondFilterItem = {value: keywordObject('keyword2', 7), checked: true};
            this.keywordsFilter = component.filters[1];
            this.keywordsFilter.filterItems = [this.firstFilterItem, this.secondFilterItem];
            spyOn(component.changeFilter, 'emit');
        });
        describe('recordTypeFilter should filter records', function() {
            it('if the filter has been checked', function() {
                this.recordTypeFilter.filter(this.firstRecordFilterItem);
                expect(this.secondRecordFilterItem.checked).toEqual(false);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: this.firstRecordFilterItem.value, keywordFilterList: ['keyword1']});
            });
            it('if the filter has been unchecked', function() {
                this.firstRecordFilterItem.checked = false;
                component.recordType = this.firstRecordFilterItem.value;
                this.recordTypeFilter.filter(this.firstRecordFilterItem);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: '', keywordFilterList: ['keyword1']});
            });
        });
        it('recordTypeFilter filter text method returns correctly', function() {
            expect(this.recordTypeFilter.getItemText(this.firstRecordFilterItem)).toEqual('test1');
        });
        describe('keywordsFilter should filter records', function() {
            it('if the keyword filter has been checked', function() {
                this.keywordsFilter.filter(this.firstFilter);
                expect(this.secondFilterItem.checked).toEqual(true);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: 'test1', keywordFilterList: [ 'keyword1', 'keyword2' ]});
            });
            it('if the keyword filter has been unchecked', function() {
                this.firstFilterItem.checked = false;
                component.keywordFilterList = [];
                this.keywordsFilter.filter(this.firstFilter);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: 'test1', keywordFilterList: [ 'keyword2' ]});
            });
        });
        it('keywordsFilter filter text method returns correctly', function() {
            expect(this.keywordsFilter.getItemText(this.firstFilterItem)).toEqual('keyword1 (6)');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.getHtmlResults = function() {
                return element.queryAll(By.css('div.record-filters mat-expansion-panel')).map(node => {
                    return [
                        node.queryAll(By.css('mat-panel-title'))[0].nativeElement.innerText,
                        node.queryAll(By.css('div.filter-options div.filter-option mat-checkbox')).map(node => node.nativeElement.innerText).join(','),
                        node.queryAll(By.css('search-bar')).length,
                        node.queryAll(By.css('a span')).length
                    ];
                });
            };
        });
        it('for wrapping containers', function() {
            component.ngOnInit();
            fixture.detectChanges();
            expect(element.queryAll(By.css('.record-filters')).length).toEqual(1);
            const expectedHtmlResults = [[ 'Record Type', 'test1,test2', 0, 0 ], [ 'Keywords', 'keyword1 (6)', 0, 1 ]];
            expect(this.getHtmlResults(this)).toEqual(expectedHtmlResults);
        });
    });
});
