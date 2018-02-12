package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.Policy;
import org.wso2.balana.AbstractPolicy;

import java.util.Optional;

public class XACMLPolicy implements Policy {

    private AbstractPolicy abstractPolicy;
    private IRI id;

    public XACMLPolicy(AbstractPolicy abstractPolicy, ValueFactory vf) {
        this.abstractPolicy = abstractPolicy;
        this.id = vf.createIRI(this.abstractPolicy.getId().toString());
    }

    @Override
    public IRI getId() {
        return this.id;
    }

    @Override
    public Optional<String> getDescription() {
        return Optional.ofNullable(this.abstractPolicy.getDescription());
    }

    @Override
    public String toString() {
        return this.abstractPolicy.encode();
    }
}
