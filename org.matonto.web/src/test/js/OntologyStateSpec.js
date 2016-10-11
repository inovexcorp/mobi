/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Ontology State service', function() {
    var ontologyStateSvc;
    var ontologyManagerSvc;
    var updateRefsSvc;
    var hierarchy;
    var indexObject;
    var expectedPaths;

    beforeEach(function() {
        module('ontologyState');
        mockOntologyManager();
        mockUpdateRefs();

        inject(function(ontologyStateService, _updateRefsService_, _ontologyManagerService_) {
            ontologyStateSvc = ontologyStateService;
            updateRefsSvc = _updateRefsService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        /*
            node1a
                node2a
                    node3a
                    node3c
                node2b
                    node3a
                node2c
                    node3b
                        node3a
            node1b
                node3b
                    node3a
        */
        hierarchy = [{
            entityIRI: 'node1a',
            subEntities: [{
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                },
                {
                    entityIRI: 'node3c'
                }]
            },
            {
                entityIRI: 'node2b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            },
            {
                entityIRI: 'node2c',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            }]
        },
        {
            entityIRI: 'node1b',
            subEntities: [{
                entityIRI: 'node3b',
                subEntities: [{
                    entityIRI: 'node3a'
                }]
            }]
        }];
        indexObject = {
            'node2a': ['node1a'],
            'node2b': ['node1a'],
            'node2c': ['node1a'],
            'node3a': ['node2a', 'node2b', 'node3b'],
            'node3b': ['node2c', 'node1b'],
            'node3c': ['node2a']
        };
        expectedPaths = [
            ['node1a','node2a','node3a'],
            ['node1a','node2b','node3a'],
            ['node1a','node2c','node3b','node3a'],
            ['node1b','node3b','node3a']
        ];
    });
    it('setOpened sets the correct property on the state object', function() {
        var path = 'this.is.the.path';
        ontologyStateSvc.setOpened(path, true);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.isOpened')).toBe(true);

        ontologyStateSvc.setOpened(path, false);
        expect(_.get(ontologyStateSvc.state, encodeURIComponent(path) + '.isOpened')).toBe(false);
    });
    describe('getOpened gets the correct property value on the state object', function() {
        it('when path is not found, returns false', function() {
            var path = 'this.is.the.path';
            expect(ontologyStateSvc.getOpened(path)).toBe(false);
        });
        it('when path is found', function() {
            var path = 'this.is.the.path';
            _.forEach([true, false], value => {
                _.set(ontologyStateSvc.state, encodeURIComponent(path) + '.isOpened', value);
                expect(ontologyStateSvc.getOpened(path)).toBe(value);
            });
        });
    });
    describe('openAt', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem = {ontologyId: 'id'};
        });
        it('if already opened, does not set anything', function() {
            var pathsArray = [['path', 'one', 'here'], ['path', 'two', 'here']];
            ontologyStateSvc.state[ontologyStateSvc.listItem.ontologyId] = {
                isOpened: true,
                path: {
                    isOpened: true,
                    two: {
                        isOpened: true
                    }
                }
            };
            ontologyStateSvc.openAt(pathsArray);
            expect(_.get(ontologyStateSvc.state, encodeURIComponent(ontologyStateSvc.listItem.ontologyId) + '.'
                + encodeURIComponent(_.join(_.slice(pathsArray[0], 0, pathsArray[0].length - 1), '.')) + '.isOpened'))
                .toBe(undefined);
        });
        it('if the whole path to it is not opened, sets the first path provided open', function() {
            var pathsArray = [['path', 'one', 'here'], ['path', 'two', 'here']];
            ontologyStateSvc.state[ontologyStateSvc.listItem.ontologyId] = {
                isOpened: true,
                path: {
                    isOpened: false,
                    two: {
                        isOpened: true
                    }
                }
            };
            ontologyStateSvc.openAt(pathsArray);
            expect(_.get(ontologyStateSvc.state, encodeURIComponent(ontologyStateSvc.listItem.ontologyId) + '.'
                + encodeURIComponent(_.join(_.slice(pathsArray[0], 0, pathsArray[0].length - 1), '.')) + '.isOpened'))
                .toBe(true);
        });
        it('if not already opened, sets the first path provided open', function() {
            var pathsArray = [['path', 'one', 'here'], ['path', 'two', 'here']];
            delete ontologyStateSvc.state[ontologyStateSvc.listItem.ontologyId];
            ontologyStateSvc.openAt(pathsArray);
            expect(_.get(ontologyStateSvc.state, encodeURIComponent(ontologyStateSvc.listItem.ontologyId) + '.'
                + encodeURIComponent(_.join(_.slice(pathsArray[0], 0, pathsArray[0].length - 1), '.')) + '.isOpened'))
                .toBe(true);
        });
    });
    describe('getPathsTo', function() {
        it('should return all paths to provided node', function() {
            var result = ontologyStateSvc.getPathsTo(indexObject, 'node3a');
            expect(result.length).toBe(4);
            expect(_.sortBy(result)).toEqual(_.sortBy(expectedPaths));
        });
    });
    describe('deleteEntityFromHierarchy', function() {
        it('should delete the entity from the hierarchy tree', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(hierarchy, 'node3a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b'
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        /*it('should move the subEntities if required', function() {
            ontologyStateSvc.deleteEntityFromHierarchy(hierarchy, 'node2a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                },
                {
                    entityIRI: 'node3c'
                }]
            }]);
            expect(updateRefsSvc.remove).toHaveBeenCalledWith(indexObject, 'node2a');
            expect(indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c'],
                'node3c': ['node2a']
            });
        });*/
    });
    describe('addEntityToHierarchy', function() {
        describe('should add the entity to the single proper location in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node1a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'new-node'
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node1a']
                });
            });
            it('where the parent does not have subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3c');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3c']
                });
            });
        });
        describe('should add the entity to the multiple proper locations in the tree', function() {
            it('where the parent entity has subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3b');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            },
                            {
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'new-node'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3b']
                });
            });
            it('where the parent does not have subEntities', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'new-node', indexObject, 'node3a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a',
                                subEntities: [{
                                    entityIRI: 'new-node'
                                }]
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a',
                            subEntities: [{
                                entityIRI: 'new-node'
                            }]
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'new-node': ['node3a']
                });
            });
        });
        describe('should add the same hierarchy structure to the new area', function() {
            it('when not at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'node2b', indexObject, 'node1b');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                },
                {
                    entityIRI: 'node1b',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a','node1b'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a']
                });
            });
            it('when at the root level', function() {
                ontologyStateSvc.addEntityToHierarchy(hierarchy, 'node1b', indexObject, 'node1a');
                expect(hierarchy).toEqual([{
                    entityIRI: 'node1a',
                    subEntities: [{
                        entityIRI: 'node2a',
                        subEntities: [{
                            entityIRI: 'node3a'
                        },
                        {
                            entityIRI: 'node3c'
                        }]
                    },
                    {
                        entityIRI: 'node2b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    },
                    {
                        entityIRI: 'node2c',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    },
                    {
                        entityIRI: 'node1b',
                        subEntities: [{
                            entityIRI: 'node3b',
                            subEntities: [{
                                entityIRI: 'node3a'
                            }]
                        }]
                    }]
                }]);
                expect(indexObject).toEqual({
                    'node2a': ['node1a'],
                    'node2b': ['node1a'],
                    'node2c': ['node1a'],
                    'node3a': ['node2a', 'node2b', 'node3b'],
                    'node3b': ['node2c', 'node1b'],
                    'node3c': ['node2a'],
                    'node1b': ['node1a']
                });
            });
        });
    });
    describe('deleteEntityFromParentInHierarchy', function() {
        it('should remove the provided entityIRI from the parentIRI', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(hierarchy, 'node3a', 'node3b', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2a',
                    subEntities: [{
                        entityIRI: 'node3a'
                    },
                    {
                        entityIRI: 'node3c'
                    }]
                },
                {
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b'
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2a': ['node1a'],
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
        it('should add any subEntities that are unique to this location', function() {
            ontologyStateSvc.deleteEntityFromParentInHierarchy(hierarchy, 'node2a', 'node1a', indexObject);
            expect(hierarchy).toEqual([{
                entityIRI: 'node1a',
                subEntities: [{
                    entityIRI: 'node2b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                },
                {
                    entityIRI: 'node2c',
                    subEntities: [{
                        entityIRI: 'node3b',
                        subEntities: [{
                            entityIRI: 'node3a'
                        }]
                    }]
                }]
            },
            {
                entityIRI: 'node1b',
                subEntities: [{
                    entityIRI: 'node3b',
                    subEntities: [{
                        entityIRI: 'node3a'
                    }]
                }]
            },
            {
                entityIRI: 'node2a',
                subEntities: [{
                    entityIRI: 'node3a'
                },
                {
                    entityIRI: 'node3c'
                }]
            }]);
            expect(indexObject).toEqual({
                'node2b': ['node1a'],
                'node2c': ['node1a'],
                'node3a': ['node2a', 'node2b', 'node3b'],
                'node3b': ['node2c', 'node1b'],
                'node3c': ['node2a']
            });
        });
    });
    describe('goTo calls the proper manager functions with correct parameters', function() {
        beforeEach(function() {
            spyOn(ontologyStateSvc, 'getActivePage').and.returnValue({entityIRI: ''});
            spyOn(ontologyStateSvc, 'setActivePage');
            spyOn(ontologyStateSvc, 'selectItem');
            spyOn(ontologyStateSvc, 'getPathsTo');
            spyOn(ontologyStateSvc, 'openAt');
            ontologyStateSvc.listItem = {
                classIndex: 'classIndex',
                conceptIndex: 'conceptIndex',
                dataPropertyIndex: 'dataPropertyIndex',
                objectPropertyIndex: 'objectPropertyIndex'
            }
        });
        it('when it is a vocabulary', function() {
            ontologyStateSvc.listItem = {type: 'vocabulary'};
            ontologyStateSvc.goTo('iri');
            expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('concepts');
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
            expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.conceptIndex, 'iri');
            expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.conceptIndex, 'iri'));
        });
        describe('when it is not a vocabulary', function() {
            beforeEach(function() {
                ontologyStateSvc.listItem = {type: 'ontology'};
            });
            it('and is a class', function() {
                ontologyManagerSvc.isClass.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('classes');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.classIndex, 'iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.classIndex, 'iri'));
            });
            it('and is a datatype property', function() {
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.dataPropertyIndex, 'iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.dataPropertyIndex, 'iri'));
                expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.state.ontologyId, true);
            });
            it('and is a object property', function() {
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('properties');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).toHaveBeenCalledWith(ontologyStateSvc.listItem.objectPropertyIndex, 'iri');
                expect(ontologyStateSvc.openAt).toHaveBeenCalledWith(ontologyStateSvc.getPathsTo(ontologyStateSvc.listItem.objectPropertyIndex, 'iri'));
                expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.state.ontologyId, true);
            });
            it('and is an individual', function() {
                ontologyManagerSvc.isClass.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isIndividual.and.returnValue(true);
                ontologyStateSvc.goTo('iri');
                expect(ontologyStateSvc.setActivePage).toHaveBeenCalledWith('individuals');
                expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith('iri');
                expect(ontologyStateSvc.getPathsTo).not.toHaveBeenCalled();
                expect(ontologyStateSvc.openAt).not.toHaveBeenCalled();
            });
        });
    });
});