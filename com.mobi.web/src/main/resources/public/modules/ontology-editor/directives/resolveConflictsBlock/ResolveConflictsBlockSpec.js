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
describe('Resolve Conflicts Block directive', function() {
    var $compile, scope, $q, ontologyStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('resolveConflictsBlock');
        mockOntologyState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
        });

        this.element = $compile(angular.element('<resolve-conflicts-block></resolve-conflicts-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('resolveConflictsBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('resolve-conflicts-block')).toBe(true);
        });
        it('with a resolve-conflicts-form', function() {
            expect(this.element.find('resolve-conflicts-form').length).toBe(1);
        });
        it('with buttons to submit with resolutions and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container .btn');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit with Resolutions'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit with Resolutions'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.error = 'Error';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on the value of the merge checkbox', function() {
            expect(this.element.querySelectorAll('.merge-details p').length).toEqual(1);

            ontologyStateSvc.listItem.merge.checkbox = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.merge-details p').length).toEqual(2);
        });
        it('depending on whether all conflicts are resolved', function() {
            ontologyStateSvc.listItem.merge.conflicts = [{}];
            spyOn(this.controller, 'allResolved').and.returnValue(false);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.allResolved.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the source branch is up to date', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container .btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should test whether all conflicts are resolved', function() {
            expect(this.controller.allResolved()).toEqual(true);

            ontologyStateSvc.listItem.merge.conflicts = [{resolved: true}];
            expect(this.controller.allResolved()).toEqual(true);

            ontologyStateSvc.listItem.merge.conflicts = [{resolved: false}];
            expect(this.controller.allResolved()).toEqual(false);
        });
        describe('should submit the merge', function() {
            beforeEach(function() {
                var selectedLeft = {resolved: 'left', right: {additions: ['add-right'], deletions: ['del-right']}};
                var selectedRight = {resolved: 'right', left: {additions: ['add-left'], deletions: ['del-left']}};
                ontologyStateSvc.listItem.merge.conflicts = [selectedLeft, selectedRight];
            });
            it('unless merge rejects', function() {
                ontologyStateSvc.merge.and.returnValue($q.reject('Error message'));
                this.controller.submit();
                scope.$apply();
                expect(ontologyStateSvc.listItem.merge.resolutions.additions).toEqual([]);
                expect(ontologyStateSvc.listItem.merge.resolutions.deletions).toEqual(['add-right', 'add-left']);
                expect(ontologyStateSvc.merge).toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).not.toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.cancelMerge).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual('Error message');
            });
            it('if merge resolves', function() {
                this.controller.submit();
                scope.$apply();
                expect(ontologyStateSvc.listItem.merge.resolutions.additions).toEqual([]);
                expect(ontologyStateSvc.listItem.merge.resolutions.deletions).toEqual(['add-right', 'add-left']);
                expect(ontologyStateSvc.merge).toHaveBeenCalled();
                expect(ontologyStateSvc.resetStateTabs).toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(ontologyStateSvc.cancelMerge).toHaveBeenCalled();
                expect(this.controller.error).toEqual('');
            });
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(this.controller, 'submit');
        var button = angular.element(this.element.querySelectorAll('.btn-container .btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.submit).toHaveBeenCalled();
    });
    it('should call the correct method when the button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container .btn:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.cancelMerge).toHaveBeenCalled();
    });
});
