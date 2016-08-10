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
describe('Settings Pages directive', function() {
    var $compile,
        scope,
        settingsStateSvc;

    beforeEach(function() {
        module('templates');
        module('settingsPages');
        mockSettingsState();

        inject(function(_settingsStateService_, _$compile_, _$rootScope_) {
            settingsStateSvc = _settingsStateService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<settings-pages></settings-pages>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('settings-pages')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a settings page', function() {
            expect(this.element.find('settings-page').length).toBe(0);

            settingsStateSvc.showSettings = true;
            scope.$digest();
            expect(this.element.find('settings-page').length).toBe(1);
        });
        it('with a change password page', function() {
            expect(this.element.find('change-password-page').length).toBe(0);

            settingsStateSvc.showChangePassword = true;
            scope.$digest();
            expect(this.element.find('change-password-page').length).toBe(1);
        });
        it('with a user information page', function() {
            expect(this.element.find('user-information-page').length).toBe(0);

            settingsStateSvc.showUserInfo = true;
            scope.$digest();
            expect(this.element.find('user-information-page').length).toBe(1);
        });
    });
});