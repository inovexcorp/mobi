package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
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

import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Statement;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

public abstract class AbstractModelFactory implements ModelFactory {

    @Override
    public Model createModel(@Nonnull Model model) {
        return createModel(model.getNamespaces(), model);
    }

    @Override
    public Model createModel(@Nonnull Collection<? extends Statement> c) {
        return createModel(Collections.emptySet(), c);
    }

    @Override
    public Model createModel(@Nonnull Set<Namespace> namespaces) {
        return createModel(namespaces, Collections.emptySet());
    }

    @Override
    public Model createModel(@Nonnull Set<Namespace> namespaces, @Nonnull Collection<@Nonnull ? extends Statement> c) {
        Model finalModel = createModel();
        finalModel.addAll(c);
        namespaces.forEach(finalModel::setNamespace);
        return finalModel;
    }
}
