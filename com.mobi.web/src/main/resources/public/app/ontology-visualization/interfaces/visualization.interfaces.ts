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

export interface ParentMapI {
    [key: string]: Array<string>;
}

export interface RangesI {
    domain: string;
    property: string;
    range: string;
}

export interface ChildIrisI {
    [key: string]: string;
}

export interface CommitItemI {
    '@id': string;
    '@type'?: string[];
    [key: string]: any;
}

export interface inProgressCommitI {
    additions: CommitItemI[];
    deletions: CommitItemI[];
}

export interface EntityItemI {
    label: string;
    names: Array<string>;
    imported: boolean;
    ontologyId: string;
}

export interface EntityInfoI {
    [key: string]: EntityItemI;
}

export interface OntologyGraphData {
    parentMap: {
        [key: string]: string[]
    },
    iris: {
        [key: string]: string
    },
    entityInfo: EntityInfoI,
    ranges: Array<RangesI>[],
    childIris: ChildIrisI,
    classParentMap: ParentMapI
}
