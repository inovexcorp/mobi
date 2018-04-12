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

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * A builder class with parameters for queries policies based on their related resources, subjects, and actions.
 */
public class PolicyQueryParams {

    private Set<IRI> resourceIRIs;
    private Set<IRI> subjectIRIs;
    private Set<IRI> actionIRIs;

    private PolicyQueryParams(Builder builder) {
        resourceIRIs = builder.resourceIRIs;
        subjectIRIs = builder.subjectIRIs;
        actionIRIs = builder.actionIRIs;
    }

    public Set<IRI> getResourceIRIs() {
        return resourceIRIs;
    }

    public Set<IRI> getSubjectIRIs() {
        return subjectIRIs;
    }

    public Set<IRI> getActionIRIs() {
        return actionIRIs;
    }

    public static class Builder {
        private Set<IRI> resourceIRIs = new HashSet<>();
        private Set<IRI> subjectIRIs = new HashSet<>();
        private Set<IRI> actionIRIs = new HashSet<>();

        public Builder() {}

        public Builder addResourceIRI(IRI iri) {
            resourceIRIs.add(iri);
            return this;
        }

        public Builder addResourceIRIs(Collection<IRI> iris) {
            resourceIRIs.addAll(iris);
            return this;
        }

        public Builder addSubjectIRI(IRI iri) {
            subjectIRIs.add(iri);
            return this;
        }

        public Builder addSubjectIRIs(Collection<IRI> iris) {
            subjectIRIs.addAll(iris);
            return this;
        }

        public Builder addActionIRI(IRI iri) {
            actionIRIs.add(iri);
            return this;
        }

        public Builder addActionIRIs(Collection<IRI> iris) {
            actionIRIs.addAll(iris);
            return this;
        }

        public PolicyQueryParams build() {
            return new PolicyQueryParams(this);
        }
    }
}
