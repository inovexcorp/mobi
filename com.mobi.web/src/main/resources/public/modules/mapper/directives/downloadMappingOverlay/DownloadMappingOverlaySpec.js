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
    var $compile, scope, mappingManagerSvc, mapperStateSvc;

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
        this.element = $compile(angular.element('<download-mapping-overlay></download-mapping-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('downloadMappingOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should download a mapping', function() {
            this.controller.download();
            expect(mappingManagerSvc.downloadMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, this.controller.downloadFormat);
            expect(mapperStateSvc.displayDownloadMappingOverlay).toBe(false);
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(mapperStateSvc.displayDownloadMappingOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('download-mapping-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a mapper serialization select', function() {
            expect(this.element.find('mapper-serialization-select').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.downloadForm.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to cancel and download', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Download']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Download']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call download when the button is clicked', function() {
        spyOn(this.controller, 'download');
        var downloadButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        downloadButton.triggerHandler('click');
        expect(this.controller.download).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});