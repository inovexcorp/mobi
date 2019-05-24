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
describe('See History component', function() {
    var $compile, scope, ontologyStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockComponent('staticIri', 'staticIri');
        injectTrustedFilter();
        injectHighlightFilter();
        injectPrefixationFilter();
        mockCatalogManager();
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
        });

        this.commits = [{id: 'commit1'}, {id: 'commit2'}];
        this.element = $compile(angular.element('<see-history></see-history>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('seeHistory');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should go to prev', function() {
            this.controller.commits = this.commits;
            ontologyStateSvc.listItem.selectedCommit = this.controller.commits[0];
            this.controller.prev();
            expect(ontologyStateSvc.listItem.selectedCommit).toEqual(this.controller.commits[1]);
        });
        it('should go to next', function() {
            this.controller.commits = this.commits;
            ontologyStateSvc.listItem.selectedCommit = this.controller.commits[1];
            this.controller.next();
            expect(ontologyStateSvc.listItem.selectedCommit).toEqual(this.controller.commits[0]);
        });
        it('should go back', function() {
            this.controller.goBack();
            expect(ontologyStateSvc.listItem.seeHistory).toBeUndefined();
            expect(ontologyStateSvc.listItem.selectedCommit).toBeUndefined();
        });
        it('should assign the correct label for each commit', function() {
            this.controller.commits = this.commits;
            utilSvc.condenseCommitId.and.returnValue('1234');
            var labels = this.controller.commits.map(commit => this.controller.createLabel(commit.id));
            labels.forEach((label, idx) => {
                if (idx === 0) {
                    expect(label).toEqual('1234 (latest)');
                } else {
                    expect(label).toEqual('1234');
                }
            });
            // var label1 = this.controller.createLabel(this.commits[0].id);
            // var label2 = this.controller.createLabel(this.commits[1].id);
            // expect(label1).toEqual('1234 (latest)');
            // expect(label2).toEqual('1234');  
        });
        describe('should load a list of commits', function() {
            it('to `commits` in the controller when receiveCommits is called', function() {
                this.controller.receiveCommits(this.commits);
                expect(this.controller.commits).toBe(this.commits);
            });
            it('and set the default value in the dropdown to the latest commit for an entity', function() {
                this.controller.receiveCommits(this.commits);
                expect(this.controller.os.listItem.selectedCommit).toBe(this.commits[0]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SEE-HISTORY');
            expect(this.element.querySelectorAll('.see-history-header').length).toBe(1);
            expect(this.element.querySelectorAll('.see-history-title').length).toBe(1);
        });
        it('with .form-groups', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        ['static-iri', 'select', 'commit-compiled-resource', 'commit-history-table'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
    });
    it('should call goBack when the button is clicked', function() {
        spyOn(this.controller, 'goBack');
        var button = angular.element(this.element.querySelectorAll('.back-column button')[0]);
        button.triggerHandler('click');
        expect(this.controller.goBack).toHaveBeenCalled();
    });
    it('should call prev when the previous button is clicked', function() {
        spyOn(this.controller, 'prev');
        var button = angular.element(this.element.querySelectorAll('button.previous-btn')[0]);
        button.triggerHandler('click');
        expect(this.controller.prev).toHaveBeenCalled();
    });
    it('should call next when the next button is clicked', function() {
        spyOn(this.controller, 'next');
        var button = angular.element(this.element.querySelectorAll('button.next-btn')[0]);
        button.triggerHandler('click');
        expect(this.controller.next).toHaveBeenCalled();
    });
});
