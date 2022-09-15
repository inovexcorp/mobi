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
import { EntityNamesItem } from './entityNamesItem.interface';

/**
 * Represents a single node in a flattened Hierarchy 
 */
export interface HierarchyNode {
    entityIRI: string,
    hasChildren: boolean,
    indent: number,
    path: string[],
    entityInfo: EntityNamesItem,
    joinedPath: string,
    isOpened?: boolean,
    isClass?: boolean,
    underline?: boolean
    parentNoMatch?: boolean
    displayNode?: boolean,
    title?: string

    get?: (a: string, b?: any) => boolean,
    set?: (a: string, b: boolean, c?: any) => void,
}