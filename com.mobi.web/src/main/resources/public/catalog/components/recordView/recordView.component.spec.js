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
describe('Record View component', function() {
    var $compile, scope, $q, catalogManagerSvc, catalogStateSvc, ontologyStateSvc, policyEnforcementSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'entityPublisher');
        mockComponent('catalog', 'recordViewTabset');
        mockComponent('catalog', 'recordIcon');
        mockComponent('catalog', 'catalogRecordKeywords');
        mockComponent('catalog', 'limit-description');
        mockCatalogManager();
        mockCatalogState();
        mockOntologyState();
        mockPolicyEnforcement();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _catalogStateService_, _ontologyStateService_, _policyEnforcementService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            ontologyStateSvc = _ontologyStateService_;
            policyEnforcementSvc = _policyEnforcementService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.catalogId = 'catalogId';
        this.recordId = 'recordId';
        this.record = {'@id': this.recordId};
        utilSvc.getPropertyId.and.callFake((obj, propId) => {
            if (propId === prefixes.catalog + 'catalog') {
                return this.catalogId;
            }
            return '';
        });
        utilSvc.getDctermsValue.and.callFake((obj, prop) => prop);
        utilSvc.getDate.and.returnValue('date');
        utilSvc.updateDctermsValue.and.callFake((obj, prop, newVal) => obj[prefixes.dcterms + prop] = [{'@value': newVal}]);
        catalogStateSvc.selectedRecord = this.record;
        catalogManagerSvc.getRecord.and.returnValue($q.when(this.record));
        this.element = $compile(angular.element('<record-view></record-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordView');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        ontologyStateSvc = null;
        policyEnforcementSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('if the record is found', function() {
            expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(this.recordId, this.catalogId);
            expect(this.controller.record).toEqual(this.record);
            expect(catalogStateSvc.selectedRecord).toEqual(this.record);
            expect(this.controller.title).toEqual('title');
            expect(this.controller.description).toEqual('description');
            expect(this.controller.modified).toEqual('date');
            expect(this.controller.issued).toEqual('date');
            expect(policyEnforcementSvc.evaluateRequest).toHaveBeenCalledWith(jasmine.any(Object));
            expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
        });
        it('unless the record is not found', function() {
            policyEnforcementSvc.evaluateRequest.calls.reset();
            catalogManagerSvc.getRecord.and.returnValue($q.reject('Error message'));
            this.element = $compile(angular.element('<record-view></record-view>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('recordView');
            expect(this.controller.record).toBeUndefined();
            expect(catalogStateSvc.selectedRecord).toBeUndefined();
            expect(policyEnforcementSvc.evaluateRequest).not.toHaveBeenCalled();
            expect(utilSvc.createWarningToast).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should go back', function() {
           this.controller.goBack();
           expect(catalogStateSvc.selectedRecord).toBeUndefined();
        });
        describe('should update the record', function() {
            beforeEach(function() {
                this.controller.title = 'TEST';
                this.controller.description = 'TEST';
                this.controller.modified = 'TEST';
                this.controller.issued = 'TEST';
            });
            it('if updateRecord resolves', function() {
                this.controller.updateRecord(this.record)
                    .then(angular.noop, () => fail('Promise should have resolved'));
                scope.$apply();
                expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith(this.recordId, this.catalogId, this.record);
                expect(this.controller.record).toEqual(this.record);
                expect(catalogStateSvc.selectedRecord).toEqual(this.record);
                expect(this.controller.title).toEqual('title');
                expect(this.controller.description).toEqual('description');
                expect(this.controller.modified).toEqual('date');
                expect(this.controller.issued).toEqual('date');
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless updateRecord rejects', function() {
                catalogManagerSvc.updateRecord.and.returnValue($q.reject('Error message'));
                this.controller.updateRecord(this.record)
                    .then(() => fail('Promise should have rejected'), angular.noop);
                scope.$apply();
                expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith(this.recordId, this.catalogId, this.record);
                expect(this.controller.title).toEqual('TEST');
                expect(this.controller.description).toEqual('TEST');
                expect(this.controller.modified).toEqual('TEST');
                expect(this.controller.issued).toEqual('TEST');
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
        });
        it('should update the description', function() {
            spyOn(this.controller, 'updateRecord');
            scope.$digest();
            var description = 'This is a new description';
            this.controller.updateDescription(description);
            expect(this.controller.record[prefixes.dcterms + 'description'][0]['@value']).toEqual(description);
            expect(this.controller.updateRecord).toHaveBeenCalled();
        });
        describe('should update the title', function() {
            it('when changed', function() {
                spyOn(this.controller, 'updateRecord');
                scope.$digest();
                var title = 'This is a new title';
                this.controller.updateTitle(title);
                expect(this.controller.record[prefixes.dcterms + 'title'][0]['@value']).toEqual(title);
                expect(this.controller.updateRecord).toHaveBeenCalled();
            });
            it('and update ontology state title if open', function() {
                ontologyStateSvc.list = [{ontologyRecord: {title: 'title'}}];
                spyOn(this.controller, 'updateRecord');
                scope.$digest();
                var title = 'This is a new title';
                this.controller.updateTitle(title);
                expect(this.controller.record[prefixes.dcterms + 'title'][0]['@value']).toEqual(title);
                expect(this.controller.updateRecord).toHaveBeenCalled();
                expect(ontologyStateSvc.list[0].ontologyRecord.title).toEqual(title);
            });
        });
        describe('should set whether the user can edit the record', function() {
            describe('when evaluateRequest resolves', function() {
                it('with Permit', function() {
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
                    this.controller.setCanEdit();
                    scope.$apply();
                    expect(policyEnforcementSvc.evaluateRequest).toHaveBeenCalledWith({resourceId: this.recordId, actionId: prefixes.policy + 'Update'});
                    expect(this.controller.canEdit).toEqual(true);
                    expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                });
                it('with Indeterminate', function() {
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.indeterminate));
                    this.controller.setCanEdit();
                    scope.$apply();
                    expect(policyEnforcementSvc.evaluateRequest).toHaveBeenCalledWith({resourceId: this.recordId, actionId: prefixes.policy + 'Update'});
                    expect(this.controller.canEdit).toEqual(true);
                    expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                });
                it('with Deny', function() {
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
                    this.controller.setCanEdit();
                    scope.$apply();
                    expect(policyEnforcementSvc.evaluateRequest).toHaveBeenCalledWith({resourceId: this.recordId, actionId: prefixes.policy + 'Update'});
                    expect(this.controller.canEdit).toEqual(false);
                    expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                });
            });
            it('when evaluateRequest rejects', function() {
                policyEnforcementSvc.evaluateRequest.and.returnValue($q.reject('Error message'));
                this.controller.setCanEdit();
                scope.$apply();
                expect(policyEnforcementSvc.evaluateRequest).toHaveBeenCalledWith({resourceId: this.recordId, actionId: prefixes.policy + 'Update'});
                expect(this.controller.canEdit).toEqual(false);
                expect(utilSvc.createWarningToast).toHaveBeenCalled();
            });
        });
        it('should update the state of editing', function() {
            this.controller.setEditing(true);
            expect(this.controller.editing).toEqual(true);

            this.controller.setEditing(false);
            expect(this.controller.editing).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RECORD-VIEW');
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.back-column').length).toEqual(1);
            expect(this.element.querySelectorAll('.record-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.record-sidebar').length).toEqual(1);
        });
        ['record-view-tabset', 'button', 'record-icon', 'dl', 'entity-publisher', 'catalog-record-keywords', 'limit-description'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
    });
    it('should go back to the catalog page when the button is clicked', function() {
        spyOn(this.controller, 'goBack');
        var button = this.element.find('button');
        button.triggerHandler('click');
        expect(this.controller.goBack).toHaveBeenCalled();
    });
});