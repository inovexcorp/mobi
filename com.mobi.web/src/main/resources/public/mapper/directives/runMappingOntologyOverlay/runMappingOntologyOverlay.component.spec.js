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
describe('Run Mapping Ontology Overlay component', function() {
    var $compile, scope, $q, mapperStateSvc, delimitedManagerSvc, catalogManagerSvc, ontologyStateSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('runMappingOntologyOverlay');
        injectHighlightFilter();
        injectTrustedFilter();
        mockMapperState();
        mockDelimitedManager();
        mockDatasetManager();
        mockCatalogManager();
        mockOntologyState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _mapperStateService_, _delimitedManagerService_, _catalogManagerService_, _ontologyStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });


        mapperStateSvc.mapping = {record: {title: 'record'}, jsonld: []};
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<run-mapping-ontology-overlay close="close()" dismiss="dismiss()"></run-mapping-ontology-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('runMappingOntologyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should set the correct state for running mapping', function() {
            beforeEach(function() {
                this.controller.branchId = 'branch';
                this.controller.update = false;
                this.step = mapperStateSvc.step;
                this.controller.ontology = {'@id': 'ontologyIRI', [prefixes.catalog + 'masterBranch']: [{'@id': 'branch'}]};
                delimitedManagerSvc.mapAndCommit.and.returnValue($q.when({status: 200}));
            });
            describe('if it is also being saved', function() {
                describe('and there are changes', function() {
                    beforeEach(function() {
                        mapperStateSvc.editMapping = true;
                        mapperStateSvc.isMappingChanged.and.returnValue(true);
                    });
                    it('unless an error occurs', function() {
                        mapperStateSvc.saveMapping.and.returnValue($q.reject('Error message'));
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndDownload).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndUpload).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(this.step);
                        expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                        expect(scope.close).not.toHaveBeenCalled();
                        expect(this.controller.errorMessage).toEqual('Error message');
                    });
                    describe('successfully', function() {
                        beforeEach(function() {
                            this.newId = 'id';
                            mapperStateSvc.saveMapping.and.returnValue($q.when(this.newId));
                            utilSvc.getPropertyId.and.returnValue('branch');
                        });
                        it('committing the data with no active merge', function() {
                            ontologyStateSvc.list = [{ontologyRecord: {recordId: this.controller.ontology['@id'], branchId: 'branch'}, merge: {active: false}}];
                            this.controller.run();
                            scope.$apply();
                            expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                            expect(mapperStateSvc.mapping.record.id).toEqual(this.newId);
                            expect(delimitedManagerSvc.mapAndCommit).toHaveBeenCalledWith(this.newId, this.controller.ontology['@id'], this.controller.branchId, this.controller.update);
                            expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(scope.close).toHaveBeenCalled();
                            expect(this.controller.errorMessage).toEqual('');
                        });
                        it('committing the data with an active merge', function() {
                            ontologyStateSvc.list = [{ontologyRecord: {recordId: this.controller.ontology['@id'], branchId: 'branch'}, merge: {active: true}}];
                            this.controller.run();
                            scope.$apply();
                            expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                            expect(mapperStateSvc.mapping.record.id).toEqual(this.newId);
                            expect(delimitedManagerSvc.mapAndCommit).toHaveBeenCalledWith(this.newId, this.controller.ontology['@id'], this.controller.branchId, this.controller.update);
                            expect(utilSvc.createWarningToast).toHaveBeenCalled();
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(scope.close).toHaveBeenCalled();
                            expect(this.controller.errorMessage).toEqual('');
                        });
                    });
                });
                describe('and there are no changes', function() {
                    beforeEach(function() {
                        mapperStateSvc.isMappingChanged.and.returnValue(false);
                        utilSvc.getPropertyId.and.returnValue('branch');
                    });
                    it('and commits the data with no active merge', function() {
                        ontologyStateSvc.list = [{ontologyRecord: {recordId: this.controller.ontology['@id'], branchId: 'branch'}, merge: {active: false}}];
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndCommit).toHaveBeenCalledWith(this.newId, this.controller.ontology['@id'], this.controller.branchId, this.controller.update);
                        expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('and commits the data with an active merge', function() {
                        ontologyStateSvc.list = [{ontologyRecord: {recordId: this.controller.ontology['@id'], branchId: 'branch'}, merge: {active: true}}];
                        this.controller.run();
                        scope.$apply();
                        expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                        expect(delimitedManagerSvc.mapAndCommit).toHaveBeenCalledWith(this.newId, this.controller.ontology['@id'], this.controller.branchId, this.controller.update);
                        expect(utilSvc.createWarningToast).toHaveBeenCalled();
                        expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                        expect(mapperStateSvc.initialize).toHaveBeenCalled();
                        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                        expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                        expect(scope.close).toHaveBeenCalled();
                    });
                });
            });
            describe('if it is not being saved', function() {
                beforeEach(function() {
                    mapperStateSvc.editMapping = false;
                });
                it('and commits the data', function() {
                    this.controller.runMethod = 'upload';
                    this.controller.run();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.mapAndCommit).toHaveBeenCalledWith(this.newId, this.controller.ontology['@id'], this.controller.branchId, this.controller.update);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(scope.close).toHaveBeenCalled();
                });
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RUN-MAPPING-ONTOLOGY-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with ui-selects', function() {
            expect(this.element.find('ui-select').length).toBe(2);
        });
        it('with radio buttons', function() {
            expect(this.element.find('radio-button').length).toBe(2);
        })
        it('with buttons for cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
    it('should call cancel when the cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call run when the run button is clicked', function() {
        spyOn(this.controller, 'run');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.run).toHaveBeenCalled();
    });
});