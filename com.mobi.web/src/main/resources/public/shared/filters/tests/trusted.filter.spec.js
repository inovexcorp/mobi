/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Trusted filter', function() {
    var $filter, $sce;

    beforeEach(function() {
        module('trusted');

        inject(function(_$filter_, _$sce_) {
            $filter = _$filter_;
            $sce = _$sce_;
        });
    });

    afterEach(function() {
        $filter = null;
        $sce = null;
    });

    it('returns undefined if text is falsey or an object', function() {
        var result;
        _.forEach([false, '', 0, undefined, null, {}, []], function(value) {
            result = $filter('trusted')(value);
            expect(result).toEqual(undefined);
        });
    });
    it('returns the result of $sce.trustAsHtml if text is truthy', function() {
        var result,
            tests = ['test', '<div></div>'];
        _.forEach(tests, function(test) {
            result = $filter('trusted')(test.value);
            expect(result).toEqual($sce.trustAsHtml(test.value));
        });
    });
});