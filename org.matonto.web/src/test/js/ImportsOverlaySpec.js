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
    var $q, $compile, scope, element, controller, $httpBackend, ontologyStateSvc, ontologyManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('importsOverlay');
        injectRegexConstant();
        mockOntologyState();
        mockUtil();
        mockPrefixes();

        inject(function(_$q_, _$compile_, _$rootScope_, _$httpBackend_, _ontologyStateService_, _utilService_, _prefixes_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            ontologyStateSvc = _ontologyStateService_;
            util = _utilService_;
            prefixes = _prefixes_;
        });

        scope.onClose = jasmine.createSpy('onClose');
        element = $compile(angular.element('<imports-overlay on-close="onClose()"></imports-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('importsOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('imports-overlay')).toBe(true);
        });
        it('with a .overlay', function() {
            expect(element.querySelectorAll('.overlay').length).toBe(1);
        });
        it('with a .content', function() {
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .error-msg', function() {
            expect(element.querySelectorAll('.error-msg').length).toBe(1);
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
            }
            scope.$digest();
            expect(formGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = 'error';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether confirmation is open', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);
            controller.openConfirmation = true;
            controller.error = 'error';
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(1);
            expect(element.find('error-display').length).toBe(1);
            expect(element.find('p').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('create should call the correct methods', function() {
            beforeEach(function() {
                controller.url = 'url';
            });
            describe('when get request resolves', function() {
                beforeEach(function() {
                    $httpBackend.expectGET('/matontorest/imported-ontologies/url').respond(200);
                });
                it('when there are no changes', function() {
                    ontologyStateSvc.hasChanges.and.returnValue(false);
                    spyOn(controller, 'confirmed');
                    controller.create();
                    $httpBackend.flush();
                    expect(ontologyStateSvc.hasChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(controller.confirmed).toHaveBeenCalled();
                });
                it('when there are changes', function() {
                    ontologyStateSvc.hasChanges.and.returnValue(true);
                    controller.create();
                    $httpBackend.flush();
                    expect(ontologyStateSvc.hasChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(controller.openConfirmation).toBe(true);
                });
            });
            it('when get request rejects', function() {
                $httpBackend.expectGET('/matontorest/imported-ontologies/url').respond(400);
                controller.create();
                $httpBackend.flush();
                expect(controller.error).toBe('The provided URL was unresolvable.');
            });
        });
        describe('confirmed should call the correct methods', function() {
            var saveDeferred;
            beforeEach(function() {
                controller.url = 'url';
                saveDeferred = $q.defer();
                ontologyStateSvc.saveChanges.and.returnValue(saveDeferred.promise);
                controller.confirmed();
            });
            describe('when save changes resolves', function() {
                var afterDeferred;
                beforeEach(function() {
                    saveDeferred.resolve();
                    afterDeferred = $q.defer();
                    ontologyStateSvc.afterSave.and.returnValue(afterDeferred.promise);
                });
                describe('when after save resolves', function() {
                    var updateDeferred;
                    beforeEach(function() {
                        afterDeferred.resolve();
                        updateDeferred = $q.defer();
                        ontologyStateSvc.updateOntology.and.returnValue(updateDeferred.promise);
                    });
                    it('when update ontology resolves', function() {
                        ontologyStateSvc.isCommittable.and.returnValue(true);
                        updateDeferred.resolve();
                        scope.$apply();
                        expect(util.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', controller.url);
                        expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.ontologyRecord.type, ontologyStateSvc.listItem.ontologyState.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                        expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                        expect(scope.onClose).toHaveBeenCalled();
                    });
                    it('when update ontology rejects', function() {
                        updateDeferred.reject('error');
                        scope.$apply();
                        expect(util.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', controller.url);
                        expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                        expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.ontologyRecord.type, ontologyStateSvc.listItem.ontologyState.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(controller.error).toBe('error');
                    });
                });
                it('when after save rejects', function() {
                    afterDeferred.reject('error');
                    scope.$apply();
                    expect(util.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', controller.url);
                    expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                    expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(controller.error).toBe('error');
                });
            });
            it('when save changes rejects', function() {
                saveDeferred.reject('error');
                scope.$apply();
                expect(util.setPropertyId).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', controller.url);
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': controller.url});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                expect(controller.error).toBe('error');
            });
        });
    });
    it('should call create when the button is clicked', function() {
        spyOn(controller, 'create');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
});