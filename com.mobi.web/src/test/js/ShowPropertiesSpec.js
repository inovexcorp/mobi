/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Show Properties filter', function() {
    var $filter,
        responseObj,
        entity,
        properties;

    beforeEach(function() {
        module('showProperties');
        mockResponseObj();

        inject(function(_$filter_, _responseObj_) {
            $filter = _$filter_;
            responseObj = _responseObj_;
        });

        entity = {'prop1': '', 'prop2': ''};
        properties = ['prop1', 'prop2'];
    });

    describe('returns an empty array', function() {
        it('if properties is not an array', function() {
            _.forEach([false, '', 0, undefined, null], function(value) {
                var result = $filter('showProperties')(entity, value);
                expect(result).toEqual([]);
            });
        });
        it('if no property can be validated', function() {
            responseObj.validateItem.and.returnValue(false);
            var result = $filter('showProperties')(entity, properties)
            expect(result).toEqual([]);
        });
        it('if entity does not have the property', function() {
            responseObj.getItemIri.and.callFake(function(property) {
                return property;
            });
            var result = $filter('showProperties')(entity, ['prop3', 'prop4']);
            expect(result).toEqual([]);
        });
    });

    it('returns an array of items that are validated', function() {
        responseObj.validateItem.and.returnValue(true);
        responseObj.getItemIri.and.callFake(function(property) {
            return property;
        });
        var result = $filter('showProperties')(entity, properties);
        expect(result.length).toBe(2);

        result = $filter('showProperties')(entity, ['prop1', 'prop2', 'prop3', 'prop4']);
        expect(result.length).toBe(2);
    });
});
