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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MockComponent, MockProvider } from 'ng-mocks';

import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestFilterComponent } from './merge-request-filter.component';

describe('MergeRequestFilterComponent', () => {
  let component: MergeRequestFilterComponent;
  let fixture: ComponentFixture<MergeRequestFilterComponent>;
 
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
          MergeRequestFilterComponent,
          MockComponent(InfoMessageComponent)
      ],
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatRadioModule
      ],
      providers: [
        MockProvider(MergeRequestsStateService),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MergeRequestFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('It initializes correctly', () => {
    beforeEach(() => {
      component.ngOnInit();
    });
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    it('with request status filter', () => {
      const mergeRequestFilter = component.filters[0];
      const expectedFilterItems = [
        { checked: false, value: 'Open' },
        { checked: false, value: 'Accepted' }
      ];
      expect(mergeRequestFilter.title).toEqual('Request Status');
      expect(mergeRequestFilter.filterItems).toEqual(expectedFilterItems);
    });
  });
  describe('filter methods', () => {
    beforeEach(function () {
      component.ngOnInit();
      this.openStatus = { value: 'Open', checked: true };
      this.acceptedStatus = { value: 'Accepted', checked: false };
      this.statusFilter = component.filters[0];
      this.statusFilter.filterItems = [this.openStatus, this.acceptedStatus];
      spyOn(component.changeFilter, 'emit');
    });
    describe('requestStatus should filter records', function() {
      it('if the open status filter has been checked', function() {
        this.statusFilter.setFilter('Open');
        expect(this.acceptedStatus.checked).toEqual(false);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: this.acceptedStatus.checked
        });
      });
      it('if the accepted status has been checked', function() {
        this.acceptedStatus.checked = true;
        this.statusFilter.setFilter('Accepted');
        expect(this.openStatus.checked).toEqual(false);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: this.acceptedStatus.checked
        });
      });
    });
  });
});
