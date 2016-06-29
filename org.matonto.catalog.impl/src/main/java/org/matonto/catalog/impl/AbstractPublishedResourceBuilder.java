package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.api.PublishedResourceBuilder;
import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

public abstract class AbstractPublishedResourceBuilder<T extends PublishedResourceBuilder, U extends PublishedResource>
        implements PublishedResourceBuilder<T, U> {

    protected String title;
    protected Resource resource;

    protected String description = "";
    protected OffsetDateTime issued = OffsetDateTime.now();
    protected OffsetDateTime modified = null;
    protected String identifier = "";
    protected Set<String> keywords = new HashSet<>();
    protected Set<Distribution> distributions = new HashSet<>();
    protected Set<Resource> types = new HashSet<>();

    @Override
    public T description(String val) {
        this.description = val;
        return getThis();
    }

    public T issued(OffsetDateTime val) {
        this.issued = val;
        return getThis();
    }

    public T modified(OffsetDateTime val) {
        this.modified = val;
        return getThis();
    }

    public T identifier(String val) {
        this.identifier = val;
        return getThis();
    }

    public T addKeyword(String val) {
        this.keywords.add(val);
        return getThis();
    }

    public T addDistribution(Distribution val) {
        this.distributions.add(val);
        return getThis();
    }

    public T addType(Resource val) {
        this.types.add(val);
        return getThis();
    }

    protected abstract T getThis();

    protected void setModified() {
        if (modified == null) {
            modified = issued;
        } else if (issued.isAfter(modified)) {
            throw new IllegalStateException("Modified time must occur after issued time.");
        }
    }
}
