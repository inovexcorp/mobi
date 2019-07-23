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
describe('Prop Preview component', function() {
    var $compile, scope, ontologyManagerSvc, mapperStateSvc, utilSvc, prefixes, splitIRI;

    beforeEach(function() {
        module('templates');
        module('mapper');
        injectSplitIRIFilter();
        mockOntologyManager();
        mockMapperState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mapperStateService_, _utilService_, _prefixes_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            splitIRI = _splitIRIFilter_;
        });

        scope.propObj = {};
        scope.ontologies = [];
        this.element = $compile(angular.element('<prop-preview prop-obj="propObj" ontologies="ontologies"></prop-preview>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propPreview');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        mapperStateSvc = null;
        utilSvc = null;
        prefixes = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('propObj should be one way bound', function() {
            this.controller.propObj = {'@id': ''};
            scope.$digest();
            expect(scope.propObj).toEqual({});
        });
        it('ontologies should be one way bound', function() {
            this.controller.ontologies = [{}];
            scope.$digest();
            expect(scope.ontologies).toEqual([]);
        });
    });
    describe('should set the correct variables when the propObj changes', function() {
        beforeEach(function() {
            scope.propObj = {'@id': 'prop'};
            ontologyManagerSvc.getEntityDescription.and.returnValue('Description');
            splitIRI.calls.reset();
        });
        describe('if it is a data property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.getEntityName.and.returnValue('Name');
            });
            it('and it has a range', function() {
                utilSvc.getPropertyId.and.returnValue('range');
                splitIRI.and.returnValue({end: 'double'});
                scope.$digest();
                expect(this.controller.rangeName).toEqual('double');
                expect(this.controller.name).toEqual('Name');
                expect(this.controller.description).toEqual('Description');
                expect(this.controller.rangeId).toEqual('range');
                expect(this.controller.rangeIsDeprecated).toEqual(false);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.isDeprecated).not.toHaveBeenCalled();
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith(scope.propObj, prefixes.rdfs + 'range');
                expect(splitIRI).toHaveBeenCalledWith('range');
            });
            it('and it does not have a range', function() {
                utilSvc.getPropertyId.and.returnValue('');
                scope.$digest();
                expect(this.controller.rangeName).toEqual('string');
                expect(this.controller.name).toEqual('Name');
                expect(this.controller.description).toEqual('Description');
                expect(this.controller.rangeId).toEqual('');
                expect(this.controller.rangeIsDeprecated).toEqual(false);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.isDeprecated).not.toHaveBeenCalled();
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith(scope.propObj, prefixes.rdfs + 'range');
                expect(splitIRI).toHaveBeenCalledWith('');
            });
        });
        describe('if it is a object property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                utilSvc.getPropertyId.and.returnValue('class');
                this.classObj = {'@id': 'class'};
                ontologyManagerSvc.getEntityName.and.callFake(obj => obj === this.classObj ? 'Class Name' : 'Name');
                this.controller.rangeName = 'original';
            });
            it('unless the range class is the same', function() {
                this.controller.rangeId = this.classObj['@id'];
                scope.$digest();
                expect(this.controller.rangeName).toEqual('original');
                expect(this.controller.name).toEqual('Name');
                expect(this.controller.description).toEqual('Description');
                expect(this.controller.rangeId).toEqual(this.classObj['@id']);
                expect(this.controller.rangeIsDeprecated).toEqual(false);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalledWith(this.classObj);
                expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.isDeprecated).not.toHaveBeenCalled();
                expect(splitIRI).not.toHaveBeenCalled();
            });
            describe('and the range class changed', function() {
                it('and it is deprecated', function() {
                    ontologyManagerSvc.isDeprecated.and.returnValue(true);
                    mapperStateSvc.availableClasses = [{classObj: this.classObj}];
                    scope.$digest();
                    expect(this.controller.rangeName).toEqual('Class Name');
                    expect(this.controller.name).toEqual('Name');
                    expect(this.controller.description).toEqual('Description');
                    expect(this.controller.rangeId).toEqual(this.classObj['@id']);
                    expect(this.controller.rangeIsDeprecated).toEqual(true);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(this.classObj);
                    expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.isDeprecated).toHaveBeenCalledWith(this.classObj);
                    expect(splitIRI).not.toHaveBeenCalled();
                });
                it('and it is not deprecated', function() {
                    ontologyManagerSvc.isDeprecated.and.returnValue(false);
                    mapperStateSvc.availableClasses = [{classObj: this.classObj}];
                    scope.$digest();
                    expect(this.controller.rangeName).toEqual('Class Name');
                    expect(this.controller.name).toEqual('Name');
                    expect(this.controller.description).toEqual('Description');
                    expect(this.controller.rangeId).toEqual(this.classObj['@id']);
                    expect(this.controller.rangeIsDeprecated).toEqual(false);
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(this.classObj);
                    expect(ontologyManagerSvc.getEntityDescription).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.isDeprecated).toHaveBeenCalledWith(this.classObj);
                    expect(splitIRI).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PROP-PREVIEW');
            expect(this.element.querySelectorAll('.prop-preview').length).toEqual(1);
        });
        it('depending on whether the range class is deprecated', function() {
            expect(this.element.querySelectorAll('.deprecated').length).toEqual(0);

            this.controller.rangeIsDeprecated = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.deprecated').length).toEqual(1);
        });
    });
});