/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { RecordSelectFiltered } from '../../shapes-graph-editor/models/recordSelectFiltered.interface';
import { ShapesGraphStateService } from './shapesGraphState.service';

describe('Shapes Graph State service', function() {
    let service: ShapesGraphStateService;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                ShapesGraphStateService
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(ShapesGraphStateService);
    });

    afterEach(function() {
        service = null;
    });

    it('should reset variables', function() {
        service.currentShapesGraphRecordIri = 'test';
        service.currentShapesGraphRecordTitle = 'test';
        service.openRecords = [{recordId: 'record1'} as RecordSelectFiltered];
        service.reset();

        expect(service.currentShapesGraphRecordIri).toEqual('');
        expect(service.currentShapesGraphRecordTitle).toEqual('');
        expect(service.openRecords).toEqual([]);
    });
});