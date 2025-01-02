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

import { StateNode } from './stateNode';

describe('StateNode', () => {
    it('to be defined', () => {
        expect(new StateNode()).toBeDefined();
    });
    it('should initialize with the correct data', () => {
        const stateNode = new StateNode();
        stateNode.data = {id: 'id1', ontologyId: 'ont1'};
        const controlRecordOnGraphFalse = stateNode.asControlRecord(false);
        expect(controlRecordOnGraphFalse.onGraph).toEqual(false);

        expect(controlRecordOnGraphFalse.id).toEqual('id1');
        expect(controlRecordOnGraphFalse.name).toEqual(undefined);
        expect(controlRecordOnGraphFalse.isImported).toEqual(undefined);
        expect(controlRecordOnGraphFalse.ontologyId).toEqual('ont1');

        const controlRecordOnGraphTrue = stateNode.asControlRecord(true);
        expect(controlRecordOnGraphTrue.onGraph).toEqual(true);
    });
    it('asControlRecord', () => {
        const s1 = new StateNode();
        s1.data = { id: '1', ontologyId: 'ont1' };
        const c1 = s1.asControlRecord(true);
        c1.onGraph = true;
        expect(c1).toBeDefined();
    });
});
