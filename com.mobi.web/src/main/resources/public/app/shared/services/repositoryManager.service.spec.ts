/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { Repository } from '../models/repository.interface';
import { RepositoryManagerService } from './repositoryManager.service';

describe('Repository Manager service', function() {
    let service: RepositoryManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';
    const repo1: Repository = {
        id: 'repo1',
        title: 'Repository 1',
        type: 'native'
    };
    const repo2: Repository = {
        id: 'repo2',
        title: 'Repository 2',
        type: 'memory'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                RepositoryManagerService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(RepositoryManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

        progressSpinnerStub.track.and.callFake((ob) => ob);
    });

    afterEach(() => {
        cleanStylesFromDOM();
        service = null;
        progressSpinnerStub = null;
        httpMock = null;
    });

    afterEach(() => {
        httpMock.verify();
    });
    
    describe('should retrieve the list of repositories', function() {
        it('unless an error occurs', function() {
            service.getRepositories()
                .subscribe(() => fail('Promise should have rejected'), (response) => expect(response).toEqual(error));
            const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRepositories()
                .subscribe((response) => expect(response).toEqual([repo1, repo2]), () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush([repo1, repo2]);
        });
    });
    describe('should retrieve a single repository', function() {
        it('unless an error occurs', function() {
            service.getRepository(repo1.id)
                .subscribe(() => fail('Promise should have rejected'), (response) => expect(response).toEqual(error));

            const request = httpMock.expectOne({url: `${service.prefix}/${repo1.id}`, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('when resolved', function() {
            service.getRepository(repo1.id)
                .subscribe(response => expect(response).toEqual(repo1),() => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: `${service.prefix}/${repo1.id}`, method: 'GET'});
            request.flush(repo1);
        });
    });
});
