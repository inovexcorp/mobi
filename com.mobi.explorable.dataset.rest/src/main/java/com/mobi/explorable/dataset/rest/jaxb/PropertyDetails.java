package com.mobi.explorable.dataset.rest.jaxb;

/*-
 * #%L
 * com.mobi.explorable.dataset.rest
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

import org.apache.commons.lang3.builder.EqualsBuilder;

import java.util.Set;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class PropertyDetails {
    private String propertyIRI;
    private String type;
    private Set<String> range;
    private Set<RestrictionDetails> restrictions;

    @XmlElement
    public String getPropertyIRI() {
        return propertyIRI;
    }

    public void setPropertyIRI(String propertyIRI) {
        this.propertyIRI = propertyIRI;
    }

    @XmlElement
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    @XmlElement
    public Set<String> getRange() {
        return range;
    }

    public void setRange(Set<String> range) {
        this.range = range;
    }

    @XmlElement
    public Set<RestrictionDetails> getRestrictions() {
        return restrictions;
    }

    public void setRestrictions(Set<RestrictionDetails> restrictions) {
        this.restrictions = restrictions;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        if (obj.getClass() != getClass()) {
            return false;
        }
        PropertyDetails other = (PropertyDetails) obj;
        return new EqualsBuilder()
                .append(propertyIRI, other.propertyIRI)
                .isEquals();
    }
}
