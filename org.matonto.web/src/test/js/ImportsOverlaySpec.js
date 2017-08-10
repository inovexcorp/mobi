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
describe('Imports Overlay directive', function() {
    var $q, $compile, scope, element, controller, $httpBackend, ontologyStateSvc, ontologyManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('importsOverlay');
        injectRegexConstant();
        mockOntologyState();
        mockOntologyManager();
        mockUtil();
        mockPrefixes();
        mockHttpService();

        inject(function(_$q_, _$compile_, _$rootScope_, _$httpBackend_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        scope.onClose = jasmine.createSpy('onClose');
        scope.onSubmit = jasmine.createSpy('onSubmit');
        element = $compile(angular.element('<imports-overlay on-close="onClose()" on-submit="onSubmit()"></imports-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('importsOverlay');
    });

    describe('controller bound variables', function() {
        it('onClose to be called in parent scope', function() {
            controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
        it('onSubmit to be called in parent scope', function() {
            controller.onSubmit();
            expect(scope.onSubmit).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('imports-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('with a .content', function() {
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h1', function() {
            expect(element.find('h1').length).toBe(1);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(element.find('tab').length).toBe(2);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('depending on whether an error has occured on the URL tab', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.urlError = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether an error has occured on the Server tab', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.serverError = 'Error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a md-list', function() {
            expect(element.find('md-list').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the url pattern is incorrect', function() {
            var formGroup = angular.element(element.querySelectorAll('.form-group')[0]);
            expect(formGroup.hasClass('has-error')).toBe(false);
            controller.form.url = {
                '$error': {
                    pattern: true
                }
            };
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on how many ontologies there are', function() {
            expect(element.find('info-message').length).toEqual(1);
            expect(element.querySelectorAll('.ontologies .ontology').length).toEqual(0);

            controller.ontologies = [{}];
            scope.$digest();
            expect(element.find('info-message').length).toEqual(0);
            expect(element.querySelectorAll('.ontologies .ontology').length).toEqual(controller.ontologies.length);
        });
        it('depending on whether the button should be disabled', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.url = 'test';
            controller.tabs.url = false;
            controller.tabs.server = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            spyOn(controller, 'ontologyIsSelected').and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilSvc.getPropertyId.and.returnValue('ontology')
            expect(controller.getOntologyIRI({})).toEqual('ontology');
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.ontologyEditor + 'ontologyIRI');
        });
        /*describe('should update the appropriate varibles if clicking the', function() {
            beforeEach(function() {
                controller.urls = [''];
            });
            describe('Mobi tab', function() {
                beforeEach(function() {
                    controller.tabs.url = false;
                    controller.tabs.server = true;
                    controller.ontologies = [];
                });
                it('unless an error occurs', function() {
                    ontologyManagerSvc.getAllOntologyRecords.and.returnValue($q.reject('error'));
                    controller.clickTab();
                    scope.$apply();
                    expect(ontologyManagerSvc.getAllOntologyRecords).toHaveBeenCalledWith(undefined, controller.spinnerId);
                    expect(controller.urls).toEqual([]);
                    expect(controller.ontologies).toEqual([]);
                    expect(controller.serverError).toEqual('error');
                });
                it('unless the ontologies have already been retrieved', function() {
                    controller.ontologies = [{}];
                    controller.clickTab();
                    scope.$apply();
                    expect(ontologyManagerSvc.getAllOntologyRecords).not.toHaveBeenCalled();
                    expect(controller.urls).toEqual(['']);
                    expect(controller.ontologies).toEqual([{}]);
                });
                it('successfully', function() {
                    var currentOntologyId = 'ontology1';
                    ontologyStateSvc.listItem.ontologyRecord = {recordId: currentOntologyId};
                    ontologyManagerSvc.getAllOntologyRecords.and.returnValue($q.when([{'@id': currentOntologyId}, {'@id': 'ontology2'}]));
                    controller.clickTab();
                    scope.$apply();
                    expect(ontologyManagerSvc.getAllOntologyRecords).toHaveBeenCalledWith(undefined, controller.spinnerId);
                    expect(controller.urls).toEqual([]);
                    expect(controller.ontologies.length).toEqual(1);
                    expect(controller.serverError).toEqual('');
                });
            });
            it('URL tab', function() {
                controller.ontologies = [{}];
                controller.clickTab();
                expect(ontologyManagerSvc.getAllOntologyRecords).not.toHaveBeenCalled();
                expect(controller.urls).toEqual(['']);
                expect(controller.ontologies).toEqual([{}]);
            });
        });*/
        describe('addImport should call the correct methods', function() {
            beforeEach(function() {
                spyOn(controller, 'confirmed');
                controller.openConfirmation = false;
            });
            describe('if importing from a URL', function() {
                beforeEach(function() {
                    controller.url = 'url';
                });
                it('and get request resolves', function() {
                    $httpBackend.expectGET('/matontorest/imported-ontologies/url').respond(200);
                    controller.addImport();
                    flushAndVerify($httpBackend);
                    expect(controller.confirmed).toHaveBeenCalledWith([controller.url]);
                });
                it('when get request rejects', function() {
                    $httpBackend.expectGET('/matontorest/imported-ontologies/url').respond(400);
                    controller.addImport();
                    flushAndVerify($httpBackend);
                    expect(controller.urlError).toBe('The provided URL was unresolvable.');
                });
            });
            it('if importing Mobi ontologies', function() {
                controller.tabs.url = false;
                controller.tabs.server = true;
                controller.ontologies = [{selected: true, ontologyIRI: 'ontology1', recordId: 'record1'}, {selected: false, ontologyIRI: 'ontology2', recordId: 'record2'}]
                controller.addImport();
                $httpBackend.verifyNoOutstandingExpectation();
                expect(controller.confirmed).toHaveBeenCalledWith(['ontology1']);
            });
        });
        describe('confirmed should call the correct methods', function() {
            var urls = ['url'];
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
                        controller.confirmed(urls);
                        scope.$apply();
                        _.forEach(urls, function(url) {
                            expect(utilSvc.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                            expect(utilSvc.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': url});
                        });
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.ontologyRecord.type, ontologyStateSvc.listItem.ontologyState.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                        expect(scope.onSubmit).toHaveBeenCalled();
                        expect(scope.onClose).toHaveBeenCalled();
                    });
                    it('when update ontology rejects', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                        controller.confirmed(urls);
                        scope.$apply();
                        _.forEach(urls, function(url) {
                            expect(utilSvc.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                            expect(utilSvc.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': url});
                        });
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.ontologyRecord.type, ontologyStateSvc.listItem.ontologyState.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(controller.urlError).toBe('error');
                    });
                });
                it('when after save rejects', function() {
                    ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                    controller.confirmed(urls);
                    scope.$apply();
                    _.forEach(urls, function(url) {
                        expect(utilSvc.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                        expect(utilSvc.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': url});
                    });
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(ontologyStateSvc.updateOntology).not.toHaveBeenCalled();
                    expect(controller.urlError).toBe('error');
                });
            });
            it('when save changes rejects', function() {
                ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
                controller.confirmed(urls);
                scope.$apply();
                _.forEach(urls, function(url) {
                    expect(utilSvc.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', url);
                    expect(utilSvc.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': url});
                });
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                expect(ontologyStateSvc.afterSave).not.toHaveBeenCalled();
                expect(controller.urlError).toBe('error');
            });
        });
    });
    it('should call addImport when the button is clicked', function() {
        spyOn(controller, 'addImport');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.addImport).toHaveBeenCalled();
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
});