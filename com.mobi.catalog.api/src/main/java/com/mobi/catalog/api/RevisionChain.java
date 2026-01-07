package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.catalog.api.ontologies.mcat.Revision;
import org.eclipse.rdf4j.model.Resource;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public record RevisionChain(List<Revision> reverseDeltas, List<Revision> forwardDeltas) {
    public List<Revision> fullDeltas() {
        return Stream.concat(reverseDeltas.stream(), forwardDeltas.stream())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public List<Resource> reverseIRIs() {
        return reverseDeltas.stream()
                .map(Revision::getResource)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public List<Resource> forwardIRIs() {
        return forwardDeltas.stream()
                .map(Revision::getResource)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public List<Resource> fullIRIs() {
        return Stream.concat(reverseDeltas.stream(), forwardDeltas.stream())
                .map(Revision::getResource)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
