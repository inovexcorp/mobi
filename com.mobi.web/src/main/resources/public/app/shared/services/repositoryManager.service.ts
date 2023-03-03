/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { Repository } from '../models/repository.interface';
import { UtilService } from './util.service';

@Injectable()
export class RepositoryManagerService {
    prefix = REST_PREFIX + 'repositories';

    constructor(private http: HttpClient, private util: UtilService, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /repositories endpoint to retrieve an array of the repositories configured in the Mobi server.
     * 
     * @returns {Observable<Repository[]>} An Observable with the REST response of an array of {@link Repository} objects
     */
    getRepositories(): Observable<Repository[]> {
        return this.spinnerSvc.track(this.http.get<Repository[]>(this.prefix))
            .pipe(catchError(this.util.handleError));
    }

    /**
     * Calls the GET /repositories/{id} endpoint to retrieve a single repository based on its id.
     * 
     * @param {string} id The id of a repository
     * @returns {Observable<Repository>} An Observable with the REST response of a single {@link Repository}
     */
    getRepository(id: string): Observable<Repository> {
        return this.spinnerSvc.track(this.http.get<Repository>(`${this.prefix}/${encodeURIComponent(id)}`))
            .pipe(catchError(this.util.handleError));
    }
}
