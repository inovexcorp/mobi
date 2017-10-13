package com.mobi.sparql.rest.jaxb;

/*-
 * #%L
 * com.mobi.sparql.rest
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

import com.mobi.rest.util.jaxb.PaginatedResults;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

@XmlRootElement
public class SparqlPaginatedResults<T> {

    private PaginatedResults<T> paginatedResults;
    private List<String> bindingNames;

    @XmlElement
    public PaginatedResults<T> getPaginatedResults() {
        return paginatedResults;
    }

    public void setPaginatedResults(PaginatedResults<T> paginatedResults) {
        this.paginatedResults = paginatedResults;
    }

    @XmlElement
    public List<String> getBindingNames() {
        return bindingNames;
    }

    public void setBindingNames(List<String> bindingNames) {
        this.bindingNames = bindingNames;
    }
}
