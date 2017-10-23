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
describe('Settings Tabset directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('settingsTabset');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<settings-tabset></settings-tabset>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('settings-tabset')).toBe(true);
        });
        it('with tabsets', function() {
            expect(this.element.find('tabset').length).toBe(2);
            expect(this.element.querySelectorAll('tabset.centered').length).toBe(1);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(3);
        });
        it('with a profile tab', function() {
            expect(this.element.find('profile-tab').length).toBe(1);
        });
        it('with a group tab', function() {
            expect(this.element.find('group-tab').length).toBe(1);
        });
        it('with a password tab', function() {
            expect(this.element.find('password-tab').length).toBe(1);
        });
    });
});