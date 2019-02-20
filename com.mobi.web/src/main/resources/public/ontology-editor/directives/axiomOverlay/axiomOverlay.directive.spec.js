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
describe('Axiom Overlay directive', function() {
    var $compile, scope, $q, ontologyStateSvc, util, propertyManagerSvc, ontologyManagerSvc, ontoUtils, prefixes, manchesterSvc, ontologyManagerSvc, splitIRI, removeIriFromArray;

    beforeEach(function() {
        module('templates');
        module('axiomOverlay');
        mockOntologyState();
        mockUtil();
        mockOntologyUtilsManager();
        mockPrefixes();
        mockManchesterConverter();
        mockOntologyManager();
        mockPropertyManager();
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();
        injectRemoveIriFromArrayFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _utilService_, _ontologyUtilsManagerService_, _prefixes_, _manchesterConverterService_, _ontologyManagerService_, _propertyManagerService_, _splitIRIFilter_, _removeIriFromArrayFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            util = _utilService_,
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            manchesterSvc = _manchesterConverterService_;
            ontologyManagerSvc = _ontologyManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            splitIRI = _splitIRIFilter_;
            removeIriFromArray = _removeIriFromArrayFilter_;
        });

        this.localNameMap = {
            'ClassA': 'http://test.com/ClassA',
            'PropA': 'http://test.com/PropA'
        };
        var invertedMap = _.invert(this.localNameMap);
        ontologyStateSvc.listItem.iriList = _.values(this.localNameMap);
        splitIRI.and.callFake(iri => ({end: invertedMap[iri]}));

        scope.resolve = {axiomList: []};
        scope.dismiss = jasmine.createSpy('dismiss');
        scope.close = jasmine.createSpy('close');
        this.element = $compile(angular.element('<axiom-overlay resolve="resolve" dismiss="dismiss()" close="close($value)"></axiom-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('axiomOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        util = null;
        propertyManagerSvc = null;
        ontologyManagerSvc = null;
        ontoUtils = null;
        prefixes = null;
        manchesterSvc = null;
        ontologyManagerSvc = null;
        splitIRI = null;
        removeIriFromArray = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('AXIOM-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with custom-labels', function() {
            expect(this.element.find('custom-label').length).toBe(3);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(2);
        });
        it('with ui-selects', function() {
            expect(this.element.find('ui-select').length).toBe(2);
        });
        it('with a ui-codemirror', function() {
            expect(this.element.find('ui-codemirror').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the form is invalid', function() {
            this.controller.axiom = {};
            this.controller.values = [{}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer .btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether an axiom is selected', function() {
            this.controller.values = [{}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.axiom = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether values have been selected', function() {
            this.controller.axiom = {};
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.values = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether an expression has been entered', function() {
            this.controller.axiom = {};
            this.controller.tabs.list = false;
            this.controller.tabs.editor = true;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.modal-footer .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.expression = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the expression editor is readOnly', function() {
            var codemirrorWrapper = angular.element(this.element.querySelectorAll('.codemirror-wrapper')[0]);
            expect(codemirrorWrapper.hasClass('readOnly')).toEqual(true);

            this.controller.editorOptions.readOnly = false;
            scope.$digest();
            expect(codemirrorWrapper.hasClass('readOnly')).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should get the namespace of an axiom IRI', function() {
            util.getIRINamespace.and.returnValue('namespace');
            expect(this.controller.getIRINamespace({iri: 'axiom'})).toEqual('namespace');
            expect(util.getIRINamespace).toHaveBeenCalledWith('axiom');
        });
        it('should get the localName of an axiom IRI', function() {
            util.getIRILocalName.and.returnValue('localName');
            expect(this.controller.getIRILocalName({iri: 'axiom'})).toEqual('localName');
            expect(util.getIRILocalName).toHaveBeenCalledWith('axiom');
        });
        describe('should add an axiom', function() {
            beforeEach(function() {
                this.controller.values = ['value'];
                this.controller.axiom = {iri: 'axiom'};
                this.controller.expression = 'PropA some ClassA';
                ontologyStateSvc.showAxiomOverlay = true;
                ontoUtils.saveCurrentChanges.and.returnValue($q.when());
                propertyManagerSvc.addId.and.returnValue(true);
            });
            describe('if adding a list', function() {
                beforeEach(function() {
                    this.controller.tabs.list = true;
                    this.controller.tabs.editor = false;
                });
                describe('and the axiom is rdfs:range', function() {
                    beforeEach(function() {
                        this.controller.axiom.iri = prefixes.rdfs + 'range';
                    });
                    it('unless a value is duplicated', function() {
                        propertyManagerSvc.addId.and.returnValue(false);
                        this.controller.addAxiom();
                        scope.$apply();
                        expect(propertyManagerSvc.addId.calls.count()).toEqual(this.controller.values.length);
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.axiom.iri, 'value');
                        expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                        expect(scope.close).not.toHaveBeenCalled();
                        expect(util.createWarningToast).toHaveBeenCalled();
                    });
                    it('and at least one value was added', function() {
                        this.controller.addAxiom();
                        scope.$apply();
                        expect(propertyManagerSvc.addId.calls.count()).toEqual(this.controller.values.length);
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.axiom.iri, 'value');
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalledWith({axiom: this.controller.axiom.iri, values: this.controller.values});
                        expect(util.createWarningToast).not.toHaveBeenCalled();
                    });
                });
                describe('and the axiom is not rdfs:range', function() {
                    it('unless a value is duplicated', function() {
                        propertyManagerSvc.addId.and.returnValue(false);
                        this.controller.addAxiom();
                        scope.$apply();
                        expect(propertyManagerSvc.addId.calls.count()).toEqual(this.controller.values.length);
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.axiom.iri, 'value');
                        expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                        expect(scope.close).not.toHaveBeenCalled();
                        expect(util.createWarningToast).toHaveBeenCalled();
                    });
                    it('and at least one value was added', function() {
                        this.controller.addAxiom();
                        scope.$apply();
                        expect(propertyManagerSvc.addId.calls.count()).toEqual(this.controller.values.length);
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.axiom.iri, 'value');
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalledWith({axiom: this.controller.axiom.iri, values: this.controller.values});
                        expect(util.createWarningToast).not.toHaveBeenCalled();
                    });
                });
            });
            describe('if adding an expression', function() {
                beforeEach(function() {
                    this.manchesterResult = {
                        errorMessage: '',
                        jsonld: []
                    };
                    this.controller.tabs.list = false;
                    this.controller.tabs.editor = true;
                    manchesterSvc.manchesterToJsonld.and.returnValue(this.manchesterResult);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                });
                it('unless the expression is invalid', function() {
                    this.manchesterResult.errorMessage = 'This is an error';
                    this.controller.addAxiom();
                    expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(this.controller.expression, this.localNameMap, false);
                    expect(propertyManagerSvc.addId).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toEqual('This is an error');
                    expect(scope.close).not.toHaveBeenCalled();
                });
                it('unless no blank nodes could be created', function() {
                    this.controller.addAxiom();
                    expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(this.controller.expression, this.localNameMap, false);
                    expect(propertyManagerSvc.addId).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                    expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toBeTruthy();
                    expect(scope.close).not.toHaveBeenCalled();
                });
                describe('and blank nodes were created', function() {
                    beforeEach(function() {
                        this.blankNodes = [{'@id': 'bnode1'}, {'@id': 'bnode2'}];
                        this.manchesterResult.jsonld = this.blankNodes;
                    });
                    it('and the axiom is rdfs:range', function() {
                        this.controller.axiom.iri = prefixes.rdfs + 'range';
                        this.controller.addAxiom();
                        scope.$apply();
                        expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(this.controller.expression, this.localNameMap, false);
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.axiom.iri, this.blankNodes[0]['@id']);
                        _.forEach(this.blankNodes, node => {
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateSvc.updatePropertyIcon).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalledWith({axiom: this.controller.axiom.iri, values: []});
                    });
                    it('and the axiom is not rdfs:range', function() {
                        this.controller.addAxiom();
                        scope.$apply();
                        expect(manchesterSvc.manchesterToJsonld).toHaveBeenCalledWith(this.controller.expression, this.localNameMap, false);
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.controller.axiom.iri, this.blankNodes[0]['@id']);
                        _.forEach(this.blankNodes, function(node) {
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {'@id': node['@id']});
                        });
                        expect(ontologyStateSvc.updatePropertyIcon).not.toHaveBeenCalled();
                        expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalledWith({axiom: this.controller.axiom.iri, values: []});
                    });
                });
            });
        });
        describe('getValues should return the correct values when controller.axiom', function() {
            beforeEach(function() {
                this.controller.array = ['initial'];
            });
            it('has valuesKey', function() {
                ontoUtils.getSelectList.and.returnValue(['item']);
                ontologyStateSvc.listItem.selected = {'@id': 'id'};
                ontologyStateSvc.listItem.list = { iris: { first: 'ontology', second: 'ontology' } };
                this.controller.axiom = { valuesKey: 'list' };
                this.controller.getValues('I');
                expect(removeIriFromArray).toHaveBeenCalledWith(['first', 'second'], 'id');
                expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['first', 'second'], 'I', ontoUtils.getDropDownText);
                expect(this.controller.array).toEqual(['item']);
            });
            it('has valuesKey but not iris', function() {
                ontoUtils.getSelectList.and.returnValue(['item']);
                ontologyStateSvc.listItem.selected = {'@id': 'id'};
                ontologyStateSvc.listItem.list = { first: 'ontology', second: 'ontology' };
                this.controller.axiom = { valuesKey: 'list' };
                this.controller.getValues('I');
                expect(removeIriFromArray).toHaveBeenCalledWith(['first', 'second'], 'id');
                expect(ontoUtils.getSelectList).toHaveBeenCalledWith(['first', 'second'], 'I', ontoUtils.getDropDownText);
                expect(this.controller.array).toEqual(['item']);
            });
            it('does not have valuesKey', function() {
                this.controller.axiom = {};
                this.controller.getValues('stuff');
                expect(this.controller.array).toEqual([]);
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call the correct methods when the Add button is clicked', function() {
        this.controller.axiom = {};
        this.controller.values = [{}];
        spyOn(this.controller, 'addAxiom');
        scope.$digest();

        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addAxiom).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});