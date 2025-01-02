package com.mobi.ontology.rest.json;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonSetter;

import java.util.Set;

public class EntityNames {
    public String label;
    private Set<String> names;

    public EntityNames() {
    }

    public EntityNames(String label) {
        this.label = label;
    }

    @JsonGetter("names")
    public Set<String> getNames() {
        return names;
    }

    @JsonSetter("names")
    public void setNames(Set<String> names) {
        this.names = names;
    }
}
