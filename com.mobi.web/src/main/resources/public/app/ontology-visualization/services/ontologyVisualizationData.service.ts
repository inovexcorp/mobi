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
import { Injectable } from '@angular/core';

import { catchError, map } from 'rxjs/operators';
import { cloneDeep, forEach } from 'lodash';
import { forkJoin, Observable, of, Subscriber } from 'rxjs';

import {
  ChildIrisI,
  EntityInfoI,
  EntityItemI,
  OntologyGraphData,
  ParentMapI,
  RangesI
} from '../interfaces/visualization.interfaces';
import { ControlRecordI } from '../classes/controlRecords';
import { EntityNames } from '../../shared/models/entityNames.interface';
import { getBeautifulIRI, handleError } from '../../shared/utility';
import { GraphState, StateEdge, StateNode } from '../classes';
import { Hierarchy } from '../../shared/models/hierarchy.interface';
import { HierarchyResponse } from '../../shared/models/hierarchyResponse.interface';
import { IriList } from '../../shared/models/iriList.interface';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { OntologyManagerService } from '../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { PropertyToRanges } from '../../shared/models/propertyToRanges.interface';

/**
 * Service responsible for handling and processing ontology data for visualization purposes.
 * It provides methods to retrieve or process ontology network data, build graph structures,
 * and manage ontology entity information and relationships.
 */
@Injectable()
export class OntologyVisualizationDataService {
  readonly NO_CLASS_MESSAGE: string = 'No classes defined';

  constructor(private os: OntologyStateService,
              private spinnerSrv: ProgressSpinnerService,
              private om: OntologyManagerService) {
  }

  /**
   * Retrieves an observable that fetches and processes ontology network data including class hierarchies, property ranges,
   * ontology entity information, and imported IRIs. The data is processed into a structured format, and error handling is applied
   * during the network request.
   *
   * @return {Observable<{classParentMap: any, childIris: any, entityInfo: any, ranges: any}>}
   * Returns an observable emitting an object containing class hierarchies, child IRIs, ontology entity information,
   * and property ranges for ontology data.
   */
  getOntologyNetworkObservable(): Observable<OntologyData> {
    return this.spinnerSrv.track(forkJoin({
        classHierarchies: this.om.getClassHierarchies(this.os.listItem.versionedRdfRecord.recordId,
          this.os.listItem.versionedRdfRecord.branchId,
          this.os.listItem.versionedRdfRecord.commitId,
          true),
        propertyToRange: this.om.getPropertyToRange(this.os.listItem.versionedRdfRecord.recordId,
          this.os.listItem.versionedRdfRecord.branchId,
          this.os.listItem.versionedRdfRecord.commitId,
          true),
        ontologyEntityNames: this.om.getOntologyEntityNames(this.os.listItem.versionedRdfRecord.recordId,
          this.os.listItem.versionedRdfRecord.branchId,
          this.os.listItem.versionedRdfRecord.commitId,
          true,
          true),
        importedIris: this.om.getImportedIris(this.os.listItem.versionedRdfRecord.recordId,
          this.os.listItem.versionedRdfRecord.branchId,
          this.os.listItem.versionedRdfRecord.commitId,
          true)
      }
    ).pipe(
      catchError(error => {
        throw 'Network Issue in Source. Details: ' + error;
      }),
      map((networkData: {
        classHierarchies: HierarchyResponse;
        propertyToRange: PropertyToRanges;
        ontologyEntityNames: EntityNames;
        importedIris: IriList[];
      }): { classParentMap: ParentMapI, childIris: ChildIrisI, entityInfo: EntityInfoI, ranges: RangesI[][] } => {
        const classHierarchy: HierarchyResponse = networkData.classHierarchies;
        const propertyRanges: { [key: string]: string[] } = networkData.propertyToRange.propertyToRanges;
        const entityNames: EntityNames = networkData.ontologyEntityNames;
        const importedIris: IriList[] = networkData.importedIris;

        const listItem: OntologyListItem = new OntologyListItem();
        listItem.classes.parentMap = classHierarchy.parentMap;
        listItem.classes.childMap = classHierarchy.childMap;
        listItem.versionedRdfRecord = this.os.listItem.versionedRdfRecord;
        listItem.ontologyId = this.os.listItem.ontologyId;
        listItem.entityInfo = entityNames;

        if (importedIris && importedIris.length > 0) {
          importedIris.forEach(info => {
            const importedOntologyListItem = {
              id: info.id,
              ontologyId: info.id
            };
            listItem.importedOntologyIds.push(info.id);
            listItem.importedOntologies.push(importedOntologyListItem);
            if (info.classes && info.classes.length) {
              info.classes.forEach(iri => this.os.addToClassIRIs(listItem, iri, info.id));
            }
          });
        }
        classHierarchy.iris.forEach(iri => this.os.addToClassIRIs(listItem, iri, listItem.ontologyId));
        listItem.classes.flat = this.os.flattenHierarchy(listItem.classes, listItem);
        const ranges = this.getPropertyRange(this.os.listItem.classToChildProperties, this.os.listItem.dataProperties, propertyRanges);
        return {
          classParentMap: listItem.classes.parentMap,
          childIris: listItem.classes.iris,
          entityInfo: listItem.entityInfo,
          ranges: ranges
        };
      })
    )).pipe(catchError(handleError));
  }

