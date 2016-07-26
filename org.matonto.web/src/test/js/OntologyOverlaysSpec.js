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
        stateManagerSvc,
        ontologyManagerSvc,
        annotationManagerSvc,
        deferred;

    beforeEach(function() {
        module('templates');
        module('ontologyOverlays');
        mockOntologyManager();
        mockStateManager();
        mockAnnotationManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_, _annotationManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            annotationManagerSvc = _annotationManagerService_;
            deferred = _$q_.defer();
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            stateManagerSvc.showUploadOverlay = true;
            stateManagerSvc.showAnnotationOverlay = true;
            stateManagerSvc.showDownloadOverlay = true;
            stateManagerSvc.showOpenOverlay = true;
            stateManagerSvc.showCreateAnnotationOverlay = true;
            stateManagerSvc.showCreateOntologyOverlay = true;
            stateManagerSvc.showCreateClassOverlay = true;
            stateManagerSvc.showCreatePropertyOverlay = true;
            stateManagerSvc.showDeleteConfirmation = true;
            stateManagerSvc.showCloseOverlay = true;
            stateManagerSvc.showRemoveAnnotationOverlay = true;
            stateManagerSvc.showSaveOverlay = true;
            element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
            scope.$digest();
        });
        it('for an ontology-overlays', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-OVERLAYS');
        });
        it('based on confirmation-overlays', function() {
            var confirmations = element.find('confirmation-overlay');
            expect(confirmations.length).toBe(4);
        });
        _.forEach(['ontology-upload-overlay', 'annotation-overlay', 'ontology-download-overlay',
        'ontology-open-overlay', 'create-annotation-overlay', 'create-class-overlay',
        'create-property-overlay'], function(item) {
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
        describe('deleteEntity', function() {
            beforeEach(function() {
                ontologyManagerSvc.delete.and.returnValue(deferred.promise);
                controller.deleteEntity();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.delete).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id, stateManagerSvc.selected.matonto.originalIri, stateManagerSvc.state);
            });
            describe('when resolved', function() {
                it('and selectOntology is true, calls the correct functions', function() {
                    deferred.resolve({selectOntology: true});
                    scope.$apply();
                    expect(stateManagerSvc.showDeleteConfirmation).toBe(false);
                    expect(stateManagerSvc.setTreeTab).toHaveBeenCalledWith('everything');
                    expect(stateManagerSvc.selectItem).toHaveBeenCalledWith('ontology-editor', stateManagerSvc.state.oi);
                });
                it('and selectOntology is false, calls the correct function', function() {
                    deferred.resolve({selectOntology: false});
                    scope.$apply();
                    expect(stateManagerSvc.showDeleteConfirmation).toBe(false);
                    expect(stateManagerSvc.clearState).toHaveBeenCalledWith(stateManagerSvc.state.oi);
                });
            });
            it('when rejected, sets the correct variable', function() {
                deferred.reject('error');
                scope.$apply();
                expect(controller.error).toBe('error');
            });
        });
        it('save calls the correct manager function', function() {
            controller.save();
            expect(ontologyManagerSvc.edit).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id, stateManagerSvc.state);
        });
        describe('save', function() {
            beforeEach(function() {
                ontologyManagerSvc.edit.and.returnValue(deferred.promise);
                controller.save();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.edit).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id, stateManagerSvc.state);
            });
            it('when resolved, sets the correct variables', function() {
                deferred.resolve({});
                scope.$apply();
                expect(stateManagerSvc.showSaveOverlay).toBe(false);
                expect(stateManagerSvc.state).toEqual({});
            });
        });
        it('closeOntology calls the correct manager functions and sets the correct manager variable', function() {
            controller.closeOntology();
            expect(ontologyManagerSvc.closeOntology).toHaveBeenCalledWith(stateManagerSvc.state.oi, stateManagerSvc.ontology.matonto.id);
            expect(stateManagerSvc.clearState).toHaveBeenCalledWith(stateManagerSvc.state.oi);
            expect(stateManagerSvc.showCloseOverlay).toBe(false);
        });
        it('removeAnnotation calls the correct manager functions and sets the correct manager variable', function() {
            controller.removeAnnotation();
            expect(annotationManagerSvc.remove).toHaveBeenCalledWith(stateManagerSvc.selected, stateManagerSvc.key, stateManagerSvc.index);
            expect(stateManagerSvc.entityChanged).toHaveBeenCalledWith(stateManagerSvc.selected, stateManagerSvc.ontology.matonto.id, stateManagerSvc.state);
            expect(stateManagerSvc.showRemoveAnnotationOverlay).toBe(false);
        });
    });
});