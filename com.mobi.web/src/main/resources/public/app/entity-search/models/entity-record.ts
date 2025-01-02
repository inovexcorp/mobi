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

/**
 * Represents a set of annotations used for matching.
 * @interface
 */
export interface MatchingAnnotations {
  /**
   * Property IRI.
   * @type {string}
   */
  prop: string;
  /**
   * Property Name.
   * @type {string}
   */
  propName: string;
  /**
   * Property value.
   *
   * @typedef {string} value
   */
  value: string;
  /**
   * Result of search matching for property value .
   *
   * @typedef {string} value
   */
  matchValue: string;
}

/**
 * Represents a source record.
 *
 * @interface Record
 */
export interface Record {
  /**
   * Record type.
   * @typedef {string} TypeString
   */
  type: string;
  /**
   * Record Title.
   *
   * @type {string}
   */
  title: string;
  /**
   * Record Internationalized Resource Identifier (IRI).
   */
  iri: string;
  /**
   * An array of keywords.
   *
   * @type {string[]}
   */
  keywords: string[]
}

/**
 * Represents an entity record.
 * @interface EntityRecord
 */
export interface EntityRecord {
  /**
   * The iri variable represents the Internationalized Resource Identifier (IRI) as a string.
   *
   * An IRI is a global identifier used to identify resources on the Internet. It is an extension of the
   * Uniform Resource Identifier (URI) standard that allows for international characters.
   *
   * @type {string}
   */
  iri: string;
  /**
   * The name of the entity.
   *
   * @type {string}
   */
  entityName: string;
  /**
   * @typedef {string[]} Types
   * @description An array of string values representing different variable types.
   */
  types: string[];
  /**
   * Description for a particular record.
   *
   * @type {string}
   * @memberOf global
   */
  description: string;
  /**
   * Represents a record.
   * @typedef {Object} Record
   */
  record: Record,
  /**
   * Represents an array of matching annotations.
   *
   * @type {MatchingAnnotations[]}
   */
  matchingAnnotations: MatchingAnnotations[];
  /**
   * Total number of matching annotations.
   *
   * @type {number}
   */
  totalNumMatchingAnnotations: number;
}
