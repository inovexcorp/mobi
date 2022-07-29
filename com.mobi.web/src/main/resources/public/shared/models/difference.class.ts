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
import { JSONLDObject } from './JSONLDObject.interface';

/**
 * A collection of RDF statements that represent a difference between two sets of RDF
 */
export class Difference {
    additions: string|JSONLDObject[] // The added statements either as JSON-LD array or a string of another RDF format
    deletions: string|JSONLDObject[] // The deleted statements either as JSON-LD array or a string of another RDF format
    hasMoreResults: boolean // Whether there are more differences than what is stored within this object

    constructor() {
        this.additions = [];
        this.deletions = [];
        this.hasMoreResults = false;
    }

    hasChanges(): boolean {
        return this.additions.length > 0 || this.deletions.length > 0;
    }
}
