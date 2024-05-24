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
/**
 * The type of filter to be applied to the workflow table.
 */
export type WorkflowTableFilterType =  /**
   * Filter by workflow status | Filter by a specific time range.
   */
    'status' | 'timeRange'| 'searchText';
/**
 * @interface WorkflowTableFilterEvent
 * 
 * Event object representing a filter applied to the workflow table.
 */
export interface WorkflowTableFilterEvent {
  /**
   * The type of filter applied.
   */
  filter: WorkflowTableFilterType;
  /**
   * Additional data associated with the filter.
   * The specific data type depends on the chosen filter type (`'status'` or `'timeRange'`).
   */
  data: {
    //@TODO change <any> to the expected data type
    [key: string]: any; 
  };
}
