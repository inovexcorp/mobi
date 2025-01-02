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
/**
 * d3-force API
 * - https://github.com/shichuanpo/cytoscape.js-d3-force/blob/master/src/defaults.js
 * - https://github.com/d3/d3-force
 * **/
export class D3Forces {
    alpha = 1;
    alphaMin = 0.001;
    alphaDecay = this.setAlphaDecay(300);
    setAlphaDecay(iterations: number): number{
        return 1 - Math.pow(this.alphaMin, 1/iterations);
    }
    forceManyBodyStrength = -700;
    forceLinkDistance = 300;
    forceLinkStrength = .5;
}

export interface SimulationOptions {
    useExistingNodeLocation?: boolean;
    preProcessClustering?: boolean;
    d3Forces?: D3Forces;
}
