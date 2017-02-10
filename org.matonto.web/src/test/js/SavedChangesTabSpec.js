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
describe('Saved Changes Tab directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        utilSvc,
        catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('savedChangesTab');
        mockOntologyManager();
        mockOntologyState();
        mockUtil();
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _utilService_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        ontologyStateSvc.listItem.inProgressCommit = {additions: [], deletions: []};
        element = $compile(angular.element('<saved-changes-tab></saved-changes-tab>'))(scope);
        scope.$digest();
        controller = element.controller('savedChangesTab');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('saved-changes-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('depending on how many saved changes there are', function() {
            expect(element.querySelectorAll('block-content .changes').length).toBe(0);
            expect(element.querySelectorAll('block-content .text-center').length).toBe(1);

            controller.list = [''];
            scope.$digest();
            expect(element.querySelectorAll('block-content .text-center').length).toBe(0);
            expect(element.querySelectorAll('block-content .changes').length).toBe(1);
            expect(element.querySelectorAll('block-content .changes .property-values').length).toBe(controller.list.length);
        });
        it('depending on whether the list item is up to date', function() {
            expect(element.querySelectorAll('block-content .text-center info-message').length).toBe(1);
            expect(element.querySelectorAll('block-content .text-center error-display').length).toBe(0);

            ontologyStateSvc.listItem.upToDate = false;
            scope.$digest();
            expect(element.querySelectorAll('block-content .text-center info-message').length).toBe(0);
            expect(element.querySelectorAll('block-content .text-center error-display').length).toBe(1);

            controller.list = [''];
            scope.$digest();
            expect(element.querySelectorAll('block-content .changes error-display').length).toBe(1);

            ontologyStateSvc.listItem.upToDate = true;
            scope.$digest();
            expect(element.querySelectorAll('block-content .changes error-display').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('should get the additions of the changes to an entity', function() {
            ontologyStateSvc.listItem.inProgressCommit.additions = [{'@id': 'A', 'test': true}];
            expect(controller.getAdditions('A')).toEqual({'test': true});
            expect(controller.getAdditions('B')).toBeUndefined();
        });
        it('should get the deletions of the changes to an entity', function() {
            ontologyStateSvc.listItem.inProgressCommit.deletions = [{'@id': 'A', 'test': true}];
            expect(controller.getDeletions('A')).toEqual({'test': true});
            expect(controller.getDeletions('B')).toBeUndefined();
        });
        it('should go to a specific entity', function() {
            var event = {
                stopPropagation: jasmine.createSpy('stopPropagation')
            };
            controller.go(event, 'A');
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(ontologyStateSvc.goTo).toHaveBeenCalledWith('A');
        });
        describe('should update the selected ontology', function() {
            beforeEach(function() {
                this.commitId = 'commit';
                catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({commit: {'@id': this.commitId}}));
            });
            it('unless an error occurs', function() {
                ontologyManagerSvc.updateOntology.and.returnValue($q.reject('Error message'));
                controller.update();
                scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, jasmine.any(String));
                expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, this.commitId, ontologyStateSvc.listItem.type);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                ontologyManagerSvc.updateOntology.and.returnValue($q.when());
                controller.update();
                scope.$apply();
                expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.branchId, ontologyStateSvc.listItem.recordId, jasmine.any(String));
                expect(ontologyManagerSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, ontologyStateSvc.listItem.branchId, this.commitId, ontologyStateSvc.listItem.type);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    it('should call goTo when an entity title is clicked', function() {
        controller.list = ['test'];
        scope.$digest();
        spyOn(controller, 'go');

        var link = angular.element(element.querySelectorAll('block-content .changes .property-values h5 a')[0]);
        link.triggerHandler('click');
        expect(controller.go).toHaveBeenCalledWith(jasmine.any(Object), 'test');
    });
    it('should call update when the link is clicked', function() {
        ontologyStateSvc.listItem.upToDate = false;
        scope.$digest();
        spyOn(controller, 'update');
        var link = angular.element(element.querySelectorAll('block-content .text-center error-display a')[0]);
        link.triggerHandler('click');
        expect(controller.update).toHaveBeenCalled();
    });
});