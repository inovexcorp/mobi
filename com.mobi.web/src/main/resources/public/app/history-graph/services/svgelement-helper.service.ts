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
import { Injectable } from '@angular/core';

import { createText, createRect, createCircle, createClipPath, createUse, createDefs, createG, createPath  } from '@sourceflow/gitgraph-js/lib/svg-elements.js';
import { Branch as GitGraphBranch } from '@sourceflow/gitgraph-core/lib/branch';
import { Commit as GitGraphCommit } from '@sourceflow/gitgraph-core/lib/commit';
import { TagStyle } from '@sourceflow/gitgraph-core/lib/template';

const BRANCH_LABEL_PADDING_X = 10;
const BRANCH_LABEL_PADDING_Y = 4;

const TAG_LABEL_PADDING_X = 10;
const TAG_LABEL_PADDING_Y = 5;

const BRANCH_LABEL_Y_OFFSET = -10;
const SUBJECT_SVG_ELEMENT_OFFSET = 100;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const LINK_HEX_COLOR = '#3F51B5';

@Injectable({
  providedIn: 'root'
})
export class SVGElementHelperService {
  constructor() { }
  /**
   * Render Commit Dots
   * Reference: https://github.com/nicoespeon/gitgraph.js/blob/master/packages/gitgraph-js/src/gitgraph.ts#L500
   * @param commitSVGElement Gitgraph Commit<SVGElement> object
   * @param parentComponentId ID of parent component
   * @param commitDotClickable Commit Dot Clickable
   * @returns SVGElement
   */
  renderCommitDot(commitSVGElement: GitGraphCommit, parentComponentId: string, commitDotClickable: boolean): SVGElement {
    const circleId = `circle-${commitSVGElement.hash}-${parentComponentId}`;
    const circle: SVGCircleElement = createCircle({
      id: circleId,
      radius: commitSVGElement.style.dot.size,
      fill: commitSVGElement.style.dot.color || '',
    });
    if (commitDotClickable){
      circle.setAttribute('style', 'cursor: pointer');
    }
    const clipPathId = `clip-${commitSVGElement.hash}-${parentComponentId}`;
    const circleClipPath = createClipPath();
    circleClipPath.setAttribute('id', clipPathId);
    circleClipPath.appendChild(createUse(circleId));

    const useCirclePath = createUse(circleId);
    useCirclePath.setAttribute('clip-path', `url(#${clipPathId})`);
    useCirclePath.setAttribute('stroke', commitSVGElement.style.dot.strokeColor || '');
    const strokeWidth = commitSVGElement.style.dot.strokeWidth
      ? commitSVGElement.style.dot.strokeWidth * 2
      : 0;
    useCirclePath.setAttribute('stroke-width', strokeWidth.toString());

    const dotText = commitSVGElement.dotText
      ? createText({
          content: commitSVGElement.dotText,
          font: commitSVGElement.style.dot.font,
          anchor: 'middle',
          translate: { x: commitSVGElement.style.dot.size, y: commitSVGElement.style.dot.size },
        })
      : null;
    const commitDotContainer = createG({
      onClick: commitSVGElement.onClick,
      onMouseOver: () => {
        commitSVGElement.onMouseOver();
      },
      onMouseOut: () => {
        commitSVGElement.onMouseOut();
      },
      children: [
        createDefs([circle, circleClipPath]),
        useCirclePath,
        dotText
      ]
    });
    commitDotContainer.setAttribute('id', `circle-dot-${commitSVGElement.hash}-${parentComponentId}`);
    return commitDotContainer;
  }
  /**
   * Render Branch Label
   * @param gitGraphBranch Branch<SVGElement>
   * @param commit
   * @returns SVGElement
   */
  renderBranchLabel(gitGraphBranch: GitGraphBranch<SVGElement>, commit: GitGraphCommit): SVGElement {
    const rect = createRect({
        width: 0,
        height: 0,
        borderRadius: gitGraphBranch.style.label.borderRadius,
        stroke: gitGraphBranch.style.label.strokeColor || gitGraphBranch.computedColor,
        fill: gitGraphBranch.style.label.bgColor
    });
    const text = createText({
        content: commit.commitLabel || gitGraphBranch.name,
        translate: {
            x: BRANCH_LABEL_PADDING_X,
            y: 0
        },
        font: gitGraphBranch.style.label.font,
        fill: gitGraphBranch.style.label.color || gitGraphBranch.computedColor
    });
    const branchLabel: SVGGElement = document.createElementNS(SVG_NAMESPACE, 'g');
    branchLabel.setAttribute(
        'transform',
        `translate(0, ${BRANCH_LABEL_Y_OFFSET})`
    );
    branchLabel.appendChild(rect);
    const observer = new MutationObserver(() => {
        const { height, width } = text.getBBox();
        const boxWidth = width + 2 * BRANCH_LABEL_PADDING_X;
        const boxHeight = height + 2 * BRANCH_LABEL_PADDING_Y;
        // Ideally, it would be great to refactor these behavior into SVG elements.
        rect.setAttribute('width', `${boxWidth}`);
        rect.setAttribute('height', `${boxHeight}`);
        text.setAttribute('y', `${boxHeight / 2}`);
    });
    observer.observe(branchLabel, {
        attributes: false,
        subtree: false,
        childList: true
    });
    // Add text after observer is set up => react based on text size.
    branchLabel.appendChild(text);
    return branchLabel;
  }
  /**
   * Render Commit Message
   * Reference: https://github.com/nicoespeon/gitgraph.js/blob/master/packages/gitgraph-js/src/gitgraph.ts#L355
   * https://github.com/nicoespeon/gitgraph.js/blob/master/packages/gitgraph-js/src/svg-elements.ts#L110
   * @param commitSVGElement Commit<SVGElement>
   * @returns SVGElement
   */
  renderCommitMessage(commitSVGElement: GitGraphCommit, date: string): SVGElement {
    const gSvgElement: SVGGElement = document.createElementNS(SVG_NAMESPACE, 'g');
    gSvgElement.setAttribute('transform', 'translate(0, 5)');
    // Create Hash element
    const hashSvgElement: SVGTextElement = document.createElementNS(SVG_NAMESPACE, 'text');
    hashSvgElement.setAttribute('class', 'commit-hash-string');
    hashSvgElement.setAttribute('alignment-baseline', 'central');
    hashSvgElement.setAttribute('dominant-baseline', 'central');
    hashSvgElement.setAttribute('fill', LINK_HEX_COLOR);
    if (commitSVGElement.style?.message?.font) {
        hashSvgElement.setAttribute('style', `cursor: pointer; font: ${commitSVGElement.style.message.font}`);
    } else {
        hashSvgElement.setAttribute('style', 'cursor: pointer');
    }
    hashSvgElement.textContent = `${commitSVGElement.hash}`;
    
    if (commitSVGElement.onMessageClick) {
        hashSvgElement.addEventListener('click', commitSVGElement.onMessageClick);
    }
    gSvgElement.appendChild(hashSvgElement);
    // Create Subject element
    const subjectSvgElement: SVGTextElement = document.createElementNS(SVG_NAMESPACE, 'text');
    subjectSvgElement.setAttribute('class', 'commit-subject-string');
    subjectSvgElement.setAttribute('alignment-baseline', 'central');
    subjectSvgElement.setAttribute('dominant-baseline', 'central');
    subjectSvgElement.setAttribute('transform', `translate(${SUBJECT_SVG_ELEMENT_OFFSET}, 0)`);
    if (commitSVGElement.style?.message?.color) {
        subjectSvgElement.setAttribute('fill', commitSVGElement.style.message.color);
    }
    if (commitSVGElement.style?.message?.font) {
        subjectSvgElement.setAttribute('style', `font: ${commitSVGElement.style.message.font}`);
    }
    if (commitSVGElement.author?.email) {
        subjectSvgElement.textContent = `${date} - ${commitSVGElement.subject} - ${commitSVGElement.author.name} <${commitSVGElement.author.email}>`;
    } else {
        subjectSvgElement.textContent = `${date} - ${commitSVGElement.subject} - ${commitSVGElement.author.name}`;
    }
    gSvgElement.appendChild(subjectSvgElement);
    return gSvgElement;
  }
  /**
   * Create Tag 
   * Reference: https://github.com/alvarezr/gitgraph.js/blob/master/packages/gitgraph-js/lib/tag.js#L5
   * @param name Tag Title
   * @param style Tag Style
   * @returns SVGElement
   */
  createTag(name: string, style: TagStyle): SVGElement {
    const path = createPath({
        d: '',
        fill: style.bgColor,
        stroke: style.strokeColor,
    });
    const text = createText({
        content: name.length >= 10 ? name.substring(0, 10) + '...' : name,
        fill: style.color,
        font: style.font,
        translate: { x: 0, y: 0 },
    });
    // create title for element
    if (name.length >= 10) {
      const titleElement = document.createElementNS(SVG_NAMESPACE, 'title');
      titleElement.textContent = name;
      text.appendChild(titleElement);
    }
    const result = createG({ children: [path] });
    const offset = style.pointerWidth;
    const observer = new MutationObserver(function () {
        const _a = text.getBBox(), height = _a.height, width = _a.width;
        if (height === 0 || width === 0) {
          return;
        }
        const radius = style.borderRadius;
        const boxWidth = offset + width + 2 * TAG_LABEL_PADDING_X;
        const boxHeight = height + 2 * TAG_LABEL_PADDING_Y;
        const pathD = [
            'M 0,0',
            'L ' + offset + ',' + boxHeight / 2,
            'V ' + boxHeight / 2,
            'Q ' + offset + ',' + boxHeight / 2 + ' ' + (offset + radius) + ',' + boxHeight / 2,
            'H ' + (boxWidth - radius),
            'Q ' + boxWidth + ',' + boxHeight / 2 + ' ' + boxWidth + ',' + (boxHeight / 2 - radius),
            'V -' + (boxHeight / 2 - radius),
            'Q ' + boxWidth + ',-' + boxHeight / 2 + ' ' + (boxWidth - radius) + ',-' + boxHeight / 2,
            'H ' + (offset + radius),
            'Q ' + offset + ',-' + boxHeight / 2 + ' ' + offset + ',-' + boxHeight / 2,
            'V -' + boxHeight / 2,
            'z',
        ].join(' ');
        // Ideally, it would be great to refactor these behavior into SVG elements.
        path.setAttribute('d', pathD.toString());
        text.setAttribute('x', (offset + TAG_LABEL_PADDING_X).toString());
    });
    observer.observe(result, {
        attributes: false,
        subtree: false,
        childList: true,
    });
    // Add text after observer is set up => react based on text size.
    // We might refactor it by including `onChildrenUpdate()` to `createG()`.
    result.appendChild(text);
    return result;
  }
}
