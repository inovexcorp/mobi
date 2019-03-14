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
describe('Class Select component', function() {
    var $compile, scope, ontologyManagerSvc, splitIRI;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockOntologyManager();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRI = _splitIRIFilter_;
        });

        scope.classes = [];
        scope.selectedClass = undefined;
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<class-select classes="classes" selected-class="selectedClass" change-event="changeEvent(value)" is-disabled-when="isDisabledWhen"></class-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('selectedClass should be one way bound', function() {
            this.controller.selectedClass = {};
            scope.$digest();
            expect(scope.selectedClass).toBeUndefined();
        });
        it('classes should be one way bound', function() {
            this.controller.classes = [{}];
            scope.$digest();
            expect(scope.classes).not.toEqual([{}]);
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: {}});
            expect(scope.changeEvent).toHaveBeenCalledWith({});
        });
    });
    describe('controller methods', function() {
        it('should get the ontology id of a class', function() {
            expect(this.controller.getOntologyId({ontologyId: 'test'})).toEqual('test');
            expect(splitIRI).not.toHaveBeenCalled();

            splitIRI.and.returnValue({begin: 'test'});
            expect(this.controller.getOntologyId({classObj: {'@id': ''}})).toEqual('test');
            expect(splitIRI).toHaveBeenCalledWith('');
        });
        describe('should set the class list for the select', function() {
            beforeEach(function() {
                this.ontologyId = 'ontologyId';
                ontologyManagerSvc.isDeprecated.and.returnValue(false);
                ontologyManagerSvc.getEntityName.and.callFake(obj => obj['@id']);
                spyOn(this.controller, 'getOntologyId').and.returnValue(this.ontologyId);
            });
            describe('if search text is provided', function() {
                it('if there are less than 100 classes', function() {
                    this.controller.classes = [{classObj: {'@id': 'class3'}}, {classObj: {'@id': 'class1'}}, {classObj: {'@id': 'class20'}}, {classObj: {'@id': 'class2'}}];
                    this.controller.setClasses('2');
                    expect(this.controller.selectClasses).toEqual([
                        {
                            classObj: {'@id': 'class2'},
                            name: 'class2',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        },
                        {
                            classObj: {'@id': 'class20'},
                            name: 'class20',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        }
                    ]);
                });
                it('if there are more than 100 classes', function() {
                    this.controller.classes = _.reverse(_.map(_.range(1, 201), num => ({classObj: {'@id': 'class' + num}})));
                    this.controller.setClasses('1');
                    expect(this.controller.selectClasses.length).toEqual(100);
                    expect(this.controller.selectClasses[0].name).toEqual('class1');
                    _.forEach(this.controller.selectClasses, clazz => {
                        expect(clazz.name).toEqual(clazz.classObj['@id']);
                        expect(clazz.isDeprecated).toEqual(false);
                        expect(clazz.groupHeader).toEqual(this.ontologyId);
                    });
                });
            });
            describe('if no search text is provided', function() {
                it('if there are less than 100 classes', function() {
                    this.controller.classes = [{classObj: {'@id': 'class3'}}, {classObj: {'@id': 'class1'}}, {classObj: {'@id': 'class2'}}];
                    this.controller.setClasses();
                    expect(this.controller.selectClasses).toEqual([
                        {
                            classObj: {'@id': 'class1'},
                            name: 'class1',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        },
                        {
                            classObj: {'@id': 'class2'},
                            name: 'class2',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        },
                        {
                            classObj: {'@id': 'class3'},
                            name: 'class3',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        }
                    ]);
                });
                it('if there are more than 100 classes', function() {
                    this.controller.classes = _.reverse(_.map(_.range(1, 151), num => ({classObj: {'@id': 'class' + num}})));
                    this.controller.setClasses();
                    expect(this.controller.selectClasses.length).toEqual(100);
                    expect(this.controller.selectClasses[0].name).toEqual('class1');
                    _.forEach(this.controller.selectClasses, clazz => {
                        expect(clazz.name).toEqual(clazz.classObj['@id']);
                        expect(clazz.isDeprecated).toEqual(false);
                        expect(clazz.groupHeader).toEqual(this.ontologyId);
                    });
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CLASS-SELECT');
            expect(this.element.querySelectorAll('.class-select').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
    });
});