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
describe('Imports Overlay directive', function() {
    var $q, $compile, scope, $httpBackend, ontologyStateSvc, ontologyManagerSvc, utilSvc, prefixes, propertyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('importsOverlay');
        injectRegexConstant();
        mockOntologyState();
        mockOntologyManager();
        mockUtil();
        mockPrefixes();
        mockHttpService();
        mockPropertyManager();
        injectRestPathConstant();

        inject(function(_$q_, _$compile_, _$rootScope_, _$httpBackend_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _prefixes_, _propertyManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            propertyManagerSvc = _propertyManagerService_;
        });

        scope.onClose = jasmine.createSpy('onClose');
        scope.onSubmit = jasmine.createSpy('onSubmit');
        this.element = $compile(angular.element('<imports-overlay on-close="onClose()" on-submit="onSubmit()"></imports-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('importsOverlay');
    });

    afterEach(function() {
        $q = null;
        $compile = null;
        scope = null;
        $httpBackend = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        propertyManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        it('onClose to be called in parent scope', function() {
            this.controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
        it('onSubmit to be called in parent scope', function() {
            this.controller.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('imports-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a .content', function() {
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h1', function() {
            expect(this.element.find('h1').length).toBe(1);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
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
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a md-list', function() {
            expect(this.element.find('md-list').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the url pattern is incorrect', function() {
            var formGroup = angular.element(this.element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);
            this.controller.form.url = {
                '$error': {
                    pattern: true
                }
            };
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on how many ontologies there are', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toEqual(0);

            this.controller.ontologies = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.ontologies .ontology').length).toEqual(this.controller.ontologies.length);
        });
        it('depending on whether the button should be disabled', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.url = 'test';
            this.controller.tabs.url = false;
            this.controller.tabs.server = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            spyOn(this.controller, 'ontologyIsSelected').and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilSvc.getPropertyId.and.returnValue('ontology')
            expect(this.controller.getOntologyIRI({})).toEqual('ontology');
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.ontologyEditor + 'ontologyIRI');
        });
        describe('should update the appropriate varibles if clicking the', function() {
            describe('On Server tab', function() {
                beforeEach(function() {
                    this.controller.ontologies = [];
                });
                it('unless an error occurs', function() {
                    ontologyManagerSvc.getAllOntologyRecords.and.returnValue($q.reject('error'));
                    this.controller.clickTab('server');
                    scope.$apply();
                    expect(ontologyManagerSvc.getAllOntologyRecords).toHaveBeenCalledWith(undefined, this.controller.spinnerId);
                    expect(this.controller.ontologies).toEqual([]);
                    expect(this.controller.serverError).toEqual('error');
                });
                it('unless the ontologies have already been retrieved', function() {
                    this.controller.ontologies = [{}];
                    this.controller.clickTab('server');
                    scope.$apply();
                    expect(ontologyManagerSvc.getAllOntologyRecords).not.toHaveBeenCalled();
                    expect(this.controller.ontologies).toEqual([{}]);
                });
                it('successfully', function() {
                    var currentOntologyId = 'ontology1';
                    ontologyStateSvc.listItem.ontologyRecord = {recordId: currentOntologyId};
                    ontologyManagerSvc.getAllOntologyRecords.and.returnValue($q.when([{'@id': currentOntologyId}, {'@id': 'ontology2'}]));
                    this.controller.clickTab('server');
                    scope.$apply();
                    expect(ontologyManagerSvc.getAllOntologyRecords).toHaveBeenCalledWith(undefined, this.controller.spinnerId);
                    expect(this.controller.ontologies.length).toEqual(1);
                    expect(this.controller.serverError).toEqual('');
                });
            });
            it('URL tab', function() {
                this.controller.ontologies = [{}];
                this.controller.clickTab('url');
                expect(ontologyManagerSvc.getAllOntologyRecords).not.toHaveBeenCalled();
                expect(this.controller.ontologies).toEqual([{}]);
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
                this.controller.ontologies = [{selected: true, ontologyIRI: 'ontology1', recordId: 'record1'}, {selected: false, ontologyIRI: 'ontology2', recordId: 'record2'}]
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
                _.forEach(this.urls, function(url) {
                    expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                });
                expect(utilSvc.createWarningToast).toHaveBeenCalledWith('Duplicate property values not allowed');
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.saveChanges).not.toHaveBeenCalled();
                expect(ontologyStateSvc.afterSave).not.toHaveBeenCalled();
                expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                expect(ontologyStateSvc.isCommittable).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.isSaved).toBe(false);
                expect(scope.onSubmit).not.toHaveBeenCalled();
                expect(scope.onClose).toHaveBeenCalled();
            });
            describe('if there are no duplicated values', function() {
                beforeEach(function() {
                    propertyManagerSvc.addId.and.returnValue(true);
                    this.additionsObj = {
                        '@id': ontologyStateSvc.listItem.selected['@id'],
                    };
                    this.additionsObj[prefixes.owl + 'imports'] = _.map(this.urls, function(url) {
                        return {'@id': url};
                    });
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
                            _.forEach(this.urls, function(url) {
                                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                            });
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                            expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                            expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                            expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                            expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                            expect(scope.onSubmit).toHaveBeenCalled();
                            expect(scope.onClose).toHaveBeenCalled();
                        });
                        it('when update ontology rejects', function() {
                            ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                            this.controller.confirmed(this.urls, 'url');
                            scope.$apply();
                            _.forEach(this.urls, function(url) {
                                expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                            });
                            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                            expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                            expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                            expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                            expect(this.controller.urlError).toBe('error');
                        });
                    });
                    it('when after save rejects', function() {
                        ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                        this.controller.confirmed(this.urls, 'url');
                        scope.$apply();
                        _.forEach(this.urls, function(url) {
                            expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                        });
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                        expect(this.controller.urlError).toBe('error');
                    });
                });
                it('when save changes rejects', function() {
                    ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
                    this.controller.confirmed(this.urls, 'url');
                    scope.$apply();
                    _.forEach(this.urls, function(url) {
                        expect(propertyManagerSvc.addId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                    });
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.additionsObj);
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).not.toHaveBeenCalled();
                    expect(this.controller.urlError).toBe('error');
                });
            });
        });
    });
    it('should call addImport when the button is clicked', function() {
        spyOn(this.controller, 'addImport');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addImport).toHaveBeenCalled();
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
});
