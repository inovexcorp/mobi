package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
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

import java.util.List;
import java.util.Optional;

public interface Rule {

    /**
     * The IRI ID of the Rule.
     */
    IRI getId();

    /**
     * The description of the Rule if set.
     */
    Optional<String> getDescription();

    /**
     * The {@link Effect} of the Rule if it matches, i.e. Permit or Deny.
     */
    Effect getEffect();

    /**
     * The {@link Condition Conditions} set on this rule that must match the {@link Request} subject.
     */
    List<Condition> getSubjectConditions();

    /**
     * The {@link Condition Conditions} set on this rule that must match the {@link Request} resource.
     */
    List<Condition> getResourceConditions();

    /**
     * The {@link Condition Conditions} set on this rule that must match the {@link Request} action.
     */
    List<Condition> getActionConditions();
}
