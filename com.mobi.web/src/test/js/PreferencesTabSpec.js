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
describe('Preferences Tab directive', function() {
    var $compile,
        scope,
        settingsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('preferencesTab');
        mockSettingsManager();

        inject(function(_settingsManagerService_, _$compile_, _$rootScope_) {
            settingsManagerSvc = _settingsManagerService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<preferences-tab></preferences-tab>'))(scope);
            scope.$digest();
        });
        it('should save the settings entered', function() {
            var controller = this.element.controller('preferencesTab');
            controller.settings = {};
            controller.save();
            expect(settingsManagerSvc.setSettings).toHaveBeenCalledWith(controller.settings);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<preferences-tab></preferences-tab>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('preferences-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-6').length).toBe(1);
            expect(this.element.querySelectorAll('.col-xs-offset-3').length).toBe(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a block footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a settings container', function() {
            expect(this.element.find('preferences-container').length).toBe(1);
        });
        it('with custom settings', function() {
            expect(this.element.find('custom-preference').length).toBe(2);
        });
        it('with a button to save', function() {
            expect(this.element.querySelectorAll('block-footer button').text().trim()).toBe('Save');
        });
    });
    it('should save when the save button is clicked', function() {
        var element = $compile(angular.element('<preferences-tab></preferences-tab>'))(scope);
        scope.$digest();
        var controller = element.controller('preferencesTab');
        spyOn(controller, 'save');

        var saveBtn = angular.element(element.querySelectorAll('block-footer button')[0]);
        saveBtn.triggerHandler('click');
        expect(controller.save).toHaveBeenCalled();
    });
});