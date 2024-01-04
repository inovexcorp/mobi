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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DCTERMS } from '../../../prefixes';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { User } from '../../../shared/models/user.interface';
import { RecordFiltersComponent } from './recordFilters.component';

describe('Record Filters component', function() {
    let component: RecordFiltersComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordFiltersComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;

    const catalogId = 'catalogId';
    const keyword = 'keyword1';
    const user: User = {
      iri: 'urn:userA',
      username: 'userA',
      firstName: 'Joe',
      lastName: 'Davis'
    };
    const keywordObject = function(keyword, count): KeywordCount {
        return { ['http://mobi.com/ontologies/catalog#keyword']: keyword, 'count': count };
    };
    const totalSize = 10;
    const headers = {'x-total-count': '' + totalSize};
    const records: JSONLDObject[] = [{
      '@id': 'record1',
      [`${DCTERMS}publisher`]: [{'@id': user.iri}]
    }];
    const keywords = [keywordObject(keyword, 6)];
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatExpansionModule,
                MatCheckboxModule
             ],
            declarations: [
                RecordFiltersComponent,
                MockComponent(SearchBarComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(CatalogStateService),
                MockProvider(UserManagerService),
                MockProvider(ToastService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RecordFiltersComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;

        catalogManagerStub.recordTypes = ['test1', 'test2'];
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: records, headers: new HttpHeaders(headers)})));
        catalogManagerStub.getKeywords.and.returnValue(of(new HttpResponse<KeywordCount[]>({body: keywords, headers: new HttpHeaders(headers)})));
        
        userManagerStub.users = [user];
        userManagerStub.getUserDisplay.and.callFake(user => user.username);
        userManagerStub.filterUsers.and.callFake((users) => users);

        component.catalogId = catalogId;
        component.recordType = 'test1';
        component.keywordFilterList = [keyword];
        component.creatorFilterList = [user.iri];
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
        it('with creatorFilter', function() {
          const creatorFilter = component.filters[1];
          const expectedFilterItems = [
              {value: { user, count: 1 }, checked: true},
          ];
          expect(creatorFilter.title).toEqual('Creators');
          expect(creatorFilter.filterItems).toEqual(expectedFilterItems);
      });
        it('with keywordsFilter', function() {
            const keywordsFilter = component.filters[2];
            const expectedFilterItems = [
                {value: keywordObject(keyword, 6), checked: true}
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

            this.firstCreatorFilterItem = {value: {user, count: 1}, checked: true};
            this.secondCreatorFilterItem = {value: {user: {iri: 'urn:userB', username: 'userB', firstName: 'Jane', lastName: 'Davis'}, count: 10}, checked: true};
            this.creatorTypeFilter = component.filters[1];
            this.creatorTypeFilter.filterItems = [this.firstCreatorFilterItem, this.secondCreatorFilterItem];

            this.firstKeywordFilterItem = {value: keywordObject(keyword, 6), checked: true};
            this.secondKeywordFilterItem = {value: keywordObject('keyword2', 7), checked: true};
            this.keywordsFilter = component.filters[2];
            this.keywordsFilter.filterItems = [this.firstKeywordFilterItem, this.secondKeywordFilterItem];
            spyOn(component.changeFilter, 'emit');
        });
        describe('recordTypeFilter should filter records', function() {
            it('if the filter has been checked', function() {
                this.recordTypeFilter.filter(this.firstRecordFilterItem);
                expect(this.secondRecordFilterItem.checked).toEqual(false);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: this.firstRecordFilterItem.value, keywordFilterList: [keyword], creatorFilterList: [user.iri]});
            });
            it('if the filter has been unchecked', function() {
                this.firstRecordFilterItem.checked = false;
                component.recordType = this.firstRecordFilterItem.value;
                this.recordTypeFilter.filter(this.firstRecordFilterItem);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: '', keywordFilterList: [keyword], creatorFilterList: [user.iri]});
            });
        });
        it('recordTypeFilter filter text method returns correctly', function() {
            expect(this.recordTypeFilter.getItemText(this.firstRecordFilterItem)).toEqual('Test 1');
        });
        describe('creatorTypeFilter should filter records', function() {
          it('if the filter has been checked', function() {
              this.creatorTypeFilter.filter(this.firstCreatorFilterItem);
              expect(this.secondCreatorFilterItem.checked).toEqual(true);
              expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: 'test1', keywordFilterList: [keyword], creatorFilterList: [user.iri, 'urn:userB']});
          });
          it('if the filter has been unchecked', function() {
              this.firstCreatorFilterItem.checked = false;
              component.creatorFilterList = [];
              this.creatorTypeFilter.filter(this.firstRecordFilterItem);
              expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: 'test1', keywordFilterList: [keyword], creatorFilterList: ['urn:userB']});
          });
      });
      it('creatorTypeFilter filter text method returns correctly', function() {
          expect(this.creatorTypeFilter.getItemText(this.firstCreatorFilterItem)).toEqual('userA (1)');
      });
        describe('keywordsFilter should filter records', function() {
            it('if the keyword filter has been checked', function() {
                this.keywordsFilter.filter(this.firstFilter);
                expect(this.secondKeywordFilterItem.checked).toEqual(true);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: 'test1', keywordFilterList: [ keyword, 'keyword2' ], creatorFilterList: [user.iri]});
            });
            it('if the keyword filter has been unchecked', function() {
                this.firstKeywordFilterItem.checked = false;
                component.keywordFilterList = [];
                this.keywordsFilter.filter(this.firstKeywordFilterItem);
                expect(component.changeFilter.emit).toHaveBeenCalledWith({recordType: 'test1', keywordFilterList: [ 'keyword2' ], creatorFilterList: [user.iri]});
            });
        });
        it('keywordsFilter filter text method returns correctly', function() {
            expect(this.keywordsFilter.getItemText(this.firstKeywordFilterItem)).toEqual(`${keyword} (6)`);
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
            const expectedHtmlResults = [[ 'Record Type', 'Test 1,Test 2', 0, 0 ], [ 'Creators', `${user.username} (1)`, 1, 0 ], [ 'Keywords', `${keyword} (6)`, 1, 1 ]];
            expect(this.getHtmlResults(this)).toEqual(expectedHtmlResults);
        });
    });
});
