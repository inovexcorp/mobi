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
describe('Ontology Close Overlay directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, deferred;

    beforeEach(function() {
        module('templates');
        module('ontologyCloseOverlay');
        mockOntologyState();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            deferred = _$q_.defer();
        });

        element = $compile(angular.element('<ontology-close-overlay></ontology-close-overlay>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('ontology-close-overlay')).toBe(true);
            expect(element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(element.find('h6').length).toBe(1);
        });
        it('with a .main', function() {
            expect(element.querySelectorAll('.main').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('depending on whether an error occurred', function() {
            expect(element.find('error-display').length).toBe(0);

            controller = element.controller('ontologyCloseOverlay');
            controller.error = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('with custom buttons to save and close, close without saving, and cancel', function() {
            var buttons = element.find('button');
            expect(buttons.length).toBe(3);
            expect(['Cancel', 'Close Without Saving', 'Save and Close'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Close Without Saving', 'Save and Close'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Close Without Saving', 'Save and Close'].indexOf(angular.element(buttons[2]).text()) >= 0).toBe(true);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('ontologyCloseOverlay');
        });
        describe('saveThenClose', function() {
            beforeEach(function() {
                ontologyStateSvc.saveChanges.and.returnValue(deferred.promise);
                controller.saveThenClose();
            });
            it('calls the correct manager functions', function() {
                expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                    {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
            });
            describe('when resolved, calls the correct controller function', function() {
                var afterDeferred;
                beforeEach(function() {
                    controller.close = jasmine.createSpy('close');
                    deferred.resolve('id');
                    afterDeferred = $q.defer();
                    ontologyStateSvc.afterSave.and.returnValue(afterDeferred.promise);
                });
                it('when afterSave is resolved', function() {
                    afterDeferred.resolve();
                    scope.$apply();
                    expect(controller.close).toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                });
                it('when afterSave is rejected', function() {
                    var error = 'error';
                    afterDeferred.reject(error);
                    scope.$apply();
                    expect(controller.close).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(controller.error).toEqual(error);
                });
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toBe('error');
            });
        });
        it('close calls the correct manager functions and sets the correct manager variable', function() {
            controller.close();
            expect(ontologyStateSvc.closeOntology).toHaveBeenCalledWith(ontologyStateSvc.recordIdToClose);
            expect(ontologyStateSvc.showCloseOverlay).toBe(false);
        });
    });
    it('should call saveThenClose when the button is clicked', function() {
        controller = element.controller('ontologyCloseOverlay');
        spyOn(controller, 'saveThenClose');

        var button = angular.element(element.querySelectorAll('.btn-container button.save-close-btn')[0]);
        button.triggerHandler('click');
        expect(controller.saveThenClose).toHaveBeenCalled();
    });
    it('should call saveThenClose when the button is clicked', function() {
        controller = element.controller('ontologyCloseOverlay');
        spyOn(controller, 'close');

        var button = angular.element(element.querySelectorAll('.btn-container button.close-btn')[0]);
        button.triggerHandler('click');
        expect(controller.close).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCloseOverlay).toBe(false);
    });
});