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
/*describe('Mapping Preview directive', function() {
    var $compile,
        scope,
        utilSvc,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        prefixes,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('mappingPreview');
        mockPrefixes();
        mockUtil();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _prefixes_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            prefixes = _prefixes_;
            $timeout = _$timeout_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-preview></mapping-preview>'))(scope);
            scope.$digest();
            controller = this.element.controller('mappingPreview');
        });
        it('should test whether an ontology exists', function() {
            var result = controller.ontologyExists();
            expect(result).toBe(false);

            ontologyManagerSvc.ontologyIds = [''];
            mappingManagerSvc.getSourceOntologyId.and.returnValue('');
            result = controller.ontologyExists();
            expect(result).toBe(true);

            ontologyManagerSvc.ontologyIds = [];
            ontologyManagerSvc.list = [{ontologyId: ''}];
            mappingManagerSvc.getSourceOntologyId.and.returnValue('');
            result = controller.ontologyExists();
            expect(result).toBe(true);
        });
        it('should get a class name', function() {
            var classMapping = {};
            var result = controller.getClassName(classMapping);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get a prop name', function() {
            var propMapping = {};
            var result = controller.getPropName(propMapping);
            expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get the column index of a data mapping', function() {
            var propMapping = {'columnIndex': [{'@value': '0'}]};
            var result = controller.getColumnIndex(propMapping);
            expect(result).toBe('0');
        });
        it('should test whether a property mapping is invalid', function() {
            var result = controller.isInvalid('');
            expect(result).toBe(false);
            mapperStateSvc.invalidProps = [{'@id': ''}];
            result = controller.isInvalid('');
            expect(result).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-preview></mapping-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-preview')).toBe(true);
        });
        it('with the correct classes based on whether the source ontology exists', function() {
            controller = this.element.controller('mappingPreview');
            spyOn(controller, 'ontologyExists').and.returnValue(true);
            scope.$digest();
            var sourceOntologyName = angular.element(this.element.querySelectorAll('.source-ontology')[0]);
            expect(sourceOntologyName.hasClass('text-danger')).toBe(false);
            expect(sourceOntologyName.find('span').length).toBe(0);

            controller.ontologyExists.and.returnValue(false);
            scope.$digest();
            expect(sourceOntologyName.hasClass('text-danger')).toBe(true);
            expect(sourceOntologyName.find('span').length).toBe(1);
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
            controller = this.element.controller('mappingPreview');
            spyOn(controller, 'isInvalid').and.returnValue(false);
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': '', 'columnIndex': [{'@value': '0'}]}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var propItem = angular.element(this.element.querySelectorAll('.props > li')[0]);
            expect(propItem.hasClass('error-msg')).toBe(false);

            controller.isInvalid.and.returnValue(true);
            scope.$digest();
            expect(propItem.hasClass('error-msg')).toBe(true);
        });
    });
});*/
