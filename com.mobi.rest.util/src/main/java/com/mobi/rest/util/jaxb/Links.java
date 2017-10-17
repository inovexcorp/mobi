package com.mobi.rest.util.jaxb;

/*-
 * #%L
 * com.mobi.rest.util
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

public class Links {

    private String base;
    private String context;
    private String next;
    private String prev;
    private String self;

    @XmlElement
    public String getBase() {
        return base;
    }

    public void setBase(String base) {
        this.base = base;
    }

    @XmlElement
    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

    @XmlElement
    public String getNext() {
        return next;
    }

    public void setNext(String next) {
        this.next = next;
    }

    @XmlElement
    public String getPrev() {
        return prev;
    }

    public void setPrev(String prev) {
        this.prev = prev;
    }

    @XmlElement
    public String getSelf() {
        return self;
    }

    public void setSelf(String self) {
        this.self = self;
    }
}
