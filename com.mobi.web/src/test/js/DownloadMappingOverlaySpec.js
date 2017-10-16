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
describe('Download Mapping Overlay directive', function() {
    var $compile, scope, element, controller, mappingManagerSvc, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('downloadMappingOverlay');
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        mapperStateSvc.mapping = {record: {id: '', title: ''}};
        element = $compile(angular.element('<download-mapping-overlay></download-mapping-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('downloadMappingOverlay');
    });

    describe('controller methods', function() {
        it('should download a mapping', function() {
            controller.download();
            expect(mappingManagerSvc.downloadMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, controller.downloadFormat);
            expect(mapperStateSvc.displayDownloadMappingOverlay).toBe(false);
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayDownloadMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('download-mapping-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a mapper serialization select', function() {
            expect(element.find('mapper-serialization-select').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.downloadForm.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to cancel and download', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Download']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Download']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call download when the button is clicked', function() {
        spyOn(controller, 'download');
        var downloadButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        downloadButton.triggerHandler('click');
        expect(controller.download).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(controller, 'cancel');
        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});