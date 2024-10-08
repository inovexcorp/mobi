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
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

import { get } from 'lodash';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { EntityRecord, MatchingAnnotations } from '../models/entity-record';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { handleError, paginatedConfigToHttpParams } from '../../shared/utility';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { CatalogManagerService } from '../../shared/services/catalogManager.service';
import { PaginatedResponse } from '../models/paginated-response.interface';

/**
 * EntitySearchManagerService class is responsible for retrieving entities based on the provided configuration
 */
@Injectable({
  providedIn: 'root'
})
export class EntitySearchManagerService {
  /**
   * The prefix for catalogs REST API endpoints.
   *
   * @type {string}
   * @constant
   * @default
   */
  prefix = `${REST_PREFIX}catalogs`;
  /**
   * The catalogId variable represents the unique identifier of a catalog.
   *
   * @type {string}
   */
  catalogId = '';
  searchURL = '';
  constructor(private cm: CatalogManagerService,
              private http: HttpClient,
              private spinnerSvc: ProgressSpinnerService) {
  }

  /**
   * Initializes the service by retrieving the {@link shared.CatalogManagerService local catalog} id.
   */
  initialize(): void {
    this.catalogId = get(this.cm.localCatalog, '@id', '');
    // set url
    this.searchURL = `${this.prefix}/${encodeURIComponent(this.catalogId)}/entities`;
  }

  /**
   * Retrieves entities based on the provided configuration.
   *
   * @param {PaginatedConfig} config - The configuration for retrieving entities.
   * @returns {Observable<HttpResponse<EntityRecord[]>>} - The observable containing the HTTP response with the retrieved JSONLDObject entities.
   */
  getEntities(config: PaginatedConfig): Observable<PaginatedResponse<EntityRecord[]>> {
    let params = paginatedConfigToHttpParams(config);
    if (config.searchText) {
      params = params.set('searchText', config.searchText.trim());
    }
    return this.spinnerSvc.track(this.http.get<EntityRecord[]>(this.searchURL, {params, observe: 'response'}))
      .pipe(
        catchError(handleError),
        map((response: HttpResponse<EntityRecord[]>): PaginatedResponse<EntityRecord[]> => {
          let entityRecords = [];
          if (response.body) {
            entityRecords = response.body.map((entityRecord: EntityRecord) => {
              if (entityRecord.matchingAnnotations) {
                entityRecord.matchingAnnotations = entityRecord.matchingAnnotations.map((matchingAnnotations: MatchingAnnotations) => {
                  if (matchingAnnotations.value && config.searchText) {
                    matchingAnnotations.matchValue = this.getSubstringMatch(matchingAnnotations.value, config.searchText);
                  }
                  return matchingAnnotations;
                });
              }
              return entityRecord;
            });
          }
          return {
            totalCount: Number(response.headers.get('x-total-count')) || 0,
            page: entityRecords
          };
        })
      );
  }

  /**
   * Finds and returns a portion of a string that contains the first occurrence of the matching substring,
   * along with two words before and two words after the match. If more than two words exist before or
   * after the match, the result is truncated with ellipses.
   * 
   * - If there are 2 or fewer words before or after the match, no ellipsis is added.
   * - If there are more than 2 words before or after the match, ellipses are added to the truncated result.
   * 
   * Note: searchText could be `word`, `word word`, `word word word`
   * 
   * @param {string} originalString - The original string where the search will be performed.
   * @param {string} searchText - The substring to search for within the original string.
   * 
   * @returns {string} - A truncated string that displays 2 words before and 2 words after the first
   * occurrence of the matching substring. If truncation occurs, ellipses are added before or after
   * the matched section.
   */
  getSubstringMatch(originalString: string, searchText: string): string {
    const startIdx = originalString.toLowerCase().indexOf(searchText.toLowerCase().trim());
    if (startIdx < 0) {
      return ''; // No matches
    }
    const endIdx = startIdx + searchText.length; // End Index of searchText in the originalString
    const tokenRegex = /[^\s]+(\s*)/g;
    const words = originalString.match(tokenRegex) || []; // Array of Words
    let firstWordMatchIdx = -1;
    let wordMatches = 0;
    let currentIdx = 0;
    // Loop over the words to update the wordsFlag array
    for (let i = 0; i < words.length; i++) { 
      const wordStartIdx = currentIdx;
      const wordEndIdx = currentIdx + words[i].length;
      // Check if the start of the word is within the searchText range
      const isStartWithinRange = wordStartIdx >= startIdx && wordStartIdx < endIdx;
      // Check if the end of the word is within the searchText range
      const isEndWithinRange = wordEndIdx > startIdx && wordEndIdx <= endIdx;
      // Check if the word fully contains the searchText range
      const doesWordContainRange = wordStartIdx <= startIdx && wordEndIdx >= endIdx;
      if (isStartWithinRange || isEndWithinRange || doesWordContainRange) {
        wordMatches += 1;
        if (firstWordMatchIdx === -1) {
          firstWordMatchIdx = i;
        }
      }
      currentIdx += words[i].length;  // Move currentIdx forward to account for the next word and its spaces
    }
    if (firstWordMatchIdx < 0) {
      return ''; // No matches
    }
    // Get index of two words before matching substring
    const leftSideIdx = Math.max(0, firstWordMatchIdx - (2 - Math.min(wordMatches-1, 1) ));
    // Get index of two words after matching substring
    const rightSideIdx = Math.min(words.length - 1, firstWordMatchIdx + (2 + Math.min(wordMatches-1, 1) ));
    let slicedWords = words.slice(leftSideIdx, rightSideIdx + 1).join('').trim();
    if (leftSideIdx > 0) {
      slicedWords = `...${slicedWords}`;
    }
    if (rightSideIdx < words.length -1) {
      slicedWords = `${slicedWords}...`;
    }
    return slicedWords;
  }
}