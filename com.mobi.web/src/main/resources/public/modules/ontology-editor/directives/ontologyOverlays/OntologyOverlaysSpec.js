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
describe('Ontology Overlays directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyOverlays');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.showAnnotationOverlay = true;
        ontologyStateSvc.showDataPropertyOverlay = true;
        ontologyStateSvc.showObjectPropertyOverlay = true;
        ontologyStateSvc.showDownloadOverlay = true;
        ontologyStateSvc.showCreateClassOverlay = true;
        ontologyStateSvc.showCreatePropertyOverlay = true;
        ontologyStateSvc.showCreateIndividualOverlay = true;
        ontologyStateSvc.showCloseOverlay = true;
        ontologyStateSvc.showRemoveOverlay = true;
        ontologyStateSvc.showRemoveIndividualPropertyOverlay = true;
        ontologyStateSvc.showCommitOverlay = true;
        ontologyStateSvc.showCreateBranchOverlay = true;
        this.element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('ONTOLOGY-OVERLAYS');
        });
        _.forEach(['annotation-overlay', 'datatype-property-overlay', 'object-property-overlay',
        'ontology-download-overlay', 'create-class-overlay', 'create-property-overlay', 'create-individual-overlay',
        'ontology-close-overlay', 'commit-overlay', 'create-branch-overlay'],
        function(item) {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
    });
});