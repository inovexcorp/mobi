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
import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

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
   * A Subject that will emit whenever an event is received from the EventSource.
   * @private
   * @type {Subject}
   */
  private _eventSubject = new Subject<SSEEvent>();

  /**
   * The number of seconds to wait before trying to reconnect to the event stream again. Will double on every retry.
   * @private
   * @type {number}
   */
  private _reconnectFrequencySec = 1;

  /**
   * The timeout function for reconnecting to the event stream. Will be cleared and reset on every attempt.
   * @private
   * @type {NodeJS.Timer}
   */
  private _reconnectTimeout: NodeJS.Timer;

  /**
   * The maximum number of seconds to try to reconnect to the event stream.
   * @private
   * @type {number}
   */
  private readonly SSE_RECONNECT_UPPER_LIMIT = 64;

  /**
   * Constructor for the SseService.
   * @param {NgZone} _zone Angular's NgZone service.
   */
  constructor(private _zone: NgZone) {}

  /**
   * Initializes server-sent event listening.
   */
  initializeEvents(): void {
    if (this._eventSource) {
      this.stopEvents();
    }
    this._eventSource = new EventSource(`${REST_PREFIX}sse-stream`);
    // Process connection opened
    this._eventSource.onopen = () => {
      this._reconnectFrequencySec = 1;
    };
    // Handle incoming event
    this._eventSource.onmessage = (event: MessageEvent) => {
      this._zone.run(() => {
        this._processEvent(event.data);
      });
    };
    // Reconnect on error
    this._eventSource.onerror = error => {
      console.error(error);
      this._reconnectOnError();
    };
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
    return this._eventSubject.asObservable();
  }

  private _processEvent(data: any): void {
    this._eventSubject.next(JSON.parse(data) as SSEEvent);
  }

  private _reconnectOnError(): void {
    const self = this;
    this.stopEvents();
    clearTimeout(this._reconnectTimeout);
    this._reconnectTimeout = setTimeout(() => {
      self.initializeEvents();
      self._reconnectFrequencySec *= 2;
      if (self._reconnectFrequencySec >= self.SSE_RECONNECT_UPPER_LIMIT) {
        self._reconnectFrequencySec = self.SSE_RECONNECT_UPPER_LIMIT;
      }
    }, this._reconnectFrequencySec * 1000);
  }
}
