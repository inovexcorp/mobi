/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { GraphState, StateEdge, StateNode } from '../classes';
import { forkJoin, Observable, of, Subscriber } from 'rxjs';
import { ChildIrisI, EntityInfoI, OntologyGraphData, ParentMapI, RangesI} from '../interfaces/visualization.interfaces';
import { cloneDeep, forEach } from 'lodash';

import { catchError, map } from 'rxjs/operators';
import { HierarchyResponse} from '../../shared/models/hierarchyResponse.interface';
import { PropertyToRanges } from '../../shared/models/propertyToRanges.interface';
import { EntityNames} from '../../shared/models/entityNames.interface';
import { IriList } from '../../shared/models/iriList.interface';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { Hierarchy} from '../../shared/models/hierarchy.interface';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { OntologyManagerService } from '../../shared/services/ontologyManager.service';
import { ControlRecordI } from '../classes/controlRecords';
import { getBeautifulIRI, handleError } from '../../shared/utility';

/**
 * @class ontology-visualization.OntologyVisualizationDataService
 * 
 * The graph is generated by the data retrieved from {@link shared.OntologyStateService}
 * and {@link shared.OntologyManagerService}
 */
@Injectable()
export class OntologyVisualizationDataService {
    readonly NO_CLASS_MESSAGE: string = 'No classes defined';