  /**
   * Retrieves an observable stream containing ontology-related data, including class hierarchy,
   * property ranges, and entity information. This method processes network data and returns
   * relevant ontology details in a structured format.
   *
   * @return {Observable<any>} An observable that emits the processed ontology data or errors if encountered.
   */
  getOntologyLocalObservable(): Observable<OntologyData> {
    return this.spinnerSrv.track(forkJoin(
      [this.om.getPropertyToRange(this.os.listItem.versionedRdfRecord.recordId,
        this.os.listItem.versionedRdfRecord.branchId,
        this.os.listItem.versionedRdfRecord.commitId,
        false)]
    ).pipe(
      catchError(error => of(error)),
      map((networkData: PropertyToRanges): OntologyData => {
        const propertyRanges: { [key: string]: string[] } = networkData[0].propertyToRanges;
        const classesObject: Hierarchy = this.os.listItem && this.os.listItem.classes ? this.os.listItem.classes : {
          iris: {},
          parentMap: {},
          childMap: {},
          circularMap: {},
          flat: []
        };
        const classParentMap = classesObject.parentMap;
        const classIris = classesObject.iris;
        const entityInfo = this.os.listItem.entityInfo;
        const ranges = this.getPropertyRange(this.os.listItem.classToChildProperties, this.os.listItem.dataProperties, propertyRanges);

        return {
          classParentMap: cloneDeep(classParentMap),
          childIris: cloneDeep(classIris),
          entityInfo: cloneDeep(entityInfo),
          ranges: cloneDeep(ranges)
        };
      })
    )).pipe(catchError(handleError));
  }

  /**
   * Transforms and constructs graph data based on the provided input state and commit progress status.
   *
   * @param {GraphState} commitGraphState - The current state of the graph that requires transformation.
   * @param {boolean} hasInProgressCommit - A flag indicating whether there is an in-progress commit.
   * @return {Observable<GraphState>} An observable emitting the updated graph state once data processing is complete.
   */
  buildGraphData(commitGraphState: GraphState, hasInProgressCommit: boolean): Observable<GraphState> {
    return new Observable((observer: Subscriber<GraphState>) => {
      // Data has already been initialized previously
      if (commitGraphState.allGraphNodes.length > 0) {
        return observer.next(commitGraphState);
      }
      if (hasInProgressCommit) {
        this.getOntologyNetworkObservable().subscribe((ontologyData: OntologyGraphData) => {
          return this.graphDataFormat(ontologyData, commitGraphState, observer);
        });
      } else {
        this.getOntologyLocalObservable().subscribe((ontologyData: OntologyGraphData) => {
          return this.graphDataFormat(ontologyData, commitGraphState, observer);
        });
      }
    });
  }

  /**
   * Formats ontology graph data and updates the given graph state, notifying the observer of the updates.
   *
   * @param {OntologyGraphData} ontologyData - The ontology data including class-parent mappings, child IRIs, entity information, and ranges.
   * @param {GraphState} commitGraphState - The current graph state to be updated, including all graph nodes and edges.
   * @param {Subscriber<GraphState>} observer - The observer to notify with the updated graph state or an error if the process fails.
   *
   * @return {void} Returns nothing explicitly, but notifies the observer with the updated graph state or an error message.
   */
  graphDataFormat(ontologyData: OntologyGraphData, commitGraphState: GraphState, observer: Subscriber<GraphState>): void {
    const result = this.buildGraph(ontologyData.classParentMap,
      ontologyData.childIris,
      ontologyData.entityInfo,
      ontologyData.ranges,
      false);

    commitGraphState.allGraphNodes = result.allGraphNodes;
    commitGraphState.allGraphEdges = result.allEdges;

    let checkedCount = 0;
    commitGraphState.allGraphNodes.forEach(record => {
      if (checkedCount < commitGraphState.nodeLimit) {
        record.isChecked = true;
        record.onGraph = true;
        record.disabled = false;
      } else {
        record.disabled = true;
      }
      checkedCount += 1;
    });

    const uniqueOntologyIds = new Set();
    const importedOntologiesTemp = [];
    if (result.allGraphNodes.length > 0) {

      result.allGraphNodes.forEach(controlRecord => {
        if (controlRecord.isImported && !uniqueOntologyIds.has(controlRecord.ontologyId)) {
          importedOntologiesTemp.push({id: controlRecord.ontologyId, ontologyId: controlRecord.ontologyId});
          uniqueOntologyIds.add(controlRecord.ontologyId);
        }
      });

      commitGraphState.importedOntologies.forEach(v => {
        if (!uniqueOntologyIds.has(v.id)) {
          importedOntologiesTemp.push(v);
          uniqueOntologyIds.add(v.id);
        }
      });

      commitGraphState.importedOntologies = importedOntologiesTemp;
      commitGraphState.importedOntologies.sort((a, b) => {
        if (a.id < b.id) {
          return -1;
        }
        if (a.id > b.id) {
          return 1;
        }
        return 0;
      });
      return observer.next(commitGraphState);
    } else {
      return observer.error(this.NO_CLASS_MESSAGE);
    }
  }

