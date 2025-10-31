/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { Component, OnInit } from '@angular/core';

import { Repository } from '../../../shared/models/repository.interface';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { ToastService } from '../../../shared/services/toast.service';

interface RepositoryDisplay extends Repository {
  capacityPercentage?: number;
}

@Component({
  selector: 'app-repositories-page',
  templateUrl: './repositories-page.component.html',
  styleUrls: ['./repositories-page.component.scss']
})
export class RepositoriesPageComponent implements OnInit {

  repositories: RepositoryDisplay[] = [];

  constructor(private _rm: RepositoryManagerService, private _toast: ToastService) {}
  
  /**
   * Initializes the list of repositories by fetching them from the {@link RepositoryManagerService}.
   */
  ngOnInit(): void {
    this._rm.getRepositories().subscribe(repos => {
      this.repositories = repos.map(repo => ({
        ...repo,
        capacityPercentage: this.getCapacityPercentage(repo)
      }));
    }, error => {
      this._toast.createErrorToast(`Failed to load repositories ${error}`);
    });
  }

  /**
   * Determines the percentage of capacity used in a native repository (the only Repository type with capacity limits).
   * 
   * @param {Repository} repo The repository to evaluate.
   * @returns {number} The percentage of capacity used, or 0 if the repository has no limit or triple count is 
   *    undefined.
   */
  getCapacityPercentage(repo: Repository): number {
    if (!repo.limit || repo.tripleCount === undefined) {
      return 0;
    }
    return (repo.tripleCount / repo.limit) * 100;
  }
}
