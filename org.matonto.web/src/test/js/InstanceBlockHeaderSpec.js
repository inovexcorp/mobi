/*-
 * #%L
 * org.matonto.web
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
describe('Instance Block Header directive', function() {
    var $compile, scope, element, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('instanceBlockHeader');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        discoverStateSvc.explore.breadcrumbs = ['', ''];
        element = $compile(angular.element('<instance-block-header></instance-block-header>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-block-header')).toBe(true);
        });
        it('with a breadcrumbs', function() {
            expect(element.find('breadcrumbs').length).toBe(1);
        });
        it('with a .pull-right.edit-button', function() {
            expect(element.querySelectorAll('.pull-right.edit-button').length).toBe(1);
        });
    });
});