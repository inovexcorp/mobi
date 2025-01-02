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
import { JSONLDObject } from './JSONLDObject.interface';
import { User } from './user.class';

/**
 * Configuration to create a new Merge Request
 */
export interface MergeRequestConfig {
    title: string,
    description?: string,
    recordId: string,
    sourceBranchId: string,
    sourceBranch?: JSONLDObject,
    targetBranchId: string,
    targetBranch?: JSONLDObject,
    assignees?: User[], // List of assignee Users
    removeSource: boolean
}
