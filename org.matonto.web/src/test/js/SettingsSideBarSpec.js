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
describe('Settings Side Bar directive', function() {
    var $compile,
        scope,
        settingsStateSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('settingsSideBar');
        mockSettingsState();

        inject(function(_settingsStateService_, _$compile_, _$rootScope_) {
            settingsStateSvc = _settingsStateService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<settings-side-bar></settings-side-bar>'))(scope);
            scope.$digest();
            controller = this.element.controller('settingsSideBar');
        });
        it('should navigate to the user info page', function() {
            controller.openUserInfo();
            expect(settingsStateSvc.reset).toHaveBeenCalled();
            expect(settingsStateSvc.showUserInfo).toBe(true);
        });
        it('should navigate to the change password page', function() {
            controller.openChangePassword();
            expect(settingsStateSvc.reset).toHaveBeenCalled();
            expect(settingsStateSvc.showChangePassword).toBe(true);
        });
        it('should navigate to the settings page', function() {
            controller.openSettings();
            expect(settingsStateSvc.reset).toHaveBeenCalled();
            expect(settingsStateSvc.showSettings).toBe(true);
        });
    });
    describe('fills the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<settings-side-bar></settings-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SETTINGS-SIDE-BAR');
            var leftNav = this.element.find('left-nav');
            expect(leftNav.length).toBe(1);
            expect(leftNav.hasClass('settings-side-bar')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(3);
        });
    });
});