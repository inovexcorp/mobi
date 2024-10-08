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
import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

import { orderBy } from 'lodash';

import { getBeautifulIRI, getEntityName } from '../../../shared/utility';
import { EntityRecord } from '../../models/entity-record';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { DC } from '../../../prefixes';
import { EntitySearchStateService } from '../../services/entity-search-state.service';

/**
 * Component for displaying a single search result item.
 *
 * @class
 * @public
 * @implements {OnInit}
 */
@Component({
  selector: 'app-search-result-item',
  templateUrl: './search-result-item.component.html',
  styleUrls: ['./search-result-item.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SearchResultItemComponent implements OnInit {
  /**
   * The name of an entity.
   *
   * @typedef {string} entityName
   */
  entityName: string;
  /**
   * Record types
   * @typedef {string} StringType
   */
  types: string;
  /**
   * Represents an entity record.
   *
   * @typedef {Object} EntityRecord
   * @property {string} id - The unique identifier of the entity.
   * @property {string} name - The name of the entity.
   * @property {Date} created - The date when the entity was created.
   * @property {boolean} isActive - Indicates whether the entity is active or not.
   * @property {number[]} values - An array of numerical values associated with the entity.
   */
  @Input() entity: EntityRecord;
  /**
   * Event emitter used to notify subscribers when an entity is clicked.
   *
   * @type {EventEmitter<EntityRecord>}
   */
  @Output() clickEntity: EventEmitter<EntityRecord> = new EventEmitter<EntityRecord>();
  /**
   * Record JSON-LD object.
   *
   * @typedef {Object} JSONLDObject
   * @property {string} "@context" - The context of the object.
   * @property {string} "@type" - The type of the object.
   * @property {Object} properties - The properties of the object.
   */
  record: JSONLDObject;
  /**
   * Retrieves the name of the entity.
   *
   * @returns {string} The name of the entity.
   */
  protected readonly getEntityName = getEntityName;
  /**
   * Returns the beautiful IRI (Internationalized Resource Identifier) based on the specified parameters.
   *
   * @function getBeautifulIRI
   * @param {string} parameter1 - The first parameter.
   * @param {number} parameter2 - The second parameter.
   * @returns {string} - The beautiful IRI.
   * @throws {Error} - If the parameters are invalid.
   */
  protected readonly getBeautifulIRI = getBeautifulIRI;

  /**
   * Constructor for the MyClass class.
   *
   * @param {PrefixationPipe} prefixation - The PrefixationPipe instance to be injected.
   * @param {EntitySearchStateService} state - The EntitySearchStateService instance to be injected.
   * @return {void}
   */
  constructor(
    private prefixation: PrefixationPipe,
    public state: EntitySearchStateService) {
  }

  /**
   * Initializes the component.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.setRecord();
    this.setTypes();
    this.setEntityName();
  }

  /**
   * Sets the record for the given entity.
   */
  setRecord(): void {
    this.record = {
      '@id': this.entity.record.iri,
      '@type': [this.entity.record.type],
      'entityIRI': this.entity.iri
    };
  }

  /**
   * Sets the types for the entity.
   *
   * @private
   *
   * @description This method sets the types for the entity by transforming each type using the prefixation function,
   * ordering them alphabetically, and joining them into a string separated by commas.
   */
  private setTypes(): void {
    this.types = orderBy(this.entity.types.map(t => {
      return this.prefixation.transform(t);
    })).join(', ');
  }

  /**
   * Sets the entity name based on the provided entity.
   *
   * @private
   */
  private setEntityName() {
    this.entityName = this.getEntityName({
      '@id': this.entity.iri,
      [`${DC}title`]: [{'@value': this.entity.entityName}]
    });
  }
}
