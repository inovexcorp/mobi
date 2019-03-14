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
describe('Prop Select component', function() {
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

        scope.props = [];
        scope.isDisabledWhen = false;
        scope.selectedProp = undefined;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" is-disabled-when="isDisabledWhen" change-event="changeEvent(value)"></prop-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('selectedProp should be one way bound', function() {
            this.controller.selectedProp = {};
            scope.$digest();
            expect(scope.selectedProp).toBeUndefined();
        });
        it('props should be one way bound', function() {
            this.controller.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([]);
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
        it('should get the ontology id of a prop', function() {
            expect(this.controller.getOntologyId({ontologyId: 'test'})).toEqual('test');
            expect(splitIRI).not.toHaveBeenCalled();

            splitIRI.and.returnValue({begin: 'test'});
            expect(this.controller.getOntologyId({propObj: {'@id': ''}})).toEqual('test');
            expect(splitIRI).toHaveBeenCalledWith('');
        });
        describe('should set the property list for the select', function() {
            beforeEach(function() {
                this.ontologyId = 'ontologyId';
                ontologyManagerSvc.isDeprecated.and.returnValue(false);
                ontologyManagerSvc.getEntityName.and.callFake(obj => obj['@id']);
                spyOn(this.controller, 'getOntologyId').and.returnValue(this.ontologyId);
            });
            describe('if search text is provided', function() {
                it('if there are less than 100 properties', function() {
                    this.controller.props = [{propObj: {'@id': 'prop3'}}, {propObj: {'@id': 'prop1'}}, {propObj: {'@id': 'prop20'}}, {propObj: {'@id': 'prop2'}}];
                    this.controller.setProps('2');
                    expect(this.controller.selectProps).toEqual([
                        {
                            propObj: {'@id': 'prop2'},
                            name: 'prop2',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        },
                        {
                            propObj: {'@id': 'prop20'},
                            name: 'prop20',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        }
                    ]);
                });
                it('if there are more than 100 props', function() {
                    this.controller.props = _.reverse(_.map(_.range(1, 201), num => ({propObj: {'@id': 'prop' + num}})));
                    this.controller.setProps('1');
                    expect(this.controller.selectProps.length).toEqual(100);
                    expect(this.controller.selectProps[0].name).toEqual('prop1');
                    _.forEach(this.controller.selectProps, prop => {
                        expect(prop.name).toEqual(prop.propObj['@id']);
                        expect(prop.isDeprecated).toEqual(false);
                        expect(prop.groupHeader).toEqual(this.ontologyId);
                    });
                });
            });
            describe('if no search text is provided', function() {
                it('if there are less than 100 props', function() {
                    this.controller.props = [{propObj: {'@id': 'prop3'}}, {propObj: {'@id': 'prop1'}}, {propObj: {'@id': 'prop2'}}];
                    this.controller.setProps();
                    expect(this.controller.selectProps).toEqual([
                        {
                            propObj: {'@id': 'prop1'},
                            name: 'prop1',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        },
                        {
                            propObj: {'@id': 'prop2'},
                            name: 'prop2',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        },
                        {
                            propObj: {'@id': 'prop3'},
                            name: 'prop3',
                            isDeprecated: false,
                            groupHeader: this.ontologyId
                        }
                    ]);
                });
                it('if there are more than 100 props', function() {
                    this.controller.props = _.reverse(_.map(_.range(1, 151), num => ({propObj: {'@id': 'prop' + num}})));
                    this.controller.setProps();
                    expect(this.controller.selectProps.length).toEqual(100);
                    expect(this.controller.selectProps[0].name).toEqual('prop1');
                    _.forEach(this.controller.selectProps, prop => {
                        expect(prop.name).toEqual(prop.propObj['@id']);
                        expect(prop.isDeprecated).toEqual(false);
                        expect(prop.groupHeader).toEqual(this.ontologyId);
                    });
                });
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PROP-SELECT');
            expect(this.element.querySelectorAll('.prop-select').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
    });
});