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
describe('Mapping Preview component', function() {
    var $compile, scope, utilSvc, prefixes, mappingManagerSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockPrefixes();
        mockUtil();
        mockMappingManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _mappingManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            prefixes = _prefixes_;
        });

        scope.mapping = {jsonld: []};
        scope.invalidProps = [];
        this.element = $compile(angular.element('<mapping-preview mapping="mapping" invalid-props="invalidProps"></mapping-preview>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingPreview');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        prefixes = null;
        mappingManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('mapping should be one way bound', function() {
            var original = angular.copy(scope.mapping);
            this.controller.mapping = {};
            scope.$digest();
            expect(scope.mapping).toEqual(original);
        });
        it('invalidProps should be one way bound', function() {
            var original = angular.copy(scope.invalidProps);
            this.controller.invalidProps = [{}];
            scope.$digest();
            expect(scope.invalidProps).toEqual(original);
        });
    });
    describe('controller methods', function() {
        it('should create the IRI template for the class mapping', function() {
            expect(_.isString(this.controller.getIriTemplate({}))).toEqual(true);
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'hasPrefix');
            expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'localName');
        });
        describe('should get the value of a property mapping', function() {
            it('if it is data property', function() {
                mappingManagerSvc.isDataMapping.and.returnValue(true);
                utilSvc.getPropertyValue.and.returnValue('0');
                expect(this.controller.getPropValue({})).toEqual('0');
                expect(utilSvc.getPropertyValue).toHaveBeenCalledWith({}, prefixes.delim + 'columnIndex');
            });
            it('if is an object property', function() {
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                utilSvc.getDctermsValue.and.returnValue('Class');
                utilSvc.getPropertyId.and.returnValue('classMapping');
                this.controller.mapping.jsonld = [{'@id': 'classMapping'}];
                expect(this.controller.getPropValue({})).toEqual('Class');
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.delim + 'classMapping');
                expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'classMapping'}, 'title');
            });
        });
        it('should test whether a property mapping is invalid', function() {
            expect(this.controller.isInvalid('')).toEqual(false);
            this.controller.invalidProps = [{'@id': ''}];
            expect(this.controller.isInvalid('')).toEqual(true);
        });
    });
    it('should correctly update variables when the mapping changes', function() {
        spyOn(this.controller, 'getIriTemplate').and.returnValue('IRI Template');
        spyOn(this.controller, 'getPropValue').and.returnValue('Prop Value');
        spyOn(this.controller, 'isInvalid').and.returnValue(false);
        var classMappings = [{'@id': 'classMapping2'}, {'@id': 'classMapping1'}];
        mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
        var propMappings = [{'@id': 'propMapping2'}, {'@id': 'propMapping1'}];
        mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
        utilSvc.getDctermsValue.and.callFake(obj => obj['@id']);
        scope.mapping = {jsonld: [{}]};
        scope.$digest();
        expect(this.controller.classMappings.length).toEqual(classMappings.length);
        expect(this.controller.classMappings[0]['@id']).toEqual('classMapping1');
        _.forEach(this.controller.classMappings, classMapping => {
            expect(classMapping.title).toEqual(classMapping['@id']);
            expect(classMapping.iriTemplate).toEqual('IRI Template');
            expect(classMapping.propMappings.length).toEqual(propMappings.length);
            expect(classMapping.propMappings[0]['@id']).toEqual('propMapping1');
            _.forEach(classMapping.propMappings, propMapping => {
                expect(propMapping.title).toEqual(propMapping['@id']);
                expect(propMapping.value).toEqual('Prop Value');
                expect(propMapping.isInvalid).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MAPPING-PREVIEW');
            expect(this.element.querySelectorAll('.mapping-preview').length).toEqual(1);
        });
        it('with all class and property mappings displayed', function() {
            var propMappings = [{}];
            this.controller.classMappings = [{propMappings}];
            scope.$digest();
            var classListItems = this.element.querySelectorAll('.list > li');
            expect(classListItems.length).toEqual(this.controller.classMappings.length);
            _.forEach(classListItems, function(item) {
                expect(item.querySelectorAll('.props > li').length).toEqual(propMappings.length);
            });
        });
        it('depending on whether a property mapping is valid', function() {
            this.propMapping = {isInvalid: false};
            this.controller.classMappings = [{propMappings: [this.propMapping]}];
            scope.$digest();
            var propItem = angular.element(this.element.querySelectorAll('.props > li')[0]);
            expect(propItem.hasClass('text-danger')).toEqual(false);
            expect(propItem.hasClass('font-weight-bold')).toEqual(false);

            this.propMapping.isInvalid = true;
            scope.$digest();
            expect(propItem.hasClass('text-danger')).toEqual(true);
            expect(propItem.hasClass('font-weight-bold')).toEqual(true);
        });
    });
});
