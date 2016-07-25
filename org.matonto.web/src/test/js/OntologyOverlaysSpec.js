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
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyOverlays');
        mockOntologyManager();
        mockStateManager();
        mockAnnotationManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_, _annotationManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            annotationManagerSvc = _annotationManagerService_;
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
            var confirmations = element.querySelectorAll('confirmation-overlay');
            expect(confirmations.length).toBe(4);
        });
        _.forEach(['ontology-upload-overlay', 'annotation-overlay', 'ontology-download-overlay',
        'ontology-open-overlay', 'create-annotation-overlay', 'create-class-overlay',
        'create-property-overlay'], function(item) {
            it('based on ' + item, function() {
                var items = element.querySelectorAll(item);
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
        it('deleteEntity calls the correct manager function', function() {
            controller.deleteEntity();
            expect(ontologyManagerSvc.delete).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id, stateManagerSvc.selected.matonto.originalIri, stateManagerSvc.currentState);
        });
        it('save calls the correct manager function', function() {
            controller.save();
            expect(ontologyManagerSvc.edit).toHaveBeenCalledWith(stateManagerSvc.ontology.matonto.id, stateManagerSvc.currentState);
        });
        it('closeOntology calls the correct manager functions and sets the correct manager variable', function() {
            controller.closeOntology();
            expect(ontologyManagerSvc.closeOntology).toHaveBeenCalledWith(stateManagerSvc.currentState.oi, stateManagerSvc.ontology.matonto.id);
            expect(stateManagerSvc.clearState).toHaveBeenCalledWith(stateManagerSvc.currentState.oi);
            expect(stateManagerSvc.showCloseOverlay).toBe(false);
        });
        it('removeAnnotation calls the correct manager functions and sets the correct manager variable', function() {
            controller.removeAnnotation();
            expect(annotationManagerSvc.remove).toHaveBeenCalledWith(stateManagerSvc.selected, stateManagerSvc.key, stateManagerSvc.index);
            expect(ontologyManagerSvc.entityChanged).toHaveBeenCalledWith(stateManagerSvc.selected, stateManagerSvc.ontology.matonto.id, stateManagerSvc.currentState);
            expect(stateManagerSvc.showRemoveAnnotationOverlay).toBe(false);
        });
    });
});