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
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

import { REST_PREFIX } from '../../constants';
import { SSEEvent } from '../models/sse-event';

/**
 * @class shared.SseService
 * 
 * A service that creates an EventSource for the main SSE stream of the application. Separated out for ease of mocking 
 * and testing.
 */
@Injectable({
  providedIn: 'root'
})
export class SseService {

  /**
   * The internal EventSource object used to listen for server-sent events.
   * @private
   * @type {EventSource}
   */
  private _eventSource: EventSource;

  /**
   * Constructor for the SseService.
   * @param {NgZone} _zone Angular's NgZone service.
   */
  constructor(private _zone: NgZone) {}

  /**
   * Initializes server-sent event listening.
   */
  initializeEvents(): void {
    this._eventSource = new EventSource(`${REST_PREFIX}sse-stream`);
  }

  /**
   * Stops server-sent event listening.
   */
  stopEvents(): void {
    if (!this._eventSource) {
      return;
    }
    this._eventSource.close();
    this._eventSource = null;
  }

  /**
   * Returns an Observable that emits the data from the server-sent events.
   * 
   * @returns {Observable<SSEEvent>} An Observable that emits the data from the server-sent events.
   */
  getEvents(): Observable<SSEEvent> {
    return new Observable(observer => {
      this._eventSource.onmessage = event => {
        this._zone.run(() => {
          observer.next(JSON.parse(event.data) as SSEEvent);
        });
      };
      this._eventSource.onerror = error => {
        this._zone.run(() => {
          observer.error(error);
        });
      };
    });
  }
}