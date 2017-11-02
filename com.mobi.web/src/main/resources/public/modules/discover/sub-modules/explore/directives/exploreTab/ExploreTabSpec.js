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
describe('Explore Tab directive', function() {
    var $compile, scope, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('exploreTab');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        this.element = $compile(angular.element('<explore-tab></explore-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('explore-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a class-block.col-xs-12', function() {
            expect(this.element.querySelectorAll('class-block.col-xs-12').length).toBe(1);

            discoverStateSvc.explore.breadcrumbs = ['', ''];
            scope.$apply();

            expect(this.element.querySelectorAll('class-block.col-xs-12').length).toBe(0);
        });
        it('with a instance-block.col-xs-12', function() {
            expect(this.element.querySelectorAll('instance-block.col-xs-12').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', ''];
            scope.$apply();

            expect(this.element.querySelectorAll('instance-block.col-xs-12').length).toBe(1);
        });
        it('with a instance-view.col-xs-12', function() {
            expect(this.element.querySelectorAll('instance-view.col-xs-12').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', '', ''];
            scope.$apply();

            expect(this.element.querySelectorAll('instance-view.col-xs-12').length).toBe(1);
        });
        it('with a instance-editor.col-xs-12', function() {
            expect(this.element.querySelectorAll('instance-editor.col-xs-12').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', '', ''];
            discoverStateSvc.explore.editing = true;
            scope.$apply();

            expect(this.element.querySelectorAll('instance-editor.col-xs-12').length).toBe(1);
        });
        it('with a instance-creator.col-xs-12', function() {
            expect(this.element.querySelectorAll('instance-creator.col-xs-12').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', '', ''];
            discoverStateSvc.explore.creating = true;
            scope.$apply();

            expect(this.element.querySelectorAll('instance-creator.col-xs-12').length).toBe(1);
        });
    });
});