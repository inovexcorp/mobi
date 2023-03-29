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

import {D3Forces, SimulationOptions} from './simulation.interface';

describe('Simulation Interface', () => {
    it('SimulationOptions interface', () => {
        const simulationOptions: SimulationOptions = {};
        expect(simulationOptions).toBeDefined();
    });
    it('new D3Forces', () => {
        const d3Forces: D3Forces = new D3Forces;
        expect(d3Forces).toBeDefined();
    });
});
