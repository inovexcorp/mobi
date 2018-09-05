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
describe('Imports Block directive', function() {
    var $compile, scope, $q, ontologyStateSvc, prefixes, propertyManagerSvc, modalSvc, util;

    beforeEach(function() {
        module('templates');
        module('importsBlock');
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

        ontologyStateSvc.listItem.selected[prefixes.owl + 'imports'] = [{}];
        this.element = $compile(angular.element('<imports-block></imports-block>'))(scope);
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

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('imports-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-header a', function() {
            expect(this.element.querySelectorAll('block-header a.float-right').length).toBe(2);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a p a.import-iri', function() {
            expect(this.element.querySelectorAll('p a.import-iri').length).toBe(1);
            spyOn(this.controller, 'failed').and.returnValue(true);
            scope.$apply();
            expect(this.element.querySelectorAll('p a.import-iri').length).toBe(0);
        });
        it('with a .text-danger', function() {
            expect(this.element.querySelectorAll('.text-danger').length).toBe(0);
            spyOn(this.controller, 'failed').and.returnValue(true);
            scope.$apply();
            expect(this.element.querySelectorAll('.text-danger').length).toBe(1);
        });
        it('with a p a.btn-link', function() {
            expect(this.element.querySelectorAll('p a.btn-link').length).toBe(1);
        });
        it('depending on the length of the selected ontology imports', function() {
            expect(this.element.find('info-message').length).toBe(0);
            expect(this.element.querySelectorAll('.import').length).toBe(1);
            ontologyStateSvc.listItem.selected[prefixes.owl + 'imports'] = [];
            scope.$digest();
            expect(this.element.find('info-message').length).toBe(1);
            expect(this.element.querySelectorAll('.import').length).toBe(0);
        });
        it('with an .indirect-import-container', function() {
            expect(this.element.querySelectorAll('.indirect-import-container').length).toBe(0);
            this.controller.indirectImports = ['iri'];
            scope.$digest();
            expect(this.element.querySelectorAll('.indirect-import-container').length).toBe(1);
        });
        it('with an .indirect.import', function() {
            expect(this.element.querySelectorAll('.indirect.import').length).toBe(0);
            this.controller.indirectImports = ['iri'];
            scope.$digest();
            expect(this.element.querySelectorAll('.indirect.import').length).toBe(1);
        });
        it('with an .indirect-header', function() {
            expect(this.element.querySelectorAll('.indirect-header').length).toBe(0);
            this.controller.indirectImports = ['iri'];
            scope.$digest();
            expect(this.element.querySelectorAll('.indirect-header').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('setupRemove should set the correct variables and open a remove confirmation modal if', function() {
            it('the ontology has changes', function() {
                ontologyStateSvc.hasChanges.and.returnValue(true);
                this.controller.setupRemove('url');
                expect(this.controller.url).toBe('url');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('NOTE:'), this.controller.remove);
            });
            it('the ontology does not have changes', function() {
                ontologyStateSvc.hasChanges.and.returnValue(false);
                this.controller.setupRemove('url');
                expect(this.controller.url).toBe('url');
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith({asymmetricMatch: actual => !actual.includes('NOTE:')}, this.controller.remove);
            });
        });
        describe('remove calls the proper functions', function() {
            beforeEach(function() {
                this.controller.url = 'url';
                ontologyStateSvc.listItem.selected[prefixes.owl + 'imports'] = [{'@id': 'url'}];
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
                        expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': this.controller.url});
                        expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', 0);
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(ontologyStateSvc.isCommittable).toHaveBeenCalledWith(ontologyStateSvc.listItem);
                        expect(ontologyStateSvc.listItem.isSaved).toBe(true);
                        expect(this.controller.setIndirectImports).toHaveBeenCalled();
                    });
                    it('when update ontology rejects', function() {
                        ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                        this.controller.remove();
                        scope.$apply();
                        expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': this.controller.url});
                        expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                        expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', 0);
                        expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                        expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                        expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit);
                        expect(util.createErrorToast).toHaveBeenCalledWith('error');
                    });
                });
                it('when after save rejects', function() {
                    ontologyStateSvc.afterSave.and.returnValue($q.reject('error'));
                    this.controller.remove();
                    scope.$apply();
                    expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': this.controller.url});
                    expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                    expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', 0);
                    expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                    expect(ontologyStateSvc.afterSave).toHaveBeenCalled();
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('when save changes rejects', function() {
                ontologyStateSvc.saveChanges.and.returnValue($q.reject('error'));
                this.controller.remove();
                scope.$apply();
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], prefixes.owl + 'imports', {'@id': this.controller.url});
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, prefixes.owl + 'imports', 0);
                expect(ontologyStateSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, {additions: ontologyStateSvc.listItem.additions, deletions: ontologyStateSvc.listItem.deletions});
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('get should return the correct variable', function() {
            expect(this.controller.get({'@id': 'id'})).toBe('id');
            expect(this.controller.get()).toBeUndefined();
        });
        describe('failed should return the correct value when failedImports', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem.failedImports = ['failedId'];
            });
            it('includes the iri', function() {
                expect(this.controller.failed('failedId')).toBe(true);
            });
            it('does not include the iri', function() {
                expect(this.controller.failed('missingId')).toBe(false);
            });
        });
        describe('refresh should call the correct function when updateOntology is', function() {
            it('resolved', function() {
                spyOn(this.controller, 'setIndirectImports');
                ontologyStateSvc.updateOntology.and.returnValue($q.resolve());
                this.controller.refresh();
                scope.$apply();
                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit, true);
                expect(util.createSuccessToast).toHaveBeenCalledWith('');
                expect(this.controller.setIndirectImports).toHaveBeenCalled();
            });
            it('rejected', function() {
                ontologyStateSvc.updateOntology.and.returnValue($q.reject('error'));
                this.controller.refresh();
                scope.$apply();
                expect(ontologyStateSvc.updateOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.upToDate, ontologyStateSvc.listItem.inProgressCommit, true);
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('setIndirectImports should set the value correctly', function() {
            ontologyStateSvc.listItem.selected[prefixes.owl + 'imports'] = [{'@id': 'direct'}];
            ontologyStateSvc.listItem.importedOntologies = [{
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