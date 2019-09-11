/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Imports Block component', function() {
    var $compile, scope, $q, ontologyStateSvc, prefixes, propertyManagerSvc, modalSvc, util;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockOntologyState();
        mockPrefixes();
        mockUtil();
        mockPropertyManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _prefixes_, _propertyManagerService_, _modalService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            propertyManagerSvc = _propertyManagerService_;
            modalSvc = _modalService_;
            util = _utilService_;
        });

        this.ontologyId = 'ontologyId';
        this.recordId = 'recordId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.listItem = {
            additions: [],
            deletions: [],
            ontologyRecord: { recordId: this.recordId, branchId: this.branchId, commitId: this.commitId },
            upToDate: true,
            inProgressCommit: {},
            selected: {
                '@id': this.ontologyId,
                [prefixes.owl + 'imports']: [{}]
            }
        };
        this.element = $compile(angular.element('<imports-block list-item="listItem"></imports-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('importsBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        prefixes = null;
        propertyManagerSvc = null;
        modalSvc = null;
        util = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('listItem should be one way bound', function() {
            var original = angular.copy(scope.listItem);
            this.controller.listItem = {};
            scope.$digest();
            expect(scope.listItem).toEqual(original);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('IMPORTS-BLOCK');
            expect(this.element.querySelectorAll('.imports-block').length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toEqual(1);
        });
        it('with links for adding and refreshing when the user can modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(2);
        });
        it('with links for adding and refreshing when the user cannot modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toEqual(1);
        });
        it('with a p a.import-iri', function() {
            expect(this.element.querySelectorAll('p a.import-iri').length).toEqual(1);
            spyOn(this.controller, 'failed').and.returnValue(true);
            scope.$apply();
            expect(this.element.querySelectorAll('p a.import-iri').length).toEqual(0);
        });
        it('with a .text-danger', function() {
            expect(this.element.querySelectorAll('.text-danger').length).toEqual(0);
            spyOn(this.controller, 'failed').and.returnValue(true);
            scope.$apply();
            expect(this.element.querySelectorAll('.text-danger').length).toEqual(1);
        });
        it('with a p a.btn-link if the user can modify', function() {
            expect(this.element.querySelectorAll('p a.btn-link').length).toEqual(1);
        });
        it('with no p a.btn-link if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('p a.btn-link').length).toEqual(0);
        });
        it('depending on the length of the selected ontology imports', function() {
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.import').length).toEqual(1);
            this.controller.listItem.selected[prefixes.owl + 'imports'] = [];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.import').length).toEqual(0);
        });
        it('with an .indirect-import-container', function() {
            expect(this.element.querySelectorAll('.indirect-import-container').length).toEqual(0);
            this.controller.indirectImports = ['iri'];
            scope.$digest();
            expect(this.element.querySelectorAll('.indirect-import-container').length).toEqual(1);
        });
        it('with an .indirect.import', function() {
            expect(this.element.querySelectorAll('.indirect.import').length).toEqual(0);
            this.controller.indirectImports = ['iri'];
            scope.$digest();
            expect(this.element.querySelectorAll('.indirect.import').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('setupRemove should set the correct variables and open a remove confirmation modal if', function() {
            it('the ontology has changes', function() {
                ontologyStateSvc.hasChanges.and.returnValue(true);
                this.controller.setupRemove('url');
                expect(this.controller.url).toEqual('url');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('NOTE:'), this.controller.remove);
            });
            it('the ontology does not have changes', function() {
                ontologyStateSvc.hasChanges.and.returnValue(false);
                this.controller.setupRemove('url');
                expect(this.controller.url).toEqual('url');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith({asymmetricMatch: actual => !actual.includes('NOTE:')}, this.controller.remove);
            });
        });
        describe('remove calls the proper functions', function() {
            beforeEach(function() {
                this.controller.url = 'url';
                this.controller.listItem.selected[prefixes.owl + 'imports'] = [{'@id': 'url'}];
            });
            describe('when save changes resolves', function() {
                beforeEach(function() {
                    ontologyStateSvc.saveChanges.and.returnValue($q.when());
                });
                describe('when after save resolves', function() {
                    beforeEach(function() {
                        ontologyStateSvc.afterSave.and.returnValue($q.when());
                    });
                    it('when update ontology resolves', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.when());
                        spyOn(this.controller, 'setIndirectImports');
                        ontologyStateSvc.isCommittable.and.returnValue(true);
                        this.controller.remove();
                        scope.$apply();
                        expect(util.createJson).toHaveBeenCalledWith(this.ontologyId, prefixes.owl + 'imports', {'@id': this.controller.url});
                        expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(this.recordId, jasmine.any(Object));
                        expect(propertyManagerSvc.remove).toHaveBeenCalledWith(this.controller.listItem.selected, prefixes.owl + 'imports', 0);
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(this.recordId, {additions: this.controller.listItem.additions, deletions: this.controller.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.controller.listItem.upToDate, this.controller.listItem.inProgressCommit);
                        expect(ontologyStateSvc.updateIsSaved).toHaveBeenCalled();
                        expect(this.controller.setIndirectImports).toHaveBeenCalled();
                    });
                    it('when update ontology rejects', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                        this.controller.remove();
                        scope.$apply();
                        expect(util.createJson).toHaveBeenCalledWith(this.ontologyId, prefixes.owl + 'imports', {'@id': this.controller.url});
                        expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(this.recordId, jasmine.any(Object));
                        expect(propertyManagerSvc.remove).toHaveBeenCalledWith(this.controller.listItem.selected, prefixes.owl + 'imports', 0);
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(this.recordId, {additions: this.controller.listItem.additions, deletions: this.controller.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.controller.listItem.upToDate, this.controller.listItem.inProgressCommit);
                        expect(ontologyStateSvc.updateIsSaved).not.toHaveBeenCalled();
                        expect(util.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
                it('when after save rejects', function() {
                    ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                    this.controller.remove();
                    scope.$apply();
                    expect(util.createJson).toHaveBeenCalledWith(this.ontologyId, prefixes.owl + 'imports', {'@id': this.controller.url});
                    expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(this.recordId, jasmine.any(Object));
                    expect(propertyManagerSvc.remove).toHaveBeenCalledWith(this.controller.listItem.selected, prefixes.owl + 'imports', 0);
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(this.recordId, {additions: this.controller.listItem.additions, deletions: this.controller.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('when save changes rejects', function() {
                ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
                this.controller.remove();
                scope.$apply();
                expect(util.createJson).toHaveBeenCalledWith(this.ontologyId, prefixes.owl + 'imports', {'@id': this.controller.url});
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(this.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(this.controller.listItem.selected, prefixes.owl + 'imports', 0);
                expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(this.recordId, {additions: this.controller.listItem.additions, deletions: this.controller.listItem.deletions});
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('get should return the correct variable', function() {
            expect(this.controller.get({'@id': 'id'})).toEqual('id');
            expect(this.controller.get()).toBeUndefined();
        });
        describe('failed should return the correct value when failedImports', function() {
            beforeEach(function() {
                this.controller.listItem.failedImports = ['failedId'];
            });
            it('includes the iri', function() {
                expect(this.controller.failed('failedId')).toEqual(true);
            });
            it('does not include the iri', function() {
                expect(this.controller.failed('missingId')).toEqual(false);
            });
        });
        describe('refresh should call the correct function when updateOntology is', function() {
            it('resolved', function() {
                spyOn(this.controller, 'setIndirectImports');
                ontologyStateSvc.updateOntology.and.returnValue($q.resolve());
                this.controller.refresh();
                scope.$apply();
                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.controller.listItem.upToDate, this.controller.listItem.inProgressCommit, true);
                expect(util.createSuccessToast).toHaveBeenCalledWith('');
                expect(this.controller.setIndirectImports).toHaveBeenCalled();
            });
            it('rejected', function() {
                ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                this.controller.refresh();
                scope.$apply();
                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.controller.listItem.upToDate, this.controller.listItem.inProgressCommit, true);
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('setIndirectImports should set the value correctly', function() {
            this.controller.listItem.selected[prefixes.owl + 'imports'] = [{'@id': 'direct'}];
            this.controller.listItem.importedOntologies = [{
                id: 'direct-version',
                ontologyId: 'direct'
            }, {
                id: 'indirect-b-version',
                ontologyId: 'indirect-b'
            }, {
                id: 'indirect-a',
                ontologyId: 'indirect-a'
            }];
            this.controller.setIndirectImports();
            expect(this.controller.indirectImports).toEqual(['indirect-a', 'indirect-b']);
        });
        it('should show the new import overlay', function() {
            this.controller.showNewOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('importsOverlay', {}, this.controller.setIndirectImports);
        });
    });
});