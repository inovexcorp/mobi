package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
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

import aQute.bnd.annotation.component.Component;
import com.mobi.rdf.api.NamedGraph;
import com.mobi.rdf.api.NamedGraphFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.NamedGraph;
import com.mobi.rdf.api.NamedGraphFactory;
import com.mobi.rdf.api.Resource;

@Component(
        provide = NamedGraphFactory.class,
        properties = {
                "service.ranking:Integer=10",
                "implType=tree"
        })
public class TreeNamedGraphFactoryService extends AbstractNamedGraphFactory {

    @Override
    public NamedGraph createNamedGraph(Resource graphID) {
        return new SimpleNamedGraph(graphID, TreeModelFactory.getInstance());
    }
}
