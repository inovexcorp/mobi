/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Focus Me directive', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('focusMe');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        this.element = $compile(angular.element('<input type="text" focus-me />'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    it('should set the focus on timeout', function() {
        spyOn(this.element[0], 'focus');
        $timeout.flush();
        expect(this.element[0].focus).toHaveBeenCalled();
    });
});