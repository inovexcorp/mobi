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
describe('Ontology Close Overlay directive', function() {
    var $compile, scope, $q, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyCloseOverlay');
        mockOntologyState();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<ontology-close-overlay></ontology-close-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('ontologyCloseOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-close-overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with a .main', function() {
            expect(this.element.querySelectorAll('.main').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('depending on whether an error occurred', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = true;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with custom buttons to save and close, close without saving, and cancel', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(3);
            expect(['Cancel', 'Close Without Saving', 'Save and Close'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Close Without Saving', 'Save and Close'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Close Without Saving', 'Save and Close'].indexOf(angular.element(buttons[2]).text()) >= 0).toBe(true);
        });
    });
    describe('controller methods', function() {
        describe('saveThenClose calls the correct functions', function() {
            describe('when resolved, calls the correct controller function', function() {
                beforeEach(function() {
                    ontologyStateSvc.saveChanges.and.returnValue($q.when('id'));
                    this.controller.close = jasmine.createSpy('close');
                });
                it('when afterSave is resolved', function() {
                    ontologyStateSvc.afterSave.and.returnValue($q.when());
                    this.controller.saveThenClose();
                    scope.$apply();
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId,
                        {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(this.controller.close).toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                });
                it('when afterSave is rejected', function() {
                    ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                    this.controller.saveThenClose();
                    scope.$apply();
                    expect(this.controller.close).not.toHaveBeenCalled();
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(this.controller.error).toEqual('error');
                });
            });
            it('when rejected, sets the correct variable', function() {
                ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
                this.controller.saveThenClose();
                scope.$apply();
                expect(this.controller.error).toBe('error');
            });
        });
        it('close calls the correct manager functions and sets the correct manager variable', function() {
            this.controller.close();
            expect(ontologyStateSvc.closeOntology).toHaveBeenCalledWith(ontologyStateSvc.recordIdToClose);
            expect(ontologyStateSvc.showCloseOverlay).toBe(false);
        });
    });
    it('should call saveThenClose when the button is clicked', function() {
        spyOn(this.controller, 'saveThenClose');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.save-close-btn')[0]);
        button.triggerHandler('click');
        expect(this.controller.saveThenClose).toHaveBeenCalled();
    });
    it('should call saveThenClose when the button is clicked', function() {
        spyOn(this.controller, 'close');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.close-btn')[0]);
        button.triggerHandler('click');
        expect(this.controller.close).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCloseOverlay).toBe(false);
    });
});