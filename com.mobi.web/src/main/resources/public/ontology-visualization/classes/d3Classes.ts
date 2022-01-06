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
import * as d3 from 'd3-force';

export class D3Node implements d3.SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    id: string;

    constructor(id) {
        this.id = id;
    }
}

export class D3Link implements d3.SimulationLinkDatum<D3Node> {
    index?: number;
    source: D3Node | string | number;
    target: D3Node | string | number;

    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}

/**
 * d3-force API
 * - https://github.com/shichuanpo/cytoscape.js-d3-force/blob/master/src/defaults.js
 * - https://github.com/d3/d3-force
 * **/
export class D3Forces {
    forceManyBodyStrength = -700;
    forceLinkDistance = 300;
    forceLinkStrength = .5;
}
