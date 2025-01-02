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

import { TestBed } from '@angular/core/testing';
import { forEach } from 'lodash';
import { ShowPropertiesPipe } from './showProperties.pipe';

describe('Show Properties filter', function() {
    let pipe: ShowPropertiesPipe;
    let entity;
    let properties;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ShowPropertiesPipe,
            ]
        });

        pipe = new ShowPropertiesPipe();
        entity = {'prop1': '', 'prop2': ''};
        properties = ['prop1', 'prop2'];
    });

    afterEach(function() {
        pipe = null;
    });

    describe('returns an empty array', function() {
        it('if properties is not an array', function() {
            forEach([false, '', 0, undefined, null], function(value) {
                const result = pipe.transform(entity, value);
                expect(result).toEqual([]);
            });
        });
        it('if entity does not have the property', function() {
            const result = pipe.transform(entity, ['prop3', 'prop4']);
            expect(result).toEqual([]);
        });
    });
    it('returns an array of items that are validated', function() {
        let result = pipe.transform(entity, properties);
        expect(result.length).toBe(2);

        result = pipe.transform(entity, ['prop1', 'prop2', 'prop3', 'prop4']);
        expect(result.length).toBe(2);
    });
});
