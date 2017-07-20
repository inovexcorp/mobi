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
describe('Mapping Preview directive', function() {
    var $compile, scope, element, controller, utilSvc, ontologyManagerSvc, mapperStateSvc, delimitedManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('mappingPreview');
        mockPrefixes();
        mockUtil();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            prefixes = _prefixes_;
        });

        mapperStateSvc.mapping = {jsonld: [], record: {description: ''}};
        element = $compile(angular.element('<mapping-preview></mapping-preview>'))(scope);
        scope.$digest();
        controller = element.controller('mappingPreview');
    });

    describe('controller methods', function() {
        it('should get a class name', function() {
            var classMapping = {};
            var result = controller.getClassName(classMapping);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get a prop name', function() {
            var propMapping = {};
            expect(typeof controller.getPropName(propMapping)).toBe('string');
            expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalled();
        });
        it('should get the column index of a data mapping', function() {
            utilSvc.getPropertyValue.and.returnValue('0');
            expect(controller.getColumnIndex({})).toBe('0');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'columnIndex');
        });
        it('should test whether a property mapping is invalid', function() {
            expect(controller.isInvalid('')).toBe(false);
            mapperStateSvc.invalidProps = [{'@id': ''}];
            expect(controller.isInvalid('')).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-preview')).toBe(true);
        });
        it('with all class and property mappings displayed', function() {
            mappingManagerSvc.isDataMapping.and.returnValue(false);
            var classMappings = [{}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            var propMappings = [{}];
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var classListItems = element.querySelectorAll('.list > li');
            expect(classListItems.length).toBe(classMappings.length);
            _.forEach(classListItems, function(item) {
                expect(item.querySelectorAll('.props > li').length).toBe(propMappings.length);
            });
        });
        it('depending on the type of property mapping', function() {
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': '', 'columnIndex': [{'@value': '0'}]}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            expect(delimitedManagerSvc.getHeader).toHaveBeenCalled();

            delimitedManagerSvc.getHeader.calls.reset();
            mappingManagerSvc.isDataMapping.and.returnValue(false);
            scope.$digest();
            expect(delimitedManagerSvc.getHeader).not.toHaveBeenCalled();
        });
        it('depending on whether a property mapping is valid', function() {
            spyOn(controller, 'isInvalid').and.returnValue(false);
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': '', 'columnIndex': [{'@value': '0'}]}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var propItem = angular.element(element.querySelectorAll('.props > li')[0]);
            expect(propItem.hasClass('error-display')).toBe(false);

            controller.isInvalid.and.returnValue(true);
            scope.$digest();
            expect(propItem.hasClass('error-display')).toBe(true);
        });
    });
});
