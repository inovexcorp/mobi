/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { SeeHistoryComponent } from './seeHistory.component';
import { SharedModule} from '../../../shared/shared.module';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { StaticIriComponent } from '../staticIri/staticIri.component';
import { UtilService } from '../../../shared/services/util.service';

describe('See History component', function() {
    let component: SeeHistoryComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SeeHistoryComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            declarations: [
                SeeHistoryComponent,
                MockComponent(StaticIriComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(UtilService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SeeHistoryComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        utilStub = TestBed.get(UtilService);

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.selected = {
            '@id': 'www.test.com',
        };

        this.commits = [{id: 'commit1'}, {id: 'commit2'}];
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        it('should go to prev', function() {
            component.commits = this.commits;
            ontologyStateStub.listItem.selectedCommit = component.commits[0];
            component.prev();
            expect(ontologyStateStub.listItem.selectedCommit).toEqual(component.commits[1]);
        });
        it('should go to next', function() {
            component.commits = this.commits;
            ontologyStateStub.listItem.selectedCommit = component.commits[1];
            component.next();
            expect(ontologyStateStub.listItem.selectedCommit).toEqual(component.commits[0]);
        });
        it('should go back', function() {
            component.goBack();
            expect(ontologyStateStub.listItem.seeHistory).toBeUndefined();
            expect(ontologyStateStub.listItem.selectedCommit).toBeUndefined();
        });
        it('should assign the correct label for each commit', function() {
            component.commits = this.commits;
            utilStub.condenseCommitId.and.returnValue('1234');
            const labels = component.commits.map(commit => component.createLabel(commit.id));
            labels.forEach((label, idx) => {
                if (idx === 0) {
                    expect(label).toEqual('1234 (latest)');
                } else {
                    expect(label).toEqual('1234');
                }
            });
        });
        describe('should load a list of commits', function() {
            it('to `commits` in the controller when receiveCommits is called', function() {
                component.receiveCommits(this.commits);
                expect(component.commits).toEqual(this.commits);
            });
            it('and set the default value in the dropdown to the latest commit for an entity', function() {
                component.receiveCommits(this.commits);
                expect(component.os.listItem.selectedCommit).toEqual(this.commits[0]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.see-history-header')).length).toEqual(1);
            expect(element.queryAll(By.css('.see-history-title')).length).toEqual(1);
        });
        it('with .form-groups', function() {
            expect(element.queryAll(By.css('.form-group')).length).toEqual(2);
        });
        ['static-iri', '.mat-select', 'commit-compiled-resource', 'commit-history-table'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
    it('should call goBack when the button is clicked', function() {
        spyOn(component, 'goBack');
        const button = element.queryAll(By.css('.back-column button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.goBack).toHaveBeenCalledWith();
    });
    it('should call prev when the previous button is clicked', function() {
        spyOn(component, 'prev');
        const button = element.queryAll(By.css('button.previous-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.prev).toHaveBeenCalledWith();
    });
    it('should call next when the next button is clicked', function() {
        spyOn(component, 'next');
        const button = element.queryAll(By.css('button.next-btn'))[0];
        button.triggerEventHandler('click', null);
        expect(component.next).toHaveBeenCalledWith();
    });
});
