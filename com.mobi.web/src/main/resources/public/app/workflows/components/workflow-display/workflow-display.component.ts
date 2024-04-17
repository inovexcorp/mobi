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
import { find, isArray } from 'lodash';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
// cytoscape
import cytoscape from 'cytoscape/dist/cytoscape.esm.js';
import dagre from 'cytoscape-dagre';

import { v4 } from 'uuid';
//material
import { MatDialog } from '@angular/material/dialog';
// local imports
import { EdgeData, Element, NodeData, NodeTypeStyle } from '../../models/workflow-display.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { WORKFLOWS } from '../../../prefixes';
import { getBeautifulIRI } from '../../../shared/utility';
import {
  WorkflowPropertyOverlayComponent
} from '../workflow-property-overlay-component/workflow-property-overlay.component';

interface TypeI {
  type: string;
  id: string;
}
/**
 * @class workflows.WorkflowDisplayComponent
 *
 * Represents a component for displaying workflow graphically
 */
@Component({
  selector: 'app-workflow-display',
  templateUrl: './workflow-display.component.html',
  styleUrls: ['./workflow-display.component.scss']
})
export class WorkflowDisplayComponent implements OnInit, OnChanges {
  // public attributes
  public cyChart: cytoscape.Core; // cytoscape instance
  public cyChartSize = 1;
  public cyLayout: cytoscape.Layouts; // cytoscape layout
  public nodeTypeStyle: Map<string, NodeTypeStyle>
  public superTypes = {
    'trigger': 'trigger',
    'action': 'action'
  };
  public readonly activityKeyMap: Record<'trigger' | 'action', TypeI > = {
    trigger: {'type': 'hasTrigger', id: this.buildKey('Trigger')},
    action: {'type': 'hasAction', id: this.buildKey('Action')}
  };
  @Input() resource!: JSONLDObject[];
  // private attributes
  private _isDefaultTrigger = false;

  /**
   * Constructs a new instance of the class.
   *
   * @param {MatDialog} dialog - Service to Open Mat modal
   */
  constructor(private dialog: MatDialog) {}

  /**
   * Initializes the component.
   *
   * @returns {void}
   * @description This method is called when the component initializes.
   */
  ngOnInit(): void {
    this.getWorkflowData();
  }

  /**
   * Executes when the input properties of the component change.
   *
   * @return {void}
   */
  ngOnChanges(): void {
    this.getWorkflowData();
  }

  /**
   * Retrieves workflow data.
   *
   * @returns {void}
   */
  getWorkflowData(): void {
    if (isArray(this.resource) && this.resource.length > 0) {
      this.setTypeStyle();
      const elements = this._buildGraphData(this.resource);
      this.initGraph(elements);
    }
  }

  /**
   * Returns an array of elements that match the given node key type in the data array.
   *
   * @param {JSONLDObject[]} data - The array of JSON-LD objects.
   * @param {string} nodeKey - The key representing the node type in the JSON-LD objects.
   * @return {Element[]} - An array of elements that match the given node key type.
   */
  getNodesByType(data: JSONLDObject[], nodeKey: string): Element[] {
    const nodeTypes =  data[0][this.buildKey(nodeKey)];
    if (nodeKey === this.activityKeyMap.trigger.type && !nodeTypes) {
      return [this._createNode(this.getDefaultTrigger())];
    }
    return this.buildNodes(nodeTypes, data);
  }

  /**
   * Builds an array of nodes based on the given context, workflow, and type.
   *
   * @param {JSONLDObject} context - The context object.
   * @param {JSONLDObject[]} workflow - The array of workflow objects.
   * @return {JSONLDObject[]} The array of nodes built from the context and workflow.
   */
  public buildNodes(context: JSONLDObject, workflow: JSONLDObject[]) : Element[] {
    const nodes = [];
    const keys = Object.entries(context);
    for (const [, id] of keys) {
      const entity = find(workflow, id);
      if (entity) {
        this._addNodes(nodes, entity);
      }
    }
    return nodes;
  }

