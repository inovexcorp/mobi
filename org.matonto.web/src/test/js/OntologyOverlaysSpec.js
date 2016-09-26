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

        inject(function(_$q_, _$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_,
            _annotationManagerService_) {
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
            stateManagerSvc.showRemoveOverlay = true;
            stateManagerSvc.showRemoveIndividualPropertyOverlay = true;
            stateManagerSvc.showSaveOverlay = true;
            stateManagerSvc.showCreateIndividualOverlay = true;
            stateManagerSvc.showDataPropertyOverlay = true;
            stateManagerSvc.showObjectPropertyOverlay = true;
            element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
            scope.$digest();
        });
        it('for an ontology-overlays', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-OVERLAYS');
        });
        it('based on confirmation-overlays', function() {
            var confirmations = element.find('confirmation-overlay');
            expect(confirmations.length).toBe(3);
        });
        _.forEach(['ontology-upload-overlay', 'annotation-overlay', 'ontology-download-overlay',
        'ontology-open-overlay', 'create-annotation-overlay', 'create-class-overlay',
        'create-property-overlay', 'create-individual-overlay', 'ontology-close-overlay', 
        'datatype-property-overlay', 'object-property-overlay'], function(item) {
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
        /*describe('deleteEntity', function() {
            it('calls correct manager function', function() {
                controller.deleteEntity();
                expect(stateManagerSvc.addDeletedEntity).toHaveBeenCalled();
                expect(ontologyManagerSvc.removeEntity).toHaveBeenCalledWith(stateManagerSvc.ontology,
                    stateManagerSvc.state.entityIRI);
            });
            *//*describe('when selected isOntology', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isOntology.and.returnValue(true);
                    ontologyManagerSvc.deleteOntology.and.returnValue(deferred.promise);
                    controller.deleteEntity();
                });
                it('calls the correct manager function', function() {
                    expect(ontologyManagerSvc.deleteOntology).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId);
                });
                it('when resolved', function() {
                    deferred.resolve();
                    scope.$apply();
                    expect(stateManagerSvc.clearState).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId);
                    expect(stateManagerSvc.showDeleteConfirmation).toBe(false);
                });
                it('when rejected', function() {
                    deferred.reject('error');
                    scope.$apply();
                    expect(controller.error).toBe('error');
                });
            });*//*
            *//*describe('when selected isClass', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isClass.and.returnValue(true);
                    controller.deleteEntity();
                });
                it('calls the correct manager function', function() {
                    expect(ontologyManagerSvc.deleteClass).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId,
                        stateManagerSvc.state.entityIRI);
                });
                it('when resolved', function() {
                    deferred.resolve();
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(stateManagerSvc.ontology);
                    expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId);
                    expect(stateManagerSvc.selectItem).toHaveBeenCalledWith('ontology-editor',
                        ontologyManagerSvc.getOntologyIRI(stateManagerSvc.ontology),
                        ontologyManagerSvc.getListItemById(stateManagerSvc.state.ontologyId));
                    expect(stateManagerSvc.showDeleteConfirmation).toBe(false);
                });
                it('when rejected', function() {
                    deferred.reject('error');
                    scope.$apply();
                    expect(controller.error).toBe('error');
                });
            });*//*
            *//*describe('when selected isObjectProperty', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isClass.and.returnValue(false);
                    ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                    ontologyManagerSvc.deleteObjectProperty.and.returnValue(deferred.promise);
                    controller.deleteEntity();
                });
                it('calls the correct manager function', function() {
                    expect(ontologyManagerSvc.deleteObjectProperty).toHaveBeenCalledWith(
                        stateManagerSvc.state.ontologyId, stateManagerSvc.state.entityIRI);
                });
                it('when resolved', function() {
                    deferred.resolve();
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(stateManagerSvc.ontology);
                    expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId);
                    expect(stateManagerSvc.selectItem).toHaveBeenCalledWith('ontology-editor',
                        ontologyManagerSvc.getOntologyIRI(stateManagerSvc.ontology),
                        ontologyManagerSvc.getListItemById(stateManagerSvc.state.ontologyId));
                    expect(stateManagerSvc.showDeleteConfirmation).toBe(false);
                });
                it('when rejected', function() {
                    deferred.reject('error');
                    scope.$apply();
                    expect(controller.error).toBe('error');
                });
            });
            describe('when selected isDataTypeProperty', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isClass.and.returnValue(false);
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                    ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                    ontologyManagerSvc.deleteDataTypeProperty.and.returnValue(deferred.promise);
                    controller.deleteEntity();
                });
                it('calls the correct manager function', function() {
                    expect(ontologyManagerSvc.deleteDataTypeProperty).toHaveBeenCalledWith(
                        stateManagerSvc.state.ontologyId, stateManagerSvc.state.entityIRI);
                });
                it('when resolved', function() {
                    deferred.resolve();
                    scope.$apply();
                    expect(ontologyManagerSvc.getOntologyIRI).toHaveBeenCalledWith(stateManagerSvc.ontology);
                    expect(ontologyManagerSvc.getListItemById).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId);
                    expect(stateManagerSvc.selectItem).toHaveBeenCalledWith('ontology-editor',
                        ontologyManagerSvc.getOntologyIRI(stateManagerSvc.ontology),
                        ontologyManagerSvc.getListItemById(stateManagerSvc.state.ontologyId));
                    expect(stateManagerSvc.showDeleteConfirmation).toBe(false);
                });
                it('when rejected', function() {
                    deferred.reject('error');
                    scope.$apply();
                    expect(controller.error).toBe('error');
                });
            });*//*
        });*/
        describe('save', function() {
            beforeEach(function() {
                stateManagerSvc.state.ontologyId = 'id';
                ontologyManagerSvc.saveChanges.and.returnValue(deferred.promise);
                controller.save();
            });
            it('calls the correct manager function', function() {
                expect(stateManagerSvc.getUnsavedEntities).toHaveBeenCalledWith(stateManagerSvc.ontology);
                expect(stateManagerSvc.getCreatedEntities).toHaveBeenCalledWith(stateManagerSvc.ontology);
                expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(stateManagerSvc.state.ontologyId,
                    stateManagerSvc.getUnsavedEntities(stateManagerSvc.ontology),
                    stateManagerSvc.getCreatedEntities(stateManagerSvc.ontology),
                    stateManagerSvc.state.deletedEntities);
            });
            it('when resolved, sets the correct variable and calls correct manager function', function() {
                deferred.resolve('id');
                scope.$apply();
                expect(stateManagerSvc.showSaveOverlay).toBe(false);
                expect(stateManagerSvc.afterSave).toHaveBeenCalledWith('id');
            });
        });
        it('removeAnnotation calls the correct manager functions and sets the correct manager variables', function() {
            controller.removeAnnotation();
            expect(annotationManagerSvc.remove).toHaveBeenCalledWith(stateManagerSvc.selected, stateManagerSvc.key,
                stateManagerSvc.index);
            expect(stateManagerSvc.setUnsaved).toHaveBeenCalledWith(stateManagerSvc.listItem.ontologyId,
                stateManagerSvc.selected.matonto.originalIRI, true);
            expect(stateManagerSvc.showRemoveOverlay).toBe(false);
        });
        it('removeIndividualProperty calls the correct manager functions and sets the correct manager variables', function() {
            stateManagerSvc.selected = {key: ['value0', 'value1']};
            stateManagerSvc.key = 'key';
            stateManagerSvc.index = 0;
            controller.removeIndividualProperty();
            expect(stateManagerSvc.selected.key).toBeDefined();
            expect(stateManagerSvc.selected.key).not.toContain('value0');
            expect(stateManagerSvc.setUnsaved).toHaveBeenCalledWith(stateManagerSvc.listItem.ontologyId,
                stateManagerSvc.state.entityIRI, true);
            expect(stateManagerSvc.showRemoveIndividualPropertyOverlay).toBe(false);

            controller.removeIndividualProperty();
            expect(stateManagerSvc.selected.key).toBeUndefined();
            expect(stateManagerSvc.setUnsaved).toHaveBeenCalledWith(stateManagerSvc.listItem.ontologyId,
                stateManagerSvc.state.entityIRI, true);
            expect(stateManagerSvc.showRemoveIndividualPropertyOverlay).toBe(false);
        });
    });
});