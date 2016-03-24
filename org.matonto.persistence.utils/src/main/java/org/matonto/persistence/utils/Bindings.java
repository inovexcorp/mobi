package org.matonto.persistence.utils;

import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;

import java.util.Optional;

public class Bindings {
    public static Resource requiredResource(BindingSet bindingSet, String binding) {
        return getRequired(bindingSet, binding, Resource.class);
    }

    public static Literal requiredLiteral(BindingSet bindingSet, String binding) {
        return getRequired(bindingSet, binding, Literal.class);
    }

    public static <T extends Value> T getRequired(BindingSet bindingSet, String binding, Class<T> clazz) {
        Optional<Binding> bindingOptional = bindingSet.getBinding(binding);

        if (bindingOptional.isPresent()) {
            Value value = bindingOptional.get().getValue();
            if (clazz.isAssignableFrom(value.getClass())) {
                return clazz.cast(value);
            }
        }

        throw new IllegalStateException("Required Binding was not present.");
    }
}