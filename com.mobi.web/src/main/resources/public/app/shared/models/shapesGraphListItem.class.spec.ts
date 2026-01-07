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
import { NodeShapeSelection, ShapesGraphListItem } from './shapesGraphListItem.class';

describe('ShapesGraphListItem', () => {
  let item: ShapesGraphListItem;

  beforeEach(() => {
    item = new ShapesGraphListItem();
  });

  it('should create an instance with default values', () => {
    expect(item).toBeTruthy();
    expect(item.shapesGraphId).toBe('');
    expect(item.changesPageOpen).toBeFalse();
    expect(item.currentVersionTitle).toBe('');
    expect(item.metadata).toBeUndefined();
    expect(item.content).toBe('');
    expect(item.previewFormat).toBe('turtle');
    expect(item.tabIndex).toBe(ShapesGraphListItem.PROJECT_TAB_IDX);
    expect(item.editorTabStates).toEqual({
      project: { entityIRI: '' },
      nodeShapes: { sourceIRI: '', nodes: [] }
    });
    expect(item.subjectImportMap).toEqual({});
  });
  it('should have correct static tab constants', () => {
    expect(ShapesGraphListItem.PROJECT_TAB).toBe('project');
    expect(ShapesGraphListItem.PROJECT_TAB_IDX).toBe(0);
    expect(ShapesGraphListItem.NODE_SHAPES_TAB).toBe('nodeShapes');
    expect(ShapesGraphListItem.NODE_SHAPES_TAB_IDX).toBe(1);
  });
  describe('selectedNodeShapeIri$', () => {
    it('should be null initially', () => {
      item.selectedNodeShapeIri$.subscribe((nodeShapeSelection: NodeShapeSelection) => {
        expect(nodeShapeSelection).toBeNull();
      }).unsubscribe();
    });
    it('should emit NodeShapeSelection when setSelectedNodeShapeIri is called', async () => {
      item.setSelectedNodeShapeIri('http://example.com/nodeShape', true);

      const iri = 'http://example.com/nodeShape';
      const shouldScroll = true;
      item.selectedNodeShapeIri$.subscribe((nodeShapeSelection: NodeShapeSelection) => {
        expect(nodeShapeSelection).toEqual({ iri, shouldScroll });
      }).unsubscribe();
    });
    it('should default shouldScroll to false if not provided', async () => {
      item.setSelectedNodeShapeIri('http://example.com/nodeShape2');

      const iri = 'http://example.com/nodeShape2';
      const shouldScroll = false;
      item.selectedNodeShapeIri$.subscribe((nodeShapeSelection: NodeShapeSelection) => {
        expect(nodeShapeSelection).toEqual({ iri, shouldScroll });
      }).unsubscribe();
    });
  });
  describe('selectedNodeShapeIri getter', () => {
    it('should return empty string when no selection', () => {
      expect(item.selectedNodeShapeIri).toBe('');
    });
    it('should return current selected IRI', () => {
      const iri = 'http://example.com/currentNode';
      item.setSelectedNodeShapeIri(iri);
      expect(item.selectedNodeShapeIri).toBe(iri);
    });
  });
});
