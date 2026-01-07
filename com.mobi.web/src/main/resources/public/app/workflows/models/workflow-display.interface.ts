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
/**
 * The different types of entities supported in the Workflow Display
 */
export enum EntityType {
  TRIGGER = 'trigger',
  ACTION = 'action'
}
/**
 * @interface NodePositionI
 * 
 * Represents the position of a node in a Workflow Display
 */
export interface NodePositionI {
  /**
   * Node’s current x-position
   */
  x?: number;
  /**
   * Node’s current y-position
   */
  y?: number;
}
/**
 * @interface NodeTypeStyle
 * 
 * Represents the style for a particular type of node in a Workflow Display
 */
export interface NodeTypeStyle {
  /**
   * The shape of the node (e.g., rectangle, ellipse, triangle).
   */
  shape?: string;
  /**
   * The background node's color .
   */
  bgColor?: string;
  /**
   * The color of the border.
   *
   * @type {string}
   */
  borderColor?: string;
  /**
   * Represents the color of an element.
   *
   */
  color?: string;
  /**
   * Represents the font style of a text element.
   *
   * @property {string} fontStyle - The font style of the text (optional).
   */
  fontStyle?: string;
}
/**
 * @interface BaseEntity
 * 
 * Base interface for all nodes in a Workflow Display
 */
interface BaseEntity {
  /**
   * Entity ID.
   *
   * @typedef {string} ID
   */
  id: string;
  /**
   * Represents the Element's name
   *
   * @typedef {string} Name
   */
  name: string;
  /**
   * The unique identifier
   *
   * @typedef {string} intId
   */
  intId: string;
}
/**
 * @interface NodeData
 * 
 * Represents a node in a graph.
 */
export interface NodeData extends BaseEntity, NodeTypeStyle {
  /**
   * Represents the Entity type.
   * - Trigger
   * - Action
   */
  entityType?: EntityType;
}
/**
 * @interface EdgeData
 * 
 * Represents an edge in a graph.
 */
export interface EdgeData extends BaseEntity {
  /**
   *  ID of the source node that the edge connects from
   *
   * @typedef {string} Source
   */
  source: string;
  /**
   *  ID of the target node that the edge connects to.
   *
   * @typedef {string} Target
   */
  target: string;
}
/**
 * @interface Element
 * 
 * Represents a node in the Workflow Display
 */
export interface Element {
  /**
   *  A boolean indicating whether the node's position can be changed.
   * @typedef {boolean} locked
   */
  locked?: boolean;
  /**
   * Indicates whether something has been grabbed or not.
   *
   * @type {boolean}
   */
  grabbed?: boolean;
  /**
   * A boolean indicating whether the node can be dragged by the user.
   *
   * @type {boolean}
   */
  grabbable: boolean;
  /**
   * A string indicating the group of the node. This can be useful for styling or filtering nodes
   *
   * @typedef {string}
   */
  group?: string;
  /**
   * An object specifying the x and y coordinates of the node in the graph.
   *
   * @typedef {Object} NodePositionI
   * @property {number} x - The x-coordinate of the node's position.
   * @property {number} y - The y-coordinate of the node's position.
   * @property {number} z - The z-coordinate of the node's position.
   */
  position?: NodePositionI;
  /**
   * Indicates whether the element is pannable.
   *
   * @type {boolean}
   */
  pannable?: boolean;
  /**
   * Indicates whether the node has been removed or not.
   *
   * @type {boolean}
   */
  removed?: boolean;
  /**
   * Represents whether the node is selectable or not.
   *
   * @typedef {boolean} Selectable
   */
  selectable?: boolean;
  /**
   * A boolean indicating whether the node is currently selected.
   *
   * @type {boolean}
   * @since 1.0.0
   */
  selected?: boolean;
  /**
   * An object containing additional data associated with the node.
   *
   * @typedef {Object} NodeData
   * @property {string} id - The unique identifier of the node.
   * @property {string} label - The label or name of the node.
   * @property {number} weight - The weight assigned to the node.
   */
  data: NodeData | EdgeData;
}
