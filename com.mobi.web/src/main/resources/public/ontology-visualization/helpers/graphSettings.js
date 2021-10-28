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

const highlighted = chroma('rgb(62, 189, 147)').alpha(0.5).hex('rgb');
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
        "border-color": `${highlighted}`,
        "text-outline-color": `${primary}`
    }
}, {
    "selector": "edge",
    "style": {
        "haystack-radius": "1",
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
    "selector": "edge.ranges",
    "style": {
        "opacity": "0.7",
        "width": "2",
        "overlay-padding": "3px",
        "target-arrow-shape": "triangle",
        "line-style": "solid",
        "text-background-padding": "2px",
        "text-background-opacity": 1,
        "color": `${primary}`,
        "text-background-color": "#fff",
        "text-background-shape": "roundrectangle",
        "text-border-color": "#fff",
        "text-border-width": 1,
        "text-border-opacity": 1,
        "text-rotation":'45'
    }
}, {
    "selector": "edge[label]",
    "style": {
      "label": "data(label)",
      "width": 3
    }
  }, {
    "selector": ".loop",
    "style": {
        "curve-style": "bezier",
        "control-point-step-size": 80,
        "line-color": "#5a5858",
        "loop-sweep": "-40deg"
    }
  },{
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
        "selector": ".highlighted",
        "style": {
            "border-width": "6px",
            "border-color": `${highlighted}`,
            "text-outline-color": `${primary}`,
            "border-opacity": "0.5",
        }
        },
    {
        "selector": "node.highlighted:selected",
        "style": {
            "border-width": "6px",
            "border-color": `${highlighted}`
        }
    },
    {
    "selector": "node.focused",
    "style": {
        "border-width": "6px",
        "border-color": `${highlighted}`,
        "background-color": `${primary}`,
        "text-outline-color": `${primary}`,
        "border-opacity": "0.5",
    }
},{
        "selector": "node.faded",
        "style": {
            "opacity": "0.06"
        }
    },
    {
        "selector": "edge.highlighted",
        "style": {
            "border-color": `${highlighted}`,
            "line-color": `${highlighted}`,
        }
    },
    {
        "selector": "edge.focused",
        "style": {
            "border-color": `${highlighted}`,
            "line-color": `${highlighted}`,
            "border-opacity": "0.5",
        }
    },
    {
        "selector": "edge:selected",
        "style": {
            "border-color": `${highlighted}`,
            "line-color": `${highlighted}`
        }
    },
    {
    "selector": "edge.filtered",
    "style": {
        "opacity": "0"
    },
}];

/**
 * Builds immutable styles with iri to color mappings
 * @param { Array } importedOntologies Array of { id: ..., ontologyId: ...}
 * @returns 
 */
const buildColorScale = (importedOntologies, ontologyId) => {
    const tempStyles = []
    const ontologyColorMap = {}; // iri -> color
    ontologyColorMap[ontologyId] = `${primary}`

    if(importedOntologies && importedOntologies.length > 0){
        const scaleNo = importedOntologies.length;

        const ontologyColors =  getScale(scaleNo);
    
        for (let i = 0; i < scaleNo; i++) {
            const keyIndex = `Ontology-${i}`;
            tempStyles.push({
                'selector': `.${keyIndex}`,
                'style': {
                    'background-color': `${ontologyColors[i]}`,
                    'text-outline-color': `${ontologyColors[i]}`,
                }
            },{
                'selector': `.${keyIndex}:selected`,
                'style': {
                    'text-outline-color': `${ontologyColors[i]}`
                }
            });

            ontologyColorMap[importedOntologies[i].id] = `${ontologyColors[i]}`
        }

    }
    return {'style': style.concat(tempStyles), 'ontologyColorMap': ontologyColorMap};
};

/** 
 * color sets
 **/
const colorSets = {
    Set2: {
        set : ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)', 'rgb(166,216,84)', 'rgb(255,217,47)', 'rgb(229,196,148)', 'rgb(179,179,179)'],
    },
    Accent: {
        set : ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(240,2,127)', 'rgb(191,91,23)', 'rgb(102,102,102)'],
    },
    Set3: {
        set : ['rgb(141,211,199)', 'rgb(86,176,219)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)', 'rgb(252,205,229)', 'rgb(217,217,217)', 'rgb(188,128,189)', 'rgb(204,235,197)', 'rgb(255,237,111)'],
    },
    Dark: {
        set : ['rgb(117,112,179)','rgb(231,41,138)','rgb(27,158,119)', 'rgb(230,171,2)', 'rgb(139,0,139)','rgb(102,102,102)','rgb(222,49,40)']
    },
    Paired: {
        set : ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)', 'rgb(255,255,153)', 'rgb(177,89,40)'],
    },
    Pastel2: {
        set : ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)', 'rgb(244,202,228)', 'rgb(230,245,201)', 'rgb(255,242,174)', 'rgb(241,226,204)', 'rgb(204,204,204)'],
    },
    Pastel1: {
        set : [ 'rgb(254,217,166)', 'rgb(255,255,204)', 'rgb(229,216,189)', 'rgb(253,218,236)', 'rgb(242,242,242)'],
    },
};

const getScale = (no, isPaired) => {
    if (isPaired) {
        return
    }
    return  chroma.scale(colorSets.Dark.set).mode('lch').colors(no);
};

export  {
    style,
    buildColorScale
};