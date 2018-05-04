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
describe('Ontology Button Stack directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyButtonStack');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.isCommittable.and.returnValue(false);
        ontologyStateSvc.hasChanges.and.returnValue(false);
        ontologyStateSvc.listItem.userBranch = false;
        this.element = $compile(angular.element('<ontology-button-stack></ontology-button-stack>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('ontology-button-stack')).toBe(true);
        });
        it('with a circle-button-stack', function() {
            expect(this.element.find('circle-button-stack').length).toBe(1);
        });
        it('with circle-buttons', function() {
            expect(this.element.find('circle-button').length).toBe(4);
        });
        it('depending on whether the ontology is committable', function() {
            var commitButton = angular.element(this.element.querySelectorAll('circle-button.btn-primary')[0]);
            var mergeButton = angular.element(this.element.querySelectorAll('circle-button.btn-success')[0]);
            expect(commitButton.attr('disabled')).toBeTruthy();
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.isCommittable.and.returnValue(true);
            scope.$digest();
            expect(commitButton.attr('disabled')).toBeFalsy();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the ontology has changes', function() {
            var mergeButton = angular.element(this.element.querySelectorAll('circle-button.btn-success')[0]);
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.hasChanges.and.returnValue(true);
            scope.$digest();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether the branch is a user branch', function() {
            var mergeButton = angular.element(this.element.querySelectorAll('circle-button.btn-success')[0]);
            expect(mergeButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.userBranch = true;
            scope.$digest();
            expect(mergeButton.attr('disabled')).toBeTruthy();
        });
    });
    it('should set the correct state when the upload changes button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('circle-button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showUploadChangesOverlay).toEqual(true);
    });
    it('should set the correct state when the create branch button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('circle-button.btn-warning')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCreateBranchOverlay).toEqual(true);
    });
    it('should set the correct state when the merge button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('circle-button.btn-success')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.listItem.merge.active).toEqual(true);
    });
    it('should set the correct state when the commit button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('circle-button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showCommitOverlay).toEqual(true);
    });
});