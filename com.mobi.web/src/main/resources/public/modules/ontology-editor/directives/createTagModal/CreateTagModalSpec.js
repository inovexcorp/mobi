/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Create Tag Modal component', function() {
    var $compile, scope, $q, catalogManagerSvc, ontologyStateSvc, loginManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('createTagModal');
        mockCatalogManager();
        mockOntologyState();
        mockLoginManager();
        mockPrefixes();
        injectRegexConstant();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _ontologyStateService_, _loginManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
            loginManagerSvc = _loginManagerService_;
            prefixes = _prefixes_;
        });

        loginManagerSvc.currentUserIRI = 'user';
        this.catalogId = _.get(catalogManagerSvc.localCatalog, '@id', '');
        this.recordId = 'recordId';
        this.branchId = 'branchId'
        this.commitId = 'commitId';
        this.error = 'error';
        ontologyStateSvc.listItem.ontologyRecord = {recordId: this.recordId, commitId: this.commitId, branchId: this.branchId};

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<create-tag-modal close="close()" dismiss="dismiss()"></create-tag-modal>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createTagModal');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        ontologyStateSvc = null;
        loginManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CREATE-TAG-MODAL');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('if an error has occurred', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = this.error;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with a text-input', function() {
            expect(this.element.find('text-input').length).toBe(1);
        });
        it('with an input for the IRI', function() {
            expect(this.element.querySelectorAll('input[name="iri"]').length).toEqual(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        it('cancel calls dismiss', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        describe('create calls the correct methods', function() {
            beforeEach(function() {
                this.tag = {'@id': this.controller.tagConfig.iri}
            });
            describe('when createRecordTag is resolved', function() {
                beforeEach(function() {
                    catalogManagerSvc.createRecordTag.and.returnValue($q.when());
                });
                describe('and getRecordVersion is resolved', function() {
                    beforeEach(function() {
                        catalogManagerSvc.getRecordVersion.and.returnValue($q.when(this.tag));
                    });
                    it('and updateOntologyState is resolved', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.when());
                        this.controller.create();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordTag).toHaveBeenCalledWith(this.recordId, this.catalogId, this.controller.tagConfig);
                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tag['@id'], this.recordId, this.catalogId);
                        expect(ontologyStateSvc.listItem.tags).toContain(this.tag);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, tagId: this.tag['@id']});
                        expect(this.controller.error).toEqual('');
                        expect(scope.close).toHaveBeenCalled();
                    });
                    it('and updateOntologyState is rejected', function() {
                        ontologyStateSvc.updateOntologyState.and.returnValue($q.reject(this.error));
                        this.controller.create();
                        scope.$digest();
                        expect(catalogManagerSvc.createRecordTag).toHaveBeenCalledWith(this.recordId, this.catalogId, this.controller.tagConfig);
                        expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tag['@id'], this.recordId, this.catalogId);
                        expect(ontologyStateSvc.listItem.tags).toContain(this.tag);
                        expect(ontologyStateSvc.updateOntologyState).toHaveBeenCalledWith({recordId: this.recordId, commitId: this.commitId, tagId: this.tag['@id']});
                        expect(this.controller.error).toEqual(this.error);
                        expect(scope.close).not.toHaveBeenCalled();
                    });
                });
                it('and getRecordVersion is rejected', function() {
                    catalogManagerSvc.getRecordVersion.and.returnValue($q.reject(this.error));
                    this.controller.create();
                    scope.$digest();
                    expect(catalogManagerSvc.createRecordTag).toHaveBeenCalledWith(this.recordId, this.catalogId, this.controller.tagConfig);
                    expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.tag['@id'], this.recordId, this.catalogId);
                    expect(ontologyStateSvc.listItem.tags).not.toContain(this.tag);
                    expect(ontologyStateSvc.updateOntologyState).not.toHaveBeenCalledWith();
                    expect(this.controller.error).toEqual(this.error);
                    expect(scope.close).not.toHaveBeenCalled();
                });
            });
            it('when createRecordTag is rejected', function() {
                catalogManagerSvc.createRecordTag.and.returnValue($q.reject(this.error));
                this.controller.create();
                scope.$digest();
                expect(catalogManagerSvc.createRecordTag).toHaveBeenCalledWith(this.recordId, this.catalogId, this.controller.tagConfig);
                expect(catalogManagerSvc.getRecordVersion).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.tags).not.toContain(this.tag);
                expect(ontologyStateSvc.updateOntologyState).not.toHaveBeenCalled();
                expect(this.controller.error).toEqual(this.error);
                expect(scope.close).not.toHaveBeenCalled();
            });
        });
    });
    it('should call create when the submit button is clicked', function() {
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});