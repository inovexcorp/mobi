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
describe('Axiom Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontologyManagerSvc, ontoUtils, prefixes, manchesterSvc, ontologyManagerSvc, splitIRI;
    var localNameMap = {
        'ClassA': 'http://test.com/ClassA',
        'PropA': 'http://test.com/PropA'
    };

    beforeEach(function() {
        module('templates');
        module('axiomOverlay');
        mockResponseObj();
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        mockPrefixes();
        mockManchesterConverter();
        mockOntologyManager();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _responseObj_, _ontologyUtilsManagerService_, _prefixes_, _manchesterConverterService_, _ontologyManagerService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            resObj = _responseObj_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            manchesterSvc = _manchesterConverterService_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRI = _splitIRIFilter_;
        });

        invertedMap = _.invert(localNameMap);
        ontologyStateSvc.listItem.iriList = _.values(localNameMap);
        splitIRI.and.callFake(function(iri) {
            return {end: invertedMap[iri]};
        });
        scope.axiomList = [];
        scope.onSubmit = jasmine.createSpy('onSubmit');
        element = $compile(angular.element('<axiom-overlay axiom-list="axiomList" on-submit="onSubmit()"></axiom-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('axiomOverlay');
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = element.isolateScope();
        });
        it('axiomList is one way bound', function() {
            this.isolatedScope.axiomList = [{}];
            scope.$digest();
            expect(scope.axiomList).toEqual([]);
        });
        it('onSubmit to be called in parent scope', function() {
            this.isolatedScope.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('axiom-overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with custom-labels', function() {
            expect(element.find('custom-label').length).toBe(3);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(element.find('tab').length).toBe(2);
        });
        it('with ui-selects', function() {
            expect(element.find('ui-select').length).toBe(2);
        });
        it('with a ui-codemirror', function() {
            expect(element.find('ui-codemirror').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with buttons to add and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the form is invalid', function() {
            controller.axiom = {};
            controller.values = [{}];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.form.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether an axiom is selected', function() {
            controller.values = [{}];
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.axiom = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether values have been selected', function() {
            controller.axiom = {};
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether an expression has been entered', function() {
            controller.axiom = {};
            controller.tabs.list = false;
            controller.tabs.editor = true;
            scope.$digest();
            var button = angular.element(element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.expression = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the expression editor is readOnly', function() {
            var codemirrorWrapper = angular.element(element.querySelectorAll('.codemirror-wrapper')[0]);
            expect(codemirrorWrapper.hasClass('readOnly')).toEqual(true);

            controller.editorOptions.readOnly = false;
            scope.$digest();
            expect(codemirrorWrapper.hasClass('readOnly')).toEqual(false);
        });
    });
    describe('controller methods', function() {
        describe('should add an axiom', function() {
            var axiom;
            beforeEach(function() {
                axiom = 'axiom';
                controller.values = [{}];
                controller.axiom = {};
                controller.expression = 'PropA some ClassA';
                resObj.getItemIri.and.callFake(function(obj) {
                    return obj === controller.axiom ? axiom : 'value';
                });
                ontologyStateSvc.showAxiomOverlay = true;
            });
            describe('if adding a list', function() {
                beforeEach(function() {
                    controller.tabs.list = true;
                    controller.tabs.editor = false;
                });
                describe('and the selected entity already has the axiom', function() {
                    var previousValue = {'@id': 'prev'};
                    it('and the axiom is rdfs:range', function() {
                        axiom = prefixes.rdfs + 'range';
                        ontologyStateSvc.listItem.selected = _.set({}, axiom, [previousValue]);
                        controller.addAxiom();
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(controller.values.length + 1);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain(previousValue);
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                    it('and the axiom is not rdfs:range', function() {
                        ontologyStateSvc.listItem.selected = _.set({}, axiom, [previousValue]);
                        controller.addAxiom();
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(controller.values.length + 1);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain(previousValue);
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                });
                describe('if the selected entity does not have the axiom', function() {
                    it('and the axiom is rdfs:range', function() {
                        axiom = prefixes.rdfs + 'range';
                        controller.addAxiom();
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(controller.values.length);
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                    it('and the axiom is not rdfs:range', function() {
                        controller.addAxiom();
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(controller.values.length);
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                });
            });
            describe('if adding an expression', function() {
                var manchesterResult;
                beforeEach(function() {
                    manchesterResult = {
                        errorMessage: '',
                        jsonld: []
                    };
                    controller.tabs.list = false;
                    controller.tabs.editor = true;
                    manchesterSvc.manchesterToJsonld.and.returnValue(manchesterResult);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                });
                it('unless the expression is invalid', function() {
                    manchesterResult.errorMessage = 'This is an error';
                    controller.addAxiom();
                    expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(controller.expression, localNameMap, false);
                    expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.showAxiomOverlay).toBe(true);
                    expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toEqual('This is an error');
                });
                it('unless no blank nodes could be created', function() {
                    controller.addAxiom();
                    expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(controller.expression, localNameMap, false);
                    expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.showAxiomOverlay).toBe(true);
                    expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBeTruthy();
                });
                describe('and the selected entity already has the axiom', function() {
                    var previousValue = {'@id': 'prev'};
                    var blankNodes = [{'@id': 'bnode1'}, {'@id': 'bnode2'}];
                    beforeEach(function() {
                        manchesterResult.jsonld = blankNodes;
                    });
                    it('and the axiom is rdfs:range', function() {
                        axiom = prefixes.rdfs + 'range';
                        ontologyStateSvc.listItem.selected = _.set({}, axiom, [previousValue]);
                        controller.addAxiom();
                        expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(controller.expression, localNameMap, false);
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(2);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain(previousValue);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain({'@id': blankNodes[0]['@id']});
                        _.forEach(blankNodes, function(node) {
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                    it('and the axiom is not rdfs:range', function() {
                        ontologyStateSvc.listItem.selected = _.set({}, axiom, [previousValue]);
                        controller.addAxiom();
                        expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(controller.expression, localNameMap, false);
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(2);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain(previousValue);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain({'@id': blankNodes[0]['@id']});
                        _.forEach(blankNodes, function(node) {
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                });
                describe('and the selected entity does not have the axiom', function() {
                    var blankNodes = [{'@id': 'bnode1'}, {'@id': 'bnode2'}];
                    beforeEach(function() {
                        manchesterResult.jsonld = blankNodes;
                    });
                    it('and the axiom is rdfs:range', function() {
                        axiom = prefixes.rdfs + 'range';
                        controller.addAxiom();
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(1);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain({'@id': blankNodes[0]['@id']});
                        _.forEach(blankNodes, function(node) {
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                    it('and the axiom is not rdfs:range', function() {
                        controller.addAxiom();
                        expect(ontologyStateSvc.listItem.selected[axiom].length).toBe(1);
                        expect(ontologyStateSvc.listItem.selected[axiom]).toContain({'@id': blankNodes[0]['@id']});
                        _.forEach(blankNodes, function(node) {
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                    });
                });
            });
        });
    });
    it('should call the correct methods when the Add button is clicked', function() {
        controller = element.controller('axiomOverlay');
        controller.axiom = {};
        controller.values = [{}];
        spyOn(controller, 'addAxiom');
        scope.$digest();

        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.addAxiom).toHaveBeenCalled();
        expect(scope.onSubmit).toHaveBeenCalled();
    });
    it('should set the correct state when the Cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showAxiomOverlay).toBe(false);
    });
});