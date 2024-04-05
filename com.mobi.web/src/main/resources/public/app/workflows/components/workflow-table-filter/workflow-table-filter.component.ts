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
//@angular
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
// moment
import moment from 'moment/moment';
//rxjs
import { Subscription } from 'rxjs';
//local
import { FilterOption as FilterOption } from '../../models/worklow-table-filter.interface';
import { WorkflowTableFilterEvent } from '../../models/workflow-table-filter-event.interface';

/**
 * @class workflows.WorkflowTableFilterComponent
 * 
 * This component is used to filter a workflow table based on  different options such as status and time range.
 * @implements OnInit, OnDestroy
 */
@Component({
  selector: 'app-workflow-table-filter',
  templateUrl: './workflow-table-filter.component.html',
  styleUrls: ['./workflow-table-filter.component.scss']
})
export class WorkflowTableFilterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchText?: string;
  @Input() includeSearchText = false;
  @Input() includeNeverRunOption = false;
  @Output() onFilter = new EventEmitter<WorkflowTableFilterEvent>();

  readonly debounceTimeMs = 300;
  readonly statusNeverRunOption: FilterOption = { value: 'never_run', viewValue: 'Never Run' };
  readonly statusDefaultOptions: FilterOption[] = [
    {value: null, viewValue: '--'},
    {value: 'failure', viewValue: 'Failure'},
    {value: 'started', viewValue: 'Started'},
    {value: 'success', viewValue: 'Success'},
  ];
  readonly timeRangesDefault = [
    {value: null, viewValue: '--'},
    {value: 'lastHour', viewValue: 'Last Hour'},
    {value: 'today', viewValue: 'Today'},
    {value: 'thisWeek', viewValue: 'This Week'},
    {value: 'lastWeek', viewValue: 'Last Week'},
  ];
  /**
   * Represents the status of a subscription option.
   *
   * @type {Subscription}
   * @default null
   */
  statusOptionSubscription: Subscription = null;
  /**
   * Represents the status option form control.
   *
   * @type {FormControl<string | null>}
   */
  statusOption = new FormControl<string | null>(null);
  /**
   * Represents the search text form control.
   *
   * @type {FormControl<string | null>}
   */
  searchTextField = new FormControl<string | null>(null);
  /**
   * Subscription for time range option.
   *
   * @type {Subscription}
   */
  timeRangeOptionSubscription: Subscription = null;
  /**
   * Represents a form control for selecting a time range option.
   *
   * @class
   */
  timeRangeOption = new FormControl<string | null>(null);
  /**
   * An array defining the available status options.
   *
   * @type {Array<FilterOption>}
   * @property {any} value - The value of the status option.
   * @property {string} viewValue - The display value of the status option.
   *
   */
  statusOptions: FilterOption[] = [];
  /**
   * timeRangeOptions are The options for time ranges.
   * @type {Array<FilterOption>}
   * @property {any} value - The value of the time range option.
   * @property {string} viewValue - The display value of the time range option.
   */
  timeRangeOptions: FilterOption[] = this.timeRangesDefault;
  /**
   * Creates a new instance of the constructor.
   *
   * @constructor
   * @return {undefined} Returns nothing.
   */
  constructor() { }

  /**
   * Initializes the component.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.setupStatusOptions(this.includeNeverRunOption);
    this.initSubscriptions();
  }
  /**
   * On Changes
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.searchText) {
      this.searchTextField.patchValue(changes?.searchText.currentValue);
    }
    if (changes?.includeNeverRunOption) {
      this.setupStatusOptions(changes?.includeNeverRunOption.currentValue);
    }
  }
  /**
   * Setup Status Options
   * @returns {void}
   */
  setupStatusOptions(includeNeverRunOption: boolean): void {
    const statusOptionsTemp = this.statusDefaultOptions.slice();
    if (includeNeverRunOption) {
      statusOptionsTemp.push(this.statusNeverRunOption);
    }
    this.statusOptions = statusOptionsTemp;
  }
  /**
   * Executes cleanup logic before the component is destroyed.
   * Unsubscribes from any active subscriptions.
   *
   * @return {void}
   */
  ngOnDestroy(): void {
    if (this.statusOptionSubscription !== null) {
      this.statusOptionSubscription.unsubscribe();
    }
    if (this.timeRangeOptionSubscription !== null) {
      this.timeRangeOptionSubscription.unsubscribe();
    }
  }
  /**
   * Search Text Event Handling
   * @returns {void}
   */
  onSearchText(): void {
    this.onFilter.emit({
      filter: 'searchText',
      data: { 
        text: this.searchTextField.value 
      }
    });
  }
  /**
   * Initializes the subscriptions for status and time range options.
   * @return {void} - Does not return any value.
   */
  initSubscriptions(): void {
    this.statusOptionSubscription = this.statusOption.valueChanges.subscribe((status) => {
      this.onFilter.emit({
        filter: 'status',
        data: { status }
      });
    });
    //Manage the subscription of a time range option.
    this.timeRangeOptionSubscription = this.timeRangeOption.valueChanges.subscribe((timeRange) => {
      const nowDate = new Date();
      let nowISOString: string = null;
      let startingAfter: Date = null;
      let startingAfterISOString: string = null;
      let endingBefore: Date = null;
      let endingBeforeISOString: string = null;
      if (timeRange === 'lastHour') {
        startingAfter = moment(new Date(nowDate)).subtract(1, 'hours').toDate();
      } else if (timeRange === 'today') {
        startingAfter = moment(new Date(nowDate)).subtract(24, 'hours').toDate();
      } else if (timeRange === 'thisWeek') {
        startingAfter = moment(new Date(nowDate)).subtract(7, 'days').toDate();
      } else if (timeRange === 'lastWeek') {
        startingAfter = moment(new Date(nowDate)).subtract(14, 'days').toDate();
        endingBefore = moment(new Date(nowDate)).subtract(7, 'days').toDate();
      }
      nowISOString = moment(nowDate).toISOString();
      if (startingAfter) {
        startingAfterISOString = startingAfter ? moment(startingAfter).toISOString() : null;
      }
      if (endingBefore) {
        endingBeforeISOString = moment(endingBefore).toISOString();
      }
      this.onFilter.emit({
        filter: 'timeRange',
        data: {
          timeRange,
          now: nowDate,
          nowISOString,
          startingAfter,
          startingAfterISOString,
          endingBefore,
          endingBeforeISOString,
        }
      });
    });
  }
}
