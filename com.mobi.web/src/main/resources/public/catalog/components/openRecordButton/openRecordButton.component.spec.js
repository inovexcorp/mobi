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
describe('Open Record Button component', function() {
    var $compile, $state, $q, scope, catalogStateSvc, mapperStateSvc, ontologyStateSvc, policyEnforcementSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogState();
        mockMapperState();
        mockOntologyState();
        mockPolicyEnforcement();
        mockPolicyManager();
        mockUtil();
        mockPrefixes();

        module(function($provide) {
            $provide.service('$state', function() {
                this.go = jasmine.createSpy('go');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$state_, _$q_, _catalogStateService_, _mapperStateService_, _ontologyStateService_, _policyEnforcementService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            $state = _$state_;
            $q = _$q_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
            mapperStateSvc = _mapperStateService_;
            ontologyStateSvc = _ontologyStateService_;
            policyEnforcementSvc = _policyEnforcementService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        scope.record = {
            '@id': 'recordId',
            '@type': [prefixes.catalog + 'Record']
        };
        scope.flat = '';
        scope.stopProp = '';
        this.element = $compile(angular.element('<open-record-button record="record" flat="flat" stop-prop="stopProp"></open-record-button>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('openRecordButton');
    });

    afterEach(function() {
        $compile = null;
        $state = null;
        $q = null;
        scope = null;
        catalogStateSvc = null;
        mapperStateSvc = null;
        ontologyStateSvc = null;
        policyEnforcementSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        describe('showButton', function() {
            describe('to true', function() {
                it('when it is not an ontology record', function() {
                    expect(this.controller.showButton).toEqual(true);
                });
                it('when it is an ontology record and the user can view', function() {
                    catalogStateSvc.getRecordType.and.returnValue(prefixes.ontologyEditor + 'OntologyRecord');
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
                    this.controller.$onInit();
                    scope.$apply();
                    expect(this.controller.showButton).toEqual(true);
                });
            });
            describe('to false', function() {
                it('when it is an ontology record and the user cannot view', function() {
                    catalogStateSvc.getRecordType.and.returnValue(prefixes.ontologyEditor + 'OntologyRecord');
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
                    this.controller.$onInit();
                    scope.$apply();
                    expect(this.controller.showButton).toEqual(false);
                });
            });
        });
    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            var copy = angular.copy(scope.record);
            this.controller.record = {};
            scope.$digest();
            expect(scope.record).toEqual(copy);
        });
        it('flat is one way bound', function() {
            this.controller.flat = undefined;
            scope.$digest();
            expect(scope.flat).toEqual('');
        });
        it('stopProp is one way bound', function() {
            this.controller.stopProp = undefined;
            scope.$digest();
            expect(scope.stopProp).toEqual('');
        });
    });
    describe('controller methods', function() {
        describe('openRecord calls the correct method when record is a', function() {
            beforeEach(function() {
                this.controller.stopPropagation = false;
            });
            it('OntologyRecord', function() {
                this.controller.recordType = prefixes.ontologyEditor + 'OntologyRecord';
                spyOn(this.controller, 'openOntology');
                this.controller.openRecord();
                expect(this.controller.openOntology).toHaveBeenCalled();
            });
            it('MappingRecord', function() {
                this.controller.recordType = prefixes.delim + 'MappingRecord';
                spyOn(this.controller, 'openMapping');
                this.controller.openRecord();
                expect(this.controller.openMapping).toHaveBeenCalled();
            });
            it('DatasetRecord', function() {
                this.controller.recordType = prefixes.dataset + 'DatasetRecord';
                spyOn(this.controller, 'openDataset');
                this.controller.openRecord();
                expect(this.controller.openDataset).toHaveBeenCalled();
            });
        });
        describe('openOntology should navigate to the ontology editor module and open the ontology', function() {
            beforeEach(function() {
                utilSvc.getDctermsValue.and.returnValue('title');
            });
            it('if it is already open', function() {
                ontologyStateSvc.list = [{ontologyRecord: {recordId: 'recordId'}}];
                this.controller.openOntology();
                expect(ontologyStateSvc.openOntology).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem).toEqual({ontologyRecord: {recordId: 'recordId'}, active: true});
                expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
            });
            describe('if it is not already open', function() {
                it('successfully', function() {
                    var ontologyId = 'ontologyId';
                    ontologyStateSvc.openOntology.and.returnValue($q.resolve(ontologyId));
                    this.controller.openOntology();
                    scope.$apply();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'recordId', '@type': [prefixes.catalog + 'Record']}, 'title');
                    expect(ontologyStateSvc.openOntology).toHaveBeenCalledWith('recordId', 'title');
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
                });
                it('unless an error occurs', function() {
                    ontologyStateSvc.openOntology.and.returnValue($q.reject('Error message'));
                    this.controller.openOntology();
                    scope.$apply();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'recordId', '@type': [prefixes.catalog + 'Record']}, 'title');
                    expect(ontologyStateSvc.openOntology).toHaveBeenCalledWith('recordId', 'title');
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                    expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
                });
            });
        });
        it('openMapping should navigate to the mapping module and select the mapping', function() {
            var record = {
                id: 'recordId',
                title: '',
                description: '',
                keywords: [],
                branch: ''
            };
            this.controller.openMapping();
            expect($state.go).toHaveBeenCalledWith('root.mapper');
            expect(mapperStateSvc.selectMapping).toHaveBeenCalledWith(record);
        });
        it('openDataset navigates to the dataset module', function() {
            this.controller.openDataset();
            expect($state.go).toHaveBeenCalledWith('root.datasets');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('OPEN-RECORD-BUTTON');
        });
        it('button type depending on whether isFlat is set', function() {
            this.controller.isFlat = true;
            scope.$digest();
            var raisedButton = angular.element(this.element.querySelectorAll('.btn-primary'));
            var flatButton = angular.element(this.element.querySelectorAll('.btn-flat-primary'));
            expect(raisedButton.length).toEqual(0);
            expect(flatButton.length).toEqual(1);

            this.controller.isFlat = false;
            scope.$digest();
            raisedButton = angular.element(this.element.querySelectorAll('.btn-primary'));
            flatButton = angular.element(this.element.querySelectorAll('.btn-flat-primary'));
            expect(raisedButton.length).toEqual(1);
            expect(flatButton.length).toEqual(0);
        });
        it('depending on showButton being true or false', function() {
            this.controller.showButton = true;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn'));
            expect(button.length).toEqual(1);

            this.controller.showButton = false;
            scope.$digest();
            button = angular.element(this.element.querySelectorAll('.btn'));
            expect(button.length).toEqual(0);
        });
        it('should call openRecord when clicked', function() {
            spyOn(this.controller, 'openRecord');
            scope.$digest();

            var editableArea = angular.element(this.element.querySelectorAll('.btn'));
            editableArea.triggerHandler('click');
            expect(this.controller.openRecord).toHaveBeenCalled();
        });
    });
});