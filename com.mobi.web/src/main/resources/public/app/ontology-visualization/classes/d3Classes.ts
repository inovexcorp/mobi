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
import * as d3 from 'd3-force';

/**
 * D3 Node Index use to store D3Node Id to D3Node
 */
export interface D3NodeIndex {
    [key: string]: D3Node
}

/**
 * Node type used for D3 Simulation
 */
export class D3Node implements d3.SimulationNodeDatum {
    id: string;
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;

    constructor(id:string, x?:number , y?:number) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
}

/**
 * The D3 graph edges can have these type of nodes as source and target
 */
type D3LinkNode = D3Node | string | number;

/**
 * Edge type used for D3 Simulation
 */
export class D3Link implements d3.SimulationLinkDatum<D3Node> {
    index?: number;
    source: D3LinkNode;
    target: D3LinkNode;

    constructor(source: D3LinkNode, target: D3LinkNode) {
        this.source = source;
        this.target = target;
    }
}
