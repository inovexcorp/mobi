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
import { AfterContentChecked, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
// material
import { MatDialog } from '@angular/material/dialog';
// cytoscape
import cytoscape from 'cytoscape/dist/cytoscape.esm.js';
import dagre from 'cytoscape-dagre';
import cxtmenu from 'cytoscape-cxtmenu';
import edgehandles from 'cytoscape-edgehandles';
// other libraries
import { cloneDeep, find, has, isArray, isEmpty, isEqual } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 } from 'uuid';
// local imports
import { EdgeData, Element, EntityType, NodeData, NodeTypeStyle } from '../../models/workflow-display.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ModalConfig, ModalType } from '../../models/modal-config.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { DCTERMS, WORKFLOWS } from '../../../prefixes';
import { getBeautifulIRI, getEntityName } from '../../../shared/utility';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Difference } from '../../../shared/models/difference.class';
import { WorkflowAddConfigurationComponent } from '../workflow-add-configuration/workflow-add-configuration.component';
import { WorkflowPropertyOverlayComponent } from '../workflow-property-overlay-component/workflow-property-overlay.component';
import { WorkflowSHACLDefinitions } from '../../models/workflow-shacl-definitions.interface';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowsStateService } from '../../services/workflows-state.service';

// Setup cytoscape extensions
cytoscape.use(dagre);
cytoscape.use(cxtmenu);
cytoscape.use(edgehandles);

interface TypeI {
  childKey: {
    [key: string]: string
  },
  id: string;
  shaclKey: string;
}

interface TypeInfo {
  name: string;
  entityType: EntityType;
}

/**
 * CTX-Menu commands item definition.
 * @interface
 */
interface MenuCommand {
  /**
   * @optional: custom background color for item
   */
  fillColor?: string;
  /**
   * @optional: html/text content to be displayed in the menu
   */
  content: string;
  /**
   * @optional: css key:value pairs to set the command's css in js if you want
   */
  contentStyle?: { [key: string]: string };
  /**
   * @optional: a function to execute when the command is hovered
   */
  hover?(ele: cytoscape.ElementDefinition): void;
  /**
   * @optional: a function to execute when the command is selected
   */
  select?(ele: cytoscape.ElementDefinition): void;
  /**
   * @optional: whether the command is selectable
   */
  enabled?: boolean;
}
// Alias for the ctx-menu
type MenuCommandArray = MenuCommand[] | (() => MenuCommand[]);

/**
 * @class workflows.WorkflowDisplayComponent
 *
 * Represents a component for displaying workflow graphically. Can be set to "Edit" mode where the nodes have context
 * menus with different actions to perform. Houses the logic for determining the edited differences and updating the
 * user's InProgressCommit.
 */
@Component({
  selector: 'app-workflow-display',
  templateUrl: './workflow-display.component.html',
  styleUrls: ['./workflow-display.component.scss']
})
export class WorkflowDisplayComponent implements OnChanges, AfterContentChecked {
  // public attributes
  public cyChart: cytoscape.Core; // cytoscape instance
  public cyMenu: cxtmenu[] = [];
  public cyLayout: cytoscape.Layouts; // cytoscape layout
  public cyEdgehandles;
  public cyChartSize = 1;
  public superTypes = {
    [EntityType.ACTION]: [this.buildWorkflowsIRI('Action')],
    [EntityType.TRIGGER]: [this.buildWorkflowsIRI('Trigger'), this.buildWorkflowsIRI('EventTrigger')]
  };
  public readonly entityKeyMap: Record<EntityType.TRIGGER | EntityType.ACTION, TypeI> = {
    trigger: {
      id: this.buildWorkflowsIRI('Trigger'),
      childKey: {
        [EntityType.TRIGGER]: this.buildWorkflowsIRI('hasTrigger'),
        [EntityType.ACTION]: this.buildWorkflowsIRI('hasAction'),
      },
      shaclKey: 'triggers'
    },
    action: {
      id: this.buildWorkflowsIRI('Action'),
      childKey: {
        [EntityType.ACTION]: this.buildWorkflowsIRI('hasChildAction')
      },
      shaclKey: 'actions'
    }
  };
  // inputs
  @Input() shaclDefinitions!: WorkflowSHACLDefinitions;
  @Input() resource!: JSONLDObject[];
  @Input() recordId: string;
  @Input() isEditMode!: boolean;
  @Input() fullScreenMode: boolean;
  // private attributes
  private _isDefaultTrigger = false;
  private _editedResource: JSONLDObject[] = [];
  // Creates a unique IRI for the trigger node so edges don't need to be updated as edits occur.
  // Appends a UUID to avoid conflicts with any existing data
  private readonly _TRIGGER_NODE_ID = `https://mobi.solutions/workflows/graph/trigger/${v4()}`;

  constructor(private _dialog: MatDialog, private _workflowsState: WorkflowsStateService, 
    private _wms: WorkflowsManagerService, private _toast: ToastService) {}

