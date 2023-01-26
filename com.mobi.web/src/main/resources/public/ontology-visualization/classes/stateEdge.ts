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
import { StateEdgeI } from '../interfaces/visualization.interfaces';

export class StateEdge implements StateEdgeI {
    position: unknown;
    group: 'edges';
    removed: false;
    selected: false;
    selectable: true;
    locked: false;
    grabbed: false;
    grabbable: true;
    data: {
        id: string,
        source: string,
        target: string,
        [key: string]: any
    } ;
    classes?: any;
}
