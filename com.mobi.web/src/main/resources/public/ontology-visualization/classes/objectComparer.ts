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
import { ControlRecordI } from '../interfaces/visualization.interfaces';

export class ObjectComparer {
    // All the classes in the import closure (i.e. direct and imported) grouped by parent ontology
    // The groups are ordered alphabetically along with their lists of child classes
    static ControlRecordI = (a: ControlRecordI, b: ControlRecordI) => {
        let isImported = 0;
        let ontologyId = 0;
        let name = 0;

        if (a.isImported === b.isImported) {
            isImported = 0;
        } else if (a.isImported !== undefined && b.isImported === undefined ) {
            isImported = -1;
        } else if (a.isImported === undefined && b.isImported !== undefined ) {
            isImported = 1;
        } else if (a.isImported === true && b.isImported === false) {
            isImported = 1;
        } else if (a.isImported === false && b.isImported === true) {
            isImported = -1;
        }

        if (a.ontologyId === b.ontologyId) {
            ontologyId = 0;
        } else if (a.ontologyId !== undefined && b.ontologyId === undefined) {
            ontologyId = -1;
        } else if (a.ontologyId === undefined && b.ontologyId !== undefined) {
            ontologyId = 1;
        } else {
            ontologyId = a.ontologyId.localeCompare(b.ontologyId, 'en', { sensitivity: 'base' });
        }

        if (a.name === b.name) {
            name = 0;
        } else if (a.name !== undefined && b.name === undefined) {
            name = -1;
        } else if (a.name === undefined && b.name !== undefined) {
            name = 1;
        } else {
            name = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
        }
        return isImported || ontologyId || name;
    }
}
