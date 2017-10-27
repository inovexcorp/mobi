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
describe('Mapping Preview directive', function() {
    var $compile, scope, utilSvc, ontologyManagerSvc, mapperStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('mappingPreview');
        mockPrefixes();
        mockUtil();
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _utilService_, _mappingManagerService_, _mapperStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            prefixes = _prefixes_;
        });

        mapperStateSvc.mapping = {jsonld: [], record: {description: ''}};
        this.element = $compile(angular.element('<mapping-preview></mapping-preview>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingPreview');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        ontologyManagerSvc = null;
        mapperStateSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should create the IRI template for the class mapping', function() {
            expect(_.isString(this.controller.getIriTemplate({}))).toBe(true);
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'hasPrefix');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'localName');
        });
        describe('should get the value of a property mapping', function() {
            it('if it is data property', function() {
                mappingManagerSvc.isDataMapping.and.returnValue(true);
                utilSvc.getPropertyValue.and.returnValue('0');
                expect(this.controller.getPropValue({})).toBe('0');
                expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'columnIndex');
            });
            it('if is an object property', function() {
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                utilSvc.getDctermsValue.and.returnValue('Class');
                utilSvc.getPropertyId.and.returnValue('classMapping');
                mapperStateSvc.mapping.jsonld = [{'@id': 'classMapping'}];
                expect(this.controller.getPropValue({})).toBe('Class');
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.delim + 'classMapping');
                expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'classMapping'}, 'title');
            });
        });
        it('should test whether a property mapping is invalid', function() {
            expect(this.controller.isInvalid('')).toBe(false);
            mapperStateSvc.invalidProps = [{'@id': ''}];
            expect(this.controller.isInvalid('')).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-preview')).toBe(true);
        });
        it('with all class and property mappings displayed', function() {
            mappingManagerSvc.isDataMapping.and.returnValue(false);
            var classMappings = [{}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            var propMappings = [{}];
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var classListItems = this.element.querySelectorAll('.list > li');
            expect(classListItems.length).toBe(classMappings.length);
            _.forEach(classListItems, function(item) {
                expect(item.querySelectorAll('.props > li').length).toBe(propMappings.length);
            });
        });
        it('depending on whether a property mapping is valid', function() {
            spyOn(this.controller, 'isInvalid').and.returnValue(false);
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': '', 'columnIndex': [{'@value': '0'}]}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var propItem = angular.element(this.element.querySelectorAll('.props > li')[0]);
            expect(propItem.hasClass('error-display')).toBe(false);

            this.controller.isInvalid.and.returnValue(true);
            scope.$digest();
            expect(propItem.hasClass('error-display')).toBe(true);
        });
    });
});
