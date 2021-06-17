/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
import * as chroma from 'chroma-js';
const colors = chroma.cubehelix()
    .start(200)
    .rotations(-0.35)
    .gamma(0.7)
    .lightness([0.3, 0.8])
    .scale() // convert to chroma.scale
    .correctLightness()
    .colors(6);

const highlighted = chroma('orange').alpha(0.5).hex('rgb');
let primary = colors[0];
let secondary = colors[1];

const style = [{
    "selector": "core",
    "style": {
        "selection-box-color": `${chroma(primary).brighten(2)}`,
        "selection-box-border-color": "#8BB0D0",
        "selection-box-opacity": "0.333"
    }
}, {
    "selector": "node",
    "style": {
        "content": "data(name)",
        "width": "60",
        "height": "60",
        "font-size": "12px",
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        "background-color": `${primary}`,
        "color": `#fff`,
        "overlay-padding": "6px",
        "overlay-color": `#fff`,
        "z-index": "10",
        "text-max-width": "50",
        "min-zoomed-font-size": "8",
        "text-outline-color": `${primary}`,
        "text-outline-width": "1px"
    }
}, {
    "selector": "node[?attr]",
    "style": {
        "shape": "rectangle",
        "background-color": "#76CBA1",
        "text-outline-color": "#fff",
        "width": "16px",
        "height": "16px",
        "font-size": "6px",
        "z-index": "1"
    }
}, {
    "selector": "node[?query]",
    "style": {
        "background-clip": "none",
        "background-fit": "contain",
        "border-color": `${chroma(secondary).brighten(2)}`
    }
}, {
    "selector": "node:selected",
    "style": {
        "border-width": "6px",
        "border-color": `${primary}`,
        "background-color": `${highlighted}`,
        "text-outline-color": `${primary}`
    }
}, {
    "selector": "edge",
    "style": {
        "haystack-radius": "0",
        "opacity": "0.333",
        "line-color": "#5a5858",
        "width": "2",
        "overlay-padding": "3px",
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-style": "dashed",
        "line-dash-pattern": [6, 3]
    }
}, {
    "selector": "node.unhighlighted",
    "style": {
        "opacity": "0.2"
    }
}, {
    "selector": "edge.unhighlighted",
    "style": {
        "opacity": "0.05"
    }
}, {
    "selector": ".highlighted",
    "style": {
        "z-index": "999999"
    }
}, {
        "selector": "node.highlighted",
        "style": {
            "border-width": "6px",
            "border-color": `${highlighted}`,
            "text-outline-color": `${primary}`
        }
        },
    {
        "selector": "node.highlighted:selected",
        "style": {
            "border-width": "6px",
            "border-color": `${primary}`
        }
    },
    {
    "selector": "node.focused",
    "style": {
        "border-width": "6px",
        "border-color": `${highlighted}`,
        "background-color": `${primary}`,
        "text-outline-color": `${primary}`
    }
},
    {
        "selector": "node.faded",
        "style": {
            "opacity": "0.06"
        }
    },
    {
    "selector": "edge.filtered",
    "style": {
        "opacity": "0"
    },
}];

export  { style };