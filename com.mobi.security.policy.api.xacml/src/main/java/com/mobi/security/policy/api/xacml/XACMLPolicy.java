package com.mobi.security.policy.api.xacml;

/*-
 * #%L
 * com.mobi.security.policy.api.xacml
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
import com.mobi.security.policy.api.xacml.jaxb.ObjectFactory;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.Optional;
import javax.xml.bind.JAXB;

public class XACMLPolicy implements Policy {

    protected PolicyType policyType;
    protected IRI id;
    protected String description;

    protected ObjectFactory of;

    protected XACMLPolicy() {}

    public XACMLPolicy(String policy, ValueFactory vf) {
        of = new ObjectFactory();
        this.policyType = JAXB.unmarshal(new StringReader(policy), PolicyType.class);
        this.id = vf.createIRI(this.policyType.getPolicyId());
        this.description = this.policyType.getDescription();
    }

    public XACMLPolicy(PolicyType policyType, ValueFactory vf) {
        of = new ObjectFactory();
        this.policyType = policyType;
        this.id = vf.createIRI(policyType.getPolicyId());
        this.description = policyType.getDescription();
    }

    @Override
    public IRI getId() {
        return id;
    }

    @Override
    public Optional<String> getDescription() {
        return Optional.ofNullable(description);
    }

    public PolicyType getJaxbPolicy() {
        return policyType;
    }

    @Override
    public String toString() {
        StringWriter sw = new StringWriter();
        JAXB.marshal(of.createPolicy(policyType), sw);
        return sw.toString();
    }
}
