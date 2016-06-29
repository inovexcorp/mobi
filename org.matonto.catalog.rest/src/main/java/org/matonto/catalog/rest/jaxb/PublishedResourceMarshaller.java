package org.matonto.catalog.rest.jaxb;

/*-
 * #%L
 * org.matonto.catalog.rest
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

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlSchemaType;
import javax.xml.datatype.XMLGregorianCalendar;
import java.util.Set;

@XmlRootElement
public class PublishedResourceMarshaller {

    private String id;
    private Set<String> types;
    private String title;
    private String description;
    private XMLGregorianCalendar issued;
    private XMLGregorianCalendar modified;
    private String identifier;
    private Set<String> keywords;
    private Set<String> distributions;

    @XmlElement
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @XmlElement
    public Set<String> getTypes() {
        return types;
    }

    public void setTypes(Set<String> types) {
        this.types = types;
    }

    @XmlElement
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @XmlElement
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @XmlElement
    @XmlSchemaType(name = "dateTime")
    public XMLGregorianCalendar getIssued() {
        return issued;
    }

    public void setIssued(XMLGregorianCalendar issued) {
        this.issued = issued;
    }

    @XmlElement
    @XmlSchemaType(name = "dateTime")
    public XMLGregorianCalendar getModified() {
        return modified;
    }

    public void setModified(XMLGregorianCalendar modified) {
        this.modified = modified;
    }

    @XmlElement
    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    @XmlElement
    public Set<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(Set<String> keywords) {
        this.keywords = keywords;
    }

    @XmlElement
    public Set<String> getDistributions() {
        return distributions;
    }

    public void setDistributions(Set<String> distributions) {
        this.distributions = distributions;
    }
}
