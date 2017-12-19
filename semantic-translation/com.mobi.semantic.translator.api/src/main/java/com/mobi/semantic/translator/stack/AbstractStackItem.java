package com.mobi.semantic.translator.stack;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.Value;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

public abstract class AbstractStackItem implements StackItem {

    protected final String id;

    protected final boolean root;

    protected IRI classIri;

    protected final MultiValueMap<IRI, Value> properties = new LinkedMultiValueMap<>();

    protected AbstractStackItem(String id, boolean root) {
        this(id, root, null);
    }

    protected AbstractStackItem(String id, boolean root, IRI classIri) {
        this.id = id;
        this.root = root;
        this.classIri = classIri;
    }

    @Override
    public String getIdentifier() {
        return this.id;
    }

    @Override
    public MultiValueMap<IRI, Value> getProperties() {
        return properties;
    }

    @Override
    public boolean isRoot() {
        return root;
    }

    @Override
    public IRI getClassIri() {
        return classIri;
    }

    public void setClassIri(IRI iri) {
        this.classIri = iri;
    }
}
