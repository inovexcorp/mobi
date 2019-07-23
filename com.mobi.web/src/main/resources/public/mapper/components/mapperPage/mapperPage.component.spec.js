/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Mapper Page component', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockComponent('mapper', 'mappingSelectPage');
        mockComponent('mapper', 'fileUploadPage');
        mockComponent('mapper', 'editMappingPage');
        mockComponent('mapper', 'mappingCommitsPage');
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
        });

        this.element = $compile(angular.element('<mapper-page></mapper-page>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MAPPER-PAGE');
            expect(this.element.querySelectorAll('.mapper-page').length).toEqual(1);
        });
        describe('if the step', function() {
            it('is selecting a mapping', function() {
                mapperStateSvc.step = mapperStateSvc.selectMappingStep;
                scope.$digest();
                expect(this.element.find('mapping-select-page').length).toEqual(1);
            });
            it('is uploading a file', function() {
                mapperStateSvc.step = mapperStateSvc.fileUploadStep;
                scope.$digest();
                expect(this.element.find('file-upload-page').length).toEqual(1);
            });
            it('is editing a mapping', function() {
                mapperStateSvc.step = mapperStateSvc.editMappingStep;
                scope.$digest();
                expect(this.element.find('material-tabset').length).toEqual(1);
                expect(this.element.find('material-tab').length).toEqual(2);
                expect(this.element.find('edit-mapping-page').length).toEqual(1);
            });
        });
    });
});