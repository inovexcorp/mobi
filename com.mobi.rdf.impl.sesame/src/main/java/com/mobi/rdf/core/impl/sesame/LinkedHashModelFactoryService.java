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

import aQute.bnd.annotation.component.Component;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Statement;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Set;

@Component(provide = ModelFactory.class,
        properties = {
                "service.ranking:Integer=20",
                "implType=hash"
        })
public class LinkedHashModelFactoryService extends AbstractModelFactory {

    @Override
    public Model createModel() {
        return new LinkedHashModel();
    }

    @Override
    public Model createModel(@Nonnull Set<Namespace> namespaces, @Nonnull Collection<@Nonnull ? extends Statement> c) {
        Model finalModel = new LinkedHashModel(c.size());
        finalModel.addAll(c);
        namespaces.forEach(finalModel::setNamespace);
        return finalModel;
    }
}