  /**
   * Executes on first and when the input properties of the component change.
   *
   * @param {SimpleChanges} changes - The changes object containing the modified input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // If the workflow data changed (or on first initialization)
    if (changes?.shaclDefinitions || changes?.resource) {
      this.setWorkflowData();
      // Resets the right click menus if needed
      this.cyMenu = [];
      this._handleEditMode();
    } else if (changes?.isEditMode) { // If the data didn't change but the edit status did
      this._handleEditMode();
    }
  }
  /**
   * Used when the canvas resizes to keep things from looking choppy and to make sure all elements are on screen.
   */
  ngAfterContentChecked(): void {
    this.cyChart.animate(
        { duration: 150 },
        { fit: { padding: 50 } }
    );
  }
  /**
   * Retrieves workflow data.
   */
  setWorkflowData(): void {
    if (isArray(this.resource) && this.resource.length > 0) {
      const elements = this._buildGraphData(this.resource);
      this.initGraph(elements);
    }
  }
  /**
   * Returns an array of elements that match the given node key type in the data array.
   *
   * @param {JSONLDObject[]} workflowData - The JSON-LD of the Workflow.
   * @param {EntityType} entityType - The type of entities to create nodes for.
   * @return {{ nodes: Element[], edges: Element[] }} - An object containing an array of node elements that match the
   *  given node key type and an array of outgoing edge elements from the generated nodes.
   */
  getNodesAndEdgesByType(workflowData: JSONLDObject[], entityType: EntityType): { nodes: Element[], edges: Element[] } {
    let entities = workflowData.filter(obj => obj['@type'].includes(this.entityKeyMap[entityType].id));
    if (entityType === EntityType.TRIGGER) {
      if (entities.length > 1) {
        console.error('More than one trigger node found unexpectedly');
        return { nodes: [], edges: [] };
      } else if (!entities.length) {
        entities = [this.getDefaultTrigger()];
      }
    }
    let edges: Element[] = [];
    const nodes = entities.map(entity => {
      // Make this first to account for trigger nodes
      const node = this._createNode(entity);
      const childIRIs = entityType === EntityType.TRIGGER ?
        this.getEntryActionIRIs(workflowData) :
        this.getChildActionIRIs(entity);
      const childEdges = childIRIs.map(childActionIRI => this._buildNodeEdge(node.data.id, childActionIRI));
      edges = edges.concat(childEdges);
      return node;
    });
    return { nodes, edges };
  }
  /**
   * Retrieves the IRIs of the "entry" Actions of the Workflow represented by the provided JSON-LD array. An "entry"
   * Action is one related directly to the w:Workflow object.
   * 
   * @param {JSONLDObject[]} workflowData - The Workflow to retrieve "entry" actions from.
   * @returns {string[]} - An array of Action IRI strings.
   */
  getEntryActionIRIs(workflowData: JSONLDObject[]): string[] {
    const workflowObject = this._findWorkflowObject(workflowData);
    const nodeIRIs: JSONLDId[] = workflowObject[this.entityKeyMap[EntityType.TRIGGER].childKey[EntityType.ACTION]];
    return nodeIRIs ? nodeIRIs.map(obj => obj['@id']) : [];
  }
  /**
   * Retrieves the IRIs of all the child Actions of the provided Action JSON-LD.
   * 
   * @param {JSONLDObject} action - The Action JSON-LD from which to retrieve child Actions.
   * @returns {string[]} - An array of Action IRI strings.
   */
  getChildActionIRIs(action: JSONLDObject): string[] {
    const childActionIdObjs: JSONLDId[] = action[this.entityKeyMap[EntityType.ACTION].childKey[EntityType.ACTION]];
    return childActionIdObjs ? childActionIdObjs.map(obj => obj['@id']) : [];
  }
  /**
   * Builds an IRI by appending a given string to the constant WORKFLOWS namespace.
   *
   * @param {string} key - The string to append to the WORKFLOWS namespace.
   * @return {string} - The generated IRI.
   */
  buildWorkflowsIRI(key: string): string {
    return `${WORKFLOWS}${key}`;
  }
  /**
   * Initializes the Cytoscape graph instance.
   * @see {@link https://js.cytoscape.org/#layout.run}
   *
   * @param {cytoscape.element} elements - The elements to add to the graph.
   */
  initGraph(elements: cytoscape.element): void {
    // Use DAG layout algorithm
    this.cyChart = this.createCytoscapeInstance();
    this.cyLayout = this._createLayoutOptions('dagre');

    this.cyChart.add(elements);
    this._setStyle();
    this.cyChart.layout(this.cyLayout).run();
    this.cyChart.ready(this.bindNodes.bind(this));
    this.cyChart.center();
  }
  /**
   * Create Cytoscape Instance
   * @see {@link https://js.cytoscape.org/#core/initialisation}
   * 
   * @returns cytoscape instance
   */
  createCytoscapeInstance(): cytoscape.Core {
    const container = <HTMLElement>document.querySelector('.workflow-display');
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
   */
  bindNodes(): void {
    this.cyChart.on('tap', 'node', ({target}) => {
      const node = target.data();
      const entity = node.id === this._TRIGGER_NODE_ID ? 
        this._getTriggerJSONLD(this.resource) : 
        find(this.resource, {'@id': node.id});
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
      '@id': this._TRIGGER_NODE_ID,
      '@type': [
        this.buildWorkflowsIRI('Trigger'),
        this.buildWorkflowsIRI('DefaultTrigger')
      ]
    };
  }
  /**
   * Displays the property overlay component for the given entity.
   *
   * @param {JSONLDObject} entity - The JSON-LD object representing the entity to display.
   */
  displayProperty(entity: JSONLDObject): void {
    if (this._workflowsState.isEditMode) {
      return;
    }
    const allData = entity ? this._collectEntityAndReferencedObjects(entity, this.resource) : undefined;
    this._dialog.open(WorkflowPropertyOverlayComponent, { panelClass: 'medium-dialog', data: {
        entityIRI: entity ? entity['@id'] : undefined,
        entity: allData
      } });
  }
  /**
   * Creates a node type style object based on the provided entity type
   * 
   * @param {string} entityType The string identifier for a type of node
   * @returns {NodeTypeStyle} A style object for the type of node requested.
   */
  getNodeTypeStyle(entityType: EntityType): NodeTypeStyle {
    const color = '#1a1d1f';
    if (entityType === EntityType.TRIGGER) {
      return {
        shape: 'roundrectangle',
        bgColor: '#ffefd1',
        borderColor: '#ffd688',
        fontStyle: 'normal',
        color
      };
    } else if (entityType === EntityType.ACTION) {
      return {
        shape: 'ellipse',
        bgColor: '#daf1e5',
        borderColor: '#b3e3c8',
        fontStyle: 'normal',
        color,
      };
    }
  }
  /**
   * Handle the response from a modal dialog.
   *
   * @param {Difference} changes - The changes received from the modal dialog.
   * @param {string} [parentIRI] - The optional IRI of the parent entity for any added entities.
   */
  handleModalResponse(changes: Difference, parentIRI?: string): void {
    if (!changes) {
      return;
    }
    if (changes.hasChanges()) {
      if (this._checkArray(changes.deletions) && changes.deletions.length > 0) {
        this._handleDeletedStatements(changes.deletions);
      }
      if (this._checkArray(changes.additions) && changes.additions.length > 0) {
        this._handleAddedStatements(changes.additions, parentIRI);
      }
      this._workflowsState.hasChanges = true;
    }
  }
  /**
   * Creates a modal configuration object based on the provided element definition and mode.
   *
   * @param {cytoscape.ElementDefinition} elem - The element definition.
   * @param {ModalType} mode The mode of the Modal (add or edit).
   * @returns {ModalConfig} - The created data configuration object.
   */
  createModalConfig(elem: cytoscape.ElementDefinition, mode: ModalType): ModalConfig {
    const isEditMode = mode === ModalType.EDIT;
    const elemEntityType = elem.data('entityType');
    // If in ADD mode, only can add Actions
    const entityType: EntityType = isEditMode ? elemEntityType : EntityType.ACTION;
    const shaclKey = this.entityKeyMap[entityType].shaclKey;
    const wfDef = this._findWorkflowObject(this._editedResource);

    const objectConfig: ModalConfig = {
      recordIRI: this.recordId,
      workflowIRI: wfDef['@id'],
      shaclDefinitions: this.shaclDefinitions[shaclKey],
      entityType,
      mode
    };

    const workflowEntity = this._getDefinitionValue(elem.data('id'));
    // If truly editing an existing action/trigger
    if (isEditMode && workflowEntity['@id'] !== this._TRIGGER_NODE_ID) {
      objectConfig.selectedConfigIRI = workflowEntity['@id'];
      objectConfig.workflowEntity = this._collectEntityAndReferencedObjects(workflowEntity, this._editedResource);
    } else { // Otherwise adding an action or trigger (despite the mode being EDIT)
      objectConfig.parentIRI = elemEntityType === EntityType.ACTION ? workflowEntity['@id'] : wfDef['@id'];
      objectConfig.parentProp = this.entityKeyMap[elemEntityType].childKey[entityType];
    }

    return objectConfig;
  }
  /**
   * Creates a Difference representing deleting an entity in a workflow based on the given ID and entity type string
   * and updates the InProgressCommit on the server.
   *
   * @param {string} id - The ID of the configuration to be deleted.
   * @returns {Difference} A difference containing the deleted configuration triples
   */
  getDeleteEntityDifference(id: string): Observable<Difference> {
    const entity = id === this._TRIGGER_NODE_ID ? this._getTriggerJSONLD(this._editedResource) : find(this._editedResource, {'@id': id});
    const entityAndReferencedObjects = this._collectEntityAndReferencedObjects(entity, this._editedResource);
    const referenceTriples = this._collectReferenceTriples(entity, this._editedResource);

    const diff: Difference = new Difference([], [...entityAndReferencedObjects, ...referenceTriples]);
    return this._wms.updateWorkflowConfiguration(diff, this.recordId).pipe(
      map(() => diff)
    );
  }
  /**
   * Creates a Difference representing deleting an edge between workflow entities based on the ID of the source and
   * target of the edge and updates the InProgressCommit on the server.
   *
   * @param {string} sourceId - The ID of the source node of the edge.
   * @param {string} targetId - The ID of the target node of the edge.
   * @returns {Difference} A difference containing the deleted triple for the
   */
  getDeleteEdgeDifference(sourceId: string, targetId: string): Observable<Difference> {
    const diffObj = this._createJSONLDForEdge(sourceId, targetId);
    const diff: Difference = new Difference([], [diffObj]);
    return this._wms.updateWorkflowConfiguration(diff, this.recordId).pipe(
      map(() => diff)
    );
  }
  /**
   * Determines whether an edge can be drawn between two nodes in the chart. Logic ensures:
   *  - No direct loops
   *  - No duplicate edges
   *  - No edges from an Action back to the Trigger (i.e. the Workflow)
   *
   * @param {cytoscape.ElementDefinition} sourceNode The source node of the proposed edge
   * @param {cytoscape.ElementDefinition} targetNode The target node of the proposed edge
   * @returns {boolean} True if the edge can be added; false otherwise
   */
  edgeCanBeAdded(sourceNode: cytoscape.ElementDefinition, targetNode: cytoscape.ElementDefinition): boolean {
    const hasExistingEdge = !!this.cyChart.edges()
      .filter((ele) => ele.data('source') === sourceNode.data('id') && ele.data('target') === targetNode.data('id'))
      .length;
    const actionToTrigger = sourceNode.data('entityType') === EntityType.ACTION
      && targetNode.data('entityType') === EntityType.TRIGGER;
    return !sourceNode.same(targetNode)  // no direct loops
      && !hasExistingEdge // no duplicate edges
      && !actionToTrigger; // no edges from action back to trigger
  }
  /**
   * Attempts to add a new triple between two entities represented by the sourceNode, targetNode, and cytoscape edge
   * that was added to the chart. Updates the stored InProgressCommit and the _editedResource with the new edge. If an
   * error occurs, removes the edge from the chart.
   *
   * @param {cytoscape.ElementDefinition} sourceNode An Element representing the source node of an added edge
   * @param {cytoscape.ElementDefinition} targetNode An Element representing the target node of an added edge
   * @param {cytoscape.ElementDefinition} addedEdge An Element representing an edge between the source and target nodes
   */
  addNewEdge(sourceNode: cytoscape.ElementDefinition, targetNode: cytoscape.ElementDefinition,
    addedEdge: cytoscape.ElementDefinition): void {
    const newTriples = this._createJSONLDForEdge(sourceNode.data('id'), targetNode.data('id'));
    const diff = new Difference([newTriples]);
    this._wms.updateWorkflowConfiguration(diff, this.recordId).subscribe({
      next: () => {
        this._handleAddedStatements([newTriples]);
        this._workflowsState.hasChanges = true;
      },
      error: (error: string) => {
        this._toast.createErrorToast(`Edge could not be saved: ${error}`);
        addedEdge.remove();
      }
    });
  }

  /*****************
   * Private methods
   ****************/

  /**
   * Sets up or clears the right click menus on the nodes of the graph depending on whether edit mode is enabled.
   * @private
   */
  private _handleEditMode() {
    if (this.isEditMode) {
      this._initializeContextMenu();
      this._initializeEdgeHandles();
      this._editedResource = cloneDeep(this.resource);
    } else {
      this._destroyMenus();
      this._destroyEdgeHandles();
      this._editedResource = [];
    }
  }
  /**
   * Construct the graph data for visualization.
   * @private
   *
   * @param {JSONLDObject[]} workflowData - The JSON-LD of the Workflow to build the graph from.
   * @return {{ nodes: Element[], edges: Element[] } } - The graph data containing nodes and edges.
   */
  private _buildGraphData(workflowData: JSONLDObject[]): { nodes: Element[], edges: Element[] } {
    const triggers = this.getNodesAndEdgesByType(workflowData, EntityType.TRIGGER);
    const actions = this.getNodesAndEdgesByType(workflowData, EntityType.ACTION);
    return {
      nodes: [...triggers.nodes, ...actions.nodes],
      edges: [...triggers.edges, ...actions.edges]
    };
  }
  /**
   * Builds a unique edge ID.
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
   * @see {@link https://js.cytoscape.org/#layouts/preset}
   * @private
   *
   * @param {string} layoutName The name for the layout 
   * @returns Layout Options Object
   */
  private _createLayoutOptions(layoutName: string): cytoscape.layout {
    return {
      animate: false,
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
   * Set the style for nodes and edges in the chart.
   * @private
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
          'z-index': '10',
          'text-wrap': 'ellipsis', // Truncate text with an ellipsis (...)
          'text-max-width': '100px', // Set maximum width for the text
        }
      }, {
        selector: 'node:selected',
        style: {
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
        selector: 'edge:selected',
        style: {
          'line-color': '#8BB0D0',
          'target-arrow-color': '#8BB0D0',
        }
      },
      // some styles for the extension
      {
        selector: '.eh-handle',
        style: {
          'background-color': 'red',
          'width': 12,
          'height': 12,
          'shape': 'ellipse',
          'overlay-opacity': 0,
          'border-width': 12, // makes the handle easier to hit
          'border-opacity': 0
        }
      },

      {
        selector: '.eh-hover',
        style: {
          'background-color': 'red'
        }
      },

      {
        selector: '.eh-source',
        style: {
          'border-width': 2,
          'border-color': 'red'
        }
      },

      {
        selector: '.eh-target',
        style: {
          'border-width': 2,
          'border-color': 'red'
        }
      },

      {
        selector: '.eh-preview, .eh-ghost-edge',
        style: {
          'background-color': 'red',
          'line-color': 'red',
          'target-arrow-color': 'red',
          'source-arrow-color': 'red'
        }
      },

      {
        selector: '.eh-ghost-edge.eh-preview-active',
        style: {
          'opacity': 0
        }
      }
    ]);
  }
  /**
   * Creates a new node in the display from the provided JSON-LD.
   * @private
   *
   * @param {JSONLDObject} item - The JSON-LD of the workflow entity to be added to the node's data.
   * @returns {Element} The newly created node.
   */
  private _createNode(item: JSONLDObject): Element {
    return {
      grabbable: false,
      data: this._createNodeData(item)
    };
  }
  /**
   * Creates a NodeData object from the JSON-LD of an entity within a Workflow.
   * @private
   *
   * @param {JSONLDObject} entity The JSON-LD of a workflow entity to create a node for
   * @returns {NodeData} - The created NodeData object.
   */
  private _createNodeData(entity: JSONLDObject): NodeData {
    const { name, entityType } = this._getTypeInformation(entity['@type']);
    const style = this.getNodeTypeStyle(entityType);
    const title = getEntityName(entity, false);

    const nodeData: NodeData = {
      id: entityType === EntityType.TRIGGER ? this._TRIGGER_NODE_ID : entity['@id'],
      name: title || name,
      intId: v4(),
      entityType,
      bgColor: style?.bgColor,
      fontStyle: style.fontStyle,
      color: style.color,
      borderColor: style.borderColor,
      shape: style?.shape || 'ellipse',
    };
    if (this._isDefaultTrigger && entityType === EntityType.TRIGGER) {
      this._setDefaultTriggerStyles(nodeData);
    }

    return nodeData;
  }
  /**
   * Sets styles on the provided Node Data for a default trigger.
   * @private
   * 
   * @param {NodeData} nodeData The data attached to a node in the graph (assumed to be a trigger)
   */
  private _setDefaultTriggerStyles(nodeData: NodeData): void {
    nodeData.color = '#999999';
    nodeData.fontStyle = 'italic';
  }
  /**
   * Retrieves the type information from the types array from a JSONLDObject.
   * @private
   *
   * @param {string[]} types - The list of type IRIs from a JSONLDObject.
   * @return {Object} - The object containing the type information.
   *                  - The object has two properties:
   *                     - name: The name of the activity type.
   *                     - entityType: The activity type.
   */
  private _getTypeInformation(types: string[]): TypeInfo {
    let entityType: EntityType;
    const type = getBeautifulIRI(types.filter(typeIRI => {
      if (this.superTypes[EntityType.ACTION].includes(typeIRI)) {
        entityType = EntityType.ACTION;
        return false;
      }
      if (this.superTypes[EntityType.TRIGGER].includes(typeIRI)) {
        entityType = EntityType.TRIGGER;
        return false;
      }
      return true;
    }).pop() || entityType);

    return {
      entityType,
      name: type
    };
  }
  /**
   * Removes all the context menus from the graph nodes. Meant to be used when exiting edit mode.
   * @private
   */
  private _destroyMenus(): void {
    this.cyMenu.forEach(menu => {
      menu.destroy();
    });
    this.cyMenu = [];
  }
  /**
   * Removes the edge
   */
  private _destroyEdgeHandles(): void {
    if (this.cyEdgehandles) {
      this.cyEdgehandles.disableDrawMode();
      this.cyEdgehandles.destroy();
    }
    this.cyEdgehandles = undefined;
    this.cyChart.off('ehcomplete');
  }
  /**
   * Creates the context menus for the nodes to be used when editing.
   * @private
   */
  private _initializeContextMenu(): void {
    if (!this.cyMenu.length) {
      this._getContextMenus().forEach(menu => {
        this.cyMenu.push(this.cyChart.cxtmenu(menu));
      });
    }
  }
  /**
   * Creates the edgehandles behavior for creating new edges in the chart.
   * @private
   */
  private _initializeEdgeHandles(): void {
    if (!this.cyEdgehandles) {
      const config = {
        canConnect: (sourceNode, targetNode) => this.edgeCanBeAdded(sourceNode, targetNode),
        edgeParams: (sourceNode, targetNode) => this._buildNodeEdge(sourceNode.data('id'), targetNode.data('id')),
        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
        snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
        snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
        snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
        noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
        disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
      };
      this.cyEdgehandles = this.cyChart.edgehandles(config);
      this.cyEdgehandles.enableDrawMode();
      this.cyChart.on('ehcomplete', (_event, sourceNode, targetNode, addedEdge) => this.addNewEdge(sourceNode, targetNode, addedEdge));
    }
  }
  /**
   * Generates a JSON-LD object representing a triple from the entity with the sourceId to the entity with the targetId.
   * @private
   *
   * @param {string} sourceId The IRI of the source of the triple
   * @param {string} targetId The IRI of the target of the triple
   * @returns {JSONLDObject} A JSON-LD object that represents a triple forming a connection between two nodes
   */
  private _createJSONLDForEdge(sourceId: string, targetId: string): JSONLDObject {
    let prop: string;
    let id: string;
    if (sourceId === this._TRIGGER_NODE_ID) {
      id = this._findWorkflowObject(this._editedResource)['@id'];
      prop = this.entityKeyMap[EntityType.TRIGGER].childKey[EntityType.ACTION];
    } else {
      id = sourceId;
      prop = this.entityKeyMap[EntityType.ACTION].childKey[EntityType.ACTION];
    }
    const edgeObj: JSONLDObject = {
      '@id': id,
      [prop]: [{ '@id': targetId }]
    };
    return edgeObj;
  }
  /**
   * Retrieves the context menus for each node type.
   * @private
   *
   * @returns {Array} An array of context menus for the nodes.
   */
  private _getContextMenus(): Array<{ selector: string; commands: MenuCommandArray; }> {
    /**
     * Opens the add dialog for the given element.
     * @private
     *
     * @param {Element} cytoscape.Node - The element to edit.
     */
    const addEntityFunc = function (ele: cytoscape.ElementDefinition): void {
      const dataConfig = this.createModalConfig(ele, ModalType.ADD);
      this._openDialog(dataConfig, dataConfig.mode);
    }.bind(this);

    /**
     * Opens the edit dialog for the given element.
     * @private
     * 
     * @param {Element} cytoscape.Node - The element to edit.
     */
    const editEntityFunc = function (elem: cytoscape.ElementDefinition): void {
      const dataConfig = this.createModalConfig(elem, ModalType.EDIT);
      this._openDialog(dataConfig, dataConfig.mode);
    }.bind(this);

    /**
     * Deletes an entity from the graph.
     * @private
     *
     * @param {Element.Node} ele - the cytoscape node
     */
    const deleteEntity = function (ele: cytoscape.ElementDefinition): void {
      this._dialog.open(ConfirmModalComponent, {
        data: {
          content: `Are you sure you want to delete <strong>${ele.data('name')}</strong>?`
        }
      }).afterClosed().subscribe((canDelete: boolean) => {
        if (canDelete) {
          const id = ele.data('id');
          this.getDeleteEntityDifference(id, ele.data('entityType')).subscribe(diff => {
            this._deleteNode(ele);
            this.handleModalResponse(diff);
          }, error => {
            this._toast.createErrorToast(`Error saving changes: ${error}`);
          });
        }
      });
    }.bind(this);

    /**
     * Deletes an edge between entities from the graph.
     * @private
     *
     * @param {Element.Node} ele - the cytoscape node for the edge
     */
    const deleteEdge = function(ele: cytoscape.ElementDefinition): void {
      this._dialog.open(ConfirmModalComponent, {
        data: {
          content: 'Are you sure you want to delete this edge?'
        }
      }).afterClosed().subscribe((canDelete: boolean) => {
        if (canDelete) {
          const sourceId = ele.data('source');
          const targetId = ele.data('target');
          this.getDeleteEdgeDifference(sourceId, targetId).subscribe(diff => {
            ele.remove();
            this.handleModalResponse(diff);
          }, error => {
            this._toast.createErrorToast(`Error saving changes: ${error}`);
          });
        }
      });
    }.bind(this);

    const addCommand = {
      content: '<span class="fa fa-plus-square fa-2x"></span>',
      select: addEntityFunc
    };

    const deleteCommand = {
      content: '<span class="fa fa-trash fa-2x" matTooltip="delete"></span>',
      select: deleteEntity
    };

    const deleteEdgeCommand = {
      content: '<span class="fa fa-trash fa-2x" matTooltip="delete"></span>',
      select: deleteEdge
    };

    const editCommand = {
      content: '<span class="fa fa-edit fa-2x" matTooltip="edit"></span>',
      select: editEntityFunc
    };

    const actionCommands = [addCommand, deleteCommand, editCommand];
    const triggerCommands = [addCommand];
    if (!this._isDefaultTrigger) {
      triggerCommands.push(deleteCommand);
    }
    // Done after for order around the circle
    triggerCommands.push(editCommand);
    return [{
      selector: 'node[entityType="action"]',
      commands: actionCommands
    }, {
      selector: 'node[entityType="trigger"]',
      commands: triggerCommands
    }, {
      selector: 'edge',
      commands: [deleteEdgeCommand]
    }];
  }
  /**
   * Collects and returns an array of the provided workflow entity and all the other objects it references that it found
   * in the provided full resource JSON-LD array. Does not include referenced w:Trigger, w:Action, or w:Workflow objects.
   * @private
   * 
   * @param {JSONLDObject} entity The starting JSON-LD object to search with
   * @param {JSONLDObject} resource The JSON-LD array to search for objects within
   * @returns {JSONLDObject[]} A JSON-LD array of the entity and the objects it references
   */
  private _collectEntityAndReferencedObjects(entity: JSONLDObject, resource: JSONLDObject[]): JSONLDObject[] {
    const fullArray = [entity];
    Object.keys(entity).filter(key => key !== '@id' && key !== '@type').forEach(prop => {
      entity[prop].some(propVal => {
        if (propVal['@value']) {
          return 1 === 1;
        }
        const referencedObject = resource.find(obj => {
          const hasId = obj['@id'] === propVal['@id'];
          const isTrigger = obj['@type'].includes(this.entityKeyMap.trigger.id);
          const isAction = obj['@type'].includes(this.entityKeyMap.action.id);
          const isWorkflow = obj['@type'].includes(this.buildWorkflowsIRI('Workflow'));
          // Don't want to collect main workflow entities since this is used for deletions
          return hasId && !isTrigger && !isAction && !isWorkflow;
        });
        if (referencedObject) {
          fullArray.push(referencedObject);
        }
      });
    });
    return fullArray;
  }
  /**
   * Collects and returns an array of JSON-LD objects representing the triples that reference the provided JSON-LD
   * entity from the provided JSON-LD array of objects. Does not include the full JSON-LD of a referencing object, only
   * the property that referenced the target object.
   * @private
   * 
   * @param {JSONLDObject} entity - The target entity to search for references to.
   * @param {JSONLDObject} resource - A JSON-LD array to search for references in.
   * @returns {JSONLDObject[]} - A JSON-LD array of objects representing triples.
   */
  private _collectReferenceTriples(entity: JSONLDObject, resource: JSONLDObject[]): JSONLDObject[] {
    const triples: JSONLDObject[] = [];
    resource.forEach(obj => {
      let tripleObj;
      Object.keys(obj).filter(key => key !== '@id' && key !== '@type').forEach(prop => {
        obj[prop].some(propVal => {
          if (propVal['@value']) {
            return 1 === 1;
          }
          if (propVal['@id'] === entity['@id']) {
            tripleObj = tripleObj || triples.find(obj => obj['@id'] === obj['@id']);
            if (!tripleObj) {
              tripleObj = { '@id': obj['@id'] };
              triples.push(tripleObj);
            }
            tripleObj[prop] = [{ '@id': entity['@id'] }];
          }
        });
      });
    });
    return triples;
  }
  /**
   * Opens a dialog with the given data.
   * @private
   *
   * @param {DataConfig} data - The data to pass to the dialog.
   */
  private _openDialog(data: ModalConfig): void {
    this._dialog.open(WorkflowAddConfigurationComponent, {
      panelClass: 'medium-dialog',
      data
    }).afterClosed().subscribe((changes: Difference) => {
      this.handleModalResponse(changes, data.parentIRI);
    });
  }
  /**
   * Checks if the given element is an array.
   * @private
   *
   * @param {string | JSONLDObject[]} element - The element to be checked.
   * @return {boolean} - Returns true if the element is an array, false otherwise.
   */
  private _checkArray(element?: string | JSONLDObject[]): element is JSONLDObject[] {
    return isArray(element) && !isEmpty(element);
  }
  /**
   * Processes through the provided JSON-LD representing deleted statements and updates the internal _editedResource
   * with the changes. This method does not handle updating the graph nodes.
   * @private
   * 
   * @param {JSONLDObject[]} deletions The JSON-LD of deleted statements
   */
  private _handleDeletedStatements(deletions: JSONLDObject[]): void {
    // Update the workflow definition itself first
    const deletedWorkflowDefStatements = this._findWorkflowObject(deletions);
    const workflowDefinition = this._findWorkflowObject(this._editedResource);
    if (deletedWorkflowDefStatements) {
      this._updateEntityWithDeletions(deletedWorkflowDefStatements, workflowDefinition);
    }
    // Iterate through all other deleted statements besides the workflow entity
    deletions.forEach(deletedStmts => {
      if (deletedStmts['@id'] === workflowDefinition['@id']) {
        return;
      }
      const workflowEntityIdx = this._editedResource.findIndex(obj => obj['@id'] === deletedStmts['@id']);
      if (workflowEntityIdx >= 0) {
        const workflowEntity = this._editedResource[workflowEntityIdx];
        this._updateEntityWithDeletions(deletedStmts, workflowEntity);
        // Removes the workflow entity if it has no more triples on it
        if (Object.keys(workflowEntity).length === 1) {
          this._editedResource.splice(workflowEntityIdx, 1);
        }
        if (deletedStmts[`${DCTERMS}title`]) {
          const typeInfo = this._getTypeInformation(workflowEntity['@type']);
          const potentialName = getEntityName(workflowEntity, false);
          typeInfo.name = potentialName ? potentialName : typeInfo.name;
          this._updateNode(workflowEntity['@id'], typeInfo);
        }
      }
    });
  }
  /**
   * Updates the provided JSON-LD entity with the additions triples on the provided JSON-LD object.
   * @private
   * 
   * @param {JSONLDObject} deletions All the added statements for the entity
   * @param {JSONLDObject} entity The root entity to be updated
   */
  private _updateEntityWithDeletions(deletions: JSONLDObject, entity: JSONLDObject): void {
    Object.keys(deletions).forEach(key => {
      if (key === '@id') {
        return;
      }
      deletions[key].forEach(deletedValue => {
        entity[key] = entity[key].filter(value => !isEqual(value, deletedValue));
      });
      if (!entity[key].length) {
        delete entity[key];
      }
    });
  }
  /**
   * Processes through the provided JSON-LD representing additions statements and updates the internal _editedResource
   * with the changes. This method also handles updating the graph nodes.
   * @private
   * 
   * @param {JSONLDObject[]} additions The JSON-LD of added statements
   * @param {string} [parentIRI] The optional IRI of the parent entity when drawing new edges in the chart
   */
  private _handleAddedStatements(additions: JSONLDObject[], parentIRI?: string): void {
    // Update the workflow definition itself first
    const addedWorkflowDefStatements = this._findWorkflowObject(additions);
    const workflowDefinition = this._findWorkflowObject(this._editedResource);
    if (addedWorkflowDefStatements) {
      this._updateEntityWithAdditions(addedWorkflowDefStatements, workflowDefinition);
    }
    // Iterate through all other added statements besides the workflow entity
    additions.forEach(addedStmts => {
      if (addedStmts['@id'] === workflowDefinition['@id']) {
        return;
      }
      const workflowEntity = this._editedResource.find(obj => obj['@id'] === addedStmts['@id']);
      if (workflowEntity) {
        // Update editedResource
        this._updateEntityWithAdditions(addedStmts, workflowEntity);
        // Update graph node if root entity (trigger/action) and type was changed
        const isRootEntity = workflowEntity['@type'].includes(this.entityKeyMap.trigger.id)
          || workflowEntity['@type'].includes(this.entityKeyMap.action.id);
        if (addedStmts['@type'] || addedStmts[`${DCTERMS}title`] && isRootEntity) {
          const typeInfo = this._getTypeInformation(workflowEntity['@type']);
          typeInfo.name = addedStmts[`${DCTERMS}title`] ? getEntityName(workflowEntity, false) : typeInfo.name;
          this._updateNode(workflowEntity['@id'], typeInfo);
        }
      } else {
        // Update editedResource
        this._editedResource.push(addedStmts);
        // Update graph node if root entity (trigger/action)
        const types = this._getDefinitionTypes(addedStmts);
        if (types.includes(this.entityKeyMap.trigger.id) || types.includes(this.entityKeyMap.action.id)) {
          const typeInfo = this._getTypeInformation(types);
          if (typeInfo.entityType === EntityType.TRIGGER) {
            typeInfo.name = addedStmts[`${DCTERMS}title`] ? getEntityName(workflowEntity, false) : typeInfo.name;
            this._updateNode(addedStmts['@id'], typeInfo);
          } else {
            this._addNodeToChart(addedStmts, parentIRI);
          }
        }
      }
    });
  }
  /**
   * Updates the provided JSON-LD entity with the additions triples on the provided JSON-LD object.
   * @private
   * 
   * @param {JSONLDObject} additions All the added statements for the entity
   * @param {JSONLDObject} entity The root entity to be updated
   */
  private _updateEntityWithAdditions(additions: JSONLDObject, entity: JSONLDObject): void {
    Object.keys(additions).forEach(key => {
      if (key === '@id') {
        return;
      }
      additions[key].forEach(addedValue => {
        if (entity[key]) {
          entity[key].push(addedValue);
        } else {
          entity[key] = [addedValue];
        }
      });
    });

    const fullEntity = this.resource.filter(obj => obj['@id'] === additions['@id'])[0];
    if (fullEntity && fullEntity[`${DCTERMS}title`]) {
      if (!entity[`${DCTERMS}title`] && !additions[`${DCTERMS}title`]) {
        entity[`${DCTERMS}title`] = fullEntity[`${DCTERMS}title`];
      }
    }
  }
  /**
   * Updates a node in the chart.
   * @private
   *
   * @param {string} id - The ID of the node.
   * @param {Object} typeInfo - The information about the type of the node.
   * @param {string} typeInfo.entityType - The type of the activity (e.g. 'trigger').
   * @param {string} typeInfo.name - The new name for the node.
   */
  private _updateNode(id: string, typeInfo: TypeInfo): void {
    let node;
    if (typeInfo.entityType === EntityType.TRIGGER) {
      node = this._getTriggerFromChart();
    } else {
      node = this.cyChart.getElementById(id);
    }

    if (node && node.data().name !== typeInfo.name) {
      node.data().name = typeInfo.name;
      // If the trigger node was updated, need to remove the default trigger styles and unset the boolean
      if (typeInfo.entityType === EntityType.TRIGGER) {
        const triggerStyle = this.getNodeTypeStyle(typeInfo.entityType);
        node.data().color = triggerStyle.color;
        node.data().fontStyle = triggerStyle.fontStyle;
        this._isDefaultTrigger = false;
        // Reset context menus to account for trigger being set
        this._destroyMenus();
        this._initializeContextMenu();
      }
      this.cyChart.style().update();
    }
  }
  /**
   * Returns the type(s) of a given definition.
   * @private
   *
   * @param {JSONLDObject} definition - The definition object which may contain the '@type' property.
   * @returns {Array|null} - An array of type(s) if '@type' property exists, otherwise null.
   */
  private _getDefinitionTypes(definition: JSONLDObject): Array<string> | null {
   return has(definition,'@type') ? definition['@type'] : null;
  }
  /**
   * Retrieves the triggers from the chart.
   * @private
   * 
   * @return {Cy.Collection} The collection of nodes representing triggers in the chart.
   */
  private _getTriggerFromChart() {
    return this.cyChart.elements('node[entityType="trigger"]');
  }
  /**
   * Finds the JSON-LD Object in the given array that has either 'hasAction' or 'hasTrigger' property, representing
   * the definition of the Workflow itself.
   * @private
   *
   * @param {JSONLDObject[]} def - The array of items to search through.
   * @return {JSONLDObject|undefined} - The Workflow JSON-LD object or undefined if not found.
   */
  private _findWorkflowObject(def: JSONLDObject[]): JSONLDObject {
    return def.find(item => item['@type']?.includes(this.buildWorkflowsIRI('Workflow')) 
      || has(item, this.buildWorkflowsIRI('hasAction'))
      || has(item, this.buildWorkflowsIRI('hasTrigger')));
  }
  /**
   * Adds a new node to the chart based on the provided entity JSON-LD and optional parent IRI. If the parent IRI is the
   * workflow definition, draws the edge from the trigger node. Otherwise, draws the edge from the element with that id.
   * @private
   *
   * @param {JSONLDObject} entity - The entity JSON-LD to create the node from.
   * @param {string} [parentIRI] - The optional IRI of the parent entity for this entity.
   */
  private _addNodeToChart(entity: JSONLDObject, parentIRI?: string): void {
    const node = this._createNode(entity);
    this.cyChart.add(node);
    const wfDef = this._findWorkflowObject(this._editedResource);
    let sourceId: string;
    if (parentIRI === wfDef['@id']) {
      const trigger = this._getTriggerFromChart();
      sourceId = trigger.data('id');
    } else {
      const node = this.cyChart.getElementById(parentIRI);
      sourceId = node.data('id');
    }
    const edge = this._buildNodeEdge(sourceId, node.data.id);
    this.cyChart.add(edge);
    this.cyChart.layout(this.cyLayout).run();
  }
  /**
   * Builds node edges.
   * @private
   *
   * @param {string} sourceId - The source node ID.
   * @param {string} targetId - The target node ID.
   * @returns {Element} - The built node edge.
   */
  private _buildNodeEdge(sourceId: string, targetId: string): Element {
    const edgeData: EdgeData = {
      id: this._buildEdgeId(sourceId, targetId),
      name: '',
      intId: '',
      source: sourceId,
      target: targetId,
    };
    return {
      grabbable: false,
      data: edgeData
    };
  }
  /**
   * Deletes the provided node from the graph.
   * @private
   * 
   * @param {cytoscape.node} elem - The node to be deleted.
   */
  private _deleteNode(elem: cytoscape.node): void {
    const entityType = elem.data('entityType');
    if (entityType === EntityType.TRIGGER) {
      elem.data().name = 'Default Trigger';
      this._setDefaultTriggerStyles(elem.data());
      this.cyChart.style().update();
      this._isDefaultTrigger = true;
      // Reset context menus to account for trigger being removed
      this._destroyMenus();
      this._initializeContextMenu();
    } else {
      const nodeId = elem.data('id');
      const edges = this.cyChart.edges().filter((ele) => ele.data('source') === nodeId || ele.data('target') === nodeId);
      edges.remove();
      elem.remove();
    }
  }
  /**
   * Retrieves the value of the definition from the edited JSON-LD based on the provided ID. If the IRI is the internal
   * trigger identifier, retrieves the actual trigger entity from the edited JSON-LD. 
   * @private
   *
   * @param {string} id - The ID of the definition to retrieve the value of.
   * @return {JSONLDObject} - The value of the definition with the provided ID, or the default trigger value if not found.
   */
  private _getDefinitionValue(id: string): JSONLDObject {
    if (id === this._TRIGGER_NODE_ID) {
      return this._getTriggerJSONLD(this._editedResource) || this.getDefaultTrigger();
    }
    return find(this._editedResource, (object) => object['@id'] === id);
  }
  /**
   * Retrieves the JSON-LD object for the trigger of the workflow represented by the provided JSON-LD array based on
   * the object types.
   * 
   * @param {JSONLDObject[]} resource The JSON-LD array of a Workflow
   * @returns {JSONLDObject} The Trigger JSON-LD object if found
   */
  private _getTriggerJSONLD(resource: JSONLDObject[]): JSONLDObject {
    return resource.find(obj => obj['@type'].includes(this.entityKeyMap.trigger.id));
  }
}
