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
//@angular
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { DebugElement, SimpleChange } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// @angular/material
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
//local imports
import { WorkflowTableFilterComponent } from './workflow-table-filter.component';
import { WorkflowTableFilterEvent } from '../../models/workflow-table-filter-event.interface';

describe('WorkflowTableFilterComponent', () => {
  let component: WorkflowTableFilterComponent;
  let fixture: ComponentFixture<WorkflowTableFilterComponent>;
  let element: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule
      ],
      declarations: [ 
        WorkflowTableFilterComponent 
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowTableFilterComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
  });

  afterAll(() => {
    fixture = null;
    component = null;
    element = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should initialize properly', () => {
    it('includeSearchText is false and includeNeverRunOption is false', () => {
      spyOn(component, 'setupStatusOptions').and.callThrough();
      spyOn(component, 'initSubscriptions').and.callThrough();
      component.ngOnInit();
      expect(component.setupStatusOptions).toHaveBeenCalledWith(false);
      expect(component.initSubscriptions).toHaveBeenCalledWith();
      expect(component.statusOptions.map(v => v.value)).toEqual([null, 'failure', 'started', 'success']);
    });
    it('includeSearchText is false and includeNeverRunOption is true', () => {
      component.includeNeverRunOption = true;
      spyOn(component, 'setupStatusOptions').and.callThrough();
      spyOn(component, 'initSubscriptions').and.callThrough();
      component.ngOnInit();
      expect(component.setupStatusOptions).toHaveBeenCalledWith(true);
      expect(component.initSubscriptions).toHaveBeenCalledWith();
      expect(component.statusOptions.map(v => v.value)).toEqual([null, 'failure', 'started', 'success', 'never_run']);
    });
  });
  describe('should be changed properly', () => {
    it('when searchText changes', () => {
      component.searchTextField =  jasmine.createSpyObj('Field', ['patchValue']);
      component.ngOnChanges({
        'searchText': new SimpleChange('', 'searchText', true)
      });
      expect(component.searchTextField.patchValue).toHaveBeenCalledWith('searchText');
    });
    it('when includeNeverRunOption changes', () => {
      component.setupStatusOptions(false);
      expect(component.statusOptions.map(v => v.value)).toEqual([null, 'failure', 'started', 'success']);
      component.ngOnChanges({
        'includeNeverRunOption': new SimpleChange('', true, true)
      });
      expect(component.statusOptions.map(v => v.value)).toEqual([null, 'failure', 'started', 'success', 'never_run']);
    });
  });
  it('should be destroyed properly', () => {
    component.statusOptionSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    component.timeRangeOptionSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    component.ngOnDestroy();
    expect(component.statusOptionSubscription.unsubscribe).toHaveBeenCalledWith();
    expect(component.timeRangeOptionSubscription.unsubscribe).toHaveBeenCalledWith();
  });
  describe('controller methods', () => {
    it('when onSearchText occurs emits to onFilter output', fakeAsync(() => {
      component.onFilter.subscribe((workflowTableFilterEvent: WorkflowTableFilterEvent) =>{
        expect(workflowTableFilterEvent).toEqual({
          filter: 'searchText',
          data: { 
            text: 'searchTextValue'
          }
        });
      });
      component.searchTextField.patchValue('searchTextValue');
      component.onSearchText();
    }));
    it('when initSubscriptions occurs subscribe to statusOption and timeRangeOption', fakeAsync(() => {
      expect(component.statusOptionSubscription).toEqual(null);
      expect(component.timeRangeOptionSubscription).toEqual(null);
      component.initSubscriptions();
      expect(component.statusOptionSubscription).toBeDefined();
      expect(component.timeRangeOptionSubscription).toBeDefined();
    }));
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
       fixture.detectChanges();
    });
    it('for wrapping containers', function() {
        expect(element.queryAll(By.css('mat-form-field')).length).toEqual(2);
        expect(element.queryAll(By.css('.filter-field')).length).toEqual(2);
    });
    ['form', '.field-status', '.field-time-range'].forEach(test => {
        it(`with a ${test}`, function() {
            expect(element.queryAll(By.css(test)).length).toBe(1);
        });
    });
    describe('when search-text-input is ', () => {
      it('disabled', function() {
        const fieldQuery: DebugElement[] = element.queryAll(By.css('.search-text-input'));
        expect(fieldQuery.length).toEqual(0);
      });
      it('enabled', () => {
        component.includeSearchText = true;
        fixture.detectChanges();
        const fieldQuery: DebugElement[] = element.queryAll(By.css('.search-text-input'));
        expect(fieldQuery.length).toEqual(1);
      });
    });
    it('field-status label', function() {
      const fieldQuery: DebugElement[] = element.queryAll(By.css('.field-status mat-label'));
      expect(fieldQuery.length).toEqual(1);
      expect(fieldQuery[0].nativeElement.innerText.trim()).toEqual('Select a status');
    });
    it('field-status mat-select', function() {
      const fieldQuery: DebugElement[] = element.queryAll(By.css('.field-status mat-select'));
      expect(fieldQuery.length).toEqual(1);
      expect(fieldQuery[0].nativeElement.innerText.trim()).toEqual('');
    });
    it('field-time-range label', function() {
      const fieldQuery: DebugElement[] = element.queryAll(By.css('.field-time-range mat-label'));
      expect(fieldQuery.length).toEqual(1);
      expect(fieldQuery[0].nativeElement.innerText.trim()).toEqual('Select a time range');
    });
    it('field-time-range mat-select', function() {
      const fieldQuery: DebugElement[] = element.queryAll(By.css('.field-time-range mat-select'));
      expect(fieldQuery.length).toEqual(1);
      expect(fieldQuery[0].nativeElement.innerText.trim()).toEqual('');
    });
  });
});
