package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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


import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;

import java.util.Optional;

public class Bindings {
    public static Resource requiredResource(BindingSet bindingSet, String binding) {
        return getRequired(bindingSet, binding, Resource.class);
    }

    public static Literal requiredLiteral(BindingSet bindingSet, String binding) {
        return getRequired(bindingSet, binding, Literal.class);
    }

    public static <T extends Value> T getRequired(BindingSet bindingSet, String binding, Class<T> clazz) {
        Optional<Binding> bindingOptional = Optional.ofNullable(bindingSet.getBinding(binding));

        if (bindingOptional.isPresent()) {
            Value value = bindingOptional.get().getValue();
            if (clazz.isAssignableFrom(value.getClass())) {
                return clazz.cast(value);
            }
        }

        throw new IllegalStateException(String.format("Required Binding \"%s\" was not present.", binding));
    }
}
