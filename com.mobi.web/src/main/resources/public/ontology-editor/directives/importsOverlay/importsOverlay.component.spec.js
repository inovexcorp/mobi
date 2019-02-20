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
describe('Imports Overlay component', function() {
    var $q, $compile, scope, $httpBackend, ontologyStateSvc, httpSvc, utilSvc, prefixes, propertyManagerSvc, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('importsOverlay');
        injectRegexConstant();
        mockOntologyState();
        mockUtil();
        mockPrefixes();
        mockHttpService();
        mockCatalogManager();
        mockPropertyManager();
        injectRestPathConstant();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$q_, _$compile_, _$rootScope_, _$httpBackend_, _ontologyStateService_, _httpService_, _utilService_, _prefixes_, _propertyManagerService_, _catalogManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            ontologyStateSvc = _ontologyStateService_;
            httpSvc = _httpService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            propertyManagerSvc = _propertyManagerService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        this.catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<imports-overlay close="close()" dismiss="dismiss()"></imports-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('importsOverlay');
    });

    afterEach(function() {
        $q = null;
        $compile = null;
        scope = null;
        $httpBackend = null;
        ontologyStateSvc = null;
        httpSvc = null;
        utilSvc = null;
        prefixes = null;
        propertyManagerSvc = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('IMPORTS-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        ['h3', 'tabset', 'custom-label', 'search-bar', 'md-list'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(2);
        });
        it('depending on whether an error has occured on the URL tab', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.urlError = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether an error has occured on the Server tab', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.serverError = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the url pattern is incorrect', function() {
            var formGroup = angular.element(this.element.querySelectorAll('.form-group input')[0]);
            expect(formGroup.hasClass('is-invalid')).toBe(false);
            this.controller.form.url = {
                '$error': {
                    pattern: true
                }
            };
            scope.$digest();
            expect(formGroup.hasClass('is-invalid')).toBe(true);
        });
        it('depending on how many ontologies there are', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toEqual(0);

            this.controller.ontologies = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toEqual(this.controller.ontologies.length);
        });
        it('depending on how many ontologies are selected', function() {
            expect(this.element.querySelectorAll('.selected-ontologies .none-selected').length).toEqual(1);
            expect(this.element.querySelectorAll('.selected-ontologies .selected-ontology').length).toEqual(0);

            this.controller.selectedOntologies = [{recordId: 'A'}, {recordId: 'B'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-ontologies .none-selected').length).toEqual(0);
            expect(this.element.querySelectorAll('.selected-ontologies .selected-ontology').length).toEqual(this.controller.selectedOntologies.length);
        });
        it('depending on whether the button should be disabled', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.url = 'test';
            this.controller.tabs.url = false;
            this.controller.tabs.server = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.selectedOntologies = [{}];
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should set the ontology list', function() {
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error'));
                this.controller.setOntologies();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.spinnerId);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, jasmine.any(Object), this.controller.spinnerId);
                expect(this.controller.ontologies).toEqual([]);
                expect(this.controller.serverError).toEqual('Error');
            });
            it('successfully', function() {
                spyOn(this.controller, 'getOntologyIRI').and.returnValue('ontologyId');
                utilSvc.getDctermsValue.and.returnValue('title');
                var ontology1 = {'@id': 'ontology1'};
                var ontology2 = {'@id': 'ontology2'};
                var ontology3 = {'@id': 'ontology3'};
                this.controller.selectedOntologies = [{recordId: ontology3['@id']}];
                ontologyStateSvc.listItem.ontologyRecord = {recordId: ontology1['@id']};
                catalogManagerSvc.getRecords.and.returnValue($q.when({data: [ontology1, ontology2, ontology3]}));
                this.controller.setOntologies();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.spinnerId);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, jasmine.any(Object), this.controller.spinnerId);
                expect(this.controller.ontologies).toEqual([
                    {recordId: ontology2['@id'], ontologyIRI: 'ontologyId', title: 'title', selected: false},
                    {recordId: ontology3['@id'], ontologyIRI: 'ontologyId', title: 'title', selected: true}]);
                expect(this.controller.serverError).toEqual('');
            });
        });
        describe('should toggle an ontology if it has been been', function() {
            beforeEach(function() {
                this.ontology = {selected: true, title: 'A'};
            });
            it('selected', function() {
                this.controller.selectedOntologies = [{title: 'B'}];
                this.controller.toggleOntology(this.ontology);
                expect(this.controller.selectedOntologies).toEqual([this.ontology, {title: 'B'}]);
            });
            it('unselected', function() {
                this.ontology.selected = false;
                this.controller.selectedOntologies = [this.ontology];
                this.controller.toggleOntology(this.ontology);
                expect(this.controller.selectedOntologies).toEqual([]);
            });
        });
        it('should unselect an ontology', function() {
            var ontology = {selected: true};
            this.controller.selectedOntologies = [ontology];
            this.controller.unselectOntology(ontology);
            expect(ontology.selected).toEqual(false);
            expect(this.controller.selectedOntologies).toEqual([]);
        });
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilSvc.getPropertyId.and.returnValue('ontology')
            expect(this.controller.getOntologyIRI({})).toEqual('ontology');
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.ontologyEditor + 'ontologyIRI');
        });
        describe('should update the appropriate varibles if clicking the', function() {
            beforeEach(function() {
                this.controller.ontologies = [];
                this.controller.getOntologyConfig.searchText = 'test';
                this.controller.selectedOntologies = [{}];
                spyOn(this.controller, 'setOntologies');
            });
            describe('On Server tab', function() {
                it('if the ontologies have not been retrieved', function() {
                    this.controller.clickTab('server');
                    expect(this.controller.getOntologyConfig.searchText).toEqual('');
                    expect(this.controller.selectedOntologies).toEqual([]);
                    expect(this.controller.setOntologies).toHaveBeenCalled();
                });
                it('if the ontologies have been retrieved', function() {
                    this.controller.ontologies = [{}];
                    this.controller.clickTab('server');
                    expect(this.controller.getOntologyConfig.searchText).toEqual('test');
                    expect(this.controller.selectedOntologies).toEqual([{}]);
                    expect(this.controller.setOntologies).not.toHaveBeenCalled();
                });
            });
            it('URL tab', function() {
                this.controller.ontologies = [{}];
                this.controller.clickTab('url');
                expect(httpSvc.cancel).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getRecords).not.toHaveBeenCalled();
                expect(this.controller.setOntologies).not.toHaveBeenCalled();
                expect(this.controller.getOntologyConfig.searchText).toEqual('test');
                expect(this.controller.selectedOntologies).toEqual([{}]);
            });
        });
        describe('addImport should call the correct methods', function() {
            beforeEach(function() {
                spyOn(this.controller, 'confirmed');
                this.controller.openConfirmation = false;
            });
            describe('if importing from a URL', function() {
                beforeEach(function() {
                    this.controller.url = 'url';
                });
                it('and get request resolves', function() {
                    $httpBackend.expectGET('/mobirest/imported-ontologies/url').respond(200);
                    this.controller.addImport();
                    flushAndVerify($httpBackend);
                    expect(this.controller.confirmed).toHaveBeenCalledWith([this.controller.url], 'url');
                });
                it('when get request rejects', function() {
                    $httpBackend.expectGET('/mobirest/imported-ontologies/url').respond(400);
                    this.controller.addImport();
                    flushAndVerify($httpBackend);
                    expect(this.controller.urlError).toBe('The provided URL was unresolvable.');
                });
            });
            it('if importing Mobi ontologies', function() {
                this.controller.tabs.url = false;
                this.controller.tabs.server = true;
                this.controller.selectedOntologies = [{selected: true, ontologyIRI: 'ontology1', recordId: 'record1'}];
                this.controller.addImport();
                $httpBackend.verifyNoOutstandingExpectation();
                expect(this.controller.confirmed).toHaveBeenCalledWith(['ontology1'], 'server');
            });
        });
        describe('confirmed should call the correct methods', function() {
            beforeEach(function() {
                this.urls = ['url'];
                ontologyStateSvc.listItem.isSaved = false;
            });
            it('if there are duplciate values', function() {
                propertyManagerSvc.addId.and.returnValue(false);
                this.controller.confirmed(this.urls, 'url');
                _.forEach(this.urls, url => {
                    expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                });
                expect(utilSvc.createWarningToast).toHaveBeenCalledWith('Duplicate property values not allowed');
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.saveChanges).not.toHaveBeenCalled();
                expect(ontologyStateSvc.afterSave).not.toHaveBeenCalled();
                expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                expect(ontologyStateSvc.isCommittable).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.isSaved).toBe(false);
                expect(scope.close).not.toHaveBeenCalled();
                expect(scope.dismiss).toHaveBeenCalled();
            });
            describe('if there are no duplicated values', function() {
                beforeEach(function() {
                    propertyManagerSvc.addId.and.returnValue(true);
                    this.additionsObj = {
                        '@id': ontologyStateSvc.listItem.selected['@id'],
                    };
                    this.additionsObj[prefixes.owl + 'imports'] = _.map(this.urls, url => ({'@id': url}));
                });
                describe('when save changes resolves', function() {
                    beforeEach(function() {
                        ontologyStateSvc.saveChanges.and.returnValue($q.when());
                    });
                    describe('when after save resolves', function() {
                        beforeEach(function() {
                            ontologyStateSvc.afterSave.and.returnValue($q.when());
                        });
                        it('when update ontology resolves', function() {
                            ontologyStateSvc.isCommittable.and.returnValue(true);
                            ontologyStateSvc.updateOntology.and.returnValue($q.when());
                            this.controller.confirmed(this.urls, 'url');
                            scope.$apply();
                            _.forEach(this.urls, url => {
                                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                            });
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                            expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                            expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                            expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                            expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                            expect(scope.close).toHaveBeenCalled();
                            expect(scope.dismiss).not.toHaveBeenCalled();
                        });
                        it('when update ontology rejects', function() {
                            ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                            this.controller.confirmed(this.urls, 'url');
                            scope.$apply();
                            _.forEach(this.urls, url => {
                                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                            });
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                            expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                            expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                            expect(scope.close).not.toHaveBeenCalled();
                            expect(scope.dismiss).not.toHaveBeenCalled();
                            expect(this.controller.urlError).toBe('error');
                        });
                    });
                    it('when after save rejects', function() {
                        ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                        this.controller.confirmed(this.urls, 'url');
                        scope.$apply();
                        _.forEach(this.urls, url => {
                            expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                        });
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                        expect(scope.close).not.toHaveBeenCalled();
                        expect(scope.dismiss).not.toHaveBeenCalled();
                        expect(this.controller.urlError).toBe('error');
                    });
                });
                it('when save changes rejects', function() {
                    ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
                    this.controller.confirmed(this.urls, 'url');
                    scope.$apply();
                    _.forEach(this.urls, url => {
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                    });
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).not.toHaveBeenCalled();
                    expect(scope.close).not.toHaveBeenCalled();
                    expect(scope.dismiss).not.toHaveBeenCalled();
                    expect(this.controller.urlError).toBe('error');
                });
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call addImport when the button is clicked', function() {
        spyOn(this.controller, 'addImport');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addImport).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