    constructor(private os: OntologyStateService,
                private spinnerSrv: ProgressSpinnerService,
                private om: OntologyManagerService) {
    }
    /**
     * getOntologyNetworkObservable
     * TODO figure out targeted spinnner 
     * ForkJoin Does 4 backend requests
     * - getClassHierarchies - Retrieves an object with the hierarchy of classes in the ontology organized
     *     by the subClassOf property and with an index of each IRI and its parent IRIs.
     *     {iris: ['classId1'] parentMap: {'parentClassId': ['classId1', 'classId2']}  }
     *     Note: * Does not contain class ClassHierarchies for imported ontolgies *
     *  - getPropertyToRange - retrieves an object with keys corresponding to Ontology Object Properties and ranges
     *    { propertyToRanges: { 'propertyId': ['classId1'] } }
     *  - getOntologyEntityNames - retrieves an object with entity info
     *     { 'classId1': {label: 'atto', names: ['atto']}
     *      Note: ** Includes imported entity info **
     *  - getImportedIris - retrieves an array of objects with IRIs for various entity types for each imported ontology of the identified ontology.
     *   [ {importData}, {importData}]
     *   Note: ** This does not contain the hierarchy for import data **
     *   importData[] = annotationProperties,
     * @returns Observable of with map of data
     */
    getOntologyNetworkObservable(): Observable<any>{
        return this.spinnerSrv.track(forkJoin({
                classHierarchies: this.om.getClassHierarchies(this.os.listItem.versionedRdfRecord.recordId,
                    this.os.listItem.versionedRdfRecord.branchId,
                    this.os.listItem.versionedRdfRecord.commitId,
                    false),
                propertyToRange: this.om.getPropertyToRange(this.os.listItem.versionedRdfRecord.recordId,
                    this.os.listItem.versionedRdfRecord.branchId,
                    this.os.listItem.versionedRdfRecord.commitId,
                    false),
                ontologyEntityNames: this.om.getOntologyEntityNames(this.os.listItem.versionedRdfRecord.recordId,
                    this.os.listItem.versionedRdfRecord.branchId,
                    this.os.listItem.versionedRdfRecord.commitId,
                    true,
                    false),
                importedIris: this.om.getImportedIris(this.os.listItem.versionedRdfRecord.recordId,
                    this.os.listItem.versionedRdfRecord.branchId,
                    this.os.listItem.versionedRdfRecord.commitId,
                    false)
            }
        ).pipe(
            catchError(error => { throw 'Network Issue in Source. Details: ' + error; } ),
            map((networkData: {
                classHierarchies: HierarchyResponse;
                propertyToRange: PropertyToRanges;
                ontologyEntityNames: EntityNames;
                importedIris: IriList[];
            }): { classParentMap: any, childIris: any, entityInfo: any, ranges: any } => {
                const classHierarchy: HierarchyResponse = networkData.classHierarchies;
                const propertyRanges: {[key: string]: string[]} = networkData.propertyToRange.propertyToRanges;
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
                // TODO this.os.listItem.classToChildProperties not coming from network
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
     * Get ontology data from os.listitem
     * TODO figure out targeted spinner
     * @returns Observable
     */
    getOntologyLocalObservable(): Observable<any>{
        return  this.spinnerSrv.track(forkJoin(
            [this.om.getPropertyToRange(this.os.listItem.versionedRdfRecord.recordId,
                this.os.listItem.versionedRdfRecord.branchId,
                this.os.listItem.versionedRdfRecord.commitId,
                false)]
        ).pipe(
            catchError(error => of(error)),
            map((networkData):any => {
                const propertyRanges: {[key: string]: string[]} = networkData[0].propertyToRanges;
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

                return  {
                    classParentMap: cloneDeep(classParentMap),
                    childIris: cloneDeep(classIris),
                    entityInfo: cloneDeep(entityInfo),
                    ranges: cloneDeep(ranges)
                };
            })
        )).pipe(catchError(handleError));
    }
    /**
     * Build Graph Data for Ontology.
     * Responsible for building { @link StateNode } and { @link StateLink } objects used for cytoscape chart.
     *
     * Only the domains and ranges set directly on the property definitions are taken into account
     * If an object property has more than one domain, it should be shown originating from each class
     * If an object property has more than one range, it should be shown ending at each class
     *
     * https://www.learnrxjs.io/learn-rxjs/operators/conditional/iif
     * @param commitGraphState commit graph state
     * @param hasInProgressCommit boolean whether there is an in progress commit
     * @return Promise
     */
    buildGraphData(commitGraphState: GraphState, hasInProgressCommit: boolean): Observable<GraphState>{
        return new Observable((observer: Subscriber<GraphState>) => {
            // Data has already been initialized previously
            if (commitGraphState.allGraphNodes.length > 0) {
                return observer.next(commitGraphState);
            }
            if (hasInProgressCommit) {
                this.getOntologyNetworkObservable().subscribe( (ontologyData: OntologyGraphData) => {
                    return this.graphDataFormat(ontologyData, commitGraphState, observer);
                });
            } else {
                this.getOntologyLocalObservable().subscribe( (ontologyData:OntologyGraphData) => {
                    return this.graphDataFormat(ontologyData, commitGraphState, observer);
                });
            }
        });
    }

    graphDataFormat(ontologyData:OntologyGraphData, commitGraphState: GraphState, observer) {
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
     * It defines a new StateNode with data for the network visualization.
     * it returns the data values used to create a Node
     * @param { object} nodeInfo contains information about the current node
     * @param { string } classIri The class unique Identifier. Class IRI
     * @param { any } ontologiesClassMap Map of color for ontologies
     * @returns Returns a new StateNode Object with attributes
     */
    private buildStateNode(nodeInfo: any, classIri: string): StateNode {
        if (!nodeInfo) {
            throw new Error('buildStateNode - nodeInfo is null. IRI: ' + classIri);
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
     * Get Property Label
     * @param commitGraphState graph state
     * @param propertyIri property iri
     * @param entityInfo entityInfo
     * @returns Property Label
     */
    public getPropertyLabel = (propertyIri:string, entityInfo: EntityInfoI, hasInProgressCommit:boolean) => {
        const getLabel = (entities, iri) => Object.prototype.hasOwnProperty.call(entities, iri) ? entities[iri].label : '';
        let lbl = '';
        if (!hasInProgressCommit) {
            lbl = getLabel(this.os.listItem.entityInfo, propertyIri);
        } else {
            lbl = getLabel(entityInfo, propertyIri);
        }
        if (!lbl) {
            lbl = getBeautifulIRI(propertyIri);
        }
        return lbl;
    }

    /**
     * It defines a new Object with data for the network visualization.
     * it returns the data values used to create an edge/link.
     * @param linkInfo contains information about the Link/Edge {label: string, names: [], imported?: boolean, ontologyId?: string}
     * @param source The source node Id
     * @param target The target node Id
     * @param linkId A unique name for the link
     * @param group The group name that defines this element `edges`
     * @param propertyInfo Information needed to create a property range.
     * @returns New StateLink Object with information needed to create a new link.
     */
    private buildStateEdge(linkInfo: any, source: string, target: string, linkId: string, propertyInfo = null): StateEdge {
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
        throw Error('buildStateLink method is missing data: ' + linkInfo);
    }
    public buildGraph(classParentMap:ParentMapI,
                      childIris:ChildIrisI,
                      entityInfo: EntityInfoI,
                      ranges: Array<any>= [],
                      hasInProgressCommit: boolean) {
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
        forEach(classParentMap, function(childrenIris, parentIri) {
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

        forEach(childIris, function(ontologyId, parentIri) {
            const nodeEntityInfo = entityInfo[parentIri];
            pushNode(self.buildStateNode(nodeEntityInfo, parentIri));
        } );

        // create range edges
        if (ranges && ranges.length > 0) {
            ranges.forEach((item:Array<RangesI>= [])=> {
                    item.forEach((property:RangesI) => {
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
        return { allGraphNodes , allEdges };
    }

    /**
     * Build a new array with Properties, domains and its ranges.
     * @param { object } classToChildProperties
     * @param { object } dataProperty An Object with dataProperties
     * @param { object } propertyToRanges An Object with properties and Ranges
     * @returns Array<RangesI>[] returns an array with objects properties, domains and ranges.
     */
     getPropertyRange(classToChildProperties: any, dataProperty: any, propertyToRanges: any): Array<RangesI>[] {
        if (!classToChildProperties) {
            return [];
        }
        const ranges = [];
        const dataIris = dataProperty.iris || {};
        const keys = Object.keys(classToChildProperties);

        for (const item of keys) {
            const properties = classToChildProperties[item].filter(index => !dataIris[index]);
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
