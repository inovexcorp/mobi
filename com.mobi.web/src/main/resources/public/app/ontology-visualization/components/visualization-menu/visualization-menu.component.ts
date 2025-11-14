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
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';

import { Collection, Core } from 'cytoscape';

@Component({
  selector: 'visualization-menu',
  templateUrl: './visualization-menu.component.html',
  styleUrls: ['./visualization-menu.component.scss']
})
export class VisualizationMenuComponent implements OnInit, OnChanges {
  @Input() cyChart: Core;
  @Input() initialZoom: number;
  zoomLevel = 0;
  lowerThanLimit = false;
  higherThanLimit = false;

  constructor() {
  }

  ngOnInit(): void {
    this.zoomLevel = this.initialZoom;
    this.calculateLimits();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // handle changes to cyChart and initialZoom inputs
    if (changes.cyChart || changes.initialZoom) {
      this.zoomLevel = this.initialZoom;
      this.calculateLimits();
    }
  }

  /**
   * Fits the graph within the available space.
   * Updates the zoom level and calculates the limits.
   *
   * @function fitGraph
   * @returns {void}
   */
  public fitGraph = (): void => {
    this.cyChart.fit();
    this.zoomLevel = this.cyChart.zoom();
    this.calculateLimits();
  };

  /**
   * Increases the zoom level by 0.1 and updates the chart accordingly.
   *
   * @function
   * @name zoomIn
   * @returns {void}
   */
  public zoomIn = (): void => {
    this.zoomLevel = this.zoomLevel + .10;
    const selectedNode = this.cyChart.elements('.focused');
    if (selectedNode.length === 0) {
      this.cyChart.zoom(this.zoomLevel);
    } else {
      this.cyChart.zoom({
        level: this.zoomLevel,
        position: selectedNode[0].position()
      });
    }
    this.calculateLimits();
  };

  /**
   * Decreases the zoom level by 0.1 and adjusts the chart accordingly.
   *
   * @function
   * @name zoomOut
   * @returns {void}
   */
  public zoomOut = (): void => {
    this.zoomLevel = this.zoomLevel - .10;
    const selectedNode: Collection = this.cyChart.elements('.focused');
    if (selectedNode.length === 0) {
      this.cyChart.zoom(this.zoomLevel);
    } else {
      this.cyChart.zoom({
        level: this.zoomLevel,
        position: selectedNode[0].position()
      });
    }

    this.calculateLimits();
  };

  /**
   * Handles the change of a slider and performs necessary calculations.
   *
   * @param {MatSliderChange} event The change event object containing the new slider value.
   * @returns {void}
   */
  calculateSlider = (event: MatSliderChange): void => {
    this.zoomLevel = event.value;
    const selectedNode = this.cyChart.elements('.focused');
    if (selectedNode.length === 0) {
      this.cyChart.zoom(this.zoomLevel);
    } else {
      this.cyChart.zoom({
        level: this.zoomLevel,
        position: selectedNode[0].position()
      });
    }
    this.calculateLimits();
  };

  /**
   * Calculates whether the lower and higher limits have been met based on the current zoom level.
   * @function calculateLimits
   * @returns {void}
   */
  calculateLimits = (): void => {
    this.lowerThanLimit = this.zoomLevel - .10 <= 0;
    this.higherThanLimit = this.zoomLevel + .10 >= 4;
  };
}
