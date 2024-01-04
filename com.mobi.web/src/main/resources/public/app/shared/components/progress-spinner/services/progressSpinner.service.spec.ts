/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProgressSpinnerService } from './progressSpinner.service';

describe('ProgressSpinnerService', () => {
  let service: ProgressSpinnerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        ProgressSpinnerService
      ]
    });

    service = TestBed.inject(ProgressSpinnerService);
  });

  it('should properly track a request', function() {
    spyOn(service, 'track').and.callFake(ob => ob);
    const ob = of(null);
    service.trackedRequest(ob, true);
    expect(service.track).not.toHaveBeenCalled();
    service.trackedRequest(ob, false);
    expect(service.track).toHaveBeenCalledWith(ob);
  });
});
