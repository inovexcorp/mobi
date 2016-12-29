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
describe('Ontology Overlays directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        propertyManagerSvc,
        deferred;

    beforeEach(function() {
        module('templates');
        module('ontologyOverlays');
        mockOntologyManager();
        mockOntologyState();
        mockPropertyManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_,
            _propertyManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            deferred = _$q_.defer();
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            ontologyStateSvc.showAnnotationOverlay = true;
            ontologyStateSvc.showDataPropertyOverlay = true;
            ontologyStateSvc.showObjectPropertyOverlay = true;
            ontologyStateSvc.showDownloadOverlay = true;
            ontologyStateSvc.showCreateAnnotationOverlay = true;
            ontologyStateSvc.showCreateClassOverlay = true;
            ontologyStateSvc.showCreatePropertyOverlay = true;
            ontologyStateSvc.showCreateIndividualOverlay = true;
            ontologyStateSvc.showCloseOverlay = true;
            ontologyStateSvc.showRemoveOverlay = true;
            ontologyStateSvc.showRemoveIndividualPropertyOverlay = true;
            ontologyStateSvc.showSaveOverlay = true;
            element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
            scope.$digest();
        });
        it('for an ontology-overlays', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-OVERLAYS');
        });
        it('based on confirmation-overlays', function() {
            var confirmations = element.find('confirmation-overlay');
            expect(confirmations.length).toBe(1);
        });
        _.forEach(['annotation-overlay', 'datatype-property-overlay', 'object-property-overlay',
        'ontology-download-overlay', 'create-annotation-overlay', 'create-class-overlay', 'create-property-overlay',
        'create-individual-overlay', 'ontology-close-overlay'], function(item) {
            it('based on ' + item, function() {
                var items = element.find(item);
                expect(items.length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
            scope.$digest();
            controller = element.controller('ontologyOverlays');
        });
        describe('save', function() {
            beforeEach(function() {
                ontologyStateSvc.state.ontologyId = 'id';
                ontologyManagerSvc.saveChanges.and.returnValue(deferred.promise);
                controller.save();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId,
                    {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
            });
            describe('when resolved, sets the correct variable and calls correct manager function', function() {
                var afterDeferred;
                beforeEach(function() {
                    deferred.resolve('id');
                    afterDeferred = $q.defer();
                    ontologyStateSvc.afterSave.and.returnValue(afterDeferred.promise);
                });
                it('when afterSave is resolved', function() {
                    afterDeferred.resolve();
                    scope.$apply();
                    expect(ontologyStateSvc.showSaveOverlay).toBe(false);
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                });
                it('when afterSave is rejected', function() {
                    var error = 'error';
                    afterDeferred.reject(error);
                    scope.$apply();
                    expect(ontologyStateSvc.showSaveOverlay).not.toBe(false);
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(controller.error).toEqual(error);
                });
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toEqual('error');
            });
        });
    });
});