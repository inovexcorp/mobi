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
describe('Settings Manager service', function() {
    var settingsManagerSvc,
        $window,
        $cookies;

    beforeEach(function() {
        module('settingsManager');
        mockPrefixes();

        module(function($provide) {
            $provide.service('$window', function() {
                this.Date = jasmine.createSpy('Date');
            });
            $provide.service('$cookies', function() {
                this.getObject = jasmine.createSpy('getObject').and.returnValue({});
                this.putObject = jasmine.createSpy('putObject');
            });
        });

        inject(function(settingsManagerService, _$window_, _$cookies_) {
            settingsManagerSvc = settingsManagerService;
            $window = _$window_;
            $cookies = _$cookies_;
        });
    });

    it('should return the current settings', function() {
        var result = settingsManagerSvc.getSettings();
        expect(typeof result).toBe('object');
        expect(_.has(result, 'treeDisplay')).toBe(true);
        expect(_.has(result, 'tooltipDisplay')).toBe(true);
    });
    it('should initialize with the correct default settings', function() {
        var result = settingsManagerSvc.getSettings();
        expect(result.treeDisplay).toBe('pretty');
        expect(result.tooltipDisplay).toBe('@id');
    });
    it('should set new settings', function() {
        var newSettings = {treeDisplay: 'test', tooltipDisplay: 'test'};
        settingsManagerSvc.setSettings(newSettings);
        expect($cookies.putObject).toHaveBeenCalled();
        expect($window.Date).toHaveBeenCalled();
        expect(settingsManagerSvc.getSettings()).toEqual(newSettings);
    });
    it('should get the value of treeDisplay', function() {
        var settings = settingsManagerSvc.getSettings();
        var result = settingsManagerSvc.getTreeDisplay();
        expect(result).toBe(settings.treeDisplay);
    });
    it('should get the value of tooltipDisplay', function() {
        var settings = settingsManagerSvc.getSettings();
        var result = settingsManagerSvc.getTooltipDisplay();
        expect(result).toBe(settings.tooltipDisplay);
    });
});