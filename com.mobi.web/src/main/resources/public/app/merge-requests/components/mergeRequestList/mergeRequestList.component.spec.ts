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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, Subject } from 'rxjs';

import {
  cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { DCTERMS, USER } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { MergeRequestFilterComponent } from '../merge-request-filter/merge-request-filter.component';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { User } from '../../../shared/models/user.class';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { FiltersSelectedListComponent } from '../../../shared/components/filters-selected-list/filters-selected-list.component';
import { MergeRequestListComponent } from './mergeRequestList.component';

describe('Merge Request List component', function() {
  let component: MergeRequestListComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<MergeRequestListComponent>;
  let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
  let mergeRequestsManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const recordId = 'urn://test/record/record-A';
  const creatorUserId = 'urn://test/user/creator-user-1';
  const creatorUsername = 'creator';
  const creator: User = new User({
    '@id': creatorUserId,
    '@type': [`${USER}User`],
    [`${USER}username`]: [{ '@value': creatorUsername }],
    [`${USER}hasUserRole`]: [],
  });
  const requestStatusFilterItem: FilterItem = { value: 'open', display: 'Open', checked: true };
  const userFilterItem: FilterItem = {
    value: {
      user: creatorUserId
    },
    display: `${creatorUsername} (1)`,
    checked: true
  };
  const recordFilterItem: FilterItem = {
    value: { record: recordId },
    display: `${recordId} (19)`,
    checked: true
  };
  const request: MergeRequest = {
    title: '',
    recordIri: recordId,
    date: '',
    creator: creator,
    assignees: [],
    jsonld: {'@id': ''}
  };
  const sortOptions: SortOption[] = [
    {
      field: `${DCTERMS}issued`,
      asc: false,
      label: 'Issued (desc)'
    },
    {
      field: `${DCTERMS}issued`,
      asc: true,
      label: 'Issued (asc)'
    },
    {
      field: `${DCTERMS}title`,
      asc: false,
      label: 'Title (desc)'
    },
    {
      field: `${DCTERMS}title`,
      asc: true,
      label: 'Title (asc)'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        MatButtonModule,
        MatDividerModule,
        MatFormFieldModule,
        MatMenuModule,
        MatPaginatorModule,
        MatIconModule,
        MatSelectModule,
      ],
      declarations: [
        MergeRequestListComponent,
        MockComponent(InfoMessageComponent),
        MockComponent(RecordIconComponent),
        MockComponent(MergeRequestFilterComponent),
        MockComponent(SearchBarComponent),
        MockComponent(FiltersSelectedListComponent)
      ],
      providers: [
        MockProvider(MergeRequestsStateService),
        MockProvider(MergeRequestManagerService),
        MockProvider(ToastService),
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
          open: { afterClosed: () => of(true)}
        }) }
      ],
    }).compileComponents();
    
    fixture = TestBed.createComponent(MergeRequestListComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mergeRequestsManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
    mergeRequestsManagerStub.sortOptions = sortOptions;
    mergeRequestsStateStub.creators = [];
    mergeRequestsStateStub.assignees = [];
    mergeRequestsStateStub.records = [];
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    mergeRequestsStateStub = null;
    mergeRequestsManagerStub = null;
    matDialog = null;
  });

  describe('initializes correctly', function() {
    beforeEach(function() {
      mergeRequestsStateStub.requestSearchText = 'test';
      spyOn(component, 'loadRequests');
    });
    it('if a sort option is set', function() {
      mergeRequestsStateStub.requestSortOption = sortOptions[1];
      component.ngOnInit();
      expect(mergeRequestsStateStub.requestSortOption).toEqual(sortOptions[1]);
      expect(component.searchText).toEqual('test');
      expect(component.loadRequests).toHaveBeenCalledWith();
    });
    it('if no sort option is set', function() {
      component.ngOnInit();
      expect(mergeRequestsStateStub.requestSortOption).toEqual(sortOptions[0]);
      expect(component.searchText).toEqual('test');
      expect(component.loadRequests).toHaveBeenCalledWith();
    });
    it('with the currently selected request filters', () => {
      mergeRequestsStateStub.requestStatus = requestStatusFilterItem;
      mergeRequestsStateStub.creators = [userFilterItem];
      mergeRequestsStateStub.assignees = [userFilterItem];
      mergeRequestsStateStub.records = [recordFilterItem];
      component.ngOnInit();
      expect(component.selectedFilters).toEqual({
        creators: [userFilterItem],
        assignees: [userFilterItem],
        records: [recordFilterItem]
      });
    });
  });
  describe('controller methods', function() {
    it('should handle changing a filter', function() {
      spyOn(component, 'loadRequests');
      mergeRequestsStateStub.currentRequestPage = 1;
      component.changeFilter({
        requestStatus: requestStatusFilterItem, 
        creators: [userFilterItem],
        assignees: [userFilterItem],
        records: [recordFilterItem]
      });
      expect(mergeRequestsStateStub.requestStatus).toBe(requestStatusFilterItem);
      expect(mergeRequestsStateStub.creators).toEqual([{
        value: { user: creatorUserId },
        display: creatorUsername,
        checked: true
      }]);
      expect(mergeRequestsStateStub.assignees).toEqual([{
        value: { user: creatorUserId },
        display: creatorUsername,
        checked: true
      }]);
      expect(mergeRequestsStateStub.records).toEqual([{
        value: { record: recordId },
        display: recordId,
        checked: true
      }]);
      expect(mergeRequestsStateStub.currentRequestPage).toEqual(0);
      expect(component.loadRequests).toHaveBeenCalledWith();
    });
    it('should handle submitting search text', function() {
      spyOn(component, 'loadRequests');
      component.searchText = 'test';
      mergeRequestsStateStub.currentRequestPage = 1;
      component.searchRequests();
      expect(mergeRequestsStateStub.requestSearchText).toEqual('test');
      expect(mergeRequestsStateStub.currentRequestPage).toEqual(0);
      expect(component.loadRequests).toHaveBeenCalledWith();
    });
    it('should handle changing the page', function() {
      spyOn(component, 'loadRequests');
      const event = new PageEvent();
      event.pageIndex = 10;
      component.changePage(event);
      expect(mergeRequestsStateStub.currentRequestPage).toEqual(10);
      expect(component.loadRequests).toHaveBeenCalledWith();
    });
    it('should load requests', function() {
      mergeRequestsStateStub.requestStatus = requestStatusFilterItem;
      mergeRequestsStateStub.creators = [userFilterItem];
      mergeRequestsStateStub.assignees = [userFilterItem];
      mergeRequestsStateStub.records = [recordFilterItem];
      component.loadRequests();
      expect(mergeRequestsStateStub.setRequests).toHaveBeenCalledWith({
        pageIndex: mergeRequestsStateStub.currentRequestPage,
        limit: mergeRequestsStateStub.requestLimit,
        sortOption: mergeRequestsStateStub.requestSortOption,
        requestStatus: requestStatusFilterItem.value,
        searchText: mergeRequestsStateStub.requestSearchText,
        creators: [creatorUserId],
        assignees: [creatorUserId],
        records: [recordId]
      }, jasmine.any(Subject));
    });
    it('should show the delete confirmation overlay', fakeAsync(function() {
      spyOn(component, 'loadRequests');
      spyOn(component.reloadFiltersSubject, 'next');
      component.selectedFilters = {
        creators: [userFilterItem],
        assignees: [userFilterItem],
        records: [recordFilterItem]
      };
      mergeRequestsStateStub.deleteRequest.and.returnValue(of(null));
      component.showDeleteOverlay(request);
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
      expect(mergeRequestsStateStub.deleteRequest).toHaveBeenCalledWith(request);
      expect(component.loadRequests).toHaveBeenCalledWith();
      expect(component.selectedFilters).toEqual({
        creators: [],
        assignees: [],
        records: []
      });
      expect(component.reloadFiltersSubject.next).toHaveBeenCalledWith();
    }));
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('.merge-request-list')).length).toEqual(1);
      expect(element.queryAll(By.css('.row')).length).toBe(1);
    });
    ['merge-request-filter', '.search-container', 'search-bar', 'mat-form-field', 'button.new-request-btn', 'mat-paginator'].forEach(function(test) {
      it(`with a ${test}`, function() {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('depending on how many merge requests there are', function() {
      mergeRequestsStateStub.requests = [];
      fixture.detectChanges();
      expect(element.queryAll(By.css('info-message')).length).toEqual(1);
      expect(element.queryAll(By.css('.request')).length).toEqual(0);
      expect(element.queryAll(By.css('.mat-divider')).length).toEqual(0);

      const secondRequest = Object.assign({}, request);
      secondRequest.title = 'title';
      mergeRequestsStateStub.requests = [request, secondRequest];
      fixture.detectChanges();
      expect(element.queryAll(By.css('info-message')).length).toEqual(0);
      expect(element.queryAll(By.css('.request')).length).toEqual(mergeRequestsStateStub.requests.length);
      expect(element.queryAll(By.css('.mat-divider')).length).toEqual(1);
    });
    it('depending on how many assignees are on a request', function() {
      const copyRequest = Object.assign({}, request);
      mergeRequestsStateStub.requests = [copyRequest];
      fixture.detectChanges();
      const listItems = element.queryAll(By.css('.request .assignees li'));
      expect(listItems.length).toEqual(1);
      expect(listItems[0].nativeElement.innerHTML).toContain('None specified');

      copyRequest.assignees = [
        new User({
          '@id': 'userA',
          '@type': [`${USER}User`],
          [`${USER}username`]: [{ '@value': 'userA' }]
        }),
        new User({
          '@id': 'userB',
          '@type': [`${USER}User`],
          [`${USER}username`]: [{ '@value': 'userB' }]
        })
      ];
      fixture.detectChanges();
      expect(element.queryAll(By.css('.request .assignees li')).length).toEqual(copyRequest.assignees.length);
    });
  });
  it('should call startCreate when the Create Request button is clicked', function() {
   fixture.detectChanges();
   const button = element.queryAll(By.css('.search-container button'))[0];
   expect(button).not.toBeNull();
   button.triggerEventHandler('click', null);
   expect(mergeRequestsStateStub.startCreate).toHaveBeenCalledWith();
 });
});
