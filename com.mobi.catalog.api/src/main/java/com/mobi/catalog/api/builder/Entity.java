package com.mobi.catalog.api.builder;

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

import org.eclipse.rdf4j.model.Resource;

import java.util.Objects;

public class Entity {
    private Resource value;
    private String name;

    private Entity(Entity.Builder builder) {
        this.value = builder.value;
        this.name = builder.name;
    }

    public Resource getValue() {
        return value;
    }

    public String getName() {
        return name;
    }

    public static class Builder {
        private Resource value;
        private String name;

        public Entity.Builder value(Resource value) {
            this.value = value;
            return this;
        }

        public Entity.Builder name(String name) {
            this.name = name;
            return this;
        }

        public Entity build() {
            return new Entity(this);
        }
    }

    @Override
    public String toString() {
        return "{\"value\": \"" + value + "\", \"name\": \"" + name + "\"" + "}";
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        Entity otherEntity = (Entity) obj;
        return Objects.equals(value, otherEntity.value) && name.equals(otherEntity.name);
    }
}
