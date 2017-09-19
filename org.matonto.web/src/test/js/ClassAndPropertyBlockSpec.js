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
describe('Class And Property Block directive', function() {
    var $q, $compile, scope, element, controller, analyticStateSvc, ontologyManagerSvc, prefixes, utilSvc;

    beforeEach(function() {
        module('templates');
        module('classAndPropertyBlock');
        mockAnalyticState();
        mockOntologyManager();
        mockPrefixes();
        mockUtil();

        inject(function(_$q_, _$compile_, _$rootScope_, _analyticStateService_, _ontologyManagerService_, _prefixes_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            analyticStateSvc = _analyticStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });
        
        compileElement();
        controller = element.controller('classAndPropertyBlock');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('class-and-property-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a .btn-link', function() {
            expect(element.querySelectorAll('.btn-link').length).toBe(1);
        });
        it('with a .fa', function() {
            expect(element.querySelectorAll('.fa').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with .list-containers', function() {
            expect(element.querySelectorAll('.list-container').length).toBe(2);
        });
        it('with .list-container h1s', function() {
            expect(element.querySelectorAll('.list-container h1').length).toBe(2);
        });
        it('with .list-container md-list-item', function() {
            expect(element.querySelectorAll('.list-container md-list-item').length).toBe(0);
            analyticStateSvc.classes = [{title: 'class', id: 'class-id'}];
            analyticStateSvc.properties = [{title: 'property', id: 'property-id'}];
            scope.$apply();
            expect(element.querySelectorAll('.list-container md-list-item').length).toBe(2);
        });
    });
    describe('controller methods', function() {
        describe('isDisabled returns the proper value when classes', function() {
            it('contains selectedClass id', function() {
                analyticStateSvc.selectedClass = {id: 'id'};
                expect(controller.isDisabled(['id'])).toBe(false);
            });
            it('does not contain selectedClass id', function() {
                expect(controller.isDisabled(['id'])).toBe(true);
            });
        });
    });
    describe('on startup sets values correctly when classes and properties are', function() {
        it('populated', function() {
            analyticStateSvc.classes = [{}];
            analyticStateSvc.properties = [{}];
            compileElement();
            expect(ontologyManagerSvc.getOntology).not.toHaveBeenCalled();
        });
        describe('empty and getOntology', function() {
            var dataProp;
            beforeEach(function() {
                analyticStateSvc.datasets = [{
                    ontologies: [{
                        recordId: 'recordId',
                        branchId: 'branchId',
                        commitId: 'commitId'
                    }]
                }];
                objProp = {'@id': 'objectPropId'};
                objProp[prefixes.rdfs + 'domain'] = [{'@id': 'domainId'}];
                ontologyManagerSvc.getClasses.and.returnValue([{'@id': 'classId'}]);
                ontologyManagerSvc.getEntityName.and.returnValue('name');
                ontologyManagerSvc.getObjectProperties.and.returnValue([objProp]);
                ontologyManagerSvc.getDataTypeProperties.and.returnValue([{'@id': 'dataPropId'}]);
            });
            it('resolves', function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.when([]));
                compileElement();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
                expect(ontologyManagerSvc.getClasses).toHaveBeenCalledWith([]);
                expect(ontologyManagerSvc.getObjectProperties).toHaveBeenCalledWith([]);
                expect(ontologyManagerSvc.getDataTypeProperties).toHaveBeenCalledWith([]);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'classId'});
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(objProp);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'dataPropId'});
                expect(analyticStateSvc.classes).toEqual([{id: 'classId', title: 'name'}]);
                expect(analyticStateSvc.properties).toEqual([{id: 'objectPropId', title: 'name', classes: ['domainId']}, {id: 'dataPropId', title: 'name', classes: ['classId']}]);
            });
            it('rejects', function() {
                ontologyManagerSvc.getOntology.and.returnValue($q.reject('error'));
                compileElement();
                expect(ontologyManagerSvc.getOntology).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
    });
    
    function compileElement() {
        element = $compile(angular.element('<class-and-property-block></class-and-property-block>'))(scope);
        scope.$digest();
    }
});