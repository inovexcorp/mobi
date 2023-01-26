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
import { ClassDetails } from '../../discover/models/classDetails.interface';
import { InstanceDetails } from '../../discover/models/instanceDetails.interface';
import { JSONLDObject } from './JSONLDObject.interface';

export interface ExploreState {
    breadcrumbs: string[],
    classDeprecated: boolean,
    classDetails: ClassDetails[],
    classId: string,
    creating: boolean,
    editing: boolean,
    instance: {
        entity: JSONLDObject[],
        metadata: InstanceDetails,
        objectMap: {
            [key: string]: string
        },
        original: JSONLDObject[]
    },
    instanceDetails: {
        currentPage: number,
        data: InstanceDetails[],
        limit: number,
        total: number,
        links: {
            next: string,
            prev: string
        },
    },
    recordId: string,
    recordTitle: string,
    hasPermissionError: boolean
}