  /**
   * Builds and returns a StateNode instance populated with the given information.
   *
   * @param {any} nodeInfo - The information object containing details to construct the StateNode. Must include label, ontologyId, and imported fields.
   * @param {string} classIri - The unique class IRI used to identify the StateNode.
   * @return {StateNode} The constructed StateNode instance with populated data fields.
   * @throws {Error} If nodeInfo is null or undefined.
   * @throws {Error} If classIri is null or undefined.
   */
  private buildStateNode(nodeInfo: EntityItemI, classIri: string): StateNode {
    if (!nodeInfo) {
      throw new Error(`buildStateNode - nodeInfo is null. IRI: ${classIri}`);
    }

    if (!classIri) {
      throw new Error('buildStateNode - classIri is null');
    }

    const node: StateNode = new StateNode();

    node.data = {
      id: classIri,
      idInt: classIri,
      weight: 0,
      name: nodeInfo.label,
      ontologyId: nodeInfo.ontologyId,
      isImported: nodeInfo.imported
    };
    return node;
  }

  /**
   * Returns the display label for a given property IRI. This method determines
   * the appropriate label by checking the provided entity information or falling
   * back to a beautified IRI if no label exists.
   *
   * @param {string} propertyIri - The Internationalized Resource Identifier (IRI) of the property for which to retrieve the label.
   * @param {EntityInfoI} entityInfo - The entity information object containing metadata about various entities.
   * @param {boolean} hasInProgressCommit - Indicates whether there is an ongoing commit process.
   * @returns {string} The display label corresponding to the provided property IRI. If a label cannot be found, a beautified version of the IRI is used as a fallback.
   */
  public getPropertyLabel = (propertyIri: string, entityInfo: EntityInfoI, hasInProgressCommit: boolean): string => {
    const getLabel = (entities: EntityNames, iri: string) => Object.prototype.hasOwnProperty.call(entities, iri) ? entities[iri].label : '';
    let lbl: string;
    if (!hasInProgressCommit) {
      lbl = getLabel(this.os.listItem.entityInfo, propertyIri);
    } else {
      lbl = getLabel(entityInfo, propertyIri);
    }
    if (!lbl) {
      lbl = getBeautifulIRI(propertyIri);
    }
    return lbl;
  };

  /**
   * Constructs and returns a StateEdge object based on the provided parameters.
   *
   * @param {any} linkInfo - Information about the link, including the ontologyId.
   * @param {string} source - The source node ID for the edge.
   * @param {string} target - The target node ID for the edge.
   * @param {string} linkId - The unique identifier for the edge.
   * @param {object|null} [propertyInfo=null] - Additional information about the edge, such as label and class.
   * @return {StateEdge} A StateEdge object populated with the specified data or throws an error if linkInfo is invalid.
   */
  private buildStateEdge(linkInfo: EntityItemI, source: string, target: string, linkId: string, propertyInfo = null): StateEdge {
    if (linkInfo && linkInfo.ontologyId) {
      const link = new StateEdge();

      link.data = {
        id: linkId,
        idInt: linkId,
        source: source,
        target: target,
        arrow: 'triangle',
        weight: 0,
        label: '',
        ontologyId: linkInfo.ontologyId,
      };
      if (propertyInfo) {
        if (source === target) {
          link.classes = `${propertyInfo.class} loop`;
          link.data.type = 'bezier';
          link.data.flipLabel = true;
        } else {
          link.data.type = 'bezier';
          link.classes = `${propertyInfo.class} bezier-radius`;
        }
        link.data.label = propertyInfo.label;
      }
      return link;
    }
    throw Error(`buildStateLink method is missing data: ${linkInfo}`);
  }