  /**
   * Build edges based on provided triggers and actions.
   *
   * @param {Element[]} triggers - An array of trigger elements.
   * @param {Object} actions - An object containing action elements with their respective keys.
   * @returns {Element[]} - An array of edge elements.
   */
  buildEdges(triggers: Element[], actions: Element[]): Element[] {
    const edges: Element[] = [];
    const trigger = triggers[0];
    for (const action of actions) {
      const edgeData: EdgeData = {
        id: this._buildEdgeId(trigger.data.id, action.data.id),
        name: '',
        intId: '',
        source: trigger.data.id,
        target: action.data.id,
      };

      edges.push({
        grabbable: false,
        data: edgeData
      });
    }
    return edges;
  }
  /**
   * Builds a key by appending a given string to the constant WORKFLOWS.
   *
   * @param {string} key - The string to append to the WORKFLOWS constant.
   * @return {string} - The generated key.
   */
  buildKey(key: string): string {
    return `${WORKFLOWS}${key}`;
  }

  /**
   * Initialization of cytoscape's graph instance, data was initialized using this.ovis.init()
   *
   * - https://js.cytoscape.org/#layout.run
   */
  initGraph(elements: cytoscape.element): void {
    // Use DAG layout algorithm
    this.cyChart = this.createCytoscapeInstance();
    const layout = this._createLayoutOptions('dagre');
    this.cyChart.add(elements);
    this._setStyle();
    this.cyChart.layout(layout).run();
    this.cyChart.ready(this.bindNodes.bind(this));
    this.cyChart.center();
  }
  /**
   * Create Cytoscape Instance
   * https://js.cytoscape.org/#core/initialisation
   * @returns cytoscape instance
   */
  createCytoscapeInstance(): cytoscape.Core {
    const container = <HTMLElement>document.querySelector('.workflow-display');
    cytoscape.use(dagre);
    return cytoscape({
      layout: {
        name: 'dagre'
      },
      container,
      maxZoom: 4,
      minZoom: 0.05
    });
  }

  /**
   * Binds tap event on nodes in the cyChart to display properties of the clicked entity.
   *
   * @returns {void}
   */
  bindNodes(): void {
    this.cyChart.on('tap','node', ({target}) => {
      const node = target.data();
      const entity = find(this.resource, {'@id': node.id});
      this.displayProperty(entity);
    });
  }

  /**
   * Returns a JSONLDObject representing the default trigger.
   * This method sets the internal flag `_isDefaultTrigger` to true before returning the JSONLDObject.
   *
   * @returns {JSONLDObject} The default trigger JSONLDObject.
   */
  getDefaultTrigger(): JSONLDObject {
    this._isDefaultTrigger = true;
    return {
      '@id': 'https://mobi.solutions/workflows/DefaultTrigger',
      '@type': [
        'https://mobi.solutions/ontologies/workflows#Trigger',
        'https://mobi.solutions/ontologies/workflows#DefaultTrigger'
      ]
    };
  }

  /**
   * Sets the type style for the current instance.
   *
   * @function setTypeStyle
   * @memberof WorkflowDisplayComponent
   *
   * @returns {void}
   */
  setTypeStyle(): void {
    const color = '#1a1d1f';
    this.nodeTypeStyle = new Map()
      .set(this.superTypes.trigger, {
        shape: 'roundrectangle',
        bgColor: '#ffefd1',
        borderColor: '#ffd688',
        fontStyle: 'normal',
        color
      })
      .set(this.superTypes.action, {
        shape: 'ellipse',
        bgColor: '#daf1e5',
        borderColor: '#b3e3c8',
        fontStyle: 'normal',
        color,
      });
  }

  /**
   * Displays the property overlay component for the given entity.
   *
   * @param {JSONLDObject} entity - The JSON-LD object representing the entity to display.
   * @return {void}
   */
  displayProperty(entity: JSONLDObject): void {
    this.dialog.open(WorkflowPropertyOverlayComponent, { panelClass: 'medium-dialog', data: entity });
  }

  /*****************
   * Private methods
   ****************/

  /**
   * Construct the graph data for visualization.
   *
   * @private
   *
   * @param {JSONLDObject[]} data - The input data to build the graph from.
   * @return {Object} - The graph data containing nodes and edges.
   * @Private _buildGraphData
   */
  private _buildGraphData(data: JSONLDObject[]): { nodes: Element[], edges: Element[] } {
    const triggers: Element[] = this.getNodesByType(data, this.activityKeyMap.trigger.type);
    const actions: Element[] = this.getNodesByType(data, this.activityKeyMap.action.type);
    return {
      nodes: [...triggers, ...actions],
      edges: [...this.buildEdges(triggers, actions)]
    };
  }

  /**
   * Builds a unique edge ID.
   *
   * @private
   *
   * @param {string} triggerId - The ID of the trigger.
   * @param {string} actionId - The ID of the action.
   * @return {string} The unique edge ID.
   */
  private _buildEdgeId(triggerId: string, actionId: string): string {
    return `${triggerId} => ${actionId}`;
  }

