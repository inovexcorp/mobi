/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { D3Link, D3Node } from './d3Classes';

describe('D3Classes', () => {
    it('D3Node constructor', () => {
        const d3Node: D3Node = new D3Node('id', 1, 2);
        expect(d3Node).toBeDefined();
        expect(d3Node.id).toEqual('id');
        expect(d3Node.x).toEqual(1);
        expect(d3Node.y).toEqual(2);
    });    
    it('D3Link constructor', () => {
        const d3Link: D3Link = new D3Link(10, 20);
        expect(d3Link).toBeDefined();
        expect(d3Link.source).toEqual(10);
        expect(d3Link.target).toEqual(20);
    });
});