  /**
   * Builds a graph representation based on the given inputs including nodes, edges, and their relationships.
   *
   * @param {ParentMapI} classParentMap - A mapping of parent IRIs to their respective child IRIs.
   * @param {ChildIrisI} childIris - A mapping of child IRIs to the ontology they belong to.
   * @param {EntityInfoI} entityInfo - Information about entities (nodes) involved in the graph.
   * @param {Array<any>} [ranges=[]] - An optional array of ranges defining additional edges between nodes.
   * @param {boolean} hasInProgressCommit - A flag indicating if there is an in-progress commit to consider for property labels.
   * @return {{allGraphNodes: ControlRecordI[], allEdges: StateEdge[]}} An object containing `allGraphNodes` as an array of node control records and `allEdges` as an array of edges in the graph.
   */
  public buildGraph(classParentMap: ParentMapI,
                    childIris: ChildIrisI,
                    entityInfo: EntityInfoI,
                    ranges: RangesI[][] = [],
                    hasInProgressCommit: boolean): { allGraphNodes: ControlRecordI[]; allEdges: StateEdge[]; } {
    const self = this;
    const allNodeIds = new Set<string>();
    const allNodes: StateNode[] = [];
    const allEdges: StateEdge[] = [];

    const pushNode = (stateNode: StateNode): void => {
      const nodeId = stateNode.data.id;
      if (allNodeIds.has(nodeId)) {
        return;
      }

      allNodes.push(stateNode);
      allNodeIds.add(nodeId);
    };

    // iteration of classParentMap
    forEach(classParentMap, function (childrenIris, parentIri) {
      const parentEntityInfo = entityInfo[parentIri];
      const currentStateNode = self.buildStateNode(parentEntityInfo, parentIri);
      currentStateNode.data.subClassesCount = childrenIris.length;
      pushNode(currentStateNode);
      for (const childIri of childrenIris) {
        const childEntityInfo = entityInfo[childIri];
        pushNode(self.buildStateNode(childEntityInfo, childIri));
        // StateEdge
        const edgeId = `${parentIri}<-subClass-${childIri}`;
        const edge = self.buildStateEdge(childEntityInfo, childIri, parentIri, edgeId);
        allEdges.push(edge);
      }
    });

    forEach(childIris, function (_ontologyId, parentIri) {
      const nodeEntityInfo = entityInfo[parentIri];
      pushNode(self.buildStateNode(nodeEntityInfo, parentIri));
    });

    // create range edges
    if (ranges && ranges.length > 0) {
      ranges.forEach((item: Array<RangesI> = []) => {
          item.forEach((property: RangesI) => {
            if (property && allNodeIds.has(property.domain) && allNodeIds.has(property.range)) {
              const edgeId = `${property.domain}-${property.property}-${property.range}`;
              const info = {
                label: self.getPropertyLabel(property.property, entityInfo, hasInProgressCommit),
                class: 'ranges'
              };
              const link = self.buildStateEdge(entityInfo[property.domain], property.domain, property.range, edgeId, info);
              if (link) {
                allEdges.push(link);
              }
            }
          });
        }
      );
    }
    // Object properties are displayed: As solid lines, Directed arrows from the domain to the range,
    //     With labels of the calculated names used in the other tabs
    // Post Process - Only this.nodeLimit is allowed
    const allGraphNodes: ControlRecordI[] = allNodes.map((node: StateNode) => node.asControlRecord(false));
    return {allGraphNodes, allEdges};
  }

  /**
   * Build a new array with Properties, domains, and its ranges.
   * @param { object } classToChildProperties
   * @param { object } dataProperty An Object with dataProperties
   * @param { object } propertyToRanges An Object with properties and Ranges
   * @returns Array<RangesI>[] returns an array with objects properties, domains, and ranges.
   */
  getPropertyRange(classToChildProperties: ParentMapI, dataProperty: Hierarchy, propertyToRanges: ParentMapI): Array<RangesI>[] {
    if (!classToChildProperties) {
      return [];
    }
    const ranges = [];
    const dataIris = dataProperty.iris || {};
    const keys = Object.keys(classToChildProperties);

    for (const item of keys) {
      const properties = classToChildProperties[item].filter((index: string | number) => !dataIris[index]);
      const propertyInfo: Array<RangesI> = [];

      if (!propertyToRanges) {
        throw new Error('propertyToRanges can not be null|undefined');
      }

      for (const element of properties) {
        const rangeList = propertyToRanges[element] || [];
        for (const iri of rangeList) {
          if (!iri) {
            continue;
          }
          const data = {
            range: iri,
            domain: item,
            property: element
          };
          propertyInfo.push(data);
        }
      }
      ranges.push(propertyInfo);
    }
    return ranges;
  }
}

interface OntologyData {
  classParentMap: ParentMapI;
  childIris: ChildIrisI;
  entityInfo: EntityInfoI;
  ranges: RangesI[][];
}