  /**
   * Create Layout Object
   *
   * - https://js.cytoscape.org/#layouts/preset
   *
   * @private
   *
   * @param layoutName
   * @returns Layout Options Object
   */
  private _createLayoutOptions(layoutName: string): cytoscape.layout {
    return {
      animate: true,
      fit: true,
      randomize: true,
      name: layoutName,
      spacingFactor: 1.4,
      transform: (node, pos) => pos,
      infinite: true,
      linkId: function id(d) { // https://github.com/d3/d3-force#link_id
        return d.id;
      },
      ready: () => {},
      stop: () => {},
      tick: () => {}
    };
  }
  /**
   * Adds nodes to an array of elements.
   *
   * @private
   *
   * @param {Element[]} nodes - The array of elements to add nodes to.
   * @param {JSONLDObject | JSONLDObject[]} entity - The JSON-LD object or array of objects containing node data.
   * @returns {void} - This method does not return a value.
   *
   * @private
   */
  private _addNodes(nodes: Element[], entity: JSONLDObject | JSONLDObject[]): void {
    const entities = isArray(entity) ? entity : [entity];
    for (const item of entities) {
      nodes.push(this._createNode(item));
    }
  }
  /**
   * Set the style for nodes and edges in the chart.
   *
   * @private
   *
   * @returns {void}
   */
  private _setStyle(): void {
    this.cyChart.style([
      {
        selector: 'node',
        style: {
          'shape': 'data(shape)',
          'content': 'data(name)',
          'width': '60',
          'height': '60',
          'font-size': '12px',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': 'data(bgColor)',
          'font-style': 'data(fontStyle)',
          'border-width': '3px',
          'color': 'data(color)',
          'border-color': 'data(borderColor)',
          'overlay-padding': '6px',
          'z-index': '10'
        }
      }, {
        'selector': 'node:selected',
        'style': {
          'border-width': '3px',
          'border-color': '#8BB0D0',
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'target-arrow-shape': 'triangle',
          'line-color': '#FCBF1B',
          'target-arrow-color': '#FCBF1B',
          'curve-style': 'bezier',
          'haystack-radius': '1',
          'overlay-padding': '3px',
        }
      }, {
        'selector': 'edge:selected',
        'style': {
          'line-color': '#8BB0D0',
          'target-arrow-color': '#8BB0D0',
        }
      }
    ]);
  }

  /**
   * Creates a new node.
   *
   * @private
   *
   * @param {any} item - The item to be added to the node's data.
   * @returns {Element} The newly created node.
   */
  private _createNode(item: JSONLDObject): Element {
    return {
      grabbable: false,
      data: this._createNodeData(item)
    };
  }

  /**
   * Creates a NodeData object.
   *
   * @private
   *
   * @returns {NodeData} - The created NodeData object.
   * @param activity
   */
  private _createNodeData(activity: JSONLDObject): NodeData {
    const { name, activityType} = this.getTypeInformation(activity['@type']);
    const style = this.nodeTypeStyle.get(activityType);

    if (this._isDefaultTrigger && activityType === this.superTypes.trigger) {
      style.color = '#999999';
      style.fontStyle = 'italic';
    }

    return {
      id: activity['@id'],
      name: name,
      intId: v4(),
      activityType,
      bgColor: style?.bgColor,
      fontStyle: style.fontStyle,
      color: style.color,
      borderColor: style.borderColor,
      shape: style?.shape || 'ellipse'
    };
  }

  /**
   * Retrieves the type information from the given JSONLDObject.
   *
   * @param {string[]} types - The JSONLDObject representing an activity.
   * @return {Object} - The object containing the type information.
   *                   - The object has two properties:
   *                     - name: The name of the activity type.
   *                     - activityType: The activity type.
   */
  private getTypeInformation(types:string[]): { name:string; activityType:string } {
    const isSuperType = (type: string) => {
      return !!this.superTypes[type];
    };
    const info = {
      name: '',
      activityType: ''
    };

    for (const item of types) {
      const type = getBeautifulIRI(item);
      if (type === 'Event Trigger') {
        continue;
      }
      const propertyName =  isSuperType(type.toLowerCase()) ? 'activityType' : 'name';
      info[propertyName] = type;
    }
    info.activityType = info.activityType.toLowerCase();
    return info;
  }
}
