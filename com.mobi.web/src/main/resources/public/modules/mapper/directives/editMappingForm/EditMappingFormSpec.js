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
describe('Edit Mapping Form directive', function() {
    var $compile, scope, mapperStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('editMappingForm');
        mockMapperState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            utilSvc = _utilService_;
        });

        mapperStateSvc.mapping = {name: '', jsonld: []};
        this.element = $compile(angular.element('<edit-mapping-form></edit-mapping-form>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-mapping-form')).toBe(true);
            expect(this.element.querySelectorAll('.mapping-config').length).toBe(1);
            expect(this.element.querySelectorAll('.class-mapping-select-container').length).toBe(1);
        });
        it('with a class mapping select', function() {
            expect(this.element.find('class-mapping-select').length).toBe(1);
        });
        it('with a class-mapping-details', function() {
            expect(this.element.find('class-mapping-details').length).toBe(1);
        });
        it('depending on whether a class has been selected', function() {
            var deleteClassButton = angular.element(this.element.querySelectorAll('.class-mapping-select-container button')[0]);
            expect(deleteClassButton.attr('disabled')).toBeTruthy();

            mapperStateSvc.selectedClassMappingId = 'class';
            scope.$digest();
            expect(deleteClassButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether there are available classes', function() {
            var button = angular.element(this.element.querySelectorAll('.class-mappings button.add-class-mapping-button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            mapperStateSvc.availableClasses = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    it('should set the correct state when the add class button is linked', function() {
        var button = angular.element(this.element.querySelectorAll('.class-mappings button.add-class-mapping-button')[0]);
        button.triggerHandler('click');
        expect(mapperStateSvc.displayClassMappingOverlay).toBe(true);
    });
    it('should set the correct state when the edit config link is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.mapping-config button')[0]);
        button.triggerHandler('click');
        expect(mapperStateSvc.displayMappingConfigOverlay).toBe(true);
    });
    it('should set the correct state when delete class button is clicked', function() {
        mapperStateSvc.selectedClassMappingId = 'class';
        scope.$digest();
        var button = angular.element(this.element.querySelectorAll('.class-mapping-select-container button')[0]);
        button.triggerHandler('click');
        expect(mapperStateSvc.displayDeleteClassConfirm).toBe(true);
    });
});
