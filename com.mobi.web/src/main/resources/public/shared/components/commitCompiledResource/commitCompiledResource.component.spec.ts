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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { configureTestSuite } from 'ng-bullet';
import { By } from '@angular/platform-browser';
import { of, throwError} from 'rxjs';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../services/ontologyState.service';
import { OntologyManagerService } from '../../services/ontologyManager.service';
import { SharedModule } from '../../shared.module';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { CommitDifference } from '../../models/commitDifference.interface';
import { UtilService } from '../../services/util.service';
import { CommitCompiledResourceComponent } from './commitCompiledResource.component';
import { ProgressSpinnerService } from '../progress-spinner/services/progressSpinner.service';

describe('Commit Compiled Resource component', function() {
    let component: CommitCompiledResourceComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitCompiledResourceComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const commitDifference: CommitDifference = new CommitDifference();
    commitDifference.commit = {'@id': '', '@type': []};

    configureTestSuite((function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [],
            providers: [
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(UtilService),
                MockProvider(ProgressSpinnerService)
            ]
        });
    }));

    beforeEach(function() {
        fixture = TestBed.createComponent(CommitCompiledResourceComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get(UtilService);

        this.error = 'error';
        this.commitId = 'commit';
        this.entityId = 'entity';
        this.resource = {
            '@id': 'www.test.com',
            '@type': ['commit'],
            'extraProp': ['test']
        };
        this.commit = {
            id: this.commitId,
            additions: [],
            deletions: []
        };

        catalogManagerStub.getCompiledResource.and.returnValue(of([this.resource]));
        catalogManagerStub.getCommit.and.returnValue(of(this.commit));

        component.commitId = '';
        component.entityId = '';
        component.entityNameFunc = jasmine.createSpy('entityNameFunc');
        component.entityNameFunc.and.returnValue('label');
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        fixture = null;
        component = null;
        element = null;
        ontologyStateStub = null;
        ontologyManagerStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('controller bound variable', function() {
        it('commitId is one way bound', function() {
            component.commitId = 'Test';
            fixture.detectChanges();
            expect(component.commitId).toEqual('Test');
        });
        it('entityId is one way bound', function() {
            component.entityId = 'Test';
            fixture.detectChanges();
            expect(component.entityId).toEqual('Test');
        });
    });
    describe('controller methods', function() {
        describe('sets the compiled resource and commit', function() {
            beforeEach(function() {
                component.commitId = this.commitId;
                component.entityId = this.entityId;
            });
            it('if a commitId is set', function() {
                catalogManagerStub.getDifferenceForSubject.and.returnValue(of(commitDifference));

                component.setResource();
                fixture.detectChanges();
                //expect(httpSvc.cancel).toHaveBeenCalledWith(component.id);
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, true);
                expect(catalogManagerStub.getDifferenceForSubject).toHaveBeenCalledWith(this.entityId, this.commitId);
                expect(component.resource).toEqual({'extraProp': ['test']});
            });
            it('unless a commitId is not set', function() {
                component.commitId = null;
                component.setResource();
                fixture.detectChanges();
                //expect(httpSvc.cancel).not.toHaveBeenCalled();
                expect(catalogManagerStub.getCompiledResource).not.toHaveBeenCalled();
                expect(catalogManagerStub.getDifferenceForSubject).not.toHaveBeenCalled();
                expect(component.resource).toBeUndefined();
            });
            it('unless getCompiledResource rejects', function() {
                catalogManagerStub.getCompiledResource.and.returnValue(throwError('Error Message'));
                component.setResource();
                fixture.detectChanges();
                //expect(httpSvc.cancel).toHaveBeenCalledWith(component.id);
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, true);
                expect(catalogManagerStub.getDifferenceForSubject).not.toHaveBeenCalled();
                expect(component.error).toEqual('Error Message');
            });
            it('unless getDifference rejects', function() {
                catalogManagerStub.getDifferenceForSubject.and.returnValue(throwError('Error Message'));
                component.setResource();
                fixture.detectChanges();
                //expect(httpSvc.cancel).toHaveBeenCalledWith(component.id);
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith(this.commitId, this.entityId, true);
                expect(catalogManagerStub.getDifferenceForSubject).toHaveBeenCalledWith(this.entityId, this.commitId);
                expect(component.error).toEqual('Error Message');
            });
        });
    });
    describe('contains the correct html', function() {
        it('depending on whether a resource is found', function() {
            component.resource = {prop: [{'@value': 'Test'}]};
            component.commitId = 'commit';
            component.entityId = 'entity';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.wrapper')).length).toBe(1);
            expect(element.queryAll(By.css('.property-values')).length).toBe(1);
            expect(element.queryAll(By.css('.prop-value-container')).length).toBe(1);
            expect(element.queryAll(By.css('.value-display-wrapper')).length).toBe(1);
            expect(element.queryAll(By.css('.prop-header')).length).toBe(1);
            expect(element.queryAll(By.css('.value-signs')).length).toBe(1);
        });
        it('depending on whether there is a error', function() {
            expect(element.queryAll(By.css('error-display')).length).toBe(0);
            component.error = this.error;
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toBe(1);
        });
        it('depending on whether there is no resource and no error', function() {
            component.error = '';
            component.resource = {};
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toBe(0);
            component.resource = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toBe(1);
        });
    });
});
