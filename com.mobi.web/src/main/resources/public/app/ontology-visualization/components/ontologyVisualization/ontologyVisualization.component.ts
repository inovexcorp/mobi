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

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import cytoscape, { Collection, Core, Element, Layout } from 'cytoscape';
import { Subscription } from 'rxjs';

import { D3Node, D3NodeIndex } from '../../classes/d3Classes';
import { D3SimulatorService } from '../../services/d3Simulator.service';
import { GraphState, StateNode } from '../../classes';
import { GraphStateDataI } from '../../classes/graphState';
import { OntologyVisualizationService } from '../../services/ontologyVisualization.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { SidePanelAction, SidePanelPayloadI } from '../../classes/sidebarState';
import { SimulationOptions } from '../../interfaces/simulation.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { VisualizationHelpModal } from '../visualization-help-modal/visualization-help-modal.component';

/**
 * @class OntologyVisualization
 *
 * Enable users to visually explore classes within an
 * ontology and the ways they relate to one another
 *
 * @requires OntologyVisualizationService
 */
@Component({
  selector: 'ontology-visualization',
  templateUrl: './ontologyVisualization.component.html',
  styleUrls: ['./ontologyVisualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class OntologyVisualization implements OnInit, OnDestroy, OnChanges {
  @Input() ontologyId: string;
  @Input() commitId: string;
  @Input() branchId: string;
  @Input() inProgress;
  @ViewChild('ontologyVis') ontoVis: ElementRef;
  @HostListener('wheel', ['$event'])
  onWheelEvent = (event: WheelEvent): void => {
    this.initialZoomLevel = this.cyChart.zoom();
  };

  private _toastrConfig = {
    timeOut: 0,
    extendedTimeOut: 0,
    preventDuplicates: true,
    closeButton: true,
    id: null
  };
  public hasInProgressCommit = false;
  public cyChart: Core; // cytoscape instance
  public cyChartSize = 0;
  public cyLayout: Layout; // cytoscape layout
  private debounceTimeId: NodeJS.Timer;
  public graphCollections = {
    highlighted: new Set(),
    selectedNode: new Set(),
    selectedNeighbor: new Set()
  };
  public status = {
    loaded: false, // Graph data was loaded
    initialized: false, // Cytoscape chart has been initialized
    hasWarningsMsg: false
  };
  sidePanelActionSub$: Subscription; // Subscription to control cytoscape graph from different components
  newNodeWithPositionAdded = false;
  initialZoomLevel = 0;

  constructor(private ovis: OntologyVisualizationService,
              private d3Simulator: D3SimulatorService,
              private toast: ToastService,
              private dialog: MatDialog,
              private cf: ChangeDetectorRef,
              private spinnerSrv: ProgressSpinnerService) {
  }

  ngOnInit(): void {
    const self = this;
    this.cyChart = this.createCytoscapeInstance();
    this.cyChart.ready(this.setChartBindings());
    this.sidePanelActionSub$ = this.ovis.sidePanelActionAction$.subscribe(this.sidePanelActionObserver());
    this.ovis.init(this.commitId, this.inProgress).subscribe({
      next(commitGraphState: GraphState) {
        self.initGraph(commitGraphState);
        self.updateMessages(commitGraphState.isOverLimit, commitGraphState.nodeLimit);
      },
      error(reason) {
        self.status.initialized = true;
        self.toast.clearToast();
        self.initFailed(reason);
      }
    });
    if (this.cyChart) {
      this.initialZoomLevel = this.cyChart.zoom();
    }
  }

  /**
   * ngOnChanges Lifecycle hook
   * Occurs when: ontologyId, commitId, branchId, or in-Progress commit are changed or switching between ontologies
   * @param changes SimpleChanges
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.inProgress?.currentValue) {
      this.hasInProgressCommit = changes.inProgress.currentValue['additions'].length > 0 ||
        changes.inProgress.currentValue['deletions'].length > 0;
    } else {
      this.hasInProgressCommit = false;
    }

    if (this.status.initialized) {
      this.clearErrorToasts();
      const inProgressChanges = changes.inProgress?.currentValue;
      if (!changes.commitId && changes.branchId) {
        this.status.loaded = true;
      } else if (changes.ontologyId || changes.commitId || inProgressChanges) {
        this.status.loaded = false;
        if (changes.commitId && this.cyChart) {
          this.updateGraphState(changes.commitId.previousValue);
        }

        const self = this;
        this.ovis.init(this.commitId, inProgressChanges).subscribe({
          next(commitGraphState: GraphState) {
            if (self.cyChart && commitGraphState.positioned && (!inProgressChanges || inProgressChanges && (self.cyChart.nodes().length >= commitGraphState.nodeLimit))) {
              self.updateCytoscapeGraph(commitGraphState, false, {preProcessClustering: true});
              commitGraphState.isOverLimit = self.cyChart.nodes().length >= commitGraphState.nodeLimit;
            } else {
              self.initGraph(commitGraphState);
            }
          },
          error(reason) {
            self.clearGraph();
            self.initFailed(reason);
          }
        });
      } else if (this.hasInProgressCommit) {
        const state = this.ovis.getGraphState(this.commitId);
        this.updateMessages(state.isOverLimit, state.nodeLimit);
      }
      this.initialZoomLevel = this.cyChart.zoom();
    }
  }

  ngOnDestroy(): void {
    this.toast.clearToast();
    if (this.sidePanelActionSub$) {
      this.sidePanelActionSub$.unsubscribe();
    }
    if (this.cyChart && this.status.initialized && this.ovis.graphStateCache.has(this.commitId)) {
      this.updateGraphState(this.commitId);
    }
  }

  /**
   * Create Cytoscape Instance
   * https://js.cytoscape.org/#core/initialisation
   * @returns cytoscape instance
   */
  createCytoscapeInstance(): Core {
    const container = <HTMLElement>document.querySelector('.ontology-visualization');
    return cytoscape({ // Recycling an instance will help to keep memory usage lower
      container,
      // textureOnViewport: true, // Option makes large graphs more responsive
      maxZoom: 4, // Helps with preventing user getting lost in the viewpoint
      minZoom: 0.05
    });
  }

  /**
   * Observes and handles actions triggered from the side panel, updating the graph visualization
   * based on the specified action and payload.
   *
   * @return {Object} An observer object containing a `next` method, which processes the payload
   *                  and performs associated actions on the graph visualization in response
   *                  to side panel events.
   */
  sidePanelActionObserver(): { next: any } {
    const self = this;
    return {
      next: (payload: SidePanelPayloadI) => {
        try {
          if (!self.status.initialized) {
            console.info('OntologyVisualization component was not initialized');
            return;
          }
          const currentGraphState = this.ovis.getGraphState(this.commitId);
          switch (payload.action) {
            // The checkbox next to an ontology will update the graph by adding as many nodes as possible for all the
            // classes listed beneath
            case SidePanelAction.ONTOLOGY_CHECKED: {
              self.status.loaded = false;
              const ontologyId = payload.ontology.ontologyId;
              const graphStateDataOntology: GraphStateDataI = currentGraphState.getFilteredGraphData({ontologyId});
              this.cyChart.add(graphStateDataOntology);
              const options: SimulationOptions = {
                useExistingNodeLocation: true,
              };
              this.runSimulationOnGraphState(currentGraphState, options);
              self.status.loaded = true;
              self.cf.markForCheck();
              break;
            }
            // The checkbox next to an ontology will remove all classes listed beneath from the graph
            case SidePanelAction.ONTOLOGY_UNCHECKED: {
              const record = payload.ontology;
              const elesNodes = this.getOntologyGraphElements(record.ontologyId);
              elesNodes.elements.remove();
              self.cf.markForCheck();
              break;
            }
            case SidePanelAction.CLASS_SELECT: {
              self.cyChart.elements().unselect();
              self.clearNodeStyle();
              const target = self.cyChart.$id(payload.controlRecord.id);
              target.select();
              self.focusElement(target, 'select', self.graphCollections);
              self.cf.markForCheck();
              break;
            }
            case SidePanelAction.CLASS_CENTER: {
              const targetNode = self.cyChart.$id(payload.controlRecord.id);
              self.cyChart.animate({
                fit: {
                  eles: targetNode,
                  padding: 100,
                }
              }, {
                duration: 1000,
                complete: () => {
                  self.focusElement(targetNode, 'center', self.graphCollections);
                  self.initialZoomLevel = self.cyChart.zoom();
                  self.cf.markForCheck();
                }
              });
              targetNode.select();
              self.cf.markForCheck();
              break;
            }
            /**
             * Need to add node type to controlRecord
             * Selecting the checkbox next to a class will update the graph by adding a new node
             */
            case SidePanelAction.CLASS_CHECKED: {
              self.status.loaded = false;
              const classData = payload.controlRecord;
              const graphStateDataI: GraphStateDataI = currentGraphState.getFilteredGraphData({recordId: classData.id});
              this.cyChart.add(graphStateDataI);

              if (!Object.prototype.hasOwnProperty.call(classData.stateNode, 'position') || self.newNodeWithPositionAdded === true) {
                const options: SimulationOptions = {
                  useExistingNodeLocation: true,
                };
                this.runSimulationOnGraphState(currentGraphState, options);
                self.newNodeWithPositionAdded = true;
              } else if (self.newNodeWithPositionAdded) {
                // Needed because past simulation could conflict with existing nodes that are positioned but not on the graph
                // Nodes that are not on the graph but have position data are not used for simulation
                const options: SimulationOptions = {
                  useExistingNodeLocation: true,
                };
                this.runSimulationOnGraphState(currentGraphState, options);
                self.newNodeWithPositionAdded = false;
              }
              self.status.loaded = true;
              break;
            }
            /**
             * If a checkbox next to a class is unchecked, the node is removed along with any incoming/outgoing links
             */
            case SidePanelAction.CLASS_UNCHECKED: {
              self.cyChart.elements().unselect();
              self.clearNodeAndSelectAction();
              const classData = payload.controlRecord;
              classData.inInitialGraph = false;
              classData.onGraph = false;
              const elements = this.cyChart.elements().nodes(`[id="${classData.id}"]`);
              this.cyChart.remove(elements);
              break;
            }
            default: {
              console.warn('Invalid choice');
              break;
            }
          }
          this.cyChartSize = currentGraphState.getElementsLength();
        } catch (error) {
          console.error(error);  // Error needs to be caught so that the subscriber doesn't unsubscribe
        }
      }
    };
  }

  /**
   * Search cyChart for nodes with ontologyId
   * @param ontologyId
   * @returns elements
   */
  private getOntologyGraphElements(ontologyId: string): { elements: any } {
    const selector = `[ontologyId="${ontologyId}"]`;
    const elements = this.cyChart.elements(selector);
    return {
      elements
    };
  }

  /**
   * Clear Error Toasts from UI
   */
  private clearErrorToasts(): void {
    if (this.status.hasWarningsMsg) {
      this.toast.clearToast();
      this.status.hasWarningsMsg = false;
    }
  }

  /**
   * Initialization of cytoscape's graph instance, data was initialized using this.ovis.init()
   *
   * - https://js.cytoscape.org/#layout.run
   */
  initGraph(commitGraphState: GraphState): void {
    const layoutName = 'preset';
    const layout = this.createLayoutOptions(layoutName);
    this.cyLayout = this.cyChart.layout(layout);
    this.updateCytoscapeGraph(commitGraphState, true, {preProcessClustering: true});
    this.cyLayout.run();
    this.status.initialized = true;
    if (commitGraphState.selectedNodes) {
      const selectedNode = this.cyChart.$('.focused');
      const neighborhood = selectedNode.neighborhood();
      if (neighborhood && neighborhood.length > 0) {
        this.graphCollections.selectedNeighbor.add(neighborhood);
      }
      this.graphCollections.selectedNode.add(selectedNode);
      this.ovis.emitSelectAction({
        action: SidePanelAction.CLASS_SELECT,
        nodeId: selectedNode.id()
      });
    }
    commitGraphState.isOverLimit = this.cyChart.nodes().length >= commitGraphState.nodeLimit;
  }

  /**
   * Run D3-Force Simulation On GraphState
   * Info about Cytoscape node positions: https://js.cytoscape.org/#nodes.positions
   *
   * NOTE: Mutating state by object references
   * @return Time it took to run simulation
   */
  runSimulationOnGraphState(graphState: GraphState, simulationOptions?: SimulationOptions, refreshPositions = true): number {
    const start = new Date().getTime();
    const graphStateData: GraphStateDataI = graphState.getFilteredGraphData();
    const nodePositionMapping: D3NodeIndex = this.d3Simulator.runSimulation(graphStateData, simulationOptions);
    graphStateData.nodes.forEach((stateNode: StateNode) => {
      stateNode.position = nodePositionMapping[stateNode.data.id];  // Mutating by Object Reference
    });
    if (this.cyChart && refreshPositions) {
      this.cyChart.nodes().positions(function (node) {
        const d3NodePosition: D3Node = nodePositionMapping[node.id()];
        if (d3NodePosition) {
          return {
            x: d3NodePosition?.x || 0,
            y: d3NodePosition?.y || 0
          };
        } else {
          return node.position();
        }
      });
    }
    graphState.positioned = true; // The idea of positioned graph should be check as nodes check added to graph
    return new Date().getTime() - start;
  }

  /**
   * Updates the Cytoscape graph using the provided graph state, initialization flag, and optional simulation options.
   *
   * @param {GraphState} commitGraphState - The current state of the graph, including elements, styles, and positioning.
   * @param {boolean} [init=false] - A flag indicating whether this is the initial graph setup.
   * @param {SimulationOptions} [simulationOptions] - Optional parameters for graph simulation.
   */
  public updateCytoscapeGraph(commitGraphState: GraphState, init = false, simulationOptions?: SimulationOptions): void {
    if (!commitGraphState.positioned) {
      this.runSimulationOnGraphState(commitGraphState, simulationOptions, false);
    }
    this.cyChartSize = commitGraphState.getElementsLength();
    this.clearGraph();
    this.cyChart.add(commitGraphState.getFilteredGraphData());
    this.cyChart.json({
      style: commitGraphState.style
    });
    if (!init) {
      this.updateMessages(commitGraphState.isOverLimit, commitGraphState.nodeLimit);
    }
    if (commitGraphState.positionData !== undefined) {
      this.cyChart.json(commitGraphState.positionData);
    } else {
      this.cyChart.fit(); // https://js.cytoscape.org/#cy.fit
      this.initialZoomLevel = this.cyChart.zoom();
    }
    this.cf.markForCheck(); // Needed so that graph shows
    this.status.loaded = true;
  }

  /**
   * Update Graph State
   * Before loading next graph commit the current state should be saved
   *
   * Usages:
   *  - ngOnDestroy: Save the state for next time the ontology opens up
   *  - ngOnChanges: Before loading next graph commit and switching to a different commitId save the state
   *
   * @param commitId commit Id
   */
  updateGraphState(commitId: string): void {
    const commitGraphState: GraphState = this.ovis.getGraphState(commitId);
    commitGraphState.selectedNodes = this.graphCollections.selectedNode.size > 0;
    const cyChartJson = this.cyChart.json();
    commitGraphState.positionData = {pan: cyChartJson.pan, zoom: cyChartJson.zoom};
  }

  /**
   * Clear Cytoscape chart elements
   * @returns true if graph was cleared, false if it could not clear graph
   */
  clearGraph(): boolean {
    if (this.cyChart?.elements) {
      this.cyChart.elements().remove();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Updates the message notifications based on the input conditions.
   * If the node limit is exceeded, a warning toast is displayed with the respective message.
   *
   * @param {boolean} isOverLimit - Indicates whether the node limit has been exceeded.
   * @param {number} nodeLimit - The maximum number of nodes allowed.
   */
  updateMessages(isOverLimit: boolean, nodeLimit: number): void {
    this.clearErrorToasts();
    if (isOverLimit) {
      this.status.hasWarningsMsg = true;
      this.toast.createWarningToast(`Maximum number of nodes reached. Only ${nodeLimit} nodes are being displayed`, this._toastrConfig);
    }
  }

  /**
   * Opens a help dialog displaying the VisualizationHelpModal component.
   */
  openHelpDialog() {
    this.dialog.open(VisualizationHelpModal);
  }

  /**
   * Marks the initialization as failed by setting the appropriate status flags,
   * triggering a warning toast with a provided reason, and updating graph-related
   * state information.
   *
   * @param {string} reason - The reason for the initialization failure, used to display a warning message.
   */
  private initFailed(reason: string): void {
    const commitGraphState = this.ovis.getGraphState(this.commitId);
    this.cyChartSize = commitGraphState.getElementsLength();
    this.toast.createWarningToast(reason, this._toastrConfig);
    this.status.hasWarningsMsg = true;
    this.status.loaded = true;
  }

  /**
   * Add ClassToCollection
   * @param collection
   * @param nodes
   * @param classes
   */
  private addClassToCollection(collection, nodes, classes): void {
    collection.add(nodes);
    nodes.addClass(classes);
  }

  /**
   * Remove class from element.
   * ClassName { string } represents the token to be removed.
   * @param collection
   * @param className
   */
  private removeItemFormCollection(collection, className: string): void {
    if (collection.hasClass(className)) {
      collection.removeClass(className);
    }
  }

  /**
   * Remove class from collection
   * @param collection
   * @param classes
   * @private
   */
  private removeCollectionClass(collection: Set<any>, classes): void {
    const getExclusiveState = {
      'highlighted': 'focused',
      'focused': 'highlighted',
    };
    const exClass = getExclusiveState[classes];
    if (collection.size > 0) {
      collection.forEach(entry => {
        // check if entry is a single node or collection.
        if (entry.length > 1) {
          entry.forEach(i => {
            this.removeItemFormCollection(i, classes);
          });
          collection.delete(entry);
        } else {
          this.removeItemFormCollection(entry, classes);
          const hasOtherClass = entry.filter(function (ele) {
            return ele.hasClass(exClass);
          });
          if (hasOtherClass.length === 0) {
            collection.delete(entry);
          }
        }
      });
    }
  }

  /**
   * Focus Cytoscape Elements
   * - https://js.cytoscape.org/#eles.select
   *
   * @param target The target element from the graph
   * @param action The
   * @param graphCollections highlight or select
   */
  private focusElement(target: Element, action: string, graphCollections: Collection ): void {
    const highlighted = graphCollections.highlighted;
    const selectedNeighbor = graphCollections.selectedNeighbor;
    const selectedNode = graphCollections.selectedNode;
    const neighborhood = target.neighborhood();
    // clear style
    this.removeCollectionClass(highlighted, 'highlighted');
    this.removeCollectionClass(selectedNeighbor, 'highlighted');
    this.removeCollectionClass(selectedNode, 'highlighted');

    if (target) {
      if (action === 'select' || action === 'center') {
        this.removeCollectionClass(selectedNode, 'focused');
        this.addClassToCollection(selectedNode, target, 'focused');
        this.addClassToCollection(selectedNeighbor, neighborhood, 'highlighted');
        neighborhood.select();
      } else {
        this.addClassToCollection(highlighted, neighborhood, 'highlighted');
        this.addClassToCollection(highlighted, target, 'highlighted');
      }
    }
  }

  private clearNodeStyle(): void {
    if (this.graphCollections.selectedNeighbor.size > 0) {
      this.graphCollections.selectedNeighbor.forEach((item: any) => {
        item.unselect();
      });
      this.removeCollectionClass(this.graphCollections.selectedNeighbor, 'highlighted');
      this.removeCollectionClass(this.graphCollections.selectedNeighbor, 'focused');
    }
    if (this.graphCollections.highlighted.size > 0) {
      this.removeCollectionClass(this.graphCollections.highlighted, 'highlighted');
    }
    if (this.graphCollections.selectedNode.size > 0) {
      this.graphCollections.selectedNode.forEach((item: any) => {
        item.unselect();
      });
      this.removeCollectionClass(this.graphCollections.selectedNode, 'focused');
    }
  }

  /**
   *  Clear node style
   *  Clear sidePanel selected node
   * @private
   */
  private clearNodeAndSelectAction() {
    this.clearNodeStyle();
    this.ovis.emitSelectAction({action: SidePanelAction.CLASS_SELECT, nodeId: ''});
  }

  /**
   * Sets the Chart User Event Bindings. The method gets called when cy.ready occurs
   *
   * Information about different event types:
   * - https://js.cytoscape.org/#cy.ready
   * - https://js.cytoscape.org/#events/user-input-device-events
   * - https://js.cytoscape.org/#events/event-object
   *
   * @returns ReadyEvent Function
   */
  private setChartBindings() {
    const self = this;
    return (readyEvent) => {
      const chart = readyEvent.cy;
      chart.unbind('click');
      chart.bind('mouseover', 'node', function (event: { target: any }) {
        self.focusElement(event.target, 'highlight', self.graphCollections);
      });
      chart.bind('mouseout', 'node', function (event) {
        clearTimeout(self.debounceTimeId);
        self.removeCollectionClass(self.graphCollections.selectedNode, 'highlighted');
        self.removeCollectionClass(self.graphCollections.highlighted, 'highlighted');
      });
      // bind tap to edges and add the highlighted class to connected nodes
      chart.bind('tap', 'edge', function (event: { target: any }) {
        const target = event.target;
        // clear style
        self.removeCollectionClass(self.graphCollections.highlighted, 'highlighted');
        self.removeCollectionClass(self.graphCollections.selectedNeighbor, 'highlighted');
        if (target.hasClass('ranges')) {
          //add Style
          self.addClassToCollection(self.graphCollections.selectedNeighbor, target.edges(), 'highlighted');
          self.addClassToCollection(self.graphCollections.highlighted, target.connectedNodes(), 'highlighted');
        }
      });
      chart.on('tap', function (event: { target: any }) {
        if (self.graphCollections.selectedNeighbor.size > 0 || self.graphCollections.selectedNode.size > 0) {
          self.clearNodeAndSelectAction();
        }
      });
      chart.on('click', 'node', function (event: { target: any }) {
        clearTimeout(self.debounceTimeId);
        self.debounceTimeId = setTimeout(function () {
          self.focusElement(event.target, 'select', self.graphCollections);
          self.ovis.emitSelectAction({action: SidePanelAction.CLASS_SELECT, nodeId: event.target.id()});
        }, 100);
      });
    };
  }

  /**
   * Create Layout Object
   *
   * - https://js.cytoscape.org/#layouts/preset
   *
   * @param layoutName
   * @returns Layout Options Object
   */
  private createLayoutOptions(layoutName: string) {
    const self = this;
    return {
      name: layoutName,
      animate: false,
      fit: true,
      randomize: false,
      infinite: true,
      linkId: function id(d) { // https://github.com/d3/d3-force#link_id
        return d.id;
      },
      ready: function () {
      },
      stop: function () {
        self.status.loaded = true;
        self.spinnerSrv.finishLoadingForComponent(self.ontoVis);
      },
      tick: function () {
      }
    };
  }
}
